const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
  email: {
    type: String,
    trim: true,
    lowercase: true
  },
  betterId: {
    type: String,
    trim: true
  },
  name: {
    type: String,
    trim: true
  },
  activity: {
    type: String,
    required: true,
    enum: [
      'Fitness Class',
      'Swim for Fitness',
      'Swim for All',
      'Gym',
      'Table Tennis',
      'Health Suite',
      'Cafe',
      'Multiple Activities'
    ]
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  comments: {
    type: String,
    required: true,
    trim: true
  },
  consentGiven: {
    type: Boolean,
    required: true,
    validate: {
      validator: function(v) {
        return v === true;
      },
      message: 'Consent must be given'
    }
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 31536000
  }
});

feedbackSchema.index({ createdAt: 1 });
feedbackSchema.index({ activity: 1 });
feedbackSchema.index({ rating: 1 });

module.exports = mongoose.model('Feedback', feedbackSchema);