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

// API endpoint to create a new satellite
app.post("/api/satellites", async (req, res) => {
  try {
    console.log("Received satellite creation request:", JSON.stringify(req.body, null, 2));
    const { tleData, ...satelliteData } = req.body;
    
    // Create the satellite first
    const newSatellite = new Satellite(satelliteData);
    const savedSatellite = await newSatellite.save();
    console.log("Satellite saved:", savedSatellite._id);
    
    // If TLE data is provided, create the TLE record and link it
    if (tleData) {
      console.log("TLE data provided, creating TLE record...");
      // Convert CelesTrak TLE data to TLE format
      const tleLines = convertCelesTrakToTLE(tleData);
      console.log("Generated TLE lines:", tleLines);
      
      const newTle = new Tle({
        satelliteId: savedSatellite._id,
        line1: tleLines.line1,
        line2: tleLines.line2,
        epoch: new Date(tleData.EPOCH),
        source: "live",
        createdAt: new Date()
      });
      
      const savedTle = await newTle.save();
      console.log("TLE saved:", savedTle._id);
      
      // Update satellite with currentTleId
      savedSatellite.currentTleId = savedTle._id;
      await savedSatellite.save();
      console.log("Satellite updated with TLE ID");
    } else {
      console.log("No TLE data provided in request");
    }
    
    res.status(201).json(savedSatellite);
  } catch (err) {
    console.error("Error creating satellite:", err);
    res.status(400).send(err.message);
  }
});

// Helper function to convert CelesTrak data to TLE format
function convertCelesTrakToTLE(sat) {
  // Helper function to format epoch
  const formatEpoch = (epochStr) => {
    const date = new Date(epochStr);
    const year = date.getUTCFullYear().toString().slice(-2);
    const dayOfYear = Math.floor((date.getTime() - new Date(date.getUTCFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));
    const fractionalDay = (date.getUTCHours() * 3600 + date.getUTCMinutes() * 60 + date.getUTCSeconds()) / 86400;
    return `${year}${String(dayOfYear).padStart(3, '0')}.${(fractionalDay).toFixed(8).slice(2)}`;
  };

  const formatExponential = (num) => {
    if (num === 0) return " 00000-0";
    const absNum = Math.abs(num);
    const sign = num >= 0 ? " " : "-";
    const exp = Math.floor(Math.log10(absNum));
    const mantissa = Math.round(absNum / Math.pow(10, exp) * 100000);
    return `${sign}${String(mantissa).padStart(5, '0')}-${Math.abs(exp)}`;
  };

  const calculateTLEChecksum = (line) => {
    let sum = 0;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char >= '0' && char <= '9') {
        sum += parseInt(char);
      } else if (char === '-') {
        sum += 1;
      }
    }
    return sum % 10;
  };

  // Generate TLE lines
  const epoch = formatEpoch(sat.EPOCH);
  const meanMotionDot = sat.MEAN_MOTION_DOT ? formatExponential(sat.MEAN_MOTION_DOT) : " 00000-0";
  const meanMotionDdot = sat.MEAN_MOTION_DDOT ? formatExponential(sat.MEAN_MOTION_DDOT) : " 00000-0";
  const bstar = sat.BSTAR ? formatExponential(sat.BSTAR) : " 00000-0";

  // Line 1
  const line1Base = `1 ${String(sat.NORAD_CAT_ID).padStart(5)}U ${sat.OBJECT_ID.padEnd(8)} ${epoch}${meanMotionDot}${meanMotionDdot} ${bstar} 0 ${String(sat.ELEMENT_SET_NO).padStart(4)}`;
  const line1Checksum = calculateTLEChecksum(line1Base);
  const line1 = `${line1Base}${line1Checksum}`;

  // Line 2
  const inclination = sat.INCLINATION.toFixed(4).padStart(8);
  const raan = sat.RA_OF_ASC_NODE.toFixed(4).padStart(8);
  const eccentricity = String(Math.round(sat.ECCENTRICITY * 10000000)).padStart(7, '0');
  const argPerigee = sat.ARG_OF_PERICENTER.toFixed(4).padStart(8);
  const meanAnomaly = sat.MEAN_ANOMALY.toFixed(4).padStart(8);
  const meanMotion = sat.MEAN_MOTION.toFixed(8).padStart(11);
  const revNumber = String(sat.REV_AT_EPOCH).padStart(5);

  const line2Base = `2 ${String(sat.NORAD_CAT_ID).padStart(5)} ${inclination} ${raan} ${eccentricity} ${argPerigee} ${meanAnomaly} ${meanMotion}${revNumber}`;
  const line2Checksum = calculateTLEChecksum(line2Base);
  const line2 = `${line2Base}${line2Checksum}`;

  return { line1, line2 };
}

