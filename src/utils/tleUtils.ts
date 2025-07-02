import {
  Cartesian3,
  JulianDate,
  SampledPositionProperty,
  Transforms,
  Matrix3,
} from "cesium";
import { propagate, twoline2satrec } from "satellite.js";

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
    const eciPosition = new Cartesian3(
      posVel.position.x * 1000,
      posVel.position.y * 1000,
      posVel.position.z * 1000
    );

    // ECI → ECEF position
    const fixedMatrix = Transforms.computeIcrfToFixedMatrix(time);
    const ecefPosition = fixedMatrix
      ? Matrix3.multiplyByVector(fixedMatrix, eciPosition, new Cartesian3())
      : eciPosition; // fallback: better than nothing

    positionProperty.addSample(time, ecefPosition);
  }

  return positionProperty;
}

/**
 * Calculates the satellite's velocity at a specific time based on TLE data.
 * Converts from ECI to ECEF for consistency with Cesium.
 */
export function getVelocityAtTime(
  line1: string,
  line2: string,
  time: JulianDate
): Cartesian3 | null {
  const satrec = twoline2satrec(line1, line2);
  const date = JulianDate.toDate(time);

  const posVel = propagate(satrec, date);
  if (!posVel || !posVel.velocity) return null;

  // ECI velocity in meters per second
  const eciVelocity = new Cartesian3(
    posVel.velocity.x * 1000,
    posVel.velocity.y * 1000,
    posVel.velocity.z * 1000
  );

  // ECI → ECEF velocity
  const fixedMatrix = Transforms.computeIcrfToFixedMatrix(time);
  const ecefVelocity = fixedMatrix
    ? Matrix3.multiplyByVector(fixedMatrix, eciVelocity, new Cartesian3())
    : eciVelocity; // fallback: better than nothing

  return ecefVelocity;
}

/**
 * Calculates the Doppler shift and adjusted frequency based on satellite velocity and ground station position.
 * @param line1 - TLE line 1
 * @param line2 - TLE line 2
 * @param time - JulianDate for the calculation
 * @param groundStationPosition - Cartesian3 position of the ground station
 * @param baseFrequencyHz - Original transmission frequency (Hz)
 * @returns { dopplerShift: number, adjustedFrequency: number } or null if calculation fails
 */
export function calculateDopplerShift(
  line1: string,
  line2: string,
  time: JulianDate,
  groundStationPosition: Cartesian3,
  baseFrequencyHz: number
): { dopplerShift: number; adjustedFrequency: number } | null {
  const satrec = twoline2satrec(line1, line2);
  const date = JulianDate.toDate(time);

  const posVel = propagate(satrec, date);
  if (!posVel || !posVel.velocity || !posVel.position) return null;

  // Satellite position and velocity in ECI
  const eciPosition = new Cartesian3(
    posVel.position.x * 1000,
    posVel.position.y * 1000,
    posVel.position.z * 1000
  );
  const eciVelocity = new Cartesian3(
    posVel.velocity.x * 1000,
    posVel.velocity.y * 1000,
    posVel.velocity.z * 1000
  );

  // Convert ECI to ECEF
  const fixedMatrix = Transforms.computeIcrfToFixedMatrix(time);
  const ecefPosition = fixedMatrix
    ? Matrix3.multiplyByVector(fixedMatrix, eciPosition, new Cartesian3())
    : eciPosition;
  const ecefVelocity = fixedMatrix
    ? Matrix3.multiplyByVector(fixedMatrix, eciVelocity, new Cartesian3())
    : eciVelocity;

  // Compute line-of-sight vector (station → satellite)
  const lineOfSight = Cartesian3.subtract(ecefPosition, groundStationPosition, new Cartesian3());
  Cartesian3.normalize(lineOfSight, lineOfSight);

  // Compute radial velocity (dot product of velocity and line-of-sight)
  const radialVelocity = Cartesian3.dot(ecefVelocity, lineOfSight);

  // Calculate Doppler shift
  const c = 299792458; // Speed of light (m/s)
  const dopplerShift = baseFrequencyHz * (radialVelocity / c);

  // Calculate adjusted frequency
  const adjustedFrequency = baseFrequencyHz + dopplerShift;

  return { dopplerShift, adjustedFrequency };
}
