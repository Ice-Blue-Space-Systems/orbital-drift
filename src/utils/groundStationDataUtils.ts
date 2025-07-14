import { GroundStation as ApiGroundStation } from "../types";

// Extended interface for display purposes (combines different ground station sources)
export interface DisplayGroundStation {
  id: string;
  name: string;
  source: "api" | "predefined" | "custom";
  country: string;
  city?: string;
  latitude: number;
  longitude: number;
  altitude: number; // meters above sea level
  status: "Active" | "Inactive" | "Maintenance" | "Decommissioned";
  frequency?: string; // MHz
  bandType?: "S" | "X" | "Ka" | "Ku" | "L" | "C" | "Unknown";
  elevation?: number; // minimum elevation angle
  azimuth?: number; // antenna azimuth range
  operator?: string;
  established?: string; // establishment date
  description?: string;
  lastUpdate: string;
}

// Predefined major ground stations around the world
const PREDEFINED_GROUND_STATIONS: DisplayGroundStation[] = [
  {
    id: "predefined-1",
    name: "Goldstone Deep Space Communications Complex",
    source: "predefined",
    country: "USA",
    city: "Goldstone, California",
    latitude: 35.4267,
    longitude: -116.8900,
    altitude: 1036,
    status: "Active",
    frequency: "2290-2300",
    bandType: "S",
    elevation: 5,
    azimuth: 360,
    operator: "NASA/JPL",
    established: "1958-10-01",
    description: "NASA Deep Space Network station",
    lastUpdate: new Date().toISOString(),
  },
  {
    id: "predefined-2", 
    name: "Madrid Deep Space Communications Complex",
    source: "predefined",
    country: "Spain",
    city: "Robledo de Chavela",
    latitude: 40.4552,
    longitude: -4.2517,
    altitude: 834,
    status: "Active",
    frequency: "2270-2300",
    bandType: "S",
    elevation: 5,
    azimuth: 360,
    operator: "NASA/ESA",
    established: "1965-05-17",
    description: "NASA Deep Space Network station in Europe",
    lastUpdate: new Date().toISOString(),
  },
  {
    id: "predefined-3",
    name: "Canberra Deep Space Communications Complex", 
    source: "predefined",
    country: "Australia",
    city: "Tidbinbilla",
    latitude: -35.4014,
    longitude: 148.9819,
    altitude: 692,
    status: "Active",
    frequency: "2290-2300",
    bandType: "S",
    elevation: 5,
    azimuth: 360,
    operator: "NASA/CSIRO",
    established: "1965-03-19",
    description: "NASA Deep Space Network station in Australia",
    lastUpdate: new Date().toISOString(),
  },
  {
    id: "predefined-4",
    name: "ESOC - European Space Operations Centre",
    source: "predefined",
    country: "Germany",
    city: "Darmstadt",
    latitude: 49.8728,
    longitude: 8.6512,
    altitude: 144,
    status: "Active",
    frequency: "2025-2110",
    bandType: "S",
    elevation: 10,
    azimuth: 360,
    operator: "ESA",
    established: "1967-09-08",
    description: "European Space Agency mission control center",
    lastUpdate: new Date().toISOString(),
  },
  {
    id: "predefined-5",
    name: "Wallops Flight Facility",
    source: "predefined",
    country: "USA",
    city: "Wallops Island, Virginia",
    latitude: 37.9407,
    longitude: -75.4663,
    altitude: 12,
    status: "Active",
    frequency: "2200-2300",
    bandType: "S",
    elevation: 5,
    azimuth: 360,
    operator: "NASA",
    established: "1945-07-04",
    description: "NASA rocket range and spaceport",
    lastUpdate: new Date().toISOString(),
  },
  {
    id: "predefined-6",
    name: "Johnson Space Center",
    source: "predefined",
    country: "USA",
    city: "Houston, Texas",
    latitude: 29.5586,
    longitude: -95.0890,
    altitude: 16,
    status: "Active",
    frequency: "2200-2300",
    bandType: "S",
    elevation: 5,
    azimuth: 360,
    operator: "NASA",
    established: "1961-09-19",
    description: "NASA mission control center for human spaceflight",
    lastUpdate: new Date().toISOString(),
  },
  {
    id: "predefined-7",
    name: "Kourou Space Centre",
    source: "predefined",
    country: "France",
    city: "Kourou, French Guiana",
    latitude: 5.2389,
    longitude: -52.7683,
    altitude: 17,
    status: "Active",
    frequency: "2200-2300",
    bandType: "S",
    elevation: 5,
    azimuth: 360,
    operator: "ESA/CNES",
    established: "1964-04-14",
    description: "European spaceport",
    lastUpdate: new Date().toISOString(),
  },
  {
    id: "predefined-8",
    name: "Baikonur Cosmodrome",
    source: "predefined",
    country: "Kazakhstan",
    city: "Baikonur",
    latitude: 45.965,
    longitude: 63.305,
    altitude: 90,
    status: "Active",
    frequency: "2200-2300",
    bandType: "S",
    elevation: 5,
    azimuth: 360,
    operator: "Roscosmos",
    established: "1955-06-02",
    description: "World's first and largest operational space launch facility",
    lastUpdate: new Date().toISOString(),
  },
  {
    id: "predefined-9",
    name: "Tanegashima Space Center",
    source: "predefined",
    country: "Japan",
    city: "Tanegashima",
    latitude: 30.4008,
    longitude: 130.9681,
    altitude: 194,
    status: "Active",
    frequency: "2200-2300",
    bandType: "S",
    elevation: 5,
    azimuth: 360,
    operator: "JAXA",
    established: "1969-10-01",
    description: "Japan's primary large rocket launch site",
    lastUpdate: new Date().toISOString(),
  },
  {
    id: "predefined-10",
    name: "Jiuquan Satellite Launch Center",
    source: "predefined",
    country: "China",
    city: "Jiuquan",
    latitude: 40.958,
    longitude: 100.291,
    altitude: 1000,
    status: "Active",
    frequency: "2200-2300",
    bandType: "S",
    elevation: 5,
    azimuth: 360,
    operator: "CNSA",
    established: "1958-10-20",
    description: "China's first rocket launch site",
    lastUpdate: new Date().toISOString(),
  }
];

