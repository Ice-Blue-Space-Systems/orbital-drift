import React, { useState, useEffect, useRef } from "react";
import { AgGridReact } from "ag-grid-react";
import { ModuleRegistry, AllCommunityModule } from "ag-grid-community";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";
import { ColDef, GridApi, CellValueChangedEvent } from "ag-grid-community";
import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "./store";
import { fetchMongoData } from "./store/mongoSlice";
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
import { Satellite as ApiSatellite } from "./types";
import "./SatsPage.css"; // We'll create this for matrix styling

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
  "International": "UN", // Use UN flag for international
  "Europe": "EU",
  "ESA": "EU", // European Space Agency
  "NASA": "US",
  "ROSCOSMOS": "RU",
  "CNSA": "CN",
  "JAXA": "JP",
  "ISRO": "IN",
};

// Register AG Grid modules
ModuleRegistry.registerModules([AllCommunityModule]);

// Extended interface for display purposes (combines API and custom satellites)
interface DisplaySatellite {
  id: string;
  name: string;
  source: "api" | "custom";
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

export default function SatsPage() {
  const dispatch = useDispatch<AppDispatch>();
  
  // Get satellites from Redux store
  const { satellites: mongoSatellites, status } = useSelector((state: RootState) => state.mongo);
  
  const [customSatellites, setCustomSatellites] = useState<DisplaySatellite[]>([]);
  const [loading, setLoading] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [newSatellite, setNewSatellite] = useState<Partial<DisplaySatellite>>({
    source: "custom",
    status: "Active",
    orbitType: "LEO",
  });
  const [editMode, setEditMode] = useState<string | null>(null);
  const gridRef = useRef<AgGridReact>(null);
  const [gridApi, setGridApi] = useState<GridApi | null>(null);

  // Fetch satellites data from API on component mount
  useEffect(() => {
    console.log("useEffect triggered, status:", status);
    console.log("Dispatching fetchMongoData...");
    dispatch(fetchMongoData());
  }, [dispatch]);

  // Convert API satellites to our display format
  const apiSatellites: DisplaySatellite[] = mongoSatellites.map((sat: ApiSatellite, index) => ({
    id: `api-${sat._id}`,
    name: sat.name || "Unknown Satellite",
    source: "api" as const,
    type: sat.type,
    noradId: sat.noradId,
    status: "Active" as const, // Default, could be enhanced
    orbitType: "LEO" as const, // Default, could be enhanced based on orbital data
    description: sat.description,
    lastUpdate: new Date().toISOString(),
  }));

  // Initialize with some mock custom satellites
  useEffect(() => {
    setCustomSatellites([
      {
        id: "custom-1",
        name: "ICEBLUE-SAT-1",
        source: "custom",
        status: "Active",
        orbitType: "LEO",
        apogee: 450,
        perigee: 420,
        inclination: 98.2,
        period: 93.5,
        country: "USA",
        launchDate: "2024-03-15",
        lastUpdate: new Date().toISOString(),
      },
      {
        id: "custom-2", 
        name: "MISSION-OPS-SAT",
        source: "custom",
        status: "Active",
        orbitType: "GEO",
        apogee: 35786,
        perigee: 35786,
        inclination: 0.1,
        period: 1436,
        country: "International",
        launchDate: "2023-11-22",
        lastUpdate: new Date().toISOString(),
      },
    ]);
  }, []);

  // Combine API and custom satellites
  const allSatellites = [...apiSatellites, ...customSatellites];

  // Debug logging to see what we have
  console.log("Redux Status:", status);
  console.log("Mongo Satellites count:", mongoSatellites.length);
  console.log("Mongo Satellites raw:", mongoSatellites);
  console.log("API Satellites count:", apiSatellites.length);
  console.log("API Satellites:", apiSatellites);
  console.log("Custom Satellites count:", customSatellites.length);
  console.log("All Satellites count:", allSatellites.length);
  console.log("All Satellites:", allSatellites);

  // Add a new custom satellite
  const addCustomSatellite = () => {
    const satellite: DisplaySatellite = {
      id: `custom-${Date.now()}`,
      name: newSatellite.name || `Custom-Sat-${customSatellites.length + 1}`,
      source: "custom",
      status: newSatellite.status || "Active",
      orbitType: newSatellite.orbitType || "LEO",
      apogee: newSatellite.apogee,
      perigee: newSatellite.perigee,
      inclination: newSatellite.inclination,
      period: newSatellite.period,
      country: newSatellite.country,
      launchDate: newSatellite.launchDate,
      lastUpdate: new Date().toISOString(),
    };
    
    setCustomSatellites(prev => [...prev, satellite]);
    setAddDialogOpen(false);
    setNewSatellite({
      source: "custom",
      status: "Active", 
      orbitType: "LEO",
    });
  };

  // Delete satellite
  const deleteSatellite = (id: string) => {
    setCustomSatellites(prev => prev.filter(sat => sat.id !== id));
  };

  // Refresh satellite data from API
  const refreshSatelliteData = async () => {
    setLoading(true);
    try {
      await dispatch(fetchMongoData()).unwrap();
    } catch (error) {
      console.error("Failed to refresh satellites:", error);
    } finally {
      setLoading(false);
    }
  };

  // Status cell renderer with colored chips
  const StatusCellRenderer = (params: any) => {
    const getStatusColor = (status: string) => {
      switch (status) {
        case "Active": return "#00ff41";
        case "Inactive": return "#ffaa00";
        case "Decayed": return "#ff0040";
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
          borderColor: params.value === "api" ? "#00aaff" : "#00ff41",
          color: params.value === "api" ? "#00aaff" : "#00ff41",
          fontSize: "10px",
        }}
      />
    );
  };