// API endpoint to update a satellite
app.put("/api/satellites/:id", async (req, res) => {
  try {
    const updatedSatellite = await Satellite.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!updatedSatellite) {
      return res.status(404).send("Satellite not found");
    }
    res.json(updatedSatellite);
  } catch (err) {
    res.status(400).send(err.message);
  }
});

// API endpoint to delete a satellite
app.delete("/api/satellites/:id", async (req, res) => {
  try {
    const deletedSatellite = await Satellite.findByIdAndDelete(req.params.id);
    if (!deletedSatellite) {
      return res.status(404).send("Satellite not found");
    }
    res.status(200).json({ message: "Satellite deleted successfully", satellite: deletedSatellite });
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// API endpoint to fetch ground stations
app.get("/api/ground-stations", async (req, res) => {
  try {
    const groundStations = await GroundStation.find();
    res.json(groundStations);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// API endpoint to fetch a specific ground station by ID
app.get("/api/ground-stations/:id", async (req, res) => {
  try {
    const groundStation = await GroundStation.findById(req.params.id);
    if (!groundStation) {
      return res.status(404).send("Ground station not found");
    }
    res.json(groundStation);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// API endpoint to create a new ground station
app.post("/api/ground-stations", async (req, res) => {
  try {
    const newGroundStation = new GroundStation(req.body);
    const savedGroundStation = await newGroundStation.save();
    res.status(201).json(savedGroundStation);
  } catch (err) {
    res.status(400).send(err.message);
  }
});

// API endpoint to update a ground station
app.put("/api/ground-stations/:id", async (req, res) => {
  try {
    const updatedGroundStation = await GroundStation.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!updatedGroundStation) {
      return res.status(404).send("Ground station not found");
    }
    res.json(updatedGroundStation);
  } catch (err) {
    res.status(400).send(err.message);
  }
});

// API endpoint to delete a ground station
app.delete("/api/ground-stations/:id", async (req, res) => {
  try {
    const deletedGroundStation = await GroundStation.findByIdAndDelete(req.params.id);
    if (!deletedGroundStation) {
      return res.status(404).send("Ground station not found");
    }
    res.status(200).json({ message: "Ground station deleted successfully", groundStation: deletedGroundStation });
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
      // Skip satellites without TLE data
      if (!satellite.currentTleId) {
        console.warn(`Satellite ${satellite.name} does not have TLE data. Skipping.`);
        continue;
      }

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

    // Extract real MongoDB ObjectIds from synthetic IDs
    let realSatelliteId = satelliteId;
    let realGroundStationId = groundStationId;

    // Handle synthetic IDs from the frontend (e.g., "api-66502a4e1f9c9f1a9c13b001" -> "66502a4e1f9c9f1a9c13b001")
    if (satelliteId.startsWith('api-')) {
      realSatelliteId = satelliteId.replace('api-', '');
    }
    if (groundStationId.startsWith('api-')) {
      realGroundStationId = groundStationId.replace('api-', '');
    }

    // For predefined ground stations (e.g., "predefined-1"), we can't find contact windows
    // since they don't exist in the database
    if (groundStationId.startsWith('predefined-')) {
      return res.status(200).json([]); // Return empty array for predefined ground stations
    }

    // Query the contact_windows collection
    const contactWindows = await ContactWindow.find({
      satelliteId: realSatelliteId,
      groundStationId: realGroundStationId,
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