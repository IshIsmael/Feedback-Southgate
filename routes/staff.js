var express = require('express');
var router = express.Router();
var bcrypt = require('bcrypt');
var { body, validationResult } = require('express-validator');
var rateLimit = require('express-rate-limit');
var Feedback = require('../models/Feedback');
var User = require('../models/User');

var loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many login attempts. Please try again in 15 minutes.',
  standardHeaders: true,
  legacyHeaders: false,
});

function requireAuth(req, res, next) {
  if (req.session && req.session.staffLoggedIn) {
    return next();
  }
  res.redirect('/staff/login');
}

router.get('/staff/login', function(req, res) {
  if (req.session && req.session.staffLoggedIn) {
    return res.redirect('/staff/dashboard');
  }
  res.render('staff/login', { 
    error: null 
  });
});

router.post('/staff/login', loginLimiter, [
  body('username').notEmpty().trim(),
  body('password').notEmpty()
], async function(req, res) {
  var errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.render('staff/login', {
      error: 'Please enter both username and password'
    });
  }

  try {
    var user = await User.findOne({ username: req.body.username });
    
    if (!user) {
      return res.render('staff/login', {
        error: 'Invalid username or password'
      });
    }

    var passwordMatch = await bcrypt.compare(req.body.password, user.passwordHash);
    
    if (!passwordMatch) {
      return res.render('staff/login', {
        error: 'Invalid username or password'
      });
    }

    req.session.staffLoggedIn = true;
    req.session.userId = user._id;
    
    res.redirect('/staff/dashboard');

  } catch (error) {
    console.error('Login error:', error);
    res.render('staff/login', {
      error: 'Something went wrong. Please try again.'
    });
  }
});

router.get('/staff/dashboard', requireAuth, async function(req, res) {
  try {
    var period = req.query.period || 'all';
    var dateFilter = {};
    var now = new Date();
    var periodLabel = 'All Time';

    if (period === 'ytd') {
      var startOfYear = new Date(now.getFullYear(), 0, 1);
      dateFilter.createdAt = { $gte: startOfYear };
      periodLabel = 'Year to Date';
    } else if (period === 'month') {
      var startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      dateFilter.createdAt = { $gte: startOfMonth };
      periodLabel = now.toLocaleString('en-GB', { month: 'long', year: 'numeric' });
    } else if (period === 'lastmonth') {
      var startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      var endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
      dateFilter.createdAt = { $gte: startOfLastMonth, $lte: endOfLastMonth };
      var lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      periodLabel = lastMonth.toLocaleString('en-GB', { month: 'long', year: 'numeric' });
    }

    var totalFeedback = await Feedback.countDocuments(dateFilter);
    
    var avgRatingResult = await Feedback.aggregate([
      { $match: dateFilter },
      { $group: { _id: null, avgRating: { $avg: '$rating' } } }
    ]);
    var avgRating = avgRatingResult.length > 0 ? avgRatingResult[0].avgRating : 0;
    
    var activityBreakdown = await Feedback.aggregate([
      { $match: dateFilter },
      { $group: { _id: '$activity', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    var ratingBreakdown = await Feedback.aggregate([
      { $match: dateFilter },
      { $group: { _id: '$rating', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);
    
    var recentFeedback = await Feedback.find(dateFilter)
      .sort({ createdAt: -1 })
      .limit(10);

    res.render('staff/dashboard', {
      totalFeedback: totalFeedback,
      avgRating: avgRating.toFixed(1),
      activityBreakdown: activityBreakdown,
      ratingBreakdown: ratingBreakdown,
      recentFeedback: recentFeedback,
      currentPeriod: period,
      periodLabel: periodLabel
    });

  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).send('Error loading dashboard');
  }
});

router.get('/staff/feedback', requireAuth, async function(req, res) {
  try {
    var query = {};
    var sortOption = { createdAt: -1 };
    
    if (req.query.activity && req.query.activity !== 'all') {
      query.activity = req.query.activity;
    }
    
    if (req.query.rating && req.query.rating !== 'all') {
      query.rating = parseInt(req.query.rating);
    }
    
    if (req.query.search && req.query.search.trim() !== '') {
      query.comments = { $regex: req.query.search.trim(), $options: 'i' };
    }
    
    if (req.query.startDate || req.query.endDate) {
      query.createdAt = {};
      if (req.query.startDate) {
        query.createdAt.$gte = new Date(req.query.startDate);
      }
      if (req.query.endDate) {
        var endDate = new Date(req.query.endDate);
        endDate.setHours(23, 59, 59, 999);
        query.createdAt.$lte = endDate;
      }
    }
    
    if (req.query.sort) {
      switch(req.query.sort) {
        case 'oldest':
          sortOption = { createdAt: 1 };
          break;
        case 'highest':
          sortOption = { rating: -1, createdAt: -1 };
          break;
        case 'lowest':
          sortOption = { rating: 1, createdAt: -1 };
          break;
        default:
          sortOption = { createdAt: -1 };
      }
    }
    
    var allFeedback = await Feedback.find(query).sort(sortOption);
    
    var activities = await Feedback.distinct('activity');

    res.render('staff/feedback', {
      feedback: allFeedback,
      activities: activities,
      filters: {
        activity: req.query.activity || 'all',
        rating: req.query.rating || 'all',
        search: req.query.search || '',
        startDate: req.query.startDate || '',
        endDate: req.query.endDate || '',
        sort: req.query.sort || 'newest'
      }
    });

  } catch (error) {
    console.error('Feedback list error:', error);
    res.status(500).send('Error loading feedback');
  }
});

router.get('/staff/logout', function(req, res) {
  req.session.destroy(function(err) {
    if (err) {
      console.error('Logout error:', err);
    }
    res.redirect('/staff/login');
  });
});

module.exports = router;