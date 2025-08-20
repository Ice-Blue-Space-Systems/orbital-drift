import {
  Cartesian3,
  JulianDate,
  SampledPositionProperty,
  Transforms,
  Matrix3,
  CallbackProperty,
} from "cesium";
import { propagate, twoline2satrec } from "satellite.js";
import { fetchTleBySatelliteId } from "../store/tleSlice";
import { AppDispatch } from "../store";

// Cache for position properties to prevent unnecessary recalculations
const positionPropertyCache = new Map<string, {
  satPositionProperty: SampledPositionProperty | CallbackProperty;
  groundTrackPositionProperty: SampledPositionProperty | CallbackProperty;
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
  
  // Validate TLE lines format - allow for slight length variations and pad if needed
  if (!line1 || !line2) {
    console.error("getFuturePositionsWithTime: Missing TLE lines");
    return new SampledPositionProperty();
  }
  
  // TLE lines should be 69 characters, but sometimes they're 68 (missing trailing space/checksum)
  // Pad with spaces if they're slightly short
  if (line1.length < 68 || line2.length < 68) {
    console.error("getFuturePositionsWithTime: TLE lines too short:", { 
      line1Length: line1?.length, 
      line2Length: line2?.length 
    });
    return new SampledPositionProperty();
  }
  
  // Ensure lines are exactly 69 characters by padding with spaces if needed
  line1 = line1.padEnd(69, ' ');
  line2 = line2.padEnd(69, ' ');
  
  console.log("getFuturePositionsWithTime: Padded TLE lines:", { 
    line1Length: line1.length, 
    line2Length: line2.length 
  });
  
  const satrec = twoline2satrec(line1, line2);
  console.log("getFuturePositionsWithTime: TLE parsed successfully:", !!satrec);
  
  if (!satrec) {
    console.error("getFuturePositionsWithTime: Failed to parse TLE lines");
    return new SampledPositionProperty();
  }
  
  // Check for parsing errors
  if (satrec.error) {
    const errorMessages = {
      1: "Mean eccentricity out of range (0.0 < e < 1.0)",
      2: "Mean motion less than 0.0", 
      3: "Perturbed eccentricity out of range",
      4: "Semi-latus rectum < 0.0",
      5: "Epoch elements are sub-orbital",
      6: "Satellite has decayed"
    };
    console.error("getFuturePositionsWithTime: TLE parsing error:", satrec.error, "-", errorMessages[satrec.error] || "Unknown error");
    return new SampledPositionProperty();
  }
  
  // Log satrec details for debugging
  console.log("getFuturePositionsWithTime: Satellite record details:", {
    satnum: satrec.satnum,
    epochyr: satrec.epochyr,
    epochdays: satrec.epochdays,
    ndot: satrec.ndot,
    nddot: satrec.nddot,
    bstar: satrec.bstar,
    inclo: satrec.inclo,
    nodeo: satrec.nodeo,
    ecco: satrec.ecco,
    argpo: satrec.argpo,
    mo: satrec.mo,
    no: satrec.no,
    error: satrec.error
  });
  
  const positionProperty = new SampledPositionProperty();
  const now = cesiumClock.currentTime;
  const stepSeconds = 10;
  let validPositions = 0;
  let invalidPositions = 0;

  for (let i = 0; i <= durationMinutes * 60; i += stepSeconds) {
    const time = JulianDate.addSeconds(now, i, new JulianDate());
    const date = JulianDate.toDate(time);

    const posVel = propagate(satrec, date);
    
    // Check for propagation errors
    if (satrec.error !== 0) {
      invalidPositions++;
      if (invalidPositions <= 5) {
        const errorMessages = {
          1: "Mean eccentricity out of range",
          2: "Mean motion less than 0.0", 
          3: "Perturbed eccentricity out of range",
          4: "Semi-latus rectum < 0.0",
          5: "Epoch elements are sub-orbital",
          6: "Satellite has decayed"
        };
        console.warn(`getFuturePositionsWithTime: Propagation error ${satrec.error} (${errorMessages[satrec.error] || "Unknown"}) for time: ${date}`);
      }
      continue;
    }
    
    if (!posVel) {
      invalidPositions++;
      if (invalidPositions <= 5) {
        console.warn(`getFuturePositionsWithTime: No posVel returned for time: ${date}`);
      }
      continue;
    }
    
    if (!posVel.position) {
      invalidPositions++;
      if (invalidPositions <= 5) {
        console.warn("getFuturePositionsWithTime: No position in posVel for time:", date, "posVel:", posVel);
      }
      continue;
    }
    
    // Check for valid position values
    const pos = posVel.position;
    if (isNaN(pos.x) || isNaN(pos.y) || isNaN(pos.z)) {
      invalidPositions++;
      if (invalidPositions <= 5) {
        console.warn("getFuturePositionsWithTime: Invalid position values:", pos);
      }
      continue;
    }
    
    // Check if position values are unreasonably large (satellite might have decayed)
    const magnitude = Math.sqrt(pos.x * pos.x + pos.y * pos.y + pos.z * pos.z);
    if (magnitude < 6000 || magnitude > 50000) { // Earth radius ~6371km, GEO ~42000km
      invalidPositions++;
      if (invalidPositions <= 5) {
        console.warn(`getFuturePositionsWithTime: Position magnitude out of range: ${magnitude.toFixed(1)}km`, pos);
      }
      continue;
    }

    // ECI position in meters
    const eciPosition = new Cartesian3(
      pos.x * 1000,
      pos.y * 1000,
      pos.z * 1000
    );

    // ECI → ECEF position
    const fixedMatrix = Transforms.computeIcrfToFixedMatrix(time);
    const ecefPosition = fixedMatrix
      ? Matrix3.multiplyByVector(fixedMatrix, eciPosition, new Cartesian3())
      : eciPosition; // fallback: better than nothing

    positionProperty.addSample(time, ecefPosition);
    validPositions++;
    
    // Log first few positions for debugging
    if (validPositions <= 3) {
      console.log(`getFuturePositionsWithTime: Sample ${validPositions} - ECI:`, pos, "ECEF:", ecefPosition);
    }
  }

  console.log(`getFuturePositionsWithTime: Generated ${validPositions} valid positions, ${invalidPositions} invalid positions`);
  
  if (validPositions === 0) {
    console.error("getFuturePositionsWithTime: No valid positions generated! This will cause satellite to disappear.");
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
  satPositionProperty: SampledPositionProperty | CallbackProperty | null;
  groundTrackPositionProperty: SampledPositionProperty | CallbackProperty | null;
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
      console.log("loadTleAndPosition: Generating dynamic position properties for real-time simulation");
      
      // Debug TLE format
      debugTleFormat(line1, line2, satellite.name);
      
      // Additional TLE validation
      console.log("loadTleAndPosition: TLE validation check:");
      console.log("  Line 1 length:", line1.length);
      console.log("  Line 2 length:", line2.length);
      console.log("  Line 1 starts with '1':", line1.startsWith('1'));
      console.log("  Line 2 starts with '2':", line2.startsWith('2'));
      
      // Check TLE epoch (how old is this data?)
      // TLE format: positions 18-19 = year (2 digits), positions 20-31 = day of year (3 digits + fractional part)
      const epochYear = parseInt(line1.substring(18, 20));
      const epochDay = parseFloat(line1.substring(20, 32));
      
      // Convert 2-digit year to 4-digit year
      // Convention: 00-56 = 2000-2056, 57-99 = 1957-1999
      const fullYear = epochYear <= 56 ? 2000 + epochYear : 1900 + epochYear;
      
      console.log("loadTleAndPosition: TLE epoch parsing details:", {
        epochYearString: line1.substring(18, 20),
        epochDayString: line1.substring(20, 32),
        epochYear,
        epochDay,
        fullYear
      });
      
      // Calculate epoch date properly - JavaScript Date() months are 0-indexed
      const epochDate = new Date(fullYear, 0, 1); // Start of year
      epochDate.setTime(epochDate.getTime() + (epochDay - 1) * 24 * 60 * 60 * 1000); // Add days
      
      const daysSinceEpoch = (Date.now() - epochDate.getTime()) / (1000 * 60 * 60 * 24);
      
      console.log("loadTleAndPosition: TLE epoch info:");
      console.log("  Epoch year:", fullYear);
      console.log("  Epoch day:", epochDay);
      console.log("  Calculated epoch date:", epochDate.toISOString());
      console.log("  Days since epoch:", daysSinceEpoch.toFixed(1));
      
      if (daysSinceEpoch > 30) {
        console.warn("loadTleAndPosition: TLE data is quite old (>30 days). This may cause inaccurate positioning.");
      }
      
      if (daysSinceEpoch > 365) {
        console.warn("loadTleAndPosition: TLE data is very old (>1 year). Satellite may have decayed or positioning may be highly inaccurate.");
      }
      
      // Use dynamic position properties that calculate in real-time based on simulation clock
      const satPositionProperty = createDynamicPositionProperty(line1, line2, cesiumClock);
      const groundTrackPositionProperty = createDynamicPositionProperty(line1, line2, cesiumClock);

      // Cache the position properties (only if they're not null)
      if (satPositionProperty && groundTrackPositionProperty) {
        positionPropertyCache.set(satellite._id, {
          satPositionProperty,
          groundTrackPositionProperty,
          cacheKey
        });
        console.log("loadTleAndPosition: Successfully created and cached position properties");
      } else {
        console.warn("loadTleAndPosition: Failed to create position properties - skipping cache");
      }
  
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

/**
 * Validates TLE data to check if it will produce valid satellite positions
 * More lenient validation - only filters out clearly invalid or very problematic TLEs
 */
export function isValidTleForPlotting(line1: string, line2: string): boolean {
  try {
    // Basic format validation
    if (!line1 || !line2 || line1.length < 68 || line2.length < 68) {
      return false;
    }
    
    // Pad lines if needed
    line1 = line1.padEnd(69, ' ');
    line2 = line2.padEnd(69, ' ');
    
    // Parse TLE
    const satrec = twoline2satrec(line1, line2);
    if (!satrec) {
      return false;
    }
    
    // Only reject if there's a critical parsing error (like satellite has decayed)
    if (satrec.error === 6) { // Satellite has decayed
      return false;
    }
    
    // Check TLE age - only reject extremely old TLEs (>3 years)
    // This is much more lenient than before
    const epochYear = parseInt(line1.substring(18, 20));
    const epochDay = parseFloat(line1.substring(20, 32));
    const fullYear = epochYear <= 56 ? 2000 + epochYear : 1900 + epochYear;
    
    const epochDate = new Date(fullYear, 0, 1);
    epochDate.setTime(epochDate.getTime() + (epochDay - 1) * 24 * 60 * 60 * 1000);
    
    const daysSinceEpoch = (Date.now() - epochDate.getTime()) / (1000 * 60 * 60 * 24);
    
    // Only reject TLEs older than 3 years (extremely old)
    if (daysSinceEpoch > 1095) {
      return false;
    }
    
    // Don't do the position test here - it's too strict and slow
    // Let the rendering function handle propagation errors gracefully
    return true;
  } catch (error) {
    console.warn("isValidTleForPlotting: Error validating TLE:", error);
    return false;
  }
}

/**
 * Debug function to compare TLE formats and identify issues
 */
export function debugTleFormat(line1: string, line2: string, satelliteName: string = "Unknown"): void {
  console.group(`🔍 TLE Debug Analysis for ${satelliteName}`);
  
  console.log("Raw TLE lines:");
  console.log(`Line 1: "${line1}" (length: ${line1.length})`);
  console.log(`Line 2: "${line2}" (length: ${line2.length})`);
  
  if (line1.length >= 69) {
    console.log("Line 1 breakdown:");
    console.log(`  Line number: "${line1.substring(0, 1)}"`);
    console.log(`  Satellite number: "${line1.substring(2, 7)}"`);
    console.log(`  Classification: "${line1.substring(7, 8)}"`);
    console.log(`  Launch year: "${line1.substring(9, 11)}"`);
    console.log(`  Launch number: "${line1.substring(11, 14)}"`);
    console.log(`  Launch piece: "${line1.substring(14, 17)}"`);
    console.log(`  Epoch year: "${line1.substring(18, 20)}"`);
    console.log(`  Epoch day: "${line1.substring(20, 32)}"`);
    console.log(`  First derivative: "${line1.substring(33, 43)}"`);
    console.log(`  Second derivative: "${line1.substring(44, 52)}"`);
    console.log(`  BSTAR: "${line1.substring(53, 61)}"`);
    console.log(`  Ephemeris type: "${line1.substring(62, 63)}"`);
    console.log(`  Element set number: "${line1.substring(64, 68)}"`);
    console.log(`  Checksum: "${line1.substring(68, 69)}"`);
  }
  
  if (line2.length >= 69) {
    console.log("Line 2 breakdown:");
    console.log(`  Line number: "${line2.substring(0, 1)}"`);
    console.log(`  Satellite number: "${line2.substring(2, 7)}"`);
    console.log(`  Inclination: "${line2.substring(8, 16)}"`);
    console.log(`  RAAN: "${line2.substring(17, 25)}"`);
    console.log(`  Eccentricity: "${line2.substring(26, 33)}"`);
    console.log(`  Argument of perigee: "${line2.substring(34, 42)}"`);
    console.log(`  Mean anomaly: "${line2.substring(43, 51)}"`);
    console.log(`  Mean motion: "${line2.substring(52, 63)}"`);
    console.log(`  Revolution number: "${line2.substring(63, 68)}"`);
    console.log(`  Checksum: "${line2.substring(68, 69)}"`);
  }
  
  // Test parsing
  try {
    const satrec = twoline2satrec(line1, line2);
    console.log("TLE parsing result:");
    console.log(`  Success: ${!!satrec}`);
    console.log(`  Error code: ${satrec?.error || 'N/A'}`);
    
    if (satrec?.error) {
      const errorMessages = {
        1: "Mean eccentricity out of range",
        2: "Mean motion less than 0.0", 
        3: "Perturbed eccentricity out of range",
        4: "Semi-latus rectum < 0.0",
        5: "Epoch elements are sub-orbital",
        6: "Satellite has decayed"
      };
      console.log(`  Error message: ${errorMessages[satrec.error] || 'Unknown error'}`);
    }
    
    if (satrec && satrec.error === 0) {
      console.log("Orbital elements:");
      console.log(`  Epoch year: ${satrec.epochyr}`);
      console.log(`  Epoch days: ${satrec.epochdays}`);
      console.log(`  Inclination: ${satrec.inclo} rad`);
      console.log(`  RAAN: ${satrec.nodeo} rad`);
      console.log(`  Eccentricity: ${satrec.ecco}`);
      console.log(`  Argument of perigee: ${satrec.argpo} rad`);
      console.log(`  Mean anomaly: ${satrec.mo} rad`);
      console.log(`  Mean motion: ${satrec.no} rad/min`);
    }
  } catch (error) {
    console.error("TLE parsing failed:", error);
  }
  
  console.groupEnd();
}

// Create dynamic position property that calculates position in real-time
function createDynamicPositionProperty(line1: string, line2: string, cesiumClock: any): CallbackProperty | null {
  console.log("createDynamicPositionProperty: Creating dynamic position property");
  
  // Parse TLE
  const satrec = twoline2satrec(line1, line2);
  
  if (!satrec) {
    console.error("createDynamicPositionProperty: Failed to parse TLE lines");
    return null;
  }
  
  // Check for parsing errors
  if (satrec.error) {
    const errorMessages = {
      1: "Mean eccentricity out of range (0.0 < e < 1.0)",
      2: "Mean motion less than 0.0", 
      3: "Perturbed eccentricity out of range",
      4: "Semi-latus rectum < 0.0",
      5: "Epoch elements are sub-orbital",
      6: "Satellite has decayed"
    };
    console.error("createDynamicPositionProperty: TLE parsing error:", satrec.error, "-", errorMessages[satrec.error] || "Unknown error");
    return null;
  }
  
  console.log("createDynamicPositionProperty: Successfully parsed TLE, creating CallbackProperty");
  
  // Create a CallbackProperty that calculates position based on current simulation time
  return new CallbackProperty((time: JulianDate | undefined, result?: Cartesian3): Cartesian3 | undefined => {
    if (!time) return undefined;
    
    try {
      // Convert Cesium JulianDate to JavaScript Date
      const date = JulianDate.toDate(time);
      
      // Propagate satellite position to this time
      const posVel = propagate(satrec, date);
      
      // Check for propagation errors
      if (satrec.error !== 0) {
        return undefined;
      }
      
      if (!posVel || !posVel.position) {
        return undefined;
      }
      
      const pos = posVel.position;
      
      // Check for valid position values
      if (isNaN(pos.x) || isNaN(pos.y) || isNaN(pos.z)) {
        return undefined;
      }
      
      // Check if position values are unreasonably large (satellite might have decayed)
      const magnitude = Math.sqrt(pos.x * pos.x + pos.y * pos.y + pos.z * pos.z);
      if (magnitude > 50000) { // 50,000 km is way beyond any reasonable orbit
        return undefined;
      }
      
      // Convert from kilometers to meters and create Cesium Cartesian3
      const cartesian = new Cartesian3(pos.x * 1000, pos.y * 1000, pos.z * 1000);
      
      if (result) {
        return Cartesian3.clone(cartesian, result);
      } else {
        return cartesian;
      }
    } catch (error) {
      console.error("createDynamicPositionProperty: Error calculating position:", error);
      return undefined;
    }
  }, false); // false = not a constant property, will be evaluated every frame
}
