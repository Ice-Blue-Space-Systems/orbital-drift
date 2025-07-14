const mongoose = require("mongoose");

const GroundStationSchema = new mongoose.Schema({
  name: { type: String, required: true },
  location: {
    lat: { type: Number, required: true },
    lon: { type: Number, required: true },
    alt: { type: Number, required: true }, // Altitude in meters
  },
  // Enhanced fields for comprehensive ground station management
  country: { type: String },
  city: { type: String },
  status: { 
    type: String, 
    enum: ["Active", "Inactive", "Maintenance", "Decommissioned"], 
    default: "Active" 
  },
  frequency: { type: String }, // Frequency range in MHz
  bandType: { 
    type: String, 
    enum: ["S", "X", "Ka", "Ku", "L", "C", "Unknown"], 
    default: "S" 
  },
  elevation: { type: Number, default: 5 }, // Minimum elevation angle
  azimuth: { type: Number, default: 360 }, // Antenna azimuth range
  operator: { type: String },
  established: { type: Date },
  description: { type: String },
  source: { 
    type: String, 
    enum: ["predefined", "custom"], 
    default: "custom" 
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Update the updatedAt field on save
GroundStationSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

const GroundStation = mongoose.model("GroundStation", GroundStationSchema, "ground_stations");

module.exports = GroundStation;