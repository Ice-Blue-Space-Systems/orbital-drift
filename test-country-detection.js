// Quick test to verify country detection
const testSatellites = [
  "STARLINK-1007",
  "ISS (ZARYA)",
  "COSMOS 2545",
  "TIANGONG-1",
  "SENTINEL-2A",
  "IRIDIUM 1 DUMMY",
  "GPS BIIR-2  (PRN 13)",
  "NOAA 15",
  "GOES 16",
  "HIMAWARI-8",
  "RADARSAT-2"
];

// This would be the function from satelliteDataUtils.ts
const countryFromSatelliteName = (name) => {
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
  
  return "International";
};

console.log("Country Detection Test Results:");
console.log("================================");

testSatellites.forEach(satellite => {
  const country = countryFromSatelliteName(satellite);
  console.log(`${satellite.padEnd(25)} -> ${country}`);
});
