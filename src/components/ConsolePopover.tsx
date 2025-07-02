import React, { useState } from "react";
import { IconButton } from "@mui/material";
import CodeIcon from "@mui/icons-material/Code";
import DockableComponent from "./DockableComponent";
import SatelliteStatusTable from "./SatelliteStatusTable";
import { useSelector } from "react-redux";
import { RootState } from "../store";

interface ConsolePopoverProps {
  debugInfo: any;
  nextContactWindow: any;
}

const ConsolePopover: React.FC<ConsolePopoverProps> = ({
  debugInfo,
  nextContactWindow,
}) => {
  const [openPopover, setOpenPopover] = useState<boolean>(false);
  const selectedSatId = useSelector((state: RootState) => state.mongo.selectedSatId); // Retrieve selected satellite ID
  const selectedGroundStationId = useSelector(
    (state: RootState) => state.mongo.selectedGroundStationId
  );

  return (
    <div
      style={{ position: "relative" }}
      onMouseEnter={() => setOpenPopover(true)}
      onMouseLeave={() => setOpenPopover(false)}
    >
      {/* Console Button */}
      <IconButton
        style={{
          color: selectedSatId || selectedGroundStationId ? "#00ff00" : "#555555",
          transition: "color 0.2s ease-in-out",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.color = "#00ff00")}
        onMouseLeave={(e) =>
          (e.currentTarget.style.color =
            selectedSatId || selectedGroundStationId ? "#00ff00" : "#555555")
        }
      >
        <CodeIcon />
      </IconButton>

      {/* Console Popover */}
      {openPopover && (
        <DockableComponent
          popoverStyle={{
            position: "absolute",
            backgroundColor: "rgba(13, 13, 13, 0.9)",
            border: "1px solid #00ff00",
            color: "#00ff00",
            fontFamily: "Courier New, Courier, monospace",
            borderRadius: "4px",
            padding: "8px",
            width: "350px",
            zIndex: 1001,
          }}
          content={
            <SatelliteStatusTable
              debugInfo={debugInfo}
              nextContactWindow={nextContactWindow}
            />
          }
        />
      )}
    </div>
  );
};

export default ConsolePopover;