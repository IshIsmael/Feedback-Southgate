require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('./models/User');

async function setupStaff() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const existingUser = await User.findOne({ username: 'southgatelcstaff' });
    
    if (existingUser) {
      console.log('Staff user already exists!');
      console.log('Username: southgatelcstaff');
      process.exit(0);
    }

    const password = 'Southgate2)"%';
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    await User.create({
      username: 'southgatelcstaff',
      passwordHash: passwordHash
    });

    console.log('✅ Staff user created successfully!');
    console.log('Access the staff portal at: http://localhost:3000/staff/login');

    process.exit(0);

  } catch (error) {
    console.error('Error setting up staff user:', error);
    process.exit(1);
  }
}

setupStaff();