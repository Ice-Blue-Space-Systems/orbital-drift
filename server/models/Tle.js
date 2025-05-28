const mongoose = require("mongoose");

const TleSchema = new mongoose.Schema({
  satelliteId: { type: mongoose.Schema.Types.ObjectId, ref: "Satellite", required: true },
  line1: { type: String, required: true },
  line2: { type: String, required: true },
  epoch: { type: Date, required: true },
  source: { type: String, enum: ["live", "simulated"], required: true },
  createdAt: { type: Date, default: Date.now },
});

const Tle = mongoose.model("Tle", TleSchema, "tle");

module.exports = Tle;