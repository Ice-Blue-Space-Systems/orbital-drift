import React, { useState, useRef } from "react";
import { IconButton, Tooltip } from "@mui/material";
import SettingsIcon from "@mui/icons-material/Settings";
import { useDispatch, useSelector } from "react-redux";
import { setShowCesiumOptions } from "../store/mongoSlice";
import { RootState } from "../store";

const CesiumOptionsPopover: React.FC = () => {
  const [openPopover, setOpenPopover] = useState<boolean>(false);
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const dispatch = useDispatch();
  const showCesiumOptions = useSelector(
    (state: RootState) => state.mongo.showCesiumOptions
  );

  const handleMouseEnter = () => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    setOpenPopover(true);
  };

  const handleMouseLeave = () => {
    closeTimeoutRef.current = setTimeout(() => {
      setOpenPopover(false);
    }, 200); // 200ms delay before closing
  };

  return (
    <div
      style={{ position: "relative" }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Cesium Options Button */}
      <IconButton
        className="icon-button"
      >
        <SettingsIcon />
      </IconButton>

      {/* Cesium Options Popover */}
      {openPopover && (
        <div
          style={{
            position: "absolute",
            top: "46px", // Slightly reduced gap
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
                onClick={() => dispatch(setShowCesiumOptions(!showCesiumOptions))}
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
