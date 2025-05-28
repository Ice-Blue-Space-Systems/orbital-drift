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
  const deg2rad = (deg) => (deg * Math.PI) / 180;
  const rad2deg = (rad) => (rad * 180) / Math.PI;

  const earthRadiusKm = 6371;

  // Convert to radians
  const phi = deg2rad(stationLat); // latitude
  const lambda = deg2rad(stationLon); // longitude

  const rho = earthRadiusKm + stationAlt;

  // Position of ground station in ECEF
  const stationX = rho * Math.cos(phi) * Math.cos(lambda);
  const stationY = rho * Math.cos(phi) * Math.sin(lambda);
  const stationZ = rho * Math.sin(phi);

  const satRho = earthRadiusKm + satAlt;
  const satPhi = deg2rad(satLat);
  const satLambda = deg2rad(satLon);

  const satX = satRho * Math.cos(satPhi) * Math.cos(satLambda);
  const satY = satRho * Math.cos(satPhi) * Math.sin(satLambda);
  const satZ = satRho * Math.sin(satPhi);

  // Vector from station to satellite
  const dx = satX - stationX;
  const dy = satY - stationY;
  const dz = satZ - stationZ;

  // Topocentric transformation (East-North-Up)
  const sinPhi = Math.sin(phi);
  const cosPhi = Math.cos(phi);
  const sinLambda = Math.sin(lambda);
  const cosLambda = Math.cos(lambda);

  const topX = -sinLambda * dx + cosLambda * dy; // East
  const topY = -cosLambda * sinPhi * dx - sinLambda * sinPhi * dy + cosPhi * dz; // North
  const topZ = cosLambda * cosPhi * dx + sinLambda * cosPhi * dy + sinPhi * dz; // Up

  const slantRange = Math.sqrt(topX ** 2 + topY ** 2 + topZ ** 2);
  const elevation = Math.asin(topZ / slantRange);

  return rad2deg(elevation);
}


module.exports = generateContactWindows;