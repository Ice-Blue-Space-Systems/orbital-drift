const mongoose = require("mongoose");

const ContactWindowSchema = new mongoose.Schema({
  satelliteId: { type: mongoose.Schema.Types.ObjectId, ref: "Satellite", required: true },
  groundStationId: { type: mongoose.Schema.Types.ObjectId, ref: "GroundStation", required: true },
  scheduledAOS: { type: Date, required: true }, // Acquisition of Signal
  scheduledLOS: { type: Date, required: true }, // Loss of Signal
  tleUsedId: { type: mongoose.Schema.Types.ObjectId, ref: "Tle", required: true },
  maxElevationDeg: { type: Number, required: true }, // Maximum elevation angle during the contact
  durationSeconds: { type: Number, required: true }, // Duration of the contact in seconds
  status: { type: String, enum: ["scheduled", "completed", "missed"], default: "scheduled" },
  createdAt: { type: Date, default: Date.now },
});

const ContactWindow = mongoose.model("ContactWindow", ContactWindowSchema);

module.exports = ContactWindow;