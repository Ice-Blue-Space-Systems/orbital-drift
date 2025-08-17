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

// Cache for position properties to prevent unnecessary recalculations
const positionPropertyCache = new Map<string, {
  satPositionProperty: SampledPositionProperty;
  groundTrackPositionProperty: SampledPositionProperty;
  cacheKey: string;
}>();

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
  console.log("getFuturePositionsWithTime: Generating positions with TLE:", { line1, line2 });
  const satrec = twoline2satrec(line1, line2);
  console.log("getFuturePositionsWithTime: TLE parsed successfully:", !!satrec);
  
  const positionProperty = new SampledPositionProperty();
  const now = cesiumClock.currentTime;
  const stepSeconds = 10;
  let validPositions = 0;

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
    validPositions++;
  }

  console.log(`getFuturePositionsWithTime: Generated ${validPositions} valid positions`);
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
  console.log("loadTleAndPosition: Starting for satellite:", satellite);
  
  // Create a cache key based on satellite ID and current TLE ID
  const cacheKey = `${satellite._id}-${satellite.currentTleId || 'no-tle'}`;
  
  // Check if we already have cached position properties for this satellite/TLE combination
  const cached = positionPropertyCache.get(satellite._id);
  if (cached && cached.cacheKey === cacheKey) {
    console.log("loadTleAndPosition: Using cached position properties for satellite:", satellite._id);
    return {
      satPositionProperty: cached.satPositionProperty,
      groundTrackPositionProperty: cached.groundTrackPositionProperty
    };
  }

  try {
    let line1 = "";
    let line2 = "";

    if (satellite.currentTleId) {
      // Use TLE from database (works for both simulated and live satellites)
      console.log("loadTleAndPosition: Fetching TLE from database with ID:", satellite.currentTleId);
      const tle = await dispatch(fetchTleBySatelliteId(satellite.currentTleId)).unwrap();
      console.log("loadTleAndPosition: Retrieved TLE:", tle);
      line1 = tle.line1;
      line2 = tle.line2;
    } else if (satellite.type === "live" && satellite.noradId) {
      // Fallback: fetch from CelesTrak for live satellites without stored TLE
      console.log("loadTleAndPosition: No currentTleId, fetching from CelesTrak for NORAD ID:", satellite.noradId);
      const res = await fetch("https://celestrak.com/NORAD/elements/stations.txt");
      const lines = (await res.text()).split("\n");
      const idx = lines.findIndex((l) => l.includes(String(satellite.noradId)));
      if (idx !== -1) {
        line1 = lines[idx];
        line2 = lines[idx + 1];
        console.log("loadTleAndPosition: Found TLE from CelesTrak:", { line1, line2 });
      } else {
        console.log("loadTleAndPosition: NORAD ID not found in CelesTrak data");
      }
    }

    console.log("loadTleAndPosition: Final TLE lines:", { line1, line2 });

    if (line1 && line2) {
      console.log("loadTleAndPosition: Generating position properties");
      const satPositionProperty = getFuturePositionsWithTime(line1, line2, 1060, cesiumClock);
      const groundTrackPositionProperty = getFuturePositionsWithTime(line1, line2, 1060, cesiumClock);

      // Cache the position properties
      positionPropertyCache.set(satellite._id, {
        satPositionProperty,
        groundTrackPositionProperty,
        cacheKey
      });

      console.log("loadTleAndPosition: Successfully created and cached position properties");
  
  // Debug: Test if position property has valid data
  if (satPositionProperty) {
    const now = JulianDate.now();
    const testPosition = satPositionProperty.getValue(now);
    console.log("loadTleAndPosition: Test position at current time:", {
      hasTestPosition: !!testPosition,
      testPosition: testPosition ? `${testPosition.x}, ${testPosition.y}, ${testPosition.z}` : null
    });
  }
      return { satPositionProperty, groundTrackPositionProperty };
    } else {
      console.log("loadTleAndPosition: No TLE data found - missing line1 or line2");
      return { satPositionProperty: null, groundTrackPositionProperty: null };
    }
  } catch (err) {
    console.error("loadTleAndPosition: Error:", err);
    return { satPositionProperty: null, groundTrackPositionProperty: null };
  }
}