  // Actions cell renderer
  const ActionsCellRenderer = (params: any) => {
    if (params.data.source === "api") return null;
    
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
            onClick={() => deleteSatellite(params.data.id)}
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
  const columnDefs: ColDef<DisplaySatellite>[] = [
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
      width: 90,
      cellRenderer: SourceCellRenderer,
    },
    { 
      headerName: "TYPE", 
      field: "type", 
      editable: false,
      filter: "agSetColumnFilter",
      width: 80,
      cellStyle: { color: "#66aaff" },
      valueFormatter: (params) => params.value ? params.value.toUpperCase() : "N/A"
    },
    { 
      headerName: "NORAD ID", 
      field: "noradId", 
      editable: false,
      filter: "agNumberColumnFilter",
      type: "numericColumn",
      width: 90,
      cellStyle: { color: "#ffcc66", textAlign: "right" },
      valueFormatter: (params) => params.value ? params.value.toString() : "N/A"
    },
    { 
      headerName: "STATUS", 
      field: "status", 
      editable: true,
      filter: "agSetColumnFilter",
      cellEditor: "agSelectCellEditor",
      cellEditorParams: {
        values: ["Active", "Inactive", "Decayed", "Unknown"]
      },
      width: 100,
      cellRenderer: StatusCellRenderer,
    },
    { 
      headerName: "ORBIT TYPE", 
      field: "orbitType", 
      editable: true,
      filter: "agSetColumnFilter",
      cellEditor: "agSelectCellEditor",
      cellEditorParams: {
        values: ["LEO", "MEO", "GEO", "HEO", "Unknown"]
      },
      width: 100,
      cellStyle: { color: "#00aaff" }
    },
    { 
      headerName: "APOGEE (km)", 
      field: "apogee", 
      editable: true,
      filter: "agNumberColumnFilter",
      type: "numericColumn",
      width: 110,
      cellStyle: { color: "#ffaa00", textAlign: "right" },
      valueFormatter: (params) => params.value ? params.value.toLocaleString() : "N/A"
    },
    { 
      headerName: "PERIGEE (km)", 
      field: "perigee", 
      editable: true,
      filter: "agNumberColumnFilter", 
      type: "numericColumn",
      width: 110,
      cellStyle: { color: "#ffaa00", textAlign: "right" },
      valueFormatter: (params) => params.value ? params.value.toLocaleString() : "N/A"
    },
    { 
      headerName: "INCLINATION (°)", 
      field: "inclination", 
      editable: true,
      filter: "agNumberColumnFilter",
      type: "numericColumn", 
      width: 130,
      cellStyle: { color: "#ff6600", textAlign: "right" },
      valueFormatter: (params) => params.value ? `${params.value.toFixed(2)}°` : "N/A"
    },
    { 
      headerName: "PERIOD (min)", 
      field: "period", 
      editable: true,
      filter: "agNumberColumnFilter",
      type: "numericColumn",
      width: 110,
      cellStyle: { color: "#66ff66", textAlign: "right" },
      valueFormatter: (params) => params.value ? `${params.value.toFixed(1)} min` : "N/A"
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
      headerName: "LAUNCH DATE", 
      field: "launchDate", 
      editable: true,
      filter: "agDateColumnFilter",
      width: 120,
      cellStyle: { color: "#cc88ff" },
      valueFormatter: (params) => params.value ? new Date(params.value).toLocaleDateString() : "N/A"
    },
    { 
      headerName: "DESCRIPTION", 
      field: "description", 
      editable: true,
      filter: "agTextColumnFilter",
      width: 150,
      cellStyle: { color: "#88ddff" },
      valueFormatter: (params) => params.value || "N/A"
    },
    { 
      headerName: "ACTIONS", 
      colId: "actions",
      editable: false,
      sortable: false,
      filter: false,
      width: 100,
      cellRenderer: ActionsCellRenderer,
      pinned: "right"
    },
  ];

