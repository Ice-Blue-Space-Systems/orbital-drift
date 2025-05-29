import React, { useState } from "react";
import { Viewer, Entity, Clock } from "resium";
import {
  Cartesian3,
  Color,
  CallbackProperty,
  Cartesian2,
} from "cesium";
import { JSX } from "react/jsx-runtime";
import TleEntities from "./TleEntities";
import GroundTrackEntities from "./GroundTrackEntities";
import SettingsIcon from "@mui/icons-material/Settings"; // Import an icon for the toggle button
import IconButton from "@mui/material/IconButton";

interface CesiumViewerProps {
  viewerRef: React.RefObject<any>;
  visibilityConeEntities: JSX.Element[];
  satPositionProperty: any;
  satellites: any[];
  selectedSatId: string;
  groundStationPos: Cartesian3 | null;
  nextAosLosLabel: string;
  showLineOfSight: boolean;
  lineOfSightPositions: Cartesian3[];
  showTle: boolean;
  showHistory: boolean;
  tleHistory: any[];
  tleFuture: any[];
  showGroundTrack: boolean;
  groundTrackHistory: any[];
  groundTrackFuture: any[];
}

const CesiumViewer: React.FC<CesiumViewerProps> = ({
  viewerRef,
  visibilityConeEntities,
  satPositionProperty,
  satellites,
  selectedSatId,
  groundStationPos,
  nextAosLosLabel,
  showLineOfSight,
  lineOfSightPositions,
  showTle,
  showHistory,
  tleHistory,
  tleFuture,
  showGroundTrack,
  groundTrackHistory,
  groundTrackFuture,
}) => {
  const [showCesiumOptions, setShowCesiumOptions] = useState(false);

  return (
    <div style={{ position: "relative", height: "100%" }}>
      {/* Cesium Viewer */}
      <Viewer
        ref={viewerRef}
        style={{ position: "absolute", inset: 0 }}
        homeButton={showCesiumOptions}
        sceneModePicker={showCesiumOptions}
        baseLayerPicker={showCesiumOptions}
        navigationHelpButton={showCesiumOptions}
        geocoder={showCesiumOptions}
        timeline={showCesiumOptions}
        animation={showCesiumOptions}
        fullscreenButton={showCesiumOptions}
      >
        {visibilityConeEntities}
        <Clock shouldAnimate={true} />

        {/* Satellite with name label */}
        {satPositionProperty && (
          <Entity
            name="Satellite"
            position={satPositionProperty}
            point={{ pixelSize: 12, color: Color.YELLOW }}
            label={{
              text:
                satellites.find((sat) => sat._id === selectedSatId)?.name ||
                "Satellite",
              font: "14px sans-serif",
              fillColor: Color.WHITE,
              style: 2, // LabelStyle.OUTLINE
              outlineWidth: 2,
              pixelOffset: new Cartesian2(0, -20),
              showBackground: true,
            }}
          />
        )}

        {/* Ground Station with AOS/LOS label */}
        {groundStationPos && (
          <Entity
            name="Ground Station"
            position={groundStationPos}
            point={{ pixelSize: 8, color: Color.RED }}
            label={{
              text: nextAosLosLabel,
              font: "14px sans-serif",
              fillColor: Color.WHITE,
              style: 2,
              outlineWidth: 2,
              pixelOffset: new Cartesian2(0, -40),
              showBackground: true,
            }}
          />
        )}

        {/* TLE Paths */}
        <TleEntities
          showTle={showTle}
          showHistory={showHistory}
          tleHistory={new CallbackProperty(() => tleHistory, false)}
          tleFuture={new CallbackProperty(() => tleFuture, false)}
          satPositionProperty={satPositionProperty}
        />

        {/* Line of Sight */}
        {showLineOfSight && lineOfSightPositions.length === 2 && (
          <Entity
            name="Line of Sight"
            polyline={{
              positions: new CallbackProperty(() => lineOfSightPositions, false),
              material: Color.BLUE,
              width: 5,
            }}
          />
        )}

        {/* Ground Track */}
        <GroundTrackEntities
          showGroundTrack={showGroundTrack}
          showHistory={showHistory}
          groundTrackHistory={
            new CallbackProperty(() => groundTrackHistory, false)
          }
          groundTrackFuture={
            new CallbackProperty(() => groundTrackFuture, false)
          }
          satPositionProperty={satPositionProperty}
        />
      </Viewer>

      {/* Toggle Icon Button for Cesium Options */}
      <div
        style={{
          position: "absolute",
          top: "16px",
          right: "16px", // Move to the right
          zIndex: 1001,
        }}
      >
        <IconButton
          onClick={() => setShowCesiumOptions(!showCesiumOptions)}
          title="Toggle Cesium Options"
          style={{
            color: showCesiumOptions ? "#00ff00" : "#555555", // Bright green when active, grey when inactive
            backgroundColor: "rgba(13, 13, 13, 0.9)", // Console-style dark background
          }}
        >
          <SettingsIcon />
        </IconButton>
      </div>
    </div>
  );
};

export default CesiumViewer;