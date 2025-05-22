import { Cartesian3 } from "cesium";
import * as satellite from "satellite.js";

/**
 * Given TLE lines for a satellite and a number of minutes ahead,
 * calculates predicted positions at each minute from "now."
 *
 * @param tleLine1      First line of the satellite's TLE
 * @param tleLine2      Second line of the satellite's TLE
 * @param minutesAhead  Number of future minutes to calculate
 * @returns             An array of Cesium Cartesian3 points
 */
export function getFuturePositions(
  tleLine1: string,
  tleLine2: string,
  minutesAhead = 90
): Cartesian3[] {
  // Convert the TLE lines into a satellite record
  const satrec = satellite.twoline2satrec(tleLine1, tleLine2);

  // Starting time for predictions
  const now = new Date();

  // Store each future position as a Cartesian3
  const positions: Cartesian3[] = [];

  // Generate a position at each minute from now until 'minutesAhead'
  for (let i = 0; i < minutesAhead; i++) {
    // Calculate the future timestamp
    const time = new Date(now.getTime() + i * 60_000);

    // Propagate the satellite's position & velocity at that time
    const posVel = satellite.propagate(satrec, time);
    if (posVel && posVel.position) {
      // Compute the sidereal time & convert ECI (Earth-centered inertial)
      // coordinates to geodetic coordinates (lat, lon, height)
      const gmst = satellite.gstime(time);
      const geo = satellite.eciToGeodetic(posVel.position, gmst);

      // Convert from radians to degrees for longitude/latitude
      const longitude = satellite.degreesLong(geo.longitude);
      const latitude = satellite.degreesLat(geo.latitude);

      // Convert altitude from kilometers to meters
      const altitude = geo.height * 1000;

      // Convert lat, lon, alt to Cartesian3 format for use in Cesium
      positions.push(Cartesian3.fromDegrees(longitude, latitude, altitude));
    }
  }

  // Return the future positions for plotting
  return positions;
}