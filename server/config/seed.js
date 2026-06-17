const User = require('../models/User');
const Settings = require('../models/Settings');
const Category = require('../models/Category');
const Skill = require('../models/Skill');

const seedDatabase = async () => {
  try {
    // 1. Seed Admin User
    const adminExists = await User.findOne({ username: 'admin' });
    if (!adminExists) {
      console.log('Seeding default administrator user account...');
      const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
      await User.create({
        username: 'admin',
        password: adminPassword // Will be encrypted by User model's pre-save middleware
      });
      if (adminPassword === 'admin123') {
        console.warn('⚠️ WARNING: Administrator created with default password "admin123". Please change immediately in production.');
      } else {
        console.log('Administrator created with custom password from environment variables.');
      }
    }

    // 2. Seed Settings Singleton
    const settingsExists = await Settings.findOne();
    if (!settingsExists) {
      console.log('Seeding default homepage and settings configurations...');
      await Settings.create({});
      console.log('Default site settings seeded successfully.');
    }

    // 3. Seed Default Categories
    const categoryCount = await Category.countDocuments();
    if (categoryCount === 0) {
      console.log('Seeding default portfolio categories...');
      const defaultCategories = [
        { title: 'Wedding Films', key: 'wedding-films', description: '01 / ELEGANT', vertical: false, order: 0 },
        { title: 'Brand Shoots', key: 'brand-shoots', description: '02 / CAMPAIGNS', vertical: false, order: 1 },
        { title: 'UGC', key: 'trending-reels', description: '03 / VIRAL', vertical: true, order: 2 },
        { title: 'Motion Graphics', key: 'commercial-edits', description: '04 / COMMERCIAL', vertical: false, order: 3 },
        { title: 'Social Content', key: 'social-media-content', description: '05 / AUDIENCE', vertical: false, order: 4 }
      ];
      await Category.insertMany(defaultCategories);
      console.log('Portfolio categories seeded successfully.');
    }

    // 4. Seed Default Skills
    const skillCount = await Skill.countDocuments();
    if (skillCount === 0) {
      console.log('Seeding default post-production skills list...');
      const defaultSkills = [
        { name: 'After Effects', iconType: 'after-effects', order: 0 },
        { name: 'Premiere Pro', iconType: 'premiere-pro', order: 1 },
        { name: 'CapCut PC', iconType: 'capcut', order: 2 },
        { name: 'Content Creation', iconType: 'video', order: 3 },
        { name: 'Typography Reels', iconType: 'typography', order: 4 },
        { name: 'Wedding Editing', iconType: 'wedding', order: 5 },
        { name: 'Brand Shoot Editing', iconType: 'brand', order: 6 },
        { name: 'Brand Commercial Editing', iconType: 'commercial', order: 7 },
        { name: 'Trending Reel Editing', iconType: 'trending', order: 8 },
        { name: 'Motion Graphics', iconType: 'motion', order: 9 }
      ];
      await Skill.insertMany(defaultSkills);
      console.log('Skills list seeded successfully.');
    }

  } catch (error) {
    console.error('Error seeding database:', error.message);
  }
};

module.exports = seedDatabase;
