// filepath: /Users/chrischeshire/Documents/IceBlue/hello-world-react-app/server/index.js
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// MongoDB connection
const uri = "mongodb://localhost:27017/satelliteTrackingDB";
mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("Connected to MongoDB locally"))
  .catch(err => console.error("Error connecting to MongoDB:", err));

// Models
const Satellite = require("./models/Satellite");
const GroundStation = require("./models/GroundStation");
const Tle = require("./models/Tle");
const ContactWindow = require("./models/ContactWindow");

// API endpoint to fetch satellites
app.get("/api/satellites", async (req, res) => {
  try {
    const satellites = await Satellite.find();
    res.json(satellites);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// API endpoint to fetch a specific satellite by ID
app.get("/api/satellites/:id", async (req, res) => {
  try {
    const satellite = await Satellite.findById(req.params.id);
    if (!satellite) {
      return res.status(404).send("Satellite not found");
    }
    res.json(satellite);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// API endpoint to fetch ground stations
app.get("/api/ground-stations", async (req, res) => {
  try {
    const groundStations = await GroundStation.find(); // Query the correct collection
    res.json(groundStations);
  } catch (err) {
    res.status(500).send(err.message);
  }
});


// API endpoint to fetch TLE by satelliteId or _id
app.get("/api/tle/:id", async (req, res) => {
  try {
    const id = req.params.id;

    // Try to find by _id first
    let tle = await Tle.findById(id);

    // If not found, try to find by satelliteId
    if (!tle) {
      tle = await Tle.findOne({ satelliteId: id });
    }

    if (!tle) {
      return res.status(404).send("TLE1 not found");
    }

    res.json(tle);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

const generateContactWindows = require("./tasks/generateContactWindows");

app.post("/api/contact-windows/refresh", async (req, res) => {
  try {
    const satellites = await Satellite.find().populate("currentTleId"); // Populate TLE data
    const groundStations = await GroundStation.find();

    for (const satellite of satellites) {
      for (const groundStation of groundStations) {
        // Clear old contact windows for this satellite/ground station pair
        await ContactWindow.deleteMany({
          satelliteId: satellite._id,
          groundStationId: groundStation._id,
        });

        // Generate new contact windows
        const windows = await generateContactWindows(satellite, groundStation);

        // Insert new contact windows, ensuring no duplicates
        const bulkOps = windows.map((window) => ({
          updateOne: {
            filter: {
              satelliteId: window.satelliteId,
              groundStationId: window.groundStationId,
              scheduledAOS: window.aos, // Match by AOS to prevent duplicates
            },
            update: {
              $set: {
                satelliteId: window.satelliteId,
                groundStationId: window.groundStationId,
                scheduledAOS: window.aos,
                scheduledLOS: window.los,
                tleUsedId: satellite.currentTleId._id,
                maxElevationDeg: window.maxElevationDeg,
                durationSeconds: window.durationSeconds,
                status: "scheduled",
              },
            },
            upsert: true, // Insert if it doesn't exist
          },
        }));

        if (bulkOps.length > 0) {
          await ContactWindow.bulkWrite(bulkOps);
        }
      }
    }

    res.status(200).send("Contact windows refreshed successfully.");
  } catch (err) {
    console.error(err);
    res.status(500).send("Failed to refresh contact windows.");
  }
});

// Add this route to the existing Express app
app.get("/api/contact-windows", async (req, res) => {
  try {
    const { satelliteId, groundStationId } = req.query;

    // Validate query parameters
    if (!satelliteId || !groundStationId) {
      return res.status(400).json({ error: "Both satelliteId and groundStationId are required." });
    }

    // Query the contact_windows collection
    const contactWindows = await ContactWindow.find({
      satelliteId,
      groundStationId,
    }).sort({ scheduledAOS: 1 }); // Sort by scheduledAOS ascending

    // Return the results
    res.status(200).json(contactWindows);
  } catch (err) {
    console.error("Error fetching contact windows:", err);
    res.status(500).json({ error: "Failed to fetch contact windows." });
  }
});

const PORT = 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));