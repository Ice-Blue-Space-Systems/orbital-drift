const { propagate, gstime, twoline2satrec, eciToGeodetic, degreesLat, degreesLong } = require("satellite.js");
const ContactWindow = require("../models/ContactWindow");
const Satellite = require("../models/Satellite");
const GroundStation = require("../models/GroundStation");

/**
 * Generates contact windows between a satellite and a ground station using TLE data.
 * @param satellite - The satellite object from the database.
 * @param groundStation - The ground station object from the database.
 * @param timeRangeMinutes - Time range in minutes to calculate contact windows.
 * @returns An array of contact windows.
 */
async function generateContactWindows(satellite, groundStation, timeRangeMinutes = 1440) {
  // Access TLE data from the populated currentTleId field
  const { line1, line2 } = satellite.currentTleId;
  const { lat, lon, alt } = groundStation.location;

  const satrec = twoline2satrec(line1, line2);
  const now = new Date();
  const endTime = new Date(now.getTime() + timeRangeMinutes * 60 * 1000);
  const stepSeconds = 10;

  const contactWindows = [];
  let isInContact = false;
  let aos = null;
  let maxElevationDeg = 0;

  for (let time = now; time <= endTime; time = new Date(time.getTime() + stepSeconds * 1000)) {
    const gmst = gstime(time);
    const positionAndVelocity = propagate(satrec, time);

    if (positionAndVelocity?.position) {
      const geo = eciToGeodetic(positionAndVelocity.position, gmst);
      const satLat = degreesLat(geo.latitude);
      const satLon = degreesLong(geo.longitude);
      const satAlt = geo.height;

      const elevation = calculateElevationAngle(satLat, satLon, satAlt, lat, lon, alt);

      if (elevation > 0) {
        if (!isInContact) {
          isInContact = true;
          aos = new Date(time);
          maxElevationDeg = elevation;
        } else {
          maxElevationDeg = Math.max(maxElevationDeg, elevation);
        }
      } else if (isInContact) {
        isInContact = false;
        const los = new Date(time);
        const durationSeconds = (los.getTime() - aos.getTime()) / 1000;

        if (maxElevationDeg >= 10) {
          contactWindows.push({
            satelliteId: satellite._id,
            groundStationId: groundStation._id,
            aos,
            los,
            maxElevationDeg,
            durationSeconds,
          });
        }
      }
    }
  }

  return contactWindows;
}

/**
 * Calculates the elevation angle of a satellite relative to a ground station.
 */
function calculateElevationAngle(satLat, satLon, satAlt, stationLat, stationLon, stationAlt) {
  const earthRadiusKm = 6371;

  const satX = (earthRadiusKm + satAlt) * Math.cos((satLat * Math.PI) / 180) * Math.cos((satLon * Math.PI) / 180);
  const satY = (earthRadiusKm + satAlt) * Math.cos((satLat * Math.PI) / 180) * Math.sin((satLon * Math.PI) / 180);
  const satZ = (earthRadiusKm + satAlt) * Math.sin((satLat * Math.PI) / 180);

  const stationX =
    (earthRadiusKm + stationAlt) * Math.cos((stationLat * Math.PI) / 180) * Math.cos((stationLon * Math.PI) / 180);
  const stationY =
    (earthRadiusKm + stationAlt) * Math.cos((stationLat * Math.PI) / 180) * Math.sin((stationLon * Math.PI) / 180);
  const stationZ = (earthRadiusKm + stationAlt) * Math.sin((stationLat * Math.PI) / 180);

  const dx = satX - stationX;
  const dy = satY - stationY;
  const dz = satZ - stationZ;

  const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
  const dotProduct = (dx * stationX + dy * stationY + dz * stationZ) / (distance * earthRadiusKm);
  const elevationAngleRadians = Math.asin(dotProduct);

  return elevationAngleRadians * (180 / Math.PI);
}

module.exports = generateContactWindows;