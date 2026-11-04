const authorityModel = require('../models/authorityModel');

async function initializeAuthorities() {
  try {
    console.log('Initializing default authorities...');
    await authorityModel.initializeDefaults();
    console.log('Authorities initialized successfully');
  } catch (error) {
    console.error('Failed to initialize authorities:', error);
  }
}

if (require.main === module) {
  initializeAuthorities().then(() => process.exit(0));
}

module.exports = { initializeAuthorities };
