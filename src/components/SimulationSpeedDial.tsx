import React, { useState, useRef, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setCesiumClockMultiplier } from "../store/cesiumClockSlice";
import { RootState } from "../store";

interface SimulationSpeedDialProps {
  size?: number;
  minSpeed?: number;
  maxSpeed?: number;
  position?: "top-left" | "top-right" | "bottom-left" | "bottom-right";
}

const SimulationSpeedDial: React.FC<SimulationSpeedDialProps> = ({
  size = 120,
  minSpeed = 0.1,
  maxSpeed = 1000,
  position = "top-right"
}) => {
  const dispatch = useDispatch();
  const currentMultiplier = useSelector((state: RootState) => state.cesiumClock.multiplier);
  
  const [isDragging, setIsDragging] = useState(false);
  const [rotation, setRotation] = useState(0);
  const dialRef = useRef<HTMLDivElement>(null);
  const centerRef = useRef({ x: 0, y: 0 });

  // Convert multiplier to rotation angle (logarithmic scale)
  const multiplierToAngle = (multiplier: number): number => {
    const logMin = Math.log10(minSpeed);
    const logMax = Math.log10(maxSpeed);
    const logCurrent = Math.log10(Math.max(minSpeed, Math.min(maxSpeed, multiplier)));
    const progress = (logCurrent - logMin) / (logMax - logMin);
    return progress * 360; // Full circle
  };

  // Convert rotation angle to multiplier (logarithmic scale)
  const angleToMultiplier = (angle: number): number => {
    const normalizedAngle = ((angle % 360) + 360) % 360; // Normalize to 0-360
    const progress = normalizedAngle / 360;
    const logMin = Math.log10(minSpeed);
    const logMax = Math.log10(maxSpeed);
    const logValue = logMin + progress * (logMax - logMin);
    return Math.pow(10, logValue);
  };

  // Update rotation when multiplier changes externally
  useEffect(() => {
    if (!isDragging) {
      setRotation(multiplierToAngle(currentMultiplier));
    }
  }, [currentMultiplier, multiplierToAngle, isDragging, minSpeed, maxSpeed]);

  const updateCenter = () => {
    if (dialRef.current) {
      const rect = dialRef.current.getBoundingClientRect();
      centerRef.current = {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2
      };
    }
  };

  const getAngleFromMouse = (clientX: number, clientY: number): number => {
    const dx = clientX - centerRef.current.x;
    const dy = clientY - centerRef.current.y;
    let angle = Math.atan2(dy, dx) * (180 / Math.PI);
    angle = (angle + 90 + 360) % 360; // Adjust so 0° is at top
    return angle;
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    updateCenter();
    
    const handleMouseMove = (e: MouseEvent) => {
      const angle = getAngleFromMouse(e.clientX, e.clientY);
      setRotation(angle);
      
      const newMultiplier = angleToMultiplier(angle);
      dispatch(setCesiumClockMultiplier(newMultiplier));
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  const getPositionStyles = () => {
    const baseStyles = {
      position: "absolute" as const,
      zIndex: 1000,
    };

    switch (position) {
      case "top-left":
        return { ...baseStyles, top: "80px", left: "20px" }; // 80px to clear app bar
      case "top-right":
        return { ...baseStyles, top: "80px", right: "20px" }; // 80px to clear app bar
      case "bottom-left":
        return { ...baseStyles, bottom: "20px", left: "20px" };
      case "bottom-right":
        return { ...baseStyles, bottom: "20px", right: "20px" };
      default:
        return { ...baseStyles, top: "80px", right: "20px" }; // 80px to clear app bar
    }
  };

  const formatSpeed = (multiplier: number): string => {
    if (multiplier < 1) {
      return `${multiplier.toFixed(1)}x`;
    } else if (multiplier < 10) {
      return `${multiplier.toFixed(1)}x`;
    } else if (multiplier < 100) {
      return `${Math.round(multiplier)}x`;
    } else {
      return `${Math.round(multiplier)}x`;
    }
  };

  return (
    <div style={getPositionStyles()}>
      <div
        ref={dialRef}
        onMouseDown={handleMouseDown}
        style={{
          width: size,
          height: size,
          borderRadius: "50%",
          background: `conic-gradient(from 0deg, 
            #00ff00 0deg, 
            #ffff00 120deg, 
            #ff8800 240deg, 
            #ff0000 360deg)`,
          border: "3px solid #00ff00",
          position: "relative",
          cursor: isDragging ? "grabbing" : "grab",
          boxShadow: isDragging 
            ? "0 0 20px #00ff00" 
            : "0 0 10px rgba(0, 255, 0, 0.5)",
          transition: isDragging ? "none" : "box-shadow 0.2s ease",
          userSelect: "none",
        }}
      >
        {/* Dial indicator */}
        <div
          style={{
            position: "absolute",
            top: "10px",
            left: "50%",
            width: "4px",
            height: "20px",
            backgroundColor: "#ffffff",
            borderRadius: "2px",
            transformOrigin: `2px ${size / 2 - 10}px`,
            transform: `translateX(-50%) rotate(${rotation}deg)`,
            boxShadow: "0 0 5px rgba(255, 255, 255, 0.8)",
            transition: isDragging ? "none" : "transform 0.1s ease",
          }}
        />

        {/* Center circle */}
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            width: "30px",
            height: "30px",
            backgroundColor: "#000000",
            border: "2px solid #00ff00",
            borderRadius: "50%",
            transform: "translate(-50%, -50%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "8px",
            color: "#00ff00",
            fontFamily: "Courier New, Courier, monospace",
            fontWeight: "bold",
          }}
        >
          SIM
        </div>

        {/* Speed markings */}
        {[1, 10, 50, 100, 600].map((speed) => {
          const angle = multiplierToAngle(speed);
          const radians = (angle - 90) * (Math.PI / 180);
          const markX = Math.cos(radians) * (size / 2 - 15) + size / 2;
          const markY = Math.sin(radians) * (size / 2 - 15) + size / 2;
          
          return (
            <div
              key={speed}
              style={{
                position: "absolute",
                left: markX - 8,
                top: markY - 6,
                fontSize: "8px",
                color: "#ffffff",
                fontFamily: "Courier New, Courier, monospace",
                fontWeight: "bold",
                textShadow: "0 0 3px #000000",
                pointerEvents: "none",
                width: "16px",
                textAlign: "center",
              }}
            >
              {speed}x
            </div>
          );
        })}
      </div>

      {/* Speed display */}
      <div
        style={{
          marginTop: "10px",
          textAlign: "center",
          color: "#00ff00",
          fontFamily: "Courier New, Courier, monospace",
          fontSize: "14px",
          fontWeight: "bold",
          textShadow: "0 0 5px #00ff00",
          backgroundColor: "rgba(0, 0, 0, 0.8)",
          padding: "4px 8px",
          borderRadius: "4px",
          border: "1px solid #00ff00",
        }}
      >
        {formatSpeed(currentMultiplier)}
      </div>
    </div>
  );
};

export default SimulationSpeedDial;
