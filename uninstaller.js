const fs = require('fs-extra');
const path = require('path');
const { app } = require('electron');

module.exports = async function(context) {
  try {
    const userDataPath = app.getPath('userData');
    await fs.remove(userDataPath);
    console.log('User data removed successfully.');
  } catch (error) {
    console.error('Error removing user data:', error);
  }
};