  return (
    <div className="sats-page">
      {/* Header Section */}
      <Box className="sats-header">
        <Typography variant="h4" className="sats-title">
          SATELLITE DATABASE
        </Typography>
        <Typography variant="subtitle1" className="sats-subtitle">
          Mission Operations Command Center - Status: {status.toUpperCase()}
        </Typography>
        
        {/* Action Buttons */}
        <Box className="sats-actions">
          <Tooltip title="Add Custom Satellite">
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setAddDialogOpen(true)}
              className="action-button add-button"
            >
              ADD SATELLITE
            </Button>
          </Tooltip>
          
          <Tooltip title="Refresh Satellite Data">
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={refreshSatelliteData}
              disabled={loading}
              className="action-button refresh-button"
            >
              REFRESH DATA
            </Button>
          </Tooltip>
          
          <Tooltip title="Force API Test">
            <Button
              variant="outlined" 
              onClick={async () => {
                console.log("Force testing API...");
                try {
                  const response = await fetch("/api/satellites");
                  const data = await response.json();
                  console.log("Direct API response:", data);
                } catch (error) {
                  console.error("Direct API error:", error);
                }
              }}
              className="action-button"
            >
              TEST API
            </Button>
          </Tooltip>
        </Box>

        {/* Enhanced Stats */}
        <Box className="sats-stats">
          <Box className="stat-item">
            <Typography variant="h6" className="stat-number">{mongoSatellites.length}</Typography>
            <Typography variant="caption" className="stat-label">API SATS</Typography>
          </Box>
          <Box className="stat-item">
            <Typography variant="h6" className="stat-number">{customSatellites.length}</Typography>
            <Typography variant="caption" className="stat-label">CUSTOM</Typography>
          </Box>
          <Box className="stat-item">
            <Typography variant="h6" className="stat-number">{allSatellites.filter(s => s.status === "Active").length}</Typography>
            <Typography variant="caption" className="stat-label">ACTIVE</Typography>
          </Box>
          <Box className="stat-item">
            <Typography variant="h6" className="stat-number">{allSatellites.filter(s => s.orbitType === "LEO").length}</Typography>
            <Typography variant="caption" className="stat-label">LEO</Typography>
          </Box>
          <Box className="stat-item">
            <Typography variant="h6" className="stat-number">{allSatellites.filter(s => s.orbitType === "GEO").length}</Typography>
            <Typography variant="caption" className="stat-label">GEO</Typography>
          </Box>
          <Box className="stat-item">
            <Typography variant="h6" className="stat-number">{allSatellites.filter(s => s.type === "live").length}</Typography>
            <Typography variant="caption" className="stat-label">LIVE</Typography>
          </Box>
          <Box className="stat-item">
            <Typography variant="h6" className="stat-number">{allSatellites.filter(s => s.type === "simulated").length}</Typography>
            <Typography variant="caption" className="stat-label">SIM</Typography>
          </Box>
          <Box className="stat-item">
            <Typography variant="h6" className="stat-number">{allSatellites.length}</Typography>
            <Typography variant="caption" className="stat-label">TOTAL</Typography>
          </Box>
        </Box>

        {/* Console Status Bar */}
        <Box className="console-status-bar">
          <Box className="status-section">
            <Typography variant="caption" className="status-label">SYS:</Typography>
            <Typography variant="caption" className={`status-value ${status === "succeeded" ? "online" : "loading"}`}>
              {status === "succeeded" ? "ONLINE" : status.toUpperCase()}
            </Typography>
          </Box>
          <Box className="status-section">
            <Typography variant="caption" className="status-label">CONN:</Typography>
            <Typography variant="caption" className="status-value online">ESTABLISHED</Typography>
          </Box>
          <Box className="status-section">
            <Typography variant="caption" className="status-label">API:</Typography>
            <Typography variant="caption" className="status-value online">ACTIVE</Typography>
          </Box>
          <Box className="status-section">
            <Typography variant="caption" className="status-label">DB:</Typography>
            <Typography variant="caption" className="status-value online">MONGODB</Typography>
          </Box>
          <Box className="status-section">
            <Typography variant="caption" className="status-label">TIME:</Typography>
            <Typography variant="caption" className="status-value">{new Date().toLocaleTimeString()}</Typography>
          </Box>
        </Box>
      </Box>