// Convert API ground station to display format
export const convertApiGroundStationToDisplay = (gs: ApiGroundStation): DisplayGroundStation => ({
  id: `api-${gs._id}`,
  name: gs.name,
  source: "api",
  country: gs.country || "Unknown",
  city: gs.city,
  latitude: gs.location.lat,
  longitude: gs.location.lon,
  altitude: gs.location.alt,
  status: gs.status || "Active",
  frequency: gs.frequency,
  bandType: gs.bandType || "S",
  elevation: gs.elevation || 5,
  azimuth: gs.azimuth || 360,
  operator: gs.operator,
  established: gs.established ? new Date(gs.established).toISOString().split('T')[0] : undefined,
  description: gs.description,
  lastUpdate: gs.updatedAt ? new Date(gs.updatedAt).toISOString() : new Date().toISOString(),
});

// Fetch ground stations from MongoDB API
export const fetchApiGroundStations = async (): Promise<DisplayGroundStation[]> => {
  try {
    const response = await fetch("/api/ground-stations");
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }
    const groundStations: ApiGroundStation[] = await response.json();
    return groundStations.map(convertApiGroundStationToDisplay);
  } catch (error) {
    console.error("Error fetching API ground stations:", error);
    return [];
  }
};

// Get predefined ground stations
export const getPredefinedGroundStations = (): DisplayGroundStation[] => {
  return PREDEFINED_GROUND_STATIONS;
};

// Merge ground stations from different sources, removing duplicates by name and location
export const mergeGroundStationSources = (
  apiGroundStations: DisplayGroundStation[],
  predefinedGroundStations: DisplayGroundStation[]
): DisplayGroundStation[] => {
  const merged = [...apiGroundStations];
  const existingStations = new Set(
    apiGroundStations.map(gs => `${gs.name}-${gs.latitude.toFixed(3)}-${gs.longitude.toFixed(3)}`)
  );
  
  // Add predefined stations that don't already exist in API data
  predefinedGroundStations.forEach(gs => {
    const key = `${gs.name}-${gs.latitude.toFixed(3)}-${gs.longitude.toFixed(3)}`;
    if (!existingStations.has(key)) {
      merged.push(gs);
    }
  });
  
  return merged.sort((a, b) => a.name.localeCompare(b.name));
};

// Get ground station statistics
export const getGroundStationStats = (groundStations: DisplayGroundStation[]) => ({
  total: groundStations.length,
  active: groundStations.filter(gs => gs.status === "Active").length,
  inactive: groundStations.filter(gs => gs.status === "Inactive").length,
  maintenance: groundStations.filter(gs => gs.status === "Maintenance").length,
  decommissioned: groundStations.filter(gs => gs.status === "Decommissioned").length,
  sBand: groundStations.filter(gs => gs.bandType === "S").length,
  xBand: groundStations.filter(gs => gs.bandType === "X").length,
  kaBand: groundStations.filter(gs => gs.bandType === "Ka").length,
  kuBand: groundStations.filter(gs => gs.bandType === "Ku").length,
  lBand: groundStations.filter(gs => gs.bandType === "L").length,
  cBand: groundStations.filter(gs => gs.bandType === "C").length,
  api: groundStations.filter(gs => gs.source === "api").length,
  predefined: groundStations.filter(gs => gs.source === "predefined").length,
  custom: groundStations.filter(gs => gs.source === "custom").length,
  countries: new Set(groundStations.map(gs => gs.country)).size,
});
