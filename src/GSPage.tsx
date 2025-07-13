import React, { useState, useEffect, useRef } from "react";
import { AgGridReact } from "ag-grid-react";
import { ModuleRegistry, AllCommunityModule } from "ag-grid-community";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";
import { ColDef, GridApi, CellValueChangedEvent } from "ag-grid-community";
import { 
  Button, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Box,
  Typography,
  IconButton,
  Tooltip,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import RefreshIcon from "@mui/icons-material/Refresh";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import SaveIcon from "@mui/icons-material/Save";
import CancelIcon from "@mui/icons-material/Cancel";
import "./GSPage.css"; // We'll create this for matrix styling

// Country code mapping for flags
const countryCodeMap: Record<string, string> = {
  "USA": "US",
  "United States": "US", 
  "Russia": "RU",
  "China": "CN",
  "Japan": "JP",
  "India": "IN",
  "France": "FR",
  "Germany": "DE",
  "United Kingdom": "GB",
  "Canada": "CA",
  "Italy": "IT",
  "Spain": "ES",
  "Australia": "AU",
  "Brazil": "BR",
  "South Korea": "KR",
  "Netherlands": "NL",
  "Sweden": "SE",
  "Norway": "NO",
  "Chile": "CL",
  "South Africa": "ZA",
  "International": "UN",
  "Europe": "EU",
  "ESA": "EU",
};

// Register AG Grid modules
ModuleRegistry.registerModules([AllCommunityModule]);

interface GroundStation {
  id: string;
  name: string;
  source: "predefined" | "custom";
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
  lastUpdate: string;
}

export default function GSPage() {
  const [groundStations, setGroundStations] = useState<GroundStation[]>([]);
  const [customGroundStations, setCustomGroundStations] = useState<GroundStation[]>([]);
  const [loading, setLoading] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [newGroundStation, setNewGroundStation] = useState<Partial<GroundStation>>({
    source: "custom",
    status: "Active",
    bandType: "S",
    elevation: 5,
    azimuth: 360,
  });
  const [editMode, setEditMode] = useState<string | null>(null);
  const gridRef = useRef<AgGridReact>(null);
  const [gridApi, setGridApi] = useState<GridApi | null>(null);

  // Initialize with predefined ground stations
  useEffect(() => {
    const predefinedStations: GroundStation[] = [
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
        lastUpdate: new Date().toISOString(),
      },
    ];
    setGroundStations(predefinedStations);
  }, []);

  // Initialize with some mock custom ground stations
  useEffect(() => {
    setCustomGroundStations([
      {
        id: "custom-1",
        name: "ICEBLUE Mission Control",
        source: "custom",
        country: "USA",
        city: "Austin, Texas",
        latitude: 30.2672,
        longitude: -97.7431,
        altitude: 149,
        status: "Active",
        frequency: "2400-2450",
        bandType: "S",
        elevation: 10,
        azimuth: 360,
        operator: "ICEBLUE Systems",
        established: "2024-01-15",
        lastUpdate: new Date().toISOString(),
      },
      {
        id: "custom-2",
        name: "Arctic Research Station",
        source: "custom", 
        country: "Norway",
        city: "Svalbard",
        latitude: 78.9230,
        longitude: 11.9738,
        altitude: 72,
        status: "Active",
        frequency: "8025-8400",
        bandType: "X",
        elevation: 5,
        azimuth: 180,
        operator: "Arctic Sciences",
        established: "2023-06-12",
        lastUpdate: new Date().toISOString(),
      },
    ]);
  }, []);

  // Combine predefined and custom ground stations
  const allGroundStations = [...groundStations, ...customGroundStations];

  // Add a new custom ground station
  const addCustomGroundStation = () => {
    const groundStation: GroundStation = {
      id: `custom-${Date.now()}`,
      name: newGroundStation.name || `Custom-GS-${customGroundStations.length + 1}`,
      source: "custom",
      country: newGroundStation.country || "",
      city: newGroundStation.city,
      latitude: newGroundStation.latitude || 0,
      longitude: newGroundStation.longitude || 0,
      altitude: newGroundStation.altitude || 0,
      status: newGroundStation.status || "Active",
      frequency: newGroundStation.frequency,
      bandType: newGroundStation.bandType || "S",
      elevation: newGroundStation.elevation || 5,
      azimuth: newGroundStation.azimuth || 360,
      operator: newGroundStation.operator,
      established: newGroundStation.established,
      lastUpdate: new Date().toISOString(),
    };
    
    setCustomGroundStations(prev => [...prev, groundStation]);
    setAddDialogOpen(false);
    setNewGroundStation({
      source: "custom",
      status: "Active",
      bandType: "S",
      elevation: 5,
      azimuth: 360,
    });
  };

  // Delete ground station
  const deleteGroundStation = (id: string) => {
    setCustomGroundStations(prev => prev.filter(gs => gs.id !== id));
  };

  // Status cell renderer with colored chips
  const StatusCellRenderer = (params: any) => {
    const getStatusColor = (status: string) => {
      switch (status) {
        case "Active": return "#00ff41";
        case "Inactive": return "#ffaa00";
        case "Maintenance": return "#ff8800";
        case "Decommissioned": return "#ff0040";
        default: return "#888888";
      }
    };

    return (
      <Chip
        label={params.value}
        size="small"
        sx={{
          backgroundColor: getStatusColor(params.value),
          color: "#000",
          fontWeight: "bold",
          fontSize: "11px",
        }}
      />
    );
  };

  // Source cell renderer
  const SourceCellRenderer = (params: any) => {
    return (
      <Chip
        label={params.value.toUpperCase()}
        size="small"
        variant="outlined"
        sx={{
          borderColor: params.value === "predefined" ? "#00aaff" : "#00ff41",
          color: params.value === "predefined" ? "#00aaff" : "#00ff41",
          fontSize: "10px",
        }}
      />
    );
  };

  // Coordinates cell renderer
  const CoordinatesCellRenderer = (params: any) => {
    const { latitude, longitude } = params.data;
    return (
      <span style={{ color: "#ffaa00", fontFamily: "monospace" }}>
        {latitude.toFixed(4)}°, {longitude.toFixed(4)}°
      </span>
    );
  };

  // Actions cell renderer
  const ActionsCellRenderer = (params: any) => {
    if (params.data.source === "predefined") return null;
    
    return (
      <Box sx={{ display: "flex", gap: 0.5 }}>
        <Tooltip title="Edit">
          <IconButton
            size="small"
            onClick={() => setEditMode(params.data.id)}
            sx={{ color: "#00ff41", padding: "2px" }}
          >
            <EditIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Delete">
          <IconButton
            size="small"
            onClick={() => deleteGroundStation(params.data.id)}
            sx={{ color: "#ff0040", padding: "2px" }}
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>
    );
  };

  // Country cell renderer with flag
  const CountryCellRenderer = (params: any) => {
    if (!params.value) return <span style={{ color: "#888" }}>N/A</span>;
    
    const countryCode = countryCodeMap[params.value] || params.value.slice(0, 2).toUpperCase();
    const flagUrl = `https://flagcdn.com/24x18/${countryCode.toLowerCase()}.png`;
    
    return (
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <img 
          src={flagUrl} 
          alt={`${params.value} flag`}
          style={{ 
            width: "20px", 
            height: "15px", 
            objectFit: "cover",
            border: "1px solid #333",
            borderRadius: "2px"
          }}
          onError={(e) => {
            // Fallback to generic flag if country flag not found
            e.currentTarget.src = "https://flagcdn.com/24x18/un.png";
          }}
        />
        <span style={{ color: "#aaaaaa" }}>{params.value}</span>
      </Box>
    );
  };

  // AG Grid column definitions
  const columnDefs: ColDef<GroundStation>[] = [
    { 
      headerName: "NAME", 
      field: "name", 
      editable: true,
      filter: "agTextColumnFilter",
      width: 180,
      cellStyle: { color: "#00ff41", fontWeight: "bold" }
    },
    { 
      headerName: "SOURCE", 
      field: "source", 
      editable: false,
      filter: "agSetColumnFilter",
      width: 100,
      cellRenderer: SourceCellRenderer,
    },
    { 
      headerName: "STATUS", 
      field: "status", 
      editable: true,
      filter: "agSetColumnFilter",
      cellEditor: "agSelectCellEditor",
      cellEditorParams: {
        values: ["Active", "Inactive", "Maintenance", "Decommissioned"]
      },
      width: 120,
      cellRenderer: StatusCellRenderer,
    },
    { 
      headerName: "COUNTRY", 
      field: "country", 
      editable: true,
      filter: "agTextColumnFilter",
      width: 140,
      cellRenderer: CountryCellRenderer,
    },
    { 
      headerName: "CITY", 
      field: "city", 
      editable: true,
      filter: "agTextColumnFilter",
      flex: 1,
      cellStyle: { color: "#cccccc" }
    },
    { 
      headerName: "COORDINATES", 
      colId: "coordinates",
      editable: false,
      filter: false,
      flex: 1.5,
      cellRenderer: CoordinatesCellRenderer,
    },
    { 
      headerName: "ALTITUDE (m)", 
      field: "altitude", 
      editable: true,
      filter: "agNumberColumnFilter",
      type: "numericColumn",
      flex: 1,
      cellStyle: { color: "#ffaa00", textAlign: "right" },
      valueFormatter: (params) => params.value ? params.value.toLocaleString() : "N/A"
    },
    { 
      headerName: "FREQUENCY", 
      field: "frequency", 
      editable: true,
      filter: "agTextColumnFilter",
      flex: 1,
      cellStyle: { color: "#ff6600" },
      valueFormatter: (params) => params.value ? `${params.value} MHz` : "N/A"
    },
    { 
      headerName: "BAND", 
      field: "bandType", 
      editable: true,
      filter: "agSetColumnFilter",
      cellEditor: "agSelectCellEditor",
      cellEditorParams: {
        values: ["S", "X", "Ka", "Ku", "L", "C", "Unknown"]
      },
      flex: 0.8,
      cellStyle: { color: "#66ff66", textAlign: "center", fontWeight: "bold" }
    },
    { 
      headerName: "OPERATOR", 
      field: "operator", 
      editable: true,
      filter: "agTextColumnFilter",
      flex: 1.5,
      cellStyle: { color: "#cc88ff" }
    },
    { 
      headerName: "ESTABLISHED", 
      field: "established", 
      editable: true,
      filter: "agDateColumnFilter",
      flex: 1,
      cellStyle: { color: "#88ccff" },
      valueFormatter: (params) => params.value ? new Date(params.value).toLocaleDateString() : "N/A"
    },
    { 
      headerName: "ACTIONS", 
      colId: "actions",
      editable: false,
      sortable: false,
      filter: false,
      flex: 1,
      cellRenderer: ActionsCellRenderer,
      pinned: "right"
    },
  ];

  return (
    <div className="gs-page">
      {/* Header Section */}
      <Box className="gs-header">
        <Typography variant="h4" className="gs-title">
          GROUND STATION NETWORK
        </Typography>
        <Typography variant="subtitle1" className="gs-subtitle">
          Global Communications Infrastructure
        </Typography>
        
        {/* Action Buttons */}
        <Box className="gs-actions">
          <Tooltip title="Add Ground Station">
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setAddDialogOpen(true)}
              className="action-button add-button"
            >
              ADD STATION
            </Button>
          </Tooltip>
          
          <Tooltip title="Refresh Station Data">
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={() => window.location.reload()}
              disabled={loading}
              className="action-button refresh-button"
            >
              REFRESH DATA
            </Button>
          </Tooltip>
        </Box>

        {/* Enhanced Stats */}
        <Box className="gs-stats">
          <Box className="stat-item">
            <Typography variant="h6" className="stat-number">{groundStations.length}</Typography>
            <Typography variant="caption" className="stat-label">PREDEFINED</Typography>
          </Box>
          <Box className="stat-item">
            <Typography variant="h6" className="stat-number">{customGroundStations.length}</Typography>
            <Typography variant="caption" className="stat-label">CUSTOM</Typography>
          </Box>
          <Box className="stat-item">
            <Typography variant="h6" className="stat-number">{allGroundStations.filter(gs => gs.status === "Active").length}</Typography>
            <Typography variant="caption" className="stat-label">ACTIVE</Typography>
          </Box>
          <Box className="stat-item">
            <Typography variant="h6" className="stat-number">{allGroundStations.filter(gs => gs.status === "Maintenance").length}</Typography>
            <Typography variant="caption" className="stat-label">MAINT</Typography>
          </Box>
          <Box className="stat-item">
            <Typography variant="h6" className="stat-number">{allGroundStations.filter(gs => gs.bandType === "X").length}</Typography>
            <Typography variant="caption" className="stat-label">X-BAND</Typography>
          </Box>
          <Box className="stat-item">
            <Typography variant="h6" className="stat-number">{allGroundStations.filter(gs => gs.bandType === "S").length}</Typography>
            <Typography variant="caption" className="stat-label">S-BAND</Typography>
          </Box>
          <Box className="stat-item">
            <Typography variant="h6" className="stat-number">{new Set(allGroundStations.map(gs => gs.country)).size}</Typography>
            <Typography variant="caption" className="stat-label">COUNTRIES</Typography>
          </Box>
          <Box className="stat-item">
            <Typography variant="h6" className="stat-number">{allGroundStations.length}</Typography>
            <Typography variant="caption" className="stat-label">TOTAL</Typography>
          </Box>
        </Box>

        {/* Console Status Bar */}
        <Box className="console-status-bar">
          <Box className="status-section">
            <Typography variant="caption" className="status-label">NET:</Typography>
            <Typography variant="caption" className="status-value online">ONLINE</Typography>
          </Box>
          <Box className="status-section">
            <Typography variant="caption" className="status-label">UPLINK:</Typography>
            <Typography variant="caption" className="status-value online">READY</Typography>
          </Box>
          <Box className="status-section">
            <Typography variant="caption" className="status-label">DOWNLINK:</Typography>
            <Typography variant="caption" className="status-value online">READY</Typography>
          </Box>
          <Box className="status-section">
            <Typography variant="caption" className="status-label">TRK:</Typography>
            <Typography variant="caption" className="status-value online">NOMINAL</Typography>
          </Box>
          <Box className="status-section">
            <Typography variant="caption" className="status-label">TIME:</Typography>
            <Typography variant="caption" className="status-value">{new Date().toLocaleTimeString()}</Typography>
          </Box>
        </Box>
      </Box>

      {/* AG Grid Table */}
      <Box className="gs-grid-container">
        <div 
          className="ag-theme-alpine-dark matrix-grid" 
          style={{ 
            height: '600px',
            width: '100%'
          }}
        >
          <AgGridReact
            ref={gridRef}
            rowData={allGroundStations}
            columnDefs={columnDefs}
            defaultColDef={{
              sortable: true,
              filter: true,
              resizable: true,
              editable: false,
              minWidth: 100,
            }}
            animateRows={true}
            rowSelection="single"
            enableCellTextSelection={true}
            suppressRowDeselection={true}
            rowHeight={40}
            headerHeight={45}
            onGridReady={(params) => {
              setGridApi(params.api);
              params.api.sizeColumnsToFit();
            }}
            onCellValueChanged={(event: CellValueChangedEvent) => {
              // Handle cell edits for custom ground stations only
              if (event.data.source === "custom") {
                const updatedCustomGS = customGroundStations.map(gs => 
                  gs.id === event.data.id 
                    ? { ...event.data, lastUpdate: new Date().toISOString() }
                    : gs
                );
                setCustomGroundStations(updatedCustomGS);
              }
            }}
            onFirstDataRendered={() => {
              if (gridRef.current) {
                gridRef.current.api.sizeColumnsToFit();
              }
            }}
            pagination={true}
            paginationPageSize={25}
            suppressMenuHide={true}
            enableRangeSelection={true}
            suppressCellFocus={false}
            getRowId={(params) => params.data.id}
            loading={loading}
          />
        </div>
      </Box>

      {/* Add Ground Station Dialog */}
      <Dialog 
        open={addDialogOpen} 
        onClose={() => setAddDialogOpen(false)}
        maxWidth="md"
        fullWidth
        className="add-gs-dialog"
      >
        <DialogTitle className="dialog-title">
          ADD GROUND STATION
        </DialogTitle>
        <DialogContent className="dialog-content">
          <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2, pt: 1 }}>
            <TextField
              label="Station Name"
              value={newGroundStation.name || ""}
              onChange={(e) => setNewGroundStation({...newGroundStation, name: e.target.value})}
              fullWidth
              className="matrix-input"
            />
            
            <TextField
              label="Country"
              value={newGroundStation.country || ""}
              onChange={(e) => setNewGroundStation({...newGroundStation, country: e.target.value})}
              fullWidth
              className="matrix-input"
            />

            <TextField
              label="City"
              value={newGroundStation.city || ""}
              onChange={(e) => setNewGroundStation({...newGroundStation, city: e.target.value})}
              fullWidth
              className="matrix-input"
            />

            <FormControl fullWidth className="matrix-select">
              <InputLabel>Status</InputLabel>
              <Select
                value={newGroundStation.status || "Active"}
                onChange={(e) => setNewGroundStation({...newGroundStation, status: e.target.value as any})}
                label="Status"
              >
                <MenuItem value="Active">Active</MenuItem>
                <MenuItem value="Inactive">Inactive</MenuItem>
                <MenuItem value="Maintenance">Maintenance</MenuItem>
                <MenuItem value="Decommissioned">Decommissioned</MenuItem>
              </Select>
            </FormControl>

            <TextField
              label="Latitude (degrees)"
              type="number"
              value={newGroundStation.latitude || ""}
              onChange={(e) => setNewGroundStation({...newGroundStation, latitude: parseFloat(e.target.value) || 0})}
              fullWidth
              className="matrix-input"
              inputProps={{ step: 0.0001, min: -90, max: 90 }}
            />

            <TextField
              label="Longitude (degrees)"
              type="number"
              value={newGroundStation.longitude || ""}
              onChange={(e) => setNewGroundStation({...newGroundStation, longitude: parseFloat(e.target.value) || 0})}
              fullWidth
              className="matrix-input"
              inputProps={{ step: 0.0001, min: -180, max: 180 }}
            />

            <TextField
              label="Altitude (meters)"
              type="number"
              value={newGroundStation.altitude || ""}
              onChange={(e) => setNewGroundStation({...newGroundStation, altitude: parseFloat(e.target.value) || 0})}
              fullWidth
              className="matrix-input"
            />

            <TextField
              label="Frequency (MHz)"
              value={newGroundStation.frequency || ""}
              onChange={(e) => setNewGroundStation({...newGroundStation, frequency: e.target.value})}
              fullWidth
              className="matrix-input"
            />

            <FormControl fullWidth className="matrix-select">
              <InputLabel>Band Type</InputLabel>
              <Select
                value={newGroundStation.bandType || "S"}
                onChange={(e) => setNewGroundStation({...newGroundStation, bandType: e.target.value as any})}
                label="Band Type"
              >
                <MenuItem value="S">S-Band</MenuItem>
                <MenuItem value="X">X-Band</MenuItem>
                <MenuItem value="Ka">Ka-Band</MenuItem>
                <MenuItem value="Ku">Ku-Band</MenuItem>
                <MenuItem value="L">L-Band</MenuItem>
                <MenuItem value="C">C-Band</MenuItem>
                <MenuItem value="Unknown">Unknown</MenuItem>
              </Select>
            </FormControl>

            <TextField
              label="Operator"
              value={newGroundStation.operator || ""}
              onChange={(e) => setNewGroundStation({...newGroundStation, operator: e.target.value})}
              fullWidth
              className="matrix-input"
            />

            <TextField
              label="Establishment Date"
              type="date"
              value={newGroundStation.established || ""}
              onChange={(e) => setNewGroundStation({...newGroundStation, established: e.target.value})}
              fullWidth
              InputLabelProps={{ shrink: true }}
              className="matrix-input"
            />

            <TextField
              label="Min Elevation (degrees)"
              type="number"
              value={newGroundStation.elevation || ""}
              onChange={(e) => setNewGroundStation({...newGroundStation, elevation: parseFloat(e.target.value) || 5})}
              fullWidth
              className="matrix-input"
              inputProps={{ step: 1, min: 0, max: 90 }}
            />
          </Box>
        </DialogContent>
        <DialogActions className="dialog-actions">
          <Button 
            onClick={() => setAddDialogOpen(false)}
            startIcon={<CancelIcon />}
            className="cancel-button"
          >
            CANCEL
          </Button>
          <Button 
            onClick={addCustomGroundStation}
            startIcon={<SaveIcon />}
            variant="contained"
            className="save-button"
          >
            ADD STATION
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}