/* global use, db */

// Select the database to use.
use('satelliteTrackingDB');

// Insert live satellites (ISS and Starlink) into the satellites collection.
db.getCollection('satellites').insertMany([
  {
    _id: ObjectId("66502a4e1f9c9f1a9c13a001"),
    name: "ISS",
    noradId: 25544,
    currentTleId: ObjectId("66502a4e1f9c9f1a9c13a101"),
    type: "live", // Indicates this is a live satellite
    createdAt: ISODate("2024-05-23T12:00:00Z")
  },
  {
    _id: ObjectId("66502a4e1f9c9f1a9c13a002"),
    name: "Starlink-1506",
    noradId: 48274,
    currentTleId: ObjectId("66502a4e1f9c9f1a9c13a102"),
    type: "live", // Indicates this is a live satellite
    createdAt: ISODate("2024-05-23T12:00:00Z")
  },
  {
    _id: ObjectId("66502a4e1f9c9f1a9c13a003"),
    name: "MockSat-Alpha",
    noradId: 99901,
    currentTleId: ObjectId("66502a4e1f9c9f1a9c13a103"),
    type: "simulated", // Indicates this is a mock satellite
    createdAt: ISODate("2024-05-23T12:00:00Z")
  },
  {
    _id: ObjectId("66502a4e1f9c9f1a9c13a004"),
    name: "MockSat-Beta",
    noradId: 99902,
    currentTleId: ObjectId("66502a4e1f9c9f1a9c13a104"),
    type: "simulated", // Indicates this is a mock satellite
    createdAt: ISODate("2024-05-23T12:00:00Z")
  }
]);

// Insert TLEs for live and mock satellites into the tle collection.
db.getCollection('tle').insertMany([
  // ISS TLE
  {
    _id: ObjectId("66502a4e1f9c9f1a9c13a101"),
    satelliteId: ObjectId("66502a4e1f9c9f1a9c13a001"),
    line1: "1 25544U 98067A   23146.85694444  .00004383  00000-0  85200-4 0  9993",
    line2: "2 25544  51.6433 351.3515 0008379 274.6623  85.3993 15.52465932500182",
    epoch: ISODate("2024-05-22T00:00:00Z"),
    source: "live",
    createdAt: ISODate("2024-05-22T00:00:00Z")
  },
  // Starlink TLE
  {
    _id: ObjectId("66502a4e1f9c9f1a9c13a102"),
    satelliteId: ObjectId("66502a4e1f9c9f1a9c13a002"),
    line1: "1 48274U 21035A   23146.85694444  .00002182  00000-0  12345-4 0  9993",
    line2: "2 48274  53.0000 123.4567 0001234  45.6789 321.9876 15.12345678 12345",
    epoch: ISODate("2024-05-22T01:00:00Z"),
    source: "live",
    createdAt: ISODate("2024-05-22T01:00:00Z")
  },
  // MockSat-Alpha TLE
  {
    _id: ObjectId("66502a4e1f9c9f1a9c13a103"),
    satelliteId: ObjectId("66502a4e1f9c9f1a9c13a003"),
    line1: "1 99901U 24001A   24143.50000000  .00000023  00000-0  00000-0 0  9992",
    line2: "2 99901  51.6416 156.1234 0006703 230.4562 129.5573 15.49637626216588",
    epoch: ISODate("2024-05-22T00:00:00Z"),
    source: "simulated",
    createdAt: ISODate("2024-05-22T00:00:00Z")
  },
  // MockSat-Beta TLE
  {
    _id: ObjectId("66502a4e1f9c9f1a9c13a104"),
    satelliteId: ObjectId("66502a4e1f9c9f1a9c13a004"),
    line1: "1 99902U 24002A   24143.60000000  .00000025  00000-0  00000-0 0  9993",
    line2: "2 99902  52.6416 157.1234 0006704 231.4562 130.5573 15.49637636216589",
    epoch: ISODate("2024-05-22T01:00:00Z"),
    source: "simulated",
    createdAt: ISODate("2024-05-22T01:00:00Z")
  }
]);

// Insert ground stations into the ground_stations collection.
db.getCollection('ground_stations').insertMany([
  {
    _id: ObjectId("66502a4e1f9c9f1a9c13b001"),
    name: "Wallops Island Test Site",
    location: {
      lat: 37.940,
      lon: -75.466,
      alt: 0
    },
    band: ["UHF", "S-Band"],
    createdAt: ISODate("2024-05-23T12:00:00Z")
  },
  {
    _id: ObjectId("66502a4e1f9c9f1a9c13b002"),
    name: "Mock Ground Station",
    location: {
      lat: 35.000,
      lon: -80.000,
      alt: 0
    },
    band: ["VHF", "X-Band"],
    createdAt: ISODate("2024-05-23T12:00:00Z")
  }
]);

// Insert contact windows for live and mock satellites into the contact_windows collection.
db.getCollection('contact_windows').insertMany([
  {
    _id: ObjectId("66502a4e1f9c9f1a9c13c001"),
    satelliteId: ObjectId("66502a4e1f9c9f1a9c13a001"),
    groundStationId: ObjectId("66502a4e1f9c9f1a9c13b001"),
    scheduledAOS: ISODate("2024-05-23T12:35:00Z"),
    scheduledLOS: ISODate("2024-05-23T12:41:00Z"),
    tleUsedId: ObjectId("66502a4e1f9c9f1a9c13a101"),
    status: "scheduled",
    createdAt: ISODate("2024-05-23T12:00:00Z")
  },
  {
    _id: ObjectId("66502a4e1f9c9f1a9c13c002"),
    satelliteId: ObjectId("66502a4e1f9c9f1a9c13a003"),
    groundStationId: ObjectId("66502a4e1f9c9f1a9c13b002"),
    scheduledAOS: ISODate("2024-05-23T13:00:00Z"),
    scheduledLOS: ISODate("2024-05-23T13:10:00Z"),
    tleUsedId: ObjectId("66502a4e1f9c9f1a9c13a103"),
    status: "scheduled",
    createdAt: ISODate("2024-05-23T12:00:00Z")
  }
]);