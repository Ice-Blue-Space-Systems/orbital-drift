const mongoose = require("mongoose");

const SatelliteSchema = new mongoose.Schema({
  name: { type: String, required: true },
  noradId: { type: Number, required: false }, // Optional for custom satellites
  currentTleId: { type: mongoose.Schema.Types.ObjectId, ref: "Tle", required: false }, // Optional for custom satellites
  type: { type: String, enum: ["live", "simulated"], required: true },
  description: { type: String, required: false }, // Optional description
  createdAt: { type: Date, default: Date.now },
});

const Satellite = mongoose.model("Satellite", SatelliteSchema);

module.exports = Satellite;