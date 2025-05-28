import {
  Cartesian3,
  JulianDate,
  SampledPositionProperty,
  Transforms,
  Matrix3,
} from "cesium";
import { propagate, twoline2satrec, gstime } from "satellite.js";

/**
 * Generates a SampledPositionProperty for a satellite's future positions based on TLE data.
 * Converts from ECI to ECEF so Cesium displays it correctly on the globe.
 */
export function getFuturePositionsWithTime(
  line1: string,
  line2: string,
  durationMinutes: number,
  cesiumClock: any
): SampledPositionProperty {
  const satrec = twoline2satrec(line1, line2);
  const positionProperty = new SampledPositionProperty();
  const now = cesiumClock.currentTime;
  const stepSeconds = 10;

  for (let i = 0; i <= durationMinutes * 60; i += stepSeconds) {
    const time = JulianDate.addSeconds(now, i, new JulianDate());
    const date = JulianDate.toDate(time);

    const posVel = propagate(satrec, date);
    if (!posVel || !posVel.position) continue;

    // ECI position in meters
    const eci = new Cartesian3(
      posVel.position.x * 1000,
      posVel.position.y * 1000,
      posVel.position.z * 1000
    );

    // ECI → ECEF
    const fixedMatrix = Transforms.computeIcrfToFixedMatrix(time);
    const ecef = fixedMatrix
      ? Matrix3.multiplyByVector(fixedMatrix, eci, new Cartesian3())
      : eci; // fallback: better than nothing

    positionProperty.addSample(time, ecef);
  }

  return positionProperty;
}
