import { Satellite as ApiSatellite } from "../types";

// Extended interface for display purposes (combines different satellite sources)
export interface DisplaySatellite {
  id: string;
  name: string;
  source: "api" | "celestrak" | "custom";
  type?: "live" | "simulated";
  noradId?: number;
  country?: string;
  launchDate?: string;
  orbitType?: "LEO" | "MEO" | "GEO" | "HEO" | "Unknown";
  status: "Active" | "Inactive" | "Decayed" | "Unknown";
  category?: "Space Station" | "Navigation" | "Communication" | "Weather" | "Earth Observation" | "CubeSat" | "Commercial" | "Scientific" | "Military" | "Unknown";
  constellation?: string; // For grouped satellites like Starlink, OneWeb, etc.
  apogee?: number; // km
  perigee?: number; // km
  inclination?: number; // degrees
  period?: number; // minutes
  lastUpdate: string;
  description?: string;
  // Original CelesTrak data for TLE generation (only for celestrak source)
  celestrakData?: CelesTrakSatellite;
}

// CelesTrak TLE data structure
interface CelesTrakSatellite {
  OBJECT_NAME: string;
  OBJECT_ID: string;
  EPOCH: string;
  MEAN_MOTION: number;
  ECCENTRICITY: number;
  INCLINATION: number;
  RA_OF_ASC_NODE: number;
  ARG_OF_PERICENTER: number;
  MEAN_ANOMALY: number;
  EPHEMERIS_TYPE: number;
  CLASSIFICATION_TYPE: string;
  NORAD_CAT_ID: number;
  ELEMENT_SET_NO: number;
  REV_AT_EPOCH: number;
  BSTAR: number;
  MEAN_MOTION_DOT: number;
  MEAN_MOTION_DDOT: number;
}

// Country code mapping for different satellite naming conventions
const countryFromSatelliteName = (name: string): string => {
  const nameUpper = name.toUpperCase();
  
  // SpaceX and US Commercial
  if (nameUpper.includes("STARLINK") || nameUpper.includes("FALCON") || nameUpper.includes("DRAGON")) return "USA";
  
  // Russian satellites
  if (nameUpper.includes("COSMOS") || nameUpper.includes("SOYUZ") || nameUpper.includes("PROGRESS")) return "Russia";
  if (nameUpper.includes("MOLNIYA") || nameUpper.includes("GLONAS")) return "Russia";
  
  // Chinese satellites
  if (nameUpper.includes("TIANGONG") || nameUpper.includes("SHENZHOU") || nameUpper.includes("CHANG'E")) return "China";
  if (nameUpper.includes("FENGYUN") || nameUpper.includes("YAOGAN")) return "China";
  
  // European satellites
  if (nameUpper.includes("SENTINEL") || nameUpper.includes("GALILEO") || nameUpper.includes("ENVISAT")) return "Europe";
  if (nameUpper.includes("ERS") || nameUpper.includes("METEOSAT")) return "Europe";
  
  // US Commercial and Government
  if (nameUpper.includes("IRIDIUM") || nameUpper.includes("GLOBALSTAR") || nameUpper.includes("ONEWEB")) return "USA";
  if (nameUpper.includes("TERRA") || nameUpper.includes("AQUA") || nameUpper.includes("LANDSAT")) return "USA";
  if (nameUpper.includes("GPS") || nameUpper.includes("NAVSTAR")) return "USA";
  if (nameUpper.includes("GOES") || nameUpper.includes("NOAA")) return "USA";
  
  // Japanese satellites
  if (nameUpper.includes("ALOS") || nameUpper.includes("HIMAWARI") || nameUpper.includes("JCSAT")) return "Japan";
  
  // Indian satellites
  if (nameUpper.includes("RESOURCESAT") || nameUpper.includes("CARTOSAT") || nameUpper.includes("INSAT")) return "India";
  
  // Canadian satellites
  if (nameUpper.includes("RADARSAT") || nameUpper.includes("ANIK")) return "Canada";
  
  // ISS and international missions
  if (nameUpper.includes("ISS") || nameUpper.includes("INTERNATIONAL SPACE STATION")) return "International";
  
  // console.log(`Country detection for satellite "${name}" defaulted to International`);
  return "International";
};

