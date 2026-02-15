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
  {
    firstName: 'Staff',
    lastName: 'User',
    email: 'staff@drivershub.com',
    password: 'Staff123',
    role: 2, // Staff – shtim pagesash only, jo edit/fshirje
  },
];

const roleLabel = (role) => (role === 0 ? 'Admin' : role === 1 ? 'Instructor' : 'Staff');

async function seedUsers() {
  try {
    for (const u of DEFAULT_USERS) {
      const exists = await User.findOne({ email: u.email.toLowerCase().trim() });
      if (!exists) {
        await User.create(u);
        console.log(`Created default user: ${u.email} (${roleLabel(u.role)})`);
      }
    }
  } catch (err) {
    console.error('Seed users error:', err);
    throw err;
  }
}

module.exports = seedUsers;
