import {
  Cartesian3,
  JulianDate,
  SampledPositionProperty,
  Transforms,
  Matrix3,
} from "cesium";
import { propagate, twoline2satrec } from "satellite.js";
import { fetchTleBySatelliteId } from "../store/tleSlice";
import { AppDispatch } from "../store";

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
 * Fetches TLE data and generates satellite positions.
 * @param satellite - The satellite object containing TLE or NORAD ID information.
 * @param dispatch - Redux dispatch function for fetching TLE data.
 * @param cesiumClock - Cesium clock instance for time calculations.
 * @returns An object containing satellite position and ground track position properties.
 */
export async function loadTleAndPosition(
  satellite: any,
  dispatch: AppDispatch,
  cesiumClock: any
): Promise<{
  satPositionProperty: SampledPositionProperty | null;
  groundTrackPositionProperty: SampledPositionProperty | null;
}> {
  try {
    let line1 = "";
    let line2 = "";

    if (satellite.type === "simulated" && satellite.currentTleId) {
      const tle = await dispatch(fetchTleBySatelliteId(satellite.currentTleId)).unwrap();
      line1 = tle.line1;
      line2 = tle.line2;
    } else if (satellite.type === "live" && satellite.noradId) {
      const res = await fetch("https://celestrak.com/NORAD/elements/stations.txt");
      const lines = (await res.text()).split("\n");
      const idx = lines.findIndex((l) => l.includes(String(satellite.noradId)));
      if (idx !== -1) {
        line1 = lines[idx];
        line2 = lines[idx + 1];
      }
    }

    if (line1 && line2) {
      const satPositionProperty = getFuturePositionsWithTime(line1, line2, 1060, cesiumClock);
      const groundTrackPositionProperty = getFuturePositionsWithTime(line1, line2, 1060, cesiumClock);

      return { satPositionProperty, groundTrackPositionProperty };
    } else {
      return { satPositionProperty: null, groundTrackPositionProperty: null };
    }
  } catch (err) {
    console.error("Failed to fetch TLE or compute position", err);
    return { satPositionProperty: null, groundTrackPositionProperty: null };
  }
}
