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
import SatelliteAltIcon from "@mui/icons-material/SatelliteAlt";
import { 
  DisplaySatellite, 
  convertApiSatelliteToDisplay, 
  fetchCelesTrakSatellites, 
  mergeSatelliteSources,
  getSatelliteStats 
} from "./utils/satelliteDataUtils";
import { useTheme } from "./contexts/ThemeContext";
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

export default function SatsPage() {
  const theme = useTheme();
  const dispatch = useDispatch<AppDispatch>();
  // Get satellites from Redux store
  const { satellites: mongoSatellites, status } = useSelector((state: RootState) => state.mongo);
  const [loading, setLoading] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [celestrakSatellites, setCelestrakSatellites] = useState<DisplaySatellite[]>([]);
  const [activeTab, setActiveTab] = useState(0); // 0 = My Satellites, 1 = Discover More
  const [activeFilters, setActiveFilters] = useState<Set<string>>(new Set()); // Track active filters
  const [newSatellite, setNewSatellite] = useState<Partial<DisplaySatellite>>({
    source: "custom",
    status: "Active",
    orbitType: "LEO",
    category: "Unknown",
  });
  const myGridRef = useRef<AgGridReact>(null);
  const discoverGridRef = useRef<AgGridReact>(null);

  // Fetch satellites data from API on component mount
  useEffect(() => {
    dispatch(fetchMongoData());
    
    // Also fetch CelesTrak data for enhanced satellite list
    const fetchCelestrakData = async () => {
      const celestrakData = await fetchCelesTrakSatellites();
      setCelestrakSatellites(celestrakData);
    };
    
    fetchCelestrakData();
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

  // Convert API satellites to our display format
  const apiSatellites: DisplaySatellite[] = mongoSatellites.map(convertApiSatelliteToDisplay);

  // Separate my satellites from discoverable satellites
  const mySatellites = apiSatellites; // Satellites from MongoDB API
  const discoverableSatellites = celestrakSatellites.filter(sat => 
    !apiSatellites.some(apiSat => apiSat.name.toLowerCase() === sat.name.toLowerCase())
  ); // CelesTrak satellites not already in MongoDB
  
  // All satellites for overall stats
  const allSatellites = mergeSatelliteSources(apiSatellites, celestrakSatellites);
  
  // Apply filters to satellites
  const applyFilters = (satellites: DisplaySatellite[]) => {
    if (activeFilters.size === 0) return satellites;
    
    return satellites.filter(sat => {
      // Check if satellite matches any of the active filters
      return Array.from(activeFilters).some(filter => {
        switch (filter) {
          case 'api': return sat.source === 'api';
          case 'celestrak': return sat.source === 'celestrak';
          case 'starlink': return sat.constellation === 'Starlink';
          case 'communication': return sat.category === 'Communication';
          case 'navigation': return sat.category === 'Navigation';
          case 'earthObservation': return sat.category === 'Earth Observation';
          case 'leo': return sat.orbitType === 'LEO';
          case 'geo': return sat.orbitType === 'GEO';
          case 'meo': return sat.orbitType === 'MEO';
          case 'active': return sat.status === 'Active';
          case 'inactive': return sat.status === 'Inactive';
          case 'live': return sat.type === 'live';
          case 'simulated': return sat.type === 'simulated';
          default: return false;
        }
      });
    });
  };
  
  // Filtered satellites for display
  const filteredMySatellites = applyFilters(mySatellites);
  const filteredDiscoverableSatellites = applyFilters(discoverableSatellites);
  
  // Get statistics
  const stats = getSatelliteStats(allSatellites);

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

  // Add a new custom satellite (save to DB)
  const addCustomSatellite = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/satellites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newSatellite.name,
          type: "simulated", // Custom satellites are simulated
          description: newSatellite.description,
          // Additional fields for custom satellites (if your API supports them)
          status: newSatellite.status,
          orbitType: newSatellite.orbitType,
          category: newSatellite.category,
          constellation: newSatellite.constellation,
          apogee: newSatellite.apogee,
          perigee: newSatellite.perigee,
          inclination: newSatellite.inclination,
          period: newSatellite.period,
          country: newSatellite.country,
          launchDate: newSatellite.launchDate,
          source: "custom",
        }),
      });
      
      if (response.ok) {
        setAddDialogOpen(false);
        setNewSatellite({ 
          source: "custom", 
          status: "Active", 
          orbitType: "LEO",
          category: "Unknown"
        });
        await dispatch(fetchMongoData()); // Reload from DB
      } else {
        console.error("Failed to add satellite:", response.statusText);
      }
    } catch (err) {
      console.error("Failed to add custom satellite", err);
    } finally {
      setLoading(false);
    }
  };

  // Quick-add satellite from CelesTrak to my satellites
  const quickAddSatellite = async (satellite: DisplaySatellite) => {
    try {
      setLoading(true);
      const response = await fetch("/api/satellites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: satellite.name,
          noradId: satellite.noradId,
          country: satellite.country || 'Unknown',
          launchDate: satellite.launchDate,
          orbitType: satellite.orbitType || 'Unknown',
          status: satellite.status,
          category: satellite.category,
          constellation: satellite.constellation,
          description: `Added from CelesTrak - ${satellite.description || 'Satellite from CelesTrak database'}`,
          source: "celestrak",
          type: "live"
        }),
      });

      if (response.ok) {
        await dispatch(fetchMongoData()); // Reload from DB
        // Optionally switch to "My Satellites" tab
        setActiveTab(0);
      } else {
        console.error("Failed to add satellite:", response.statusText);
      }
    } catch (err) {
      console.error("Failed to quick-add satellite", err);
    } finally {
      setLoading(false);
    }
  };

  // Delete satellite
  const deleteSatellite = async (id: string) => {
    try {
      setLoading(true);
      // Extract the actual MongoDB ID from the display ID
      const mongoId = id.replace('api-', '');
      const response = await fetch(`/api/satellites/${mongoId}`, {
        method: "DELETE",
      });
      
      if (response.ok) {
        await dispatch(fetchMongoData()); // Reload from DB
      } else {
        console.error("Failed to delete satellite:", response.statusText);
      }
    } catch (err) {
      console.error("Failed to delete satellite", err);
    } finally {
      setLoading(false);
    }
  };

  // Refresh satellite data from API
  const refreshSatelliteData = async () => {
    setLoading(true);
    try {
      await dispatch(fetchMongoData()).unwrap();
      
      // Also refresh CelesTrak data
      const celestrakData = await fetchCelesTrakSatellites();
      setCelestrakSatellites(celestrakData);
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
        case "Active": return theme.theme.primary;
        case "Inactive": return theme.theme.warning || "#ffaa00";
        case "Decayed": return theme.theme.error || "#ff4444";
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
          borderColor: params.value === "api" ? theme.theme.secondary : theme.theme.primary,
          color: params.value === "api" ? theme.theme.secondary : theme.theme.primary,
          fontSize: "10px",
        }}
      />
    );
  };

  // Actions cell renderer
  const ActionsCellRenderer = (params: any) => {
    // Only show actions for custom satellites (from our API) that can be deleted
    if (params.data.source !== "api") return null;
    
    return (
      <Box sx={{ display: "flex", gap: 0.5 }}>
        <Tooltip title="Delete">
          <IconButton
            size="small"
            onClick={() => deleteSatellite(params.data.id)}
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
    if (!params.value || params.value === "Unknown") {
      return <span style={{ color: theme.theme.textSecondary }}>N/A</span>;
    }
    
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
      <Tooltip title="Add to My Satellites">
        <IconButton
          size="small"
          onClick={() => quickAddSatellite(params.data)}
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

  // Category cell renderer with colored chips
  const CategoryCellRenderer = (params: any) => {
    if (!params.value || params.value === "Unknown") {
      return <span style={{ color: theme.theme.textSecondary }}>N/A</span>;
    }

    const getCategoryColor = (category: string) => {
      // Use theme-aware colors that work with both themes
      const colors: Record<string, string> = {
        "Space Station": theme.theme.primary,
        "Navigation": theme.theme.secondary,
        "Communication": theme.theme.accent || theme.theme.primary,
        "Weather": theme.theme.secondary,
        "Earth Observation": theme.theme.accent || theme.theme.secondary,
        "CubeSat": theme.theme.primary,
        "Commercial": theme.theme.secondary,
        "Scientific": theme.theme.accent || theme.theme.primary,
        "Military": theme.theme.error || theme.theme.primary,
      };
      return colors[category] || theme.theme.textSecondary;
    };

    return (
      <Chip
        label={params.value}
        size="small"
        sx={{
          backgroundColor: getCategoryColor(params.value),
          color: theme.theme.background,
          fontWeight: "bold",
          fontSize: "10px",
          maxWidth: "120px"
        }}
      />
    );
  };


  // Base column definitions (shared between both tabs)
  const getBaseColumnDefs = (): ColDef<DisplaySatellite>[] => {
    const cols: ColDef<DisplaySatellite>[] = [
      { 
        headerName: "NAME", 
        field: "name", 
        filter: "agTextColumnFilter",
        width: 180,
        cellStyle: { color: theme.theme.primary, fontWeight: "bold" }
      },
      { 
        headerName: "CATEGORY", 
        field: "category", 
        filter: "agSetColumnFilter",
        width: 130,
        cellRenderer: CategoryCellRenderer,
      },
      { 
        headerName: "SOURCE", 
        field: "source", 
        filter: "agSetColumnFilter",
        width: 90,
        cellRenderer: SourceCellRenderer,
      },
      { 
        headerName: "TYPE", 
        field: "type", 
        filter: "agSetColumnFilter",
        width: 80,
        cellStyle: { color: theme.theme.accent || theme.theme.secondary },
        valueFormatter: (params: any) => params.value ? params.value.toUpperCase() : "N/A"
      },
      { 
        headerName: "NORAD ID", 
        field: "noradId", 
        filter: "agNumberColumnFilter",
        type: "numericColumn",
        width: 90,
        cellStyle: { color: theme.theme.warning || theme.theme.secondary, textAlign: "right" },
        valueFormatter: (params: any) => params.value ? params.value.toString() : "N/A"
      },
      { 
        headerName: "STATUS", 
        field: "status", 
        filter: "agSetColumnFilter",
        width: 100,
        cellRenderer: StatusCellRenderer,
      },
      { 
        headerName: "ORBIT TYPE", 
        field: "orbitType", 
        filter: "agSetColumnFilter",
        width: 100,
        cellStyle: { color: theme.theme.primary },
        valueFormatter: (params: any) => params.value || "N/A"
      },
      { 
        headerName: "COUNTRY", 
        field: "country", 
        filter: "agTextColumnFilter",
        width: 160,
        cellRenderer: CountryCellRenderer,
        pinned: false, // Ensure it's not hidden
      },

      { 
        headerName: "INCLINATION (°)", 
        field: "inclination", 
        filter: "agNumberColumnFilter",
        type: "numericColumn", 
        width: 130,
        cellStyle: { color: theme.theme.warning || theme.theme.primary, textAlign: "right" },
        valueFormatter: (params: any) => params.value ? `${params.value.toFixed(2)}°` : "N/A"
      },
      { 
        headerName: "PERIOD (min)", 
        field: "period", 
        filter: "agNumberColumnFilter",
        type: "numericColumn",
        width: 110,
        cellStyle: { color: theme.theme.primary, textAlign: "right" },
        valueFormatter: (params: any) => params.value ? `${params.value.toFixed(1)} min` : "N/A"
      },
      { 
        headerName: "LAUNCH DATE", 
        field: "launchDate", 
        filter: "agDateColumnFilter",
        width: 120,
        cellStyle: { color: theme.theme.secondary },
        valueFormatter: (params: any) => params.value ? new Date(params.value).toLocaleDateString() : "N/A"
      },
      { 
        headerName: "DESCRIPTION", 
        field: "description", 
        filter: "agTextColumnFilter",
        width: 150,
        cellStyle: { color: theme.theme.textPrimary },
        valueFormatter: (params: any) => params.value || "N/A"
      },
    ];
    
    return cols;
  };

  // Column definitions for "My Satellites" tab (editable, with delete actions)
  const myColumnDefs: ColDef<DisplaySatellite>[] = [
    ...getBaseColumnDefs().map(col => ({ 
      ...col, 
      editable: col.field !== "source" && col.field !== "type",
      cellEditor: col.field === "status" ? "agSelectCellEditor" : 
                  col.field === "orbitType" ? "agSelectCellEditor" :
                  col.field === "category" ? "agSelectCellEditor" : undefined,
      cellEditorParams: col.field === "status" ? {values: ["Active", "Inactive", "Decayed", "Unknown"]} :
                        col.field === "orbitType" ? {values: ["LEO", "MEO", "GEO", "HEO", "Unknown"]} :
                        col.field === "category" ? {values: ["Space Station", "Navigation", "Communication", "Weather", "Earth Observation", "CubeSat", "Commercial", "Scientific", "Military", "Unknown"]} : undefined
    })),
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

  // Column definitions for "Discover More" tab (read-only, with add actions)
  const discoverColumnDefs: ColDef<DisplaySatellite>[] = [
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
      className="sats-page"
      style={{
        // Minimal CSS Custom Properties
        '--theme-primary': theme.theme.primary,
        '--theme-primary-rgb': theme.theme.primaryRGB,
      } as React.CSSProperties}
    >
      {/* Header Section */}
      <Box className="sats-header">
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, marginBottom: 1 }}>
          <SatelliteAltIcon sx={{ color: 'var(--theme-primary)', fontSize: '2rem' }} />
          <Typography variant="h5" className="sats-title">
            SPACE VEHICLES
          </Typography>
        </Box>
        <Typography variant="subtitle2" className="sats-subtitle">
          Orbital Asset Management System
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
        </Box>

        {/* Enhanced Stats */}
        <Box className="sats-stats">
          <StatItem count={stats.api} label="API SATS" filterKey="api" tooltip="Satellites from your MongoDB API" />
          <StatItem count={stats.celestrak} label="CELESTRAK" filterKey="celestrak" tooltip="Satellites from CelesTrak database" />
          <StatItem count={stats.starlink} label="STARLINK" filterKey="starlink" tooltip="SpaceX Starlink constellation" />
          <StatItem count={stats.communication} label="COMM" filterKey="communication" tooltip="Communication satellites" />
          <StatItem count={stats.navigation} label="NAV" filterKey="navigation" tooltip="Navigation satellites (GPS, Galileo, etc.)" />
          <StatItem count={stats.earthObservation} label="EO" filterKey="earthObservation" tooltip="Earth Observation satellites" />
          <StatItem count={stats.leo} label="LEO" filterKey="leo" tooltip="Low Earth Orbit satellites" />
          <StatItem count={stats.geo} label="GEO" filterKey="geo" tooltip="Geostationary orbit satellites" />
          <StatItem count={stats.active} label="ACTIVE" filterKey="active" tooltip="Active satellites" />
          <StatItem count={stats.total} label="TOTAL" tooltip="Total number of satellites" />
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

      {/* Tabs and Grid Section */}
      <Box className="sats-grid-container">
        
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
              label={`My Satellites (${mySatellites.length})`} 
            />
            <Tab 
              icon={<ExploreIcon />} 
              iconPosition="start"
              label={`Discover More (${discoverableSatellites.length})`} 
            />
          </Tabs>
        </Box>

        {/* Grid Content */}
        {(activeTab === 0 ? mySatellites : discoverableSatellites).length === 0 ? (
          <Box sx={{ padding: 4, textAlign: 'center', color: '#888' }}>
            <Typography variant="h6">
              {activeTab === 0 
                ? (status === "loading" ? "Loading my satellites..." : "No managed satellites found") 
                : "Loading discoverable satellites..."
              }
            </Typography>
            <Typography variant="body2" sx={{ mt: 1 }}>
              {activeTab === 0 
                ? `MongoDB Count: ${mongoSatellites.length}` 
                : `CelesTrak Available: ${celestrakSatellites.length}`
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
              <div className="sats-grid-loading-overlay">
                <div className="sats-grid-loading-spinner" />
                <div className="sats-grid-loading-text">
                  Loading Satellites...
                </div>
              </div>
            )}
            <AgGridReact
              ref={activeTab === 0 ? myGridRef : discoverGridRef}
              rowData={activeTab === 0 ? filteredMySatellites : filteredDiscoverableSatellites}
              columnDefs={activeTab === 0 ? myColumnDefs : discoverColumnDefs}
              defaultColDef={{
                sortable: true,
                filter: true,
                resizable: true,
                editable: false,
                minWidth: 80,
                suppressSizeToFit: false, // Allow column resizing
              }}
              animateRows={true}
              rowSelection="single"
              enableCellTextSelection={true}
              suppressRowDeselection={true}
              rowHeight={40}
              headerHeight={45}
              onGridReady={(params) => {
                // Don't auto-size columns to fit - let them use their defined widths
                // This ensures all columns are visible via horizontal scrolling
              }}
              onCellValueChanged={(event: CellValueChangedEvent) => {
                // Handle cell edits for managed satellites only (My Satellites tab)
                if (activeTab === 0 && event.data.source === "api") {
                  console.log("Cell value changed:", event.data);
                  // Here you could implement PUT API call to update the satellite
                }
              }}
              onFirstDataRendered={() => {
                // Don't auto-fit columns - use their defined widths to show all columns
              }}
              pagination={true}
              paginationPageSize={50}
              suppressMenuHide={true}
              enableRangeSelection={true}
              suppressCellFocus={false}
              getRowId={(params) => params.data.id}
              loading={loading || status === "loading"}
              domLayout="normal"
              suppressRowVirtualisation={false}
              rowBuffer={10}
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

            <FormControl fullWidth className="matrix-select">
              <InputLabel>Category</InputLabel>
              <Select
                value={newSatellite.category || "Unknown"}
                onChange={(e) => setNewSatellite({...newSatellite, category: e.target.value as any})}
                label="Category"
              >
                <MenuItem value="Space Station">Space Station</MenuItem>
                <MenuItem value="Navigation">Navigation</MenuItem>
                <MenuItem value="Communication">Communication</MenuItem>
                <MenuItem value="Weather">Weather</MenuItem>
                <MenuItem value="Earth Observation">Earth Observation</MenuItem>
                <MenuItem value="CubeSat">CubeSat</MenuItem>
                <MenuItem value="Commercial">Commercial</MenuItem>
                <MenuItem value="Scientific">Scientific</MenuItem>
                <MenuItem value="Military">Military</MenuItem>
                <MenuItem value="Unknown">Unknown</MenuItem>
              </Select>
            </FormControl>

            <TextField
              label="Constellation (Optional)"
              value={newSatellite.constellation || ""}
              onChange={(e) => setNewSatellite({...newSatellite, constellation: e.target.value || undefined})}
              fullWidth
              className="matrix-input"
              placeholder="e.g., Starlink, OneWeb, GPS..."
            />

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
          
          <TextField
            label="Description"
            value={newSatellite.description || ""}
            onChange={(e) => setNewSatellite({...newSatellite, description: e.target.value})}
            fullWidth
            multiline
            rows={3}
            className="matrix-input"
            sx={{ mt: 2 }}
            placeholder="Optional description or notes about this satellite..."
          />
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