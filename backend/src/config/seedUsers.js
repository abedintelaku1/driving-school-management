const User = require('../models/User');

const DEFAULT_USERS = [
  {
    firstName: 'Admin',
    lastName: 'User',
    email: 'admin@drivershub.com',
    password: 'Admin123',
    role: 0, // Admin
  },
  {
    firstName: 'Instructor',
    lastName: 'User',
    email: 'instructor@drivershub.com',
    password: 'Instructor123!!',
    role: 1, // Instructor
  },
];

async function seedUsers() {
  try {
    for (const u of DEFAULT_USERS) {
      const exists = await User.findOne({ email: u.email.toLowerCase().trim() });
      if (!exists) {
        await User.create(u);
        console.log(`Created default user: ${u.email} (${u.role === 0 ? 'Admin' : 'Instructor'})`);
      }
    }
  } catch (err) {
    console.error('Seed users error:', err);
    throw err;
  }
}

module.exports = seedUsers;
