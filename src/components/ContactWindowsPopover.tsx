import React, { useState } from "react";
import { IconButton } from "@mui/material";
import EventIcon from "@mui/icons-material/Event";
import ContactWindows from "./ContactWindows";

interface ContactWindowsPopoverProps {
  satelliteId: string;
  groundStationId: string;
}

const ContactWindowsPopover: React.FC<ContactWindowsPopoverProps> = ({
  satelliteId,
  groundStationId,
}) => {
  const [openPopover, setOpenPopover] = useState<boolean>(false);

  return (
    <div
      style={{ position: "relative" }}
      onMouseEnter={() => setOpenPopover(true)}
      onMouseLeave={() => setOpenPopover(false)}
    >
      {/* Contact Windows Button */}
      <IconButton
        className="icon-button active"
      >
        <EventIcon />
      </IconButton>

      {/* Contact Windows Popover */}
      {openPopover && (
        <div
          style={{
            position: "absolute",
            top: "48px",
            left: "0",
            backgroundColor: "rgba(13, 13, 13, 0.9)", // Match console-style dark transparent background
            border: "1px solid #00ff00", // Green border
            color: "#00ff00", // Green text
            fontFamily: "Courier New, Courier, monospace", // Console-style font
            borderRadius: "4px",
            padding: "16px",
            width: "400px",
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
          <ContactWindows satelliteId={satelliteId} groundStationId={groundStationId} />
        </div>
      )}
    </div>
  );
};

export default ContactWindowsPopover;