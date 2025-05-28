const mongoose = require("mongoose");

const SatelliteSchema = new mongoose.Schema({
  name: { type: String, required: true },
  noradId: { type: Number, required: true },
  currentTleId: { type: mongoose.Schema.Types.ObjectId, ref: "Tle", required: true },
  type: { type: String, enum: ["live", "simulated"], required: true },
  createdAt: { type: Date, default: Date.now },
});

const Satellite = mongoose.model("Satellite", SatelliteSchema);

module.exports = Satellite;