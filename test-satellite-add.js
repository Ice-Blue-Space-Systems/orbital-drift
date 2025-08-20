// Quick test script for satellite addition
const testData = {
  name: "ISS (ZARYA)",
  noradId: 25544,
  type: 'live',
  description: 'Test satellite addition from CelesTrak',
  tleData: {
    line1: "1 25544U 98067A   23321.30441426  .00003068  00000-0  60049-4 0  9996",
    line2: "2 25544  51.6459 332.1901 0006390  45.4308 314.7764 15.50030060429999",
    noradId: 25544
  }
};

async function testSatelliteAdd() {
  try {
    console.log("Testing satellite addition with data:", JSON.stringify(testData, null, 2));
    
    const response = await fetch('http://localhost:3001/api/satellites', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData),
    });

    if (response.ok) {
      const result = await response.json();
      console.log("Success! Added satellite:", result);
    } else {
      const errorText = await response.text();
      console.error("Failed to add satellite:", response.status, response.statusText, errorText);
    }
  } catch (error) {
    console.error("Network error:", error);
  }
}

testSatelliteAdd();
