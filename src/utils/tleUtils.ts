import { Cartesian3, JulianDate, SampledPositionProperty } from "cesium";
import { propagate, twoline2satrec } from "satellite.js";

/**
 * Generates a SampledPositionProperty for a satellite's future positions based on TLE data.
 * @param line1 - The first line of the TLE.
 * @param line2 - The second line of the TLE.
 * @param durationMinutes - The duration in minutes for which to calculate positions.
 * @returns A SampledPositionProperty containing time-dynamic positions.
 */
export function getFuturePositionsWithTime(
  line1: string,
  line2: string,
  durationMinutes: number
): SampledPositionProperty {
  const satrec = twoline2satrec(line1, line2); // Parse the TLE into a satellite record
  const positionProperty = new SampledPositionProperty();

  const now = JulianDate.now(); // Current time
  const stepSeconds = 10; // Time step in seconds for position calculation

  for (let i = 0; i <= durationMinutes * 60; i += stepSeconds) {
    const time = JulianDate.addSeconds(now, i, new JulianDate()); // Future time
    const date = JulianDate.toDate(time); // Convert JulianDate to JavaScript Date

    // Propagate the satellite's position at the given time
    const positionAndVelocity = propagate(satrec, date);
    if (positionAndVelocity && positionAndVelocity.position) {
      const { x, y, z } = positionAndVelocity.position;

      // Add the position to the SampledPositionProperty
      positionProperty.addSample(time, Cartesian3.fromElements(x * 1000, y * 1000, z * 1000)); // Convert km to meters
    }
  }

  return positionProperty;
}