// Determine orbit type from orbital elements
const getOrbitType = (meanMotion: number, inclination: number): DisplaySatellite["orbitType"] => {
  // Calculate orbital period in minutes
  const period = 1440 / meanMotion; // 1440 minutes in a day
  
  // Calculate approximate altitude from period (simplified)
  // Using Kepler's third law approximation
  const earthRadius = 6371; // km
  const mu = 398600.4418; // Earth's gravitational parameter (km³/s²)
  const periodSeconds = period * 60;
  const semiMajorAxis = Math.pow((mu * periodSeconds * periodSeconds) / (4 * Math.PI * Math.PI), 1/3);
  const altitude = semiMajorAxis - earthRadius;
  
  if (altitude < 2000) return "LEO";
  if (altitude < 35786) return "MEO";
  if (Math.abs(altitude - 35786) < 1000 && Math.abs(inclination) < 10) return "GEO";
  return "HEO";
};

// Convert API satellite to display format
export const convertApiSatelliteToDisplay = (sat: ApiSatellite): DisplaySatellite => ({
  id: `api-${sat._id}`,
  name: sat.name || "Unknown Satellite",
  source: "api",
  type: sat.type,
  noradId: sat.noradId,
  status: "Active", // Default since API doesn't provide status
  orbitType: "LEO", // Default since API doesn't provide orbit type
  category: "Unknown", // Default category
  constellation: undefined,
  country: countryFromSatelliteName(sat.name || "Unknown Satellite"),
  description: sat.description,
  lastUpdate: new Date().toISOString(),
});

// Convert CelesTrak satellite to display format
export const convertCelesTrakSatelliteToDisplay = (sat: CelesTrakSatellite & { _sourceGroup?: string }): DisplaySatellite => {
  const classification = getSatelliteClassification(sat.OBJECT_NAME, sat._sourceGroup);
  
  return {
    id: `celestrak-${sat.NORAD_CAT_ID}`,
    name: sat.OBJECT_NAME,
    source: "celestrak",
    type: "live",
    noradId: sat.NORAD_CAT_ID,
    status: "Active", // Assume active if in current TLE data
    orbitType: getOrbitType(sat.MEAN_MOTION, sat.INCLINATION),
    category: classification.category,
    constellation: classification.constellation,
    inclination: sat.INCLINATION,
    period: 1440 / sat.MEAN_MOTION, // Convert from mean motion to minutes
    country: countryFromSatelliteName(sat.OBJECT_NAME),
    lastUpdate: sat.EPOCH,
    description: `TLE Data - Classification: ${sat.CLASSIFICATION_TYPE}`,
    celestrakData: sat, // Include original CelesTrak data for TLE generation
  };
};

