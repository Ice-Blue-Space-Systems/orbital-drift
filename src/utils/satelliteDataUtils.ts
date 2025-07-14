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
  apogee?: number; // km
  perigee?: number; // km
  inclination?: number; // degrees
  period?: number; // minutes
  lastUpdate: string;
  description?: string;
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
  
  if (nameUpper.includes("STARLINK") || nameUpper.includes("FALCON") || nameUpper.includes("DRAGON")) return "USA";
  if (nameUpper.includes("COSMOS") || nameUpper.includes("SOYUZ") || nameUpper.includes("PROGRESS")) return "Russia";
  if (nameUpper.includes("TIANGONG") || nameUpper.includes("SHENZHOU")) return "China";
  if (nameUpper.includes("SENTINEL") || nameUpper.includes("GALILEO")) return "Europe";
  if (nameUpper.includes("IRIDIUM")) return "USA";
  if (nameUpper.includes("GLOBALSTAR")) return "USA";
  if (nameUpper.includes("ONEWE")) return "USA";
  if (nameUpper.includes("TERRA") || nameUpper.includes("AQUA") || nameUpper.includes("LANDSAT")) return "USA";
  if (nameUpper.includes("ENVISAT") || nameUpper.includes("ERS")) return "Europe";
  if (nameUpper.includes("ALOS")) return "Japan";
  if (nameUpper.includes("RESOURCESAT") || nameUpper.includes("CARTOSAT")) return "India";
  if (nameUpper.includes("RADARSAT")) return "Canada";
  
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
  description: sat.description,
  lastUpdate: new Date().toISOString(),
});

// Convert CelesTrak satellite to display format
export const convertCelesTrakSatelliteToDisplay = (sat: CelesTrakSatellite): DisplaySatellite => ({
  id: `celestrak-${sat.NORAD_CAT_ID}`,
  name: sat.OBJECT_NAME,
  source: "celestrak",
  type: "live",
  noradId: sat.NORAD_CAT_ID,
  status: "Active", // Assume active if in current TLE data
  orbitType: getOrbitType(sat.MEAN_MOTION, sat.INCLINATION),
  inclination: sat.INCLINATION,
  period: 1440 / sat.MEAN_MOTION, // Convert from mean motion to minutes
  country: countryFromSatelliteName(sat.OBJECT_NAME),
  lastUpdate: sat.EPOCH,
  description: `TLE Data - Classification: ${sat.CLASSIFICATION_TYPE}`,
});

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

// Fetch satellites from CelesTrak (sample of active satellites)
export const fetchCelesTrakSatellites = async (): Promise<DisplaySatellite[]> => {
  try {
    // Fetch a curated list of interesting satellites from CelesTrak
    const urls = [
      "https://celestrak.org/NORAD/elements/gp.php?GROUP=stations&FORMAT=json",
      "https://celestrak.org/NORAD/elements/gp.php?GROUP=starlink&FORMAT=json",
      "https://celestrak.org/NORAD/elements/gp.php?GROUP=galileo&FORMAT=json",
    ];
    
    const promises = urls.map(url => 
      fetch(url)
        .then(response => response.json())
        .catch(error => {
          console.warn(`Failed to fetch from ${url}:`, error);
          return [];
        })
    );
    
    const results = await Promise.all(promises);
    const allSatellites: CelesTrakSatellite[] = results.flat();
    
    // Take a sample to avoid overwhelming the UI
    const sampleSize = 50;
    const sampledSatellites = allSatellites
      .sort(() => 0.5 - Math.random())
      .slice(0, sampleSize);
    
    return sampledSatellites.map(convertCelesTrakSatelliteToDisplay);
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
export const getSatelliteStats = (satellites: DisplaySatellite[]) => ({
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
});
