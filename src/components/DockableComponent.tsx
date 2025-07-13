import React, { useState } from 'react';
import { IconButton, Tooltip } from '@mui/material';
import OpenInNewIcon from '@mui/icons-material/OpenInNew'; // Main button icon
import BorderRightIcon from '@mui/icons-material/BorderRight'; // Dock Right icon
import BorderLeftIcon from '@mui/icons-material/BorderLeft'; // Dock Left icon
import BorderBottomIcon from '@mui/icons-material/BorderBottom'; // Dock Bottom icon
import CloseIcon from '@mui/icons-material/Close'; // Close button icon
import './DockableComponent.css';

interface DockableComponentProps {
  content: React.ReactNode; // Content to display in the popover or docked panel
  popoverStyle?: React.CSSProperties; // Optional custom styles for the popover
  buttonRef?: React.RefObject<HTMLDivElement>; // Reference to the button for positioning
  onDockChange?: (dockPosition: 'left' | 'right' | 'bottom' | null) => void; // Callback for dock state changes
}

const DockableComponent: React.FC<DockableComponentProps> = ({
  content,
  popoverStyle,
  buttonRef,
  onDockChange,
}) => {
  const [dockPosition, setDockPosition] = useState<'left' | 'right' | 'bottom' | null>(null); // Docking state
  const [hoveringDockButton, setHoveringDockButton] = useState(false); // State to track hover over the main button

  const handleDockChange = (newPosition: 'left' | 'right' | 'bottom' | null) => {
    setDockPosition(newPosition);
    onDockChange?.(newPosition);
  };

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
            <Tooltip title="Dock Options" arrow placement="top-end">
              <IconButton
                style={{
                  color: '#00ff41', // Bright green for visibility
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
                  top: '50%', // Vertically center with the main button
                  left: '48px', // Position to the right of the main button
                  transform: 'translateY(-50%)', // Center vertically
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
                    onClick={() => handleDockChange('left')}
                    style={{
                      color: '#00ff41',
                      transition: 'all 0.2s ease-in-out',
                      padding: '6px',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = '#66ff66';
                      e.currentTarget.style.transform = 'scale(1.1)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = '#00ff41';
                      e.currentTarget.style.transform = 'scale(1)';
                    }}
                  >
                    <BorderLeftIcon />
                  </IconButton>
                </Tooltip>

                {/* Dock Bottom */}
                <Tooltip title="Dock Bottom" arrow>
                  <IconButton
                    onClick={() => handleDockChange('bottom')}
                    style={{
                      color: '#00ff41',
                      transition: 'all 0.2s ease-in-out',
                      padding: '6px',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = '#66ff66';
                      e.currentTarget.style.transform = 'scale(1.1)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = '#00ff41';
                      e.currentTarget.style.transform = 'scale(1)';
                    }}
                  >
                    <BorderBottomIcon />
                  </IconButton>
                </Tooltip>

                {/* Dock Right */}
                <Tooltip title="Dock Right" arrow>
                  <IconButton
                    onClick={() => handleDockChange('right')}
                    style={{
                      color: '#00ff41',
                      transition: 'all 0.2s ease-in-out',
                      padding: '6px',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = '#66ff66';
                      e.currentTarget.style.transform = 'scale(1.1)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = '#00ff41';
                      e.currentTarget.style.transform = 'scale(1)';
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
            top: dockPosition === 'bottom' ? 'auto' : '64px', // Account for header height, no gap
            bottom: dockPosition === 'bottom' ? '0' : 'auto',
            left: dockPosition === 'left' ? '0' : dockPosition === 'right' ? 'auto' : '0',
            right: dockPosition === 'right' ? '0' : dockPosition === 'left' ? 'auto' : '0',
            width: dockPosition === 'bottom' ? '100%' : '450px', // Wider panels for better readability
            height: dockPosition === 'bottom' ? '350px' : 'calc(100vh - 64px)', // Taller bottom panel
            backgroundColor: 'rgba(8, 20, 8, 0.95)', // Darker green-tinted background
            backdropFilter: 'blur(8px)', // Add glassmorphism effect
            color: '#00ff41', // Brighter matrix green
            fontFamily: 'Courier New, Courier, monospace',
            // Professional thick borders with glow effect
            borderLeft: dockPosition === 'right' ? '4px solid #00ff41' : 'none',
            borderRight: dockPosition === 'left' ? '4px solid #00ff41' : 'none', 
            borderTop: dockPosition === 'bottom' ? '4px solid #00ff41' : 'none',
            borderBottom: 'none',
            // Add subtle glow effect
            boxShadow: dockPosition === 'left' ? '4px 0 15px rgba(0, 255, 65, 0.3)' :
                      dockPosition === 'right' ? '-4px 0 15px rgba(0, 255, 65, 0.3)' :
                      '0 -4px 15px rgba(0, 255, 65, 0.3)',
            zIndex: 1001,
            overflowY: 'auto',
            // Add custom scrollbar styling
            scrollbarWidth: 'thin',
            scrollbarColor: '#00ff41 rgba(0, 255, 65, 0.1)',
          }}
          // Add custom scrollbar for webkit browsers
          className="docked-panel"
        >
          {/* Header bar with close button and title */}
          <div 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              marginBottom: '16px',
              padding: '8px 0',
              borderBottom: '1px solid rgba(0, 255, 65, 0.3)',
              position: 'sticky',
              top: '0',
              backgroundColor: 'rgba(8, 20, 8, 0.98)',
              backdropFilter: 'blur(10px)',
              zIndex: 10,
            }}
          >
            <div style={{ 
              fontSize: '14px', 
              fontWeight: 'bold',
              textTransform: 'uppercase',
              letterSpacing: '1px',
              color: '#00ff41',
              textShadow: '0 0 10px rgba(0, 255, 65, 0.5)',
            }}>
              SATELLITE STATUS CONSOLE
            </div>
            <IconButton
              onClick={() => handleDockChange(null)}
              style={{ 
                color: '#00ff41',
                padding: '4px',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = '#ff0040';
                e.currentTarget.style.transform = 'scale(1.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = '#00ff41';
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              <CloseIcon />
            </IconButton>
          </div>

          {/* Content area with improved styling */}
          <div style={{ 
            padding: '0 16px 16px 16px',
            lineHeight: '1.4',
          }}>
            {content}
          </div>
        </div>
      )}
    </div>
  );
};

export default DockableComponent;