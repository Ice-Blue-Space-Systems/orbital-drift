const mongoose = require('mongoose');
const Tle = require('./models/Tle');
const Satellite = require('./models/Satellite');

// Calculate current TLE epoch
const today = new Date();
const year = today.getFullYear().toString().slice(-2);
const dayOfYear = Math.floor((today - new Date(today.getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24));
const epochDay = dayOfYear + (today.getHours() + today.getMinutes()/60 + today.getSeconds()/3600) / 24;
const epochString = `${year}${epochDay.toFixed(8).padStart(12, '0')}`;

console.log('Updating MockSat-Alpha TLE with current epoch:', epochString);

async function updateMockSatTLE() {
  try {
    await mongoose.connect('mongodb://localhost:27017/orbital-drift');
    console.log('Connected to MongoDB');
    
    // Find MockSat-Alpha
    const mockSat = await Satellite.findOne({ name: 'MockSat-Alpha' }).populate('currentTleId');
    if (!mockSat) {
      console.log('MockSat-Alpha not found!');
      return;
    }
    
    console.log('Found MockSat-Alpha:', mockSat.name);
    console.log('Current TLE ID:', mockSat.currentTleId._id);
    
    // Update the TLE with current epoch
    const oldLine1 = mockSat.currentTleId.line1;
    const newLine1 = oldLine1.replace(/25148\.00000000/, epochString);
    
    console.log('Old Line 1:', oldLine1);
    console.log('New Line 1:', newLine1);
    
    // Update the TLE record
    await Tle.findByIdAndUpdate(mockSat.currentTleId._id, {
      line1: newLine1,
      epoch: today.toISOString()
    });
    
    console.log('TLE updated successfully!');
    console.log('New epoch date:', today.toISOString());
    
  } catch (error) {
    console.error('Error updating TLE:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

updateMockSatTLE();
