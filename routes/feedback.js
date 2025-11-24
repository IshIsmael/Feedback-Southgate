var express = require('express');
var router = express.Router();
var { body, validationResult } = require('express-validator');
var rateLimit = require('express-rate-limit');
var Feedback = require('../models/Feedback');

var submitLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 10,
  message: 'We Have Had Too Many Submissions In A Short Amount Of Time. Please Try Again After 10 Minutes.',
  standardHeaders: true,
  legacyHeaders: false,
});

var validationRules = [
  body('activity')
    .notEmpty().withMessage('Activity is required')
    .isIn([
      'Fitness Class',
      'Swim for Fitness',
      'Swim for All',
      'Gym',
      'Table Tennis',
      'Health Suite',
      'Cafe',
      'Multiple Activities'
    ]).withMessage('Invalid activity selected'),
  
  body('rating')
    .notEmpty().withMessage('Rating is required')
    .isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  
  body('comments')
    .notEmpty().withMessage('Comments are required')
    .trim()
    .isLength({ min: 10, max: 2000 }).withMessage('Comments must be between 10 and 2000 characters'),
  
  body('email')
    .optional({ checkFalsy: true })
    .isEmail().withMessage('Invalid email address')
    .normalizeEmail(),
  
  body('name')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 50 }).withMessage('Name is too long'),
  
  body('betterId')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 30 }).withMessage('Better ID is too long'),
  
  body('consent')
    .notEmpty().withMessage('You must agree to the privacy policy')
    .equals('on').withMessage('You must agree to the privacy policy')
];

router.post('/submit-feedback', submitLimiter, validationRules, async function(req, res, next) {
  var errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.render('index', {
      title: 'Better Southgate Leisure Centre - Feedback',
      error: errors.array()[0].msg,
      success: null
    });
  }

  try {
    var feedbackData = {
      activity: req.body.activity,
      rating: parseInt(req.body.rating),
      comments: req.body.comments,
      consentGiven: true
    };

    if (req.body.email) {
      feedbackData.email = req.body.email;
    }

    if (req.body.name) {
      feedbackData.name = req.body.name;
    }

    if (req.body.betterId) {
      feedbackData.betterId = req.body.betterId;
    }

    await Feedback.create(feedbackData);

    res.render('index', {
      title: 'Better Southgate Leisure Centre - Feedback',
      error: null,
      success: 'Your feedback has been submitted successfully! We truly appreciate you taking the time to share your thoughts.'
    });

  } catch (error) {
    console.error('Error saving feedback:', error);
    res.render('index', {
      title: 'Better Southgate Leisure Centre - Feedback',
      error: 'Something went wrong. Please try again.',
      success: null
    });
  }
});

module.exports = router;