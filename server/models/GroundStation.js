const mongoose = require("mongoose");

const GroundStationSchema = new mongoose.Schema({
  name: { type: String, required: true },
  location: {
    lat: { type: Number, required: true },
    lon: { type: Number, required: true },
    alt: { type: Number, required: true }, // Altitude in kilometers
  },
  band: [{ type: String }], // Supported frequency bands
  createdAt: { type: Date, default: Date.now },
});

const GroundStation = mongoose.model("GroundStation", GroundStationSchema, "ground_stations");

module.exports = GroundStation;