// Convert CelesTrak satellite data to TLE format
export const convertCelesTrakToTLE = (sat: CelesTrakSatellite): { line1: string; line2: string } => {
  // Helper function to format numbers with specific padding and precision
  const formatEpoch = (epochStr: string): string => {
    const date = new Date(epochStr);
    const year = date.getUTCFullYear().toString().slice(-2); // Last 2 digits
    const dayOfYear = Math.floor((date.getTime() - new Date(date.getUTCFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));
    const fractionalDay = (date.getUTCHours() * 3600 + date.getUTCMinutes() * 60 + date.getUTCSeconds()) / 86400;
    return `${year}${String(dayOfYear).padStart(3, '0')}.${(fractionalDay).toFixed(8).slice(2)}`;
  };

  const formatExponential = (num: number): string => {
    if (num === 0) return " 00000-0";
    const absNum = Math.abs(num);
    const sign = num >= 0 ? " " : "-";
    const exp = Math.floor(Math.log10(absNum));
    const mantissa = Math.round(absNum / Math.pow(10, exp) * 100000);
    return `${sign}${String(mantissa).padStart(5, '0')}-${Math.abs(exp)}`;
  };

  // Generate TLE lines
  const epoch = formatEpoch(sat.EPOCH);
  const meanMotionDot = sat.MEAN_MOTION_DOT ? formatExponential(sat.MEAN_MOTION_DOT) : " 00000-0";
  const meanMotionDdot = sat.MEAN_MOTION_DDOT ? formatExponential(sat.MEAN_MOTION_DDOT) : " 00000-0";
  const bstar = sat.BSTAR ? formatExponential(sat.BSTAR) : " 00000-0";

  // Line 1: Satellite number, classification, launch year/number, epoch, derivatives, B*, element set number, checksum
  const line1Base = `1 ${String(sat.NORAD_CAT_ID).padStart(5)}U ${sat.OBJECT_ID.padEnd(8)} ${epoch}${meanMotionDot}${meanMotionDdot} ${bstar} 0 ${String(sat.ELEMENT_SET_NO).padStart(4)}`;
  const line1Checksum = calculateTLEChecksum(line1Base);
  const line1 = `${line1Base}${line1Checksum}`;

  // Line 2: Satellite number, inclination, RAAN, eccentricity, argument of perigee, mean anomaly, mean motion, revolution number, checksum
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
};

// Calculate TLE checksum
const calculateTLEChecksum = (line: string): number => {
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

// Fetch satellites from MongoDB API
export const fetchApiSatellites = async (): Promise<DisplaySatellite[]> => {
  try {
    const response = await fetch("/api/satellites");
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }
    const satellites: ApiSatellite[] = await response.json();
    return satellites.map(convertApiSatelliteToDisplay);
  } catch (error) {
    console.error("Error fetching API satellites:", error);
    return [];
  }
};

// Satellite category and constellation mapping
const getSatelliteClassification = (name: string, sourceGroup?: string): { category: DisplaySatellite["category"], constellation?: string } => {
  const nameUpper = name.toUpperCase();
  
  // Determine category based on source group first
  if (sourceGroup) {
    if (sourceGroup === "stations") return { category: "Space Station" };
    if (sourceGroup === "gps-ops" || sourceGroup === "galileo" || 
        sourceGroup === "glonass-ops" || sourceGroup === "beidou") return { category: "Navigation" };
    if (sourceGroup === "weather" || sourceGroup === "goes") return { category: "Weather" };
    if (sourceGroup === "resource") return { category: "Earth Observation" };
    if (sourceGroup === "cubesat") return { category: "CubeSat" };
    if (sourceGroup === "starlink") return { category: "Communication", constellation: "Starlink" };
    if (sourceGroup === "oneweb") return { category: "Communication", constellation: "OneWeb" };
    if (sourceGroup === "iridium-33") return { category: "Communication", constellation: "Iridium" };
    if (sourceGroup === "globalstar") return { category: "Communication", constellation: "Globalstar" };
    if (sourceGroup === "planet") return { category: "Earth Observation", constellation: "Planet Labs" };
    if (sourceGroup === "spire") return { category: "Commercial", constellation: "Spire Global" };
  }
  
  // Fallback to name-based classification
  if (nameUpper.includes("ISS") || nameUpper.includes("SPACE STATION") || nameUpper.includes("TIANGONG")) {
    return { category: "Space Station" };
  }
  if (nameUpper.includes("STARLINK")) return { category: "Communication", constellation: "Starlink" };
  if (nameUpper.includes("ONEWEB")) return { category: "Communication", constellation: "OneWeb" };
  if (nameUpper.includes("IRIDIUM")) return { category: "Communication", constellation: "Iridium" };
  if (nameUpper.includes("GLOBALSTAR")) return { category: "Communication", constellation: "Globalstar" };
  if (nameUpper.includes("GPS") || nameUpper.includes("NAVSTAR")) return { category: "Navigation", constellation: "GPS" };
  if (nameUpper.includes("GALILEO")) return { category: "Navigation", constellation: "Galileo" };
  if (nameUpper.includes("GLONASS")) return { category: "Navigation", constellation: "GLONASS" };
  if (nameUpper.includes("BEIDOU") || nameUpper.includes("COMPASS")) return { category: "Navigation", constellation: "BeiDou" };
  if (nameUpper.includes("GOES") || nameUpper.includes("WEATHER") || nameUpper.includes("METEOSAT") || 
      nameUpper.includes("NOAA")) return { category: "Weather" };
  if (nameUpper.includes("LANDSAT") || nameUpper.includes("TERRA") || nameUpper.includes("AQUA") || 
      nameUpper.includes("SENTINEL") || nameUpper.includes("SPOT")) return { category: "Earth Observation" };
  if (nameUpper.includes("PLANET") || nameUpper.includes("DOVE") || nameUpper.includes("SKYSAT")) {
    return { category: "Earth Observation", constellation: "Planet Labs" };
  }
  if (nameUpper.includes("SPIRE")) return { category: "Commercial", constellation: "Spire Global" };
  if (nameUpper.includes("COSMOS") || nameUpper.includes("MILITARY") || nameUpper.includes("CLASSIFIED")) return { category: "Military" };
  if (nameUpper.includes("CUBESAT") || name.length < 10) return { category: "CubeSat" }; // Many CubeSats have short names
  if (nameUpper.includes("HUBBLE") || nameUpper.includes("CHANDRA") || nameUpper.includes("SPITZER") || 
      nameUpper.includes("KEPLER") || nameUpper.includes("TESS")) return { category: "Scientific" };
  
  return { category: "Unknown" };
};

// Fetch satellites from CelesTrak (comprehensive public satellite data)
export const fetchCelesTrakSatellites = async (): Promise<DisplaySatellite[]> => {
  try {
    // Fetch from major satellite groups on CelesTrak for comprehensive coverage
    // Using only verified, stable group names
    const urlsWithCategories = [
      { url: "https://celestrak.org/NORAD/elements/gp.php?GROUP=stations&FORMAT=json", group: "stations" },
      { url: "https://celestrak.org/NORAD/elements/gp.php?GROUP=starlink&FORMAT=json", group: "starlink" },
      { url: "https://celestrak.org/NORAD/elements/gp.php?GROUP=galileo&FORMAT=json", group: "galileo" },
      { url: "https://celestrak.org/NORAD/elements/gp.php?GROUP=gps-ops&FORMAT=json", group: "gps-ops" },
      { url: "https://celestrak.org/NORAD/elements/gp.php?GROUP=glonass-ops&FORMAT=json", group: "glonass-ops" },
      { url: "https://celestrak.org/NORAD/elements/gp.php?GROUP=beidou&FORMAT=json", group: "beidou" },
      { url: "https://celestrak.org/NORAD/elements/gp.php?GROUP=iridium&FORMAT=json", group: "iridium" },
      { url: "https://celestrak.org/NORAD/elements/gp.php?GROUP=oneweb&FORMAT=json", group: "oneweb" },
      { url: "https://celestrak.org/NORAD/elements/gp.php?GROUP=weather&FORMAT=json", group: "weather" },
      { url: "https://celestrak.org/NORAD/elements/gp.php?GROUP=goes&FORMAT=json", group: "goes" },
      { url: "https://celestrak.org/NORAD/elements/gp.php?GROUP=resource&FORMAT=json", group: "resource" },
      { url: "https://celestrak.org/NORAD/elements/gp.php?GROUP=cubesat&FORMAT=json", group: "cubesat" },
      { url: "https://celestrak.org/NORAD/elements/gp.php?GROUP=planet&FORMAT=json", group: "planet" },
    ];
    
    const promises = urlsWithCategories.map(({ url, group }) => 
      fetch(url)
        .then(response => {
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
          return response.json();
        })
        .then(data => {
          if (!Array.isArray(data)) {
            throw new Error(`Invalid response format for ${group}`);
          }
          return data.map((sat: CelesTrakSatellite) => ({ ...sat, _sourceGroup: group }));
        })
        .catch(error => {
          console.warn(`Failed to fetch from ${group} (${url}):`, error.message);
          return [];
        })
    );
    
    const results = await Promise.all(promises);
    const allSatellites: (CelesTrakSatellite & { _sourceGroup: string })[] = results.flat();
    
    // Filter out obviously inactive/decayed satellites and sort by name
    // Remove the artificial sampling limit to show all available public satellites
    const activeSatellites = allSatellites
      .filter(sat => {
        // Basic filtering for clearly active satellites
        const name = sat.OBJECT_NAME.toUpperCase();
        // Skip debris, rocket bodies, and clearly inactive objects
        return !name.includes("DEB") && 
               !name.includes("DEBRIS") && 
               !name.includes("R/B") && 
               !name.includes("ROCKET BODY") &&
               sat.MEAN_MOTION > 0.5; // Filter out very slow objects (likely debris)
      })
      .sort((a, b) => a.OBJECT_NAME.localeCompare(b.OBJECT_NAME));
    
    console.log(`Fetched ${activeSatellites.length} active satellites from CelesTrak`);
    return activeSatellites.map(convertCelesTrakSatelliteToDisplay);
  } catch (error) {
    console.error("Error fetching CelesTrak satellites:", error);
    return [];
  }
};

// Merge satellites from different sources, removing duplicates by NORAD ID
export const mergeSatelliteSources = (
  apiSatellites: DisplaySatellite[],
  celestrakSatellites: DisplaySatellite[]
): DisplaySatellite[] => {
  const merged = [...apiSatellites];
  const existingNoradIds = new Set(
    apiSatellites
      .filter(sat => sat.noradId)
      .map(sat => sat.noradId)
  );
  
  // Add CelesTrak satellites that don't already exist in API data
  celestrakSatellites.forEach(sat => {
    if (!sat.noradId || !existingNoradIds.has(sat.noradId)) {
      merged.push(sat);
    }
  });
  
  return merged.sort((a, b) => a.name.localeCompare(b.name));
};

// Get satellite statistics
export const getSatelliteStats = (satellites: DisplaySatellite[]) => {
  const categories = satellites.reduce((acc, sat) => {
    if (sat.category) {
      acc[sat.category] = (acc[sat.category] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  const constellations = satellites.reduce((acc, sat) => {
    if (sat.constellation) {
      acc[sat.constellation] = (acc[sat.constellation] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  return {
    total: satellites.length,
    active: satellites.filter(s => s.status === "Active").length,
    inactive: satellites.filter(s => s.status === "Inactive").length,
    decayed: satellites.filter(s => s.status === "Decayed").length,
    leo: satellites.filter(s => s.orbitType === "LEO").length,
    meo: satellites.filter(s => s.orbitType === "MEO").length,
    geo: satellites.filter(s => s.orbitType === "GEO").length,
    heo: satellites.filter(s => s.orbitType === "HEO").length,
    live: satellites.filter(s => s.type === "live").length,
    simulated: satellites.filter(s => s.type === "simulated").length,
    api: satellites.filter(s => s.source === "api").length,
    celestrak: satellites.filter(s => s.source === "celestrak").length,
    custom: satellites.filter(s => s.source === "custom").length,
    categories,
    constellations,
    // Top categories
    communication: satellites.filter(s => s.category === "Communication").length,
    navigation: satellites.filter(s => s.category === "Navigation").length,
    earthObservation: satellites.filter(s => s.category === "Earth Observation").length,
    weather: satellites.filter(s => s.category === "Weather").length,
    spaceStation: satellites.filter(s => s.category === "Space Station").length,
    cubesat: satellites.filter(s => s.category === "CubeSat").length,
    // Top constellations
    starlink: satellites.filter(s => s.constellation === "Starlink").length,
    oneWeb: satellites.filter(s => s.constellation === "OneWeb").length,
    gps: satellites.filter(s => s.constellation === "GPS").length,
  };
};
