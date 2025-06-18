import React, { useState } from "react";
import { IconButton, Tooltip } from "@mui/material";
import SettingsIcon from "@mui/icons-material/Settings";

interface CesiumOptionsPopoverProps {
  showCesiumOptions: boolean;
  setShowCesiumOptions: (value: boolean) => void;
}

const CesiumOptionsPopover: React.FC<CesiumOptionsPopoverProps> = ({
  showCesiumOptions,
  setShowCesiumOptions,
}) => {
  const [openPopover, setOpenPopover] = useState<boolean>(false);

  return (
    <div
      style={{ position: "relative" }}
      onMouseEnter={() => setOpenPopover(true)}
      onMouseLeave={() => setOpenPopover(false)}
    >
      {/* Cesium Options Button */}
      <IconButton
        style={{
          color: "#888888",
          transition: "color 0.2s ease-in-out",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.color = "#00ff00")}
        onMouseLeave={(e) => (e.currentTarget.style.color = "#888888")}
      >
        <SettingsIcon />
      </IconButton>

      {/* Cesium Options Popover */}
      {openPopover && (
        <div
          style={{
            position: "absolute",
            top: "48px",
            left: "0",
            backgroundColor: "rgba(13, 13, 13, 0.9)", // Console-style dark background
            border: "1px solid #00ff00", // Green border
            color: "#00ff00", // Green text
            fontFamily: "Courier New, Courier, monospace", // Console-style font
            borderRadius: "4px",
            padding: "8px",
            width: "200px",
            zIndex: 1001,
          }}
        >
          {/* Arrow */}
          <div
            style={{
              position: "absolute",
              top: "-8px",
              left: "16px",
              width: "0",
              height: "0",
              borderLeft: "8px solid transparent",
              borderRight: "8px solid transparent",
              borderBottom: "8px solid #00ff00", // Green arrow
            }}
          ></div>

          {/* Toggle Cesium Options */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              marginTop: "40px",
            }}
          >
            <Tooltip title="Toggle Cesium Options" arrow>
              <IconButton
                onClick={() => setShowCesiumOptions(!showCesiumOptions)}
                style={{
                  color: showCesiumOptions ? "#00ff00" : "#888888",
                  transition: "color 0.2s ease-in-out",
                }}
              >
                <SettingsIcon />
              </IconButton>
            </Tooltip>
            <span style={{ fontSize: "14px" }}>
              {showCesiumOptions ? "Disable Options" : "Enable Options"}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default CesiumOptionsPopover;