import React, { useState, useEffect } from "react";
import { AgGridReact } from "ag-grid-react";
import { ModuleRegistry, AllCommunityModule } from "ag-grid-community"; // Import modules
import "ag-grid-community/styles/ag-theme-alpine.css"; // Use only the new theme
import { ColDef } from "ag-grid-community";

// Register AG Grid modules
ModuleRegistry.registerModules([AllCommunityModule]);

interface Satellite {
  name: string;
  source: "real" | "custom";
  noradId?: number; // Optional for custom satellites
}

export default function SatsPage() {
  const [satellites, setSatellites] = useState<Satellite[]>([]);
  const [customSatellites, setCustomSatellites] = useState<Satellite[]>([
    { name: "mocksat-a", source: "custom" },
    { name: "mocksat-b", source: "custom" },
  ]);

  // Fetch real satellites from CelesTrak
  useEffect(() => {
    const fetchSatellites = async () => {
      try {
        const response = await fetch(
          "https://celestrak.com/NORAD/elements/stations.txt"
        );
        const data = await response.text();
        const realSatellites = data
          .split("\n")
          .filter((line, index) => index % 3 === 0 && line.trim() !== "")
          .map((name): Satellite => ({
            name: name.trim(),
            source: "real",
          }));
        setSatellites(realSatellites);
      } catch (error) {
        console.error("Failed to fetch satellites:", error);
      }
    };

    fetchSatellites();
  }, []);

  // Combine real and custom satellites
  const allSatellites = [...satellites, ...customSatellites];

  // Add a new custom satellite
  const addCustomSatellite = (name: string) => {
    setCustomSatellites((prev) => [...prev, { name, source: "custom" }]);
  };

  // AG Grid column definitions
  const columnDefs: ColDef<Satellite>[] = [
    { headerName: "Name", field: "name", editable: true },
    { headerName: "Source", field: "source", editable: false },
  ];

  return (
    <div style={{ padding: "20px" }}>
      <h1>Satellites</h1>
      <button
        onClick={() => addCustomSatellite(`mocksat-${customSatellites.length + 1}`)}
        style={{ marginBottom: "10px" }}
      >
        Add Custom Satellite
      </button>
      <div
        className="ag-theme-alpine"
        style={{ height: "500px", width: "100%" }}
      >
        <AgGridReact
          rowData={allSatellites}
          columnDefs={columnDefs}
          defaultColDef={{ sortable: true, filter: true, resizable: true }}
          animateRows={true}
          onCellValueChanged={(event) => {
            // Handle cell edits
            const updatedSatellites = [...allSatellites];
            if (event.node) {
              if (event.node && event.node.rowIndex !== null) {
                updatedSatellites[event.node.rowIndex] = event.data;
              }
            }
            setSatellites(updatedSatellites.filter((sat) => sat.source === "real"));
            setCustomSatellites(
              updatedSatellites.filter((sat) => sat.source === "custom")
            );
          }}
        />
      </div>
    </div>
  );
}