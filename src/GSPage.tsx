import React, { useState, useEffect, useRef } from "react";
import { AgGridReact } from "ag-grid-react";
import { ModuleRegistry, AllCommunityModule } from "ag-grid-community";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";
import { ColDef, CellValueChangedEvent } from "ag-grid-community";
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
  Tabs,
  Tab,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import RefreshIcon from "@mui/icons-material/Refresh";
import DeleteIcon from "@mui/icons-material/Delete";
import SaveIcon from "@mui/icons-material/Save";
import CancelIcon from "@mui/icons-material/Cancel";
import ManageSearchIcon from "@mui/icons-material/ManageSearch";
import ExploreIcon from "@mui/icons-material/Explore";
import RadarIcon from "@mui/icons-material/Radar";
import { 
  DisplayGroundStation, 
  convertApiGroundStationToDisplay, 
  getPredefinedGroundStations, 
  mergeGroundStationSources,
  getGroundStationStats 
} from "./utils/groundStationDataUtils";
import { useTheme } from "./contexts/ThemeContext";
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

export default function GSPage() {
  const theme = useTheme();
  const dispatch = useDispatch<AppDispatch>();
  // Get ground stations from Redux store
  const { groundStations: mongoGroundStations, status } = useSelector((state: RootState) => state.mongo);
  const [loading, setLoading] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [predefinedGroundStations, setPredefinedGroundStations] = useState<DisplayGroundStation[]>([]);
  const [activeTab, setActiveTab] = useState(0); // 0 = My Ground Stations, 1 = Discover More
  const [activeFilters, setActiveFilters] = useState<Set<string>>(new Set()); // Track active filters
  const [newGroundStation, setNewGroundStation] = useState<Partial<DisplayGroundStation>>({
    source: "custom",
    status: "Active",
    bandType: "S",
    elevation: 5,
    azimuth: 360,
  });
  const myGridRef = useRef<AgGridReact>(null);
  const discoverGridRef = useRef<AgGridReact>(null);

  // Fetch ground stations data from API on component mount
  useEffect(() => {
    dispatch(fetchMongoData());
    
    // Load predefined ground stations
    const predefinedStations = getPredefinedGroundStations();
    setPredefinedGroundStations(predefinedStations);
  }, [dispatch]);

  // Update CSS custom properties when theme changes
  useEffect(() => {
    const rootElement = document.documentElement;
    rootElement.style.setProperty('--theme-primary', theme.theme.primary);
    rootElement.style.setProperty('--theme-primary-rgb', theme.theme.primaryRGB);
    rootElement.style.setProperty('--theme-secondary', theme.theme.secondary);
    rootElement.style.setProperty('--theme-background-gradient', theme.theme.backgroundGradient);
    rootElement.style.setProperty('--theme-background-dark', theme.theme.backgroundDark);
    rootElement.style.setProperty('--theme-background-secondary', theme.theme.buttonBackground);
    rootElement.style.setProperty('--theme-border-gradient', theme.theme.borderGradient);
    rootElement.style.setProperty('--theme-glow-color', theme.theme.glowColor);
    rootElement.style.setProperty('--theme-button-background', theme.theme.buttonBackground);
    rootElement.style.setProperty('--theme-secondary-glow', `rgba(${theme.theme.primaryRGB}, 0.5)`);
  }, [theme]);

  // Convert API ground stations to our display format
  const apiGroundStations: DisplayGroundStation[] = mongoGroundStations.map(convertApiGroundStationToDisplay);

  // Separate my ground stations from discoverable ground stations
  const myGroundStations = apiGroundStations; // Ground stations from MongoDB API
  const discoverableGroundStations = predefinedGroundStations.filter(station => 
    !apiGroundStations.some(apiStation => apiStation.name.toLowerCase() === station.name.toLowerCase())
  ); // Predefined stations not already in MongoDB

  // Merge all ground station sources for overall stats
  const allGroundStations = mergeGroundStationSources(apiGroundStations, predefinedGroundStations);
  
  // Apply filters to ground stations
  const applyFilters = (stations: DisplayGroundStation[]) => {
    if (activeFilters.size === 0) return stations;
    
    return stations.filter(station => {
      // Check if station matches any of the active filters
      return Array.from(activeFilters).some(filter => {
        switch (filter) {
          case 'api': return station.source === 'api';
          case 'predefined': return station.source === 'predefined';
          case 'active': return station.status === 'Active';
          case 'inactive': return station.status === 'Inactive';
          case 'maintenance': return station.status === 'Maintenance';
          case 'decommissioned': return station.status === 'Decommissioned';
          case 'sBand': return station.bandType === 'S';
          case 'xBand': return station.bandType === 'X';
          case 'kaBand': return station.bandType === 'Ka';
          case 'kuBand': return station.bandType === 'Ku';
          case 'lBand': return station.bandType === 'L';
          case 'cBand': return station.bandType === 'C';
          default: return false;
        }
      });
    });
  };
  
  // Filtered ground stations for display
  const filteredMyGroundStations = applyFilters(myGroundStations);
  const filteredDiscoverableGroundStations = applyFilters(discoverableGroundStations);
  
  // Get statistics
  const stats = getGroundStationStats(allGroundStations);

  // Toggle filter function
  const toggleFilter = (filterKey: string) => {
    setActiveFilters(prev => {
      const newFilters = new Set(prev);
      if (newFilters.has(filterKey)) {
        newFilters.delete(filterKey);
      } else {
        newFilters.add(filterKey);
      }
      return newFilters;
    });
  };

  // Clear all filters
  const clearAllFilters = () => {
    setActiveFilters(new Set());
  };

  // Clickable stat item component
  const StatItem = ({ count, label, filterKey, tooltip }: { 
    count: number; 
    label: string; 
    filterKey?: string; 
    tooltip?: string;
  }) => {
    const isActive = filterKey ? activeFilters.has(filterKey) : false;
    const isClickable = !!filterKey;
    
    return (
      <Tooltip title={tooltip || (isClickable ? `Filter by ${label}` : label)}>
        <Box 
          className={`stat-item ${isClickable ? 'clickable' : ''} ${isActive ? 'active' : ''}`}
          onClick={isClickable ? () => toggleFilter(filterKey) : undefined}
          sx={{
            cursor: isClickable ? 'pointer' : 'default',
            opacity: activeFilters.size > 0 && !isActive && isClickable ? 0.6 : 1,
            transition: 'all 0.2s ease',
            '&:hover': isClickable ? {
              backgroundColor: `rgba(${theme.theme.primaryRGB}, 0.1)`,
              transform: 'translateY(-1px)'
            } : {},
            ...(isActive && {
              backgroundColor: `rgba(${theme.theme.primaryRGB}, 0.2)`,
              border: `1px solid ${theme.theme.primary}`,
              boxShadow: `0 0 10px rgba(${theme.theme.primaryRGB}, 0.3)`
            })
          }}
        >
          <Typography variant="h6" className="stat-number">{count}</Typography>
          <Typography variant="caption" className="stat-label">{label}</Typography>
          {isActive && (
            <Typography variant="caption" sx={{ color: theme.theme.primary, fontSize: '8px' }}>
              FILTERED
            </Typography>
          )}
        </Box>
      </Tooltip>
    );
  };

  // Add a new custom ground station (save to DB)
  const addCustomGroundStation = async () => {
    try {
      setLoading(true);
      await fetch("/api/ground-stations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newGroundStation.name,
          location: {
            lat: newGroundStation.latitude || 0,
            lon: newGroundStation.longitude || 0,
            alt: newGroundStation.altitude || 0,
          },
          country: newGroundStation.country,
          city: newGroundStation.city,
          status: newGroundStation.status,
          frequency: newGroundStation.frequency,
          bandType: newGroundStation.bandType,
          elevation: newGroundStation.elevation,
          azimuth: newGroundStation.azimuth,
          operator: newGroundStation.operator,
          established: newGroundStation.established ? new Date(newGroundStation.established) : undefined,
          description: newGroundStation.description,
          source: "custom",
        }),
      });
      setAddDialogOpen(false);
      setNewGroundStation({
        source: "custom",
        status: "Active",
        bandType: "S",
        elevation: 5,
        azimuth: 360,
      });
      await dispatch(fetchMongoData()); // Reload from DB
    } catch (err) {
      console.error("Failed to add custom ground station", err);
    } finally {
      setLoading(false);
    }
  };

  // Quick-add ground station from predefined to my ground stations
  const quickAddGroundStation = async (station: DisplayGroundStation) => {
    try {
      setLoading(true);
      const response = await fetch("/api/ground-stations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: station.name,
          location: {
            lat: station.latitude,
            lon: station.longitude,
            alt: station.altitude,
          },
          country: station.country,
          city: station.city,
          status: station.status,
          frequency: station.frequency,
          bandType: station.bandType,
          elevation: station.elevation,
          azimuth: station.azimuth,
          operator: station.operator,
          established: station.established ? new Date(station.established) : undefined,
          description: `Added from predefined - ${station.description || 'Predefined ground station'}`,
          source: "predefined",
        }),
      });

      if (response.ok) {
        await dispatch(fetchMongoData()); // Reload from DB
        // Optionally switch to "My Ground Stations" tab
        setActiveTab(0);
      } else {
        console.error("Failed to add ground station:", response.statusText);
      }
    } catch (err) {
      console.error("Failed to quick-add ground station", err);
    } finally {
      setLoading(false);
    }
  };

  // Delete ground station
  const deleteGroundStation = async (id: string) => {
    // Extract the database ID from the display ID
    const dbId = id.replace("api-", "");
    try {
      setLoading(true);
      await fetch(`/api/ground-stations/${dbId}`, {
        method: "DELETE",
      });
      await dispatch(fetchMongoData()); // Reload from DB
    } catch (error) {
      console.error("Failed to delete ground station:", error);
    } finally {
      setLoading(false);
    }
  };

  // Refresh ground station data from API
  const refreshGroundStationData = async () => {
    setLoading(true);
    try {
      await dispatch(fetchMongoData()).unwrap();
      
      // Also refresh predefined stations
      const predefinedStations = getPredefinedGroundStations();
      setPredefinedGroundStations(predefinedStations);
    } catch (error) {
      console.error("Failed to refresh ground stations:", error);
    } finally {
      setLoading(false);
    }
  };

  // Status cell renderer with colored chips
  const StatusCellRenderer = (params: any) => {
    const getStatusColor = (status: string) => {
      switch (status) {
        case "Active": return theme.theme.primary;
        case "Inactive": return theme.theme.warning || "#ffaa00";
        case "Maintenance": return theme.theme.accent || theme.theme.secondary;
        case "Decommissioned": return theme.theme.error || "#ff4444";
        default: return theme.theme.textSecondary;
      }
    };

    return (
      <Chip
        label={params.value}
        size="small"
        sx={{
          backgroundColor: getStatusColor(params.value),
          color: theme.theme.background,
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
          borderColor: params.value === "predefined" ? theme.theme.secondary : theme.theme.primary,
          color: params.value === "predefined" ? theme.theme.secondary : theme.theme.primary,
          fontSize: "10px",
        }}
      />
    );
  };

  // Coordinates cell renderer
  const CoordinatesCellRenderer = (params: any) => {
    const { latitude, longitude } = params.data;
    return (
      <span style={{ color: theme.theme.accent || theme.theme.secondary, fontFamily: "monospace" }}>
        {latitude.toFixed(4)}°, {longitude.toFixed(4)}°
      </span>
    );
  };

  // Actions cell renderer
  const ActionsCellRenderer = (params: any) => {
    // Only show actions for custom ground stations (from our API) that can be deleted
    if (params.data.source !== "api") return null;
    
    return (
      <Box sx={{ display: "flex", gap: 0.5 }}>
        <Tooltip title="Delete">
          <IconButton
            size="small"
            onClick={() => deleteGroundStation(params.data.id)}
            sx={{ color: theme.theme.error || "#ff4444", padding: "2px" }}
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>
    );
  };

  // Country cell renderer with flag
  const CountryCellRenderer = (params: any) => {
    if (!params.value) return <span style={{ color: theme.theme.textSecondary }}>N/A</span>;
    
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
            border: `1px solid ${theme.theme.secondary}`,
            borderRadius: "2px"
          }}
          onError={(e) => {
            // Fallback to generic flag if country flag not found
            e.currentTarget.src = "https://flagcdn.com/24x18/un.png";
          }}
        />
        <span style={{ color: theme.theme.textPrimary }}>{params.value}</span>
      </Box>
    );
  };

  // Quick-Add Cell Renderer for Discover More tab
  const QuickAddCellRenderer = (params: any) => {
    return (
      <Tooltip title="Add to My Ground Stations">
        <IconButton
          size="small"
          onClick={() => quickAddGroundStation(params.data)}
          disabled={loading}
          sx={{
            color: theme.theme.primary,
            "&:hover": { backgroundColor: `rgba(${theme.theme.primaryRGB}, 0.1)` }
          }}
        >
          <AddIcon fontSize="small" />
        </IconButton>
      </Tooltip>
    );
  };

  // Base column definitions (shared between both tabs)
  const getBaseColumnDefs = (): ColDef<DisplayGroundStation>[] => [
    { 
      headerName: "NAME", 
      field: "name", 
      filter: "agTextColumnFilter",
      width: 180,
      cellStyle: { color: theme.theme.primary, fontWeight: "bold" }
    },
    { 
      headerName: "SOURCE", 
      field: "source", 
      filter: "agSetColumnFilter",
      width: 100,
      cellRenderer: SourceCellRenderer,
    },
    { 
      headerName: "STATUS", 
      field: "status", 
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
      filter: "agTextColumnFilter",
      width: 140,
      cellRenderer: CountryCellRenderer,
    },
    { 
      headerName: "CITY", 
      field: "city", 
      filter: "agTextColumnFilter",
      flex: 1,
      cellStyle: { color: theme.theme.textPrimary }
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
      filter: "agNumberColumnFilter",
      type: "numericColumn",
      flex: 1,
      cellStyle: { color: theme.theme.accent || theme.theme.secondary, textAlign: "right" },
      valueFormatter: (params) => params.value ? params.value.toLocaleString() : "N/A"
    },
    { 
      headerName: "FREQUENCY", 
      field: "frequency", 
      filter: "agTextColumnFilter",
      flex: 1,
      cellStyle: { color: theme.theme.warning || theme.theme.primary },
      valueFormatter: (params) => params.value ? `${params.value} MHz` : "N/A"
    },
    { 
      headerName: "BAND", 
      field: "bandType", 
      filter: "agSetColumnFilter",
      cellEditor: "agSelectCellEditor",
      cellEditorParams: {
        values: ["S", "X", "Ka", "Ku", "L", "C", "Unknown"]
      },
      flex: 0.8,
      cellStyle: { color: theme.theme.primary, textAlign: "center", fontWeight: "bold" }
    },
    { 
      headerName: "OPERATOR", 
      field: "operator", 
      filter: "agTextColumnFilter",
      flex: 1.5,
      cellStyle: { color: theme.theme.secondary }
    },
    { 
      headerName: "ESTABLISHED", 
      field: "established", 
      filter: "agDateColumnFilter",
      flex: 1,
      cellStyle: { color: theme.theme.accent || theme.theme.secondary },
      valueFormatter: (params) => params.value ? new Date(params.value).toLocaleDateString() : "N/A"
    },
  ];

  // Column definitions for "My Ground Stations" tab (editable, with delete actions)
  const myColumnDefs: ColDef<DisplayGroundStation>[] = [
    ...getBaseColumnDefs().map(col => ({ 
      ...col, 
      editable: col.field !== "source" && col.colId !== "coordinates",
    })),
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

  // Column definitions for "Discover More" tab (read-only, with add actions)
  const discoverColumnDefs: ColDef<DisplayGroundStation>[] = [
    ...getBaseColumnDefs().map(col => ({ ...col, editable: false })),
    { 
      headerName: "ADD", 
      colId: "quickAdd",
      editable: false,
      sortable: false,
      filter: false,
      width: 60,
      cellRenderer: QuickAddCellRenderer,
      pinned: "right"
    },
  ];

  return (
    <div 
      className="gs-page"
      style={{
        // Minimal CSS Custom Properties
        '--theme-primary': theme.theme.primary,
        '--theme-primary-rgb': theme.theme.primaryRGB,
      } as React.CSSProperties}
    >
      {/* Header Section */}
      <Box className="gs-header">
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, marginBottom: 1, justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <RadarIcon sx={{ color: 'var(--theme-primary)', fontSize: '2rem' }} />
            <Typography variant="h5" className="gs-title">
              GROUND STATION NETWORK
            </Typography>
          </Box>
          
          {/* Action Buttons */}
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title="Add Ground Station">
              <IconButton
                onClick={() => setAddDialogOpen(true)}
                sx={{
                  backgroundColor: `rgba(${theme.theme.primaryRGB}, 0.2)`,
                  color: theme.theme.primary,
                  border: `1px solid ${theme.theme.primary}`,
                  '&:hover': {
                    backgroundColor: `rgba(${theme.theme.primaryRGB}, 0.3)`,
                    boxShadow: `0 0 10px rgba(${theme.theme.primaryRGB}, 0.5)`
                  }
                }}
              >
                <AddIcon />
              </IconButton>
            </Tooltip>
            
            <Tooltip title="Refresh Station Data">
              <IconButton
                onClick={refreshGroundStationData}
                disabled={loading}
                sx={{
                  backgroundColor: `rgba(${theme.theme.secondaryRGB || theme.theme.primaryRGB}, 0.2)`,
                  color: theme.theme.secondary,
                  border: `1px solid ${theme.theme.secondary}`,
                  '&:hover': {
                    backgroundColor: `rgba(${theme.theme.secondaryRGB || theme.theme.primaryRGB}, 0.3)`,
                    boxShadow: `0 0 10px rgba(${theme.theme.secondaryRGB || theme.theme.primaryRGB}, 0.5)`
                  },
                  '&:disabled': {
                    opacity: 0.5,
                    color: theme.theme.textSecondary
                  }
                }}
              >
                <RefreshIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
        <Typography variant="subtitle2" className="gs-subtitle">
          Global Communications Infrastructure
        </Typography>

        {/* Enhanced Stats */}
        <Box className="gs-stats">
          <StatItem count={stats.api} label="API" filterKey="api" tooltip="Ground stations from your MongoDB API" />
          <StatItem count={stats.predefined} label="PREDEFINED" filterKey="predefined" tooltip="Built-in ground stations database" />
          <StatItem count={stats.active} label="ACTIVE" filterKey="active" tooltip="Active ground stations" />
          <StatItem count={stats.maintenance} label="MAINT" filterKey="maintenance" tooltip="Stations under maintenance" />
          <StatItem count={stats.xBand} label="X-BAND" filterKey="xBand" tooltip="X-Band frequency stations" />
          <StatItem count={stats.sBand} label="S-BAND" filterKey="sBand" tooltip="S-Band frequency stations" />
          <StatItem count={stats.countries} label="COUNTRIES" tooltip="Number of countries with stations" />
          <StatItem count={stats.total} label="TOTAL" tooltip="Total number of ground stations" />
        </Box>

        {/* Filter Controls */}
        {activeFilters.size > 0 && (
          <Box className="filter-controls" sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 2, 
            marginTop: 1,
            padding: 1,
            backgroundColor: `rgba(${theme.theme.primaryRGB}, 0.1)`,
            borderRadius: 1,
            border: `1px solid rgba(${theme.theme.primaryRGB}, 0.2)`
          }}>
            <Typography variant="caption" sx={{ color: theme.theme.primary, fontWeight: 'bold' }}>
              ACTIVE FILTERS: {Array.from(activeFilters).join(', ').toUpperCase()}
            </Typography>
            <Button 
              size="small" 
              variant="outlined" 
              onClick={clearAllFilters}
              sx={{ 
                minWidth: 'auto',
                fontSize: '10px',
                padding: '2px 8px',
                borderColor: theme.theme.secondary,
                color: theme.theme.secondary,
                '&:hover': {
                  borderColor: theme.theme.primary,
                  color: theme.theme.primary
                }
              }}
            >
              CLEAR ALL
            </Button>
          </Box>
        )}

        {/* Console Status Bar */}
        <Box className="console-status-bar">
          <Box className="status-section">
            <Typography variant="caption" className="status-label">SYS:</Typography>
            <Typography variant="caption" className={`status-value ${status === "succeeded" ? "online" : "loading"}`}>
              {status === "succeeded" ? "ONLINE" : status.toUpperCase()}
            </Typography>
          </Box>
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
        
        {/* Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: `rgba(${theme.theme.primaryRGB}, 0.3)`, marginBottom: 2 }}>
          <Tabs 
            value={activeTab} 
            onChange={(_, newValue) => setActiveTab(newValue)}
            sx={{
              '& .MuiTabs-indicator': {
                backgroundColor: theme.theme.primary,
                height: '2px',
              },
              '& .MuiTab-root': {
                color: `rgba(${theme.theme.primaryRGB}, 0.7)`,
                fontFamily: "'Courier New', Courier, monospace",
                fontSize: '0.9rem',
                fontWeight: 'bold',
                textTransform: 'uppercase',
                '&.Mui-selected': {
                  color: theme.theme.primary,
                },
                '&:hover': {
                  color: theme.theme.primary,
                  backgroundColor: `rgba(${theme.theme.primaryRGB}, 0.1)`,
                },
              },
            }}
          >
            <Tab 
              icon={<ManageSearchIcon />} 
              iconPosition="start"
              label={`My Ground Stations (${filteredMyGroundStations.length})`} 
            />
            <Tab 
              icon={<ExploreIcon />} 
              iconPosition="start"
              label={`Discover More (${filteredDiscoverableGroundStations.length})`} 
            />
          </Tabs>
        </Box>

        {/* Grid Content */}
        {(activeTab === 0 ? filteredMyGroundStations : filteredDiscoverableGroundStations).length === 0 ? (
          <Box sx={{ padding: 4, textAlign: 'center', color: theme.theme.textSecondary }}>
            <Typography variant="h6">
              {activeTab === 0 
                ? (status === "loading" ? "Loading my ground stations..." : "No managed ground stations found") 
                : "Loading discoverable ground stations..."
              }
            </Typography>
            <Typography variant="body2" sx={{ mt: 1 }}>
              {activeTab === 0 
                ? `MongoDB Count: ${mongoGroundStations.length}` 
                : `Predefined Available: ${predefinedGroundStations.length}`
              }
            </Typography>
          </Box>
        ) : (
          <div 
            className="ag-theme-alpine-dark matrix-grid" 
            style={{ 
              height: '600px',
              width: '100%',
              position: 'relative'
            }}
          >
            {(loading || status === "loading") && (
              <div className="gs-grid-loading-overlay">
                <div className="gs-grid-loading-spinner" />
                <div className="gs-grid-loading-text">
                  Loading Ground Stations...
                </div>
              </div>
            )}
            <AgGridReact
              ref={activeTab === 0 ? myGridRef : discoverGridRef}
              rowData={activeTab === 0 ? filteredMyGroundStations : filteredDiscoverableGroundStations}
              columnDefs={activeTab === 0 ? myColumnDefs : discoverColumnDefs}
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
                params.api.sizeColumnsToFit();
                console.log("Grid ready, row count:", params.api.getDisplayedRowCount());
              }}
              onCellValueChanged={(event: CellValueChangedEvent) => {
                // Handle cell edits for managed ground stations only (My Ground Stations tab)
                if (activeTab === 0 && event.data.source === "api") {
                  console.log("Ground station edit:", event.data);
                  // TODO: Implement PUT /api/ground-stations/:id endpoint call
                }
              }}
              onFirstDataRendered={() => {
                const currentGrid = activeTab === 0 ? myGridRef.current : discoverGridRef.current;
                if (currentGrid) {
                  currentGrid.api.sizeColumnsToFit();
                }
              }}
              pagination={true}
              paginationPageSize={25}
              suppressMenuHide={true}
              enableRangeSelection={true}
              suppressCellFocus={false}
              getRowId={(params) => params.data.id}
              loading={loading || status === "loading"}
            />
          </div>
        )}
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