      {/* AG Grid Table */}
      <Box className="sats-grid-container">
        {allSatellites.length === 0 ? (
          <Box sx={{ padding: 4, textAlign: 'center', color: '#888' }}>
            <Typography variant="h6">
              {status === "loading" ? "Loading satellites..." : "No satellites found"}
            </Typography>
            <Typography variant="body2" sx={{ mt: 1 }}>
              Status: {status} | MongoDB Count: {mongoSatellites.length} | Custom Count: {customSatellites.length}
            </Typography>
          </Box>
        ) : (
          <div 
            className="ag-theme-alpine-dark matrix-grid" 
            style={{ 
              height: '600px',
              width: '100%'
            }}
          >
            <AgGridReact
              ref={gridRef}
              rowData={allSatellites}
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
                console.log("Grid ready, row count:", params.api.getDisplayedRowCount());
              }}
              onCellValueChanged={(event: CellValueChangedEvent) => {
                // Handle cell edits for custom satellites only
                if (event.data.source === "custom") {
                  const updatedCustomSats = customSatellites.map(sat => 
                    sat.id === event.data.id 
                      ? { ...event.data, lastUpdate: new Date().toISOString() }
                      : sat
                  );
                  setCustomSatellites(updatedCustomSats);
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
              loading={loading || status === "loading"}
              domLayout="normal"
            />
          </div>
        )}
      </Box>

      {/* Add Satellite Dialog */}
      <Dialog 
        open={addDialogOpen} 
        onClose={() => setAddDialogOpen(false)}
        maxWidth="md"
        fullWidth
        className="add-satellite-dialog"
      >
        <DialogTitle className="dialog-title">
          ADD CUSTOM SATELLITE
        </DialogTitle>
        <DialogContent className="dialog-content">
          <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2, pt: 1 }}>
            <TextField
              label="Satellite Name"
              value={newSatellite.name || ""}
              onChange={(e) => setNewSatellite({...newSatellite, name: e.target.value})}
              fullWidth
              className="matrix-input"
            />
            
            <FormControl fullWidth className="matrix-select">
              <InputLabel>Status</InputLabel>
              <Select
                value={newSatellite.status || "Active"}
                onChange={(e) => setNewSatellite({...newSatellite, status: e.target.value as any})}
                label="Status"
              >
                <MenuItem value="Active">Active</MenuItem>
                <MenuItem value="Inactive">Inactive</MenuItem>
                <MenuItem value="Decayed">Decayed</MenuItem>
                <MenuItem value="Unknown">Unknown</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth className="matrix-select">
              <InputLabel>Orbit Type</InputLabel>
              <Select
                value={newSatellite.orbitType || "LEO"}
                onChange={(e) => setNewSatellite({...newSatellite, orbitType: e.target.value as any})}
                label="Orbit Type"
              >
                <MenuItem value="LEO">LEO</MenuItem>
                <MenuItem value="MEO">MEO</MenuItem>
                <MenuItem value="GEO">GEO</MenuItem>
                <MenuItem value="HEO">HEO</MenuItem>
                <MenuItem value="Unknown">Unknown</MenuItem>
              </Select>
            </FormControl>

            <TextField
              label="Country"
              value={newSatellite.country || ""}
              onChange={(e) => setNewSatellite({...newSatellite, country: e.target.value})}
              fullWidth
              className="matrix-input"
            />

            <TextField
              label="Apogee (km)"
              type="number"
              value={newSatellite.apogee || ""}
              onChange={(e) => setNewSatellite({...newSatellite, apogee: parseFloat(e.target.value) || undefined})}
              fullWidth
              className="matrix-input"
            />

            <TextField
              label="Perigee (km)"
              type="number"
              value={newSatellite.perigee || ""}
              onChange={(e) => setNewSatellite({...newSatellite, perigee: parseFloat(e.target.value) || undefined})}
              fullWidth
              className="matrix-input"
            />

            <TextField
              label="Inclination (degrees)"
              type="number"
              value={newSatellite.inclination || ""}
              onChange={(e) => setNewSatellite({...newSatellite, inclination: parseFloat(e.target.value) || undefined})}
              fullWidth
              className="matrix-input"
            />

            <TextField
              label="Period (minutes)"
              type="number"
              value={newSatellite.period || ""}
              onChange={(e) => setNewSatellite({...newSatellite, period: parseFloat(e.target.value) || undefined})}
              fullWidth
              className="matrix-input"
            />

            <TextField
              label="Launch Date"
              type="date"
              value={newSatellite.launchDate || ""}
              onChange={(e) => setNewSatellite({...newSatellite, launchDate: e.target.value})}
              fullWidth
              InputLabelProps={{ shrink: true }}
              className="matrix-input"
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
            onClick={addCustomSatellite}
            startIcon={<SaveIcon />}
            variant="contained"
            className="save-button"
          >
            ADD SATELLITE
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}