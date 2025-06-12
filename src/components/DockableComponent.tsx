import React, { useState } from 'react';
import { IconButton, Tooltip } from '@mui/material';
import OpenInNewIcon from '@mui/icons-material/OpenInNew'; // Main button icon
import BorderRightIcon from '@mui/icons-material/BorderRight'; // Dock Right icon
import BorderLeftIcon from '@mui/icons-material/BorderLeft'; // Dock Left icon
import BorderBottomIcon from '@mui/icons-material/BorderBottom'; // Dock Bottom icon
import CloseIcon from '@mui/icons-material/Close'; // Close button icon

interface DockableComponentProps {
  content: React.ReactNode; // Content to display in the popover or docked panel
  popoverStyle?: React.CSSProperties; // Optional custom styles for the popover
  buttonRef?: React.RefObject<HTMLDivElement>; // Reference to the button for positioning
}

const DockableComponent: React.FC<DockableComponentProps> = ({
  content,
  popoverStyle,
  buttonRef,
}) => {
  const [dockPosition, setDockPosition] = useState<'left' | 'right' | 'bottom' | null>(null); // Docking state
  const [hoveringDockButton, setHoveringDockButton] = useState(false); // State to track hover over the main button

  return (
    <div style={{ position: 'relative' }}>
      {/* Popover Content */}
      {!dockPosition && (
        <div
          style={{
            ...popoverStyle,
            position: 'absolute',
            top: '6px', // Position below the button
            left: '0', // Align with the button
          }}
        >
          {/* Popover Arrow */}
          <div
            style={{
              position: 'absolute',
              top: '-8px', // Position the arrow above the popover
              left: '16px', // Align the arrow with the button
              width: '0',
              height: '0',
              borderLeft: '8px solid transparent',
              borderRight: '8px solid transparent',
              borderBottom: '8px solid #00ff00', // Green arrow
            }}
          ></div>

          {/* Docking Button */}
          <div
            style={{
              position: 'absolute',
              top: '8px',
              right: '8px',
            }}
            onMouseEnter={() => setHoveringDockButton(true)} // Show docking options on hover
            onMouseLeave={() => setHoveringDockButton(false)} // Hide docking options when not hovering
          >
            <Tooltip title="Dock Options" arrow>
              <IconButton
                style={{
                  color: '#00ff00', // Bright green for visibility
                  transition: 'color 0.2s ease-in-out',
                }}
              >
                <OpenInNewIcon />
              </IconButton>
            </Tooltip>

            {/* Docking Options (Visible on Hover) */}
            {hoveringDockButton && (
              <div
                style={{
                  position: 'absolute',
                  top: '48px', // Position below the main button
                  left: '50%',
                  transform: 'translateX(-50%)', // Center the options horizontally
                  display: 'flex',
                  gap: '8px', // Space between icons
                  backgroundColor: 'rgba(13, 13, 13, 0.9)', // Console-style dark background
                  border: '1px solid #00ff00', // Green border
                  borderRadius: '4px', // Rounded corners
                  padding: '8px', // Padding around the icons
                  zIndex: 1001, // Ensure it appears above other elements
                }}
              >
                {/* Dock Left */}
                <Tooltip title="Dock Left" arrow>
                  <IconButton
                    onClick={() => setDockPosition('left')}
                    style={{
                      color: '#00ff00',
                      transition: 'color 0.2s ease-in-out',
                    }}
                  >
                    <BorderLeftIcon />
                  </IconButton>
                </Tooltip>

                {/* Dock Bottom */}
                <Tooltip title="Dock Bottom" arrow>
                  <IconButton
                    onClick={() => setDockPosition('bottom')}
                    style={{
                      color: '#00ff00',
                      transition: 'color 0.2s ease-in-out',
                    }}
                  >
                    <BorderBottomIcon />
                  </IconButton>
                </Tooltip>

                {/* Dock Right */}
                <Tooltip title="Dock Right" arrow>
                  <IconButton
                    onClick={() => setDockPosition('right')}
                    style={{
                      color: '#00ff00',
                      transition: 'color 0.2s ease-in-out',
                    }}
                  >
                    <BorderRightIcon />
                  </IconButton>
                </Tooltip>
              </div>
            )}
          </div>

          {/* Popover Content */}
          {content}
        </div>
      )}

      {/* Docked Panels */}
      {dockPosition && (
        <div
          style={{
            position: 'fixed',
            [dockPosition]: '0', // Dynamically set the docking position
            ...(dockPosition === 'bottom'
              ? { height: '300px', width: '100%' } // Full width for bottom dock
              : { width: '400px', height: 'calc(100vh - 64px)' }), // Full height for left/right dock
            backgroundColor: 'rgba(13, 13, 13, 0.9)', // Console-style dark background
            color: '#00ff00', // Green text
            fontFamily: 'Courier New, Courier, monospace', // Console-style font
            borderTop: dockPosition === 'bottom' ? '1px solid #00ff00' : 'none', // Border for bottom dock
            borderLeft: dockPosition === 'right' ? '1px solid #00ff00' : 'none', // Border for right dock
            borderRight: dockPosition === 'left' ? '1px solid #00ff00' : 'none', // Border for left dock
            zIndex: 1001, // Ensure it appears above other elements
            overflowY: 'auto', // Enable scrolling for long content
            padding: '16px', // Add padding inside the panel
          }}
        >
          {/* Close Button */}
          <div style={{ textAlign: 'right' }}>
            <IconButton
              onClick={() => setDockPosition(null)} // Close the panel
              style={{ color: '#00ff00' }}
            >
              <CloseIcon />
            </IconButton>
          </div>

          {/* Docked Content */}
          <div>{content}</div>
        </div>
      )}
    </div>
  );
};

export default DockableComponent;