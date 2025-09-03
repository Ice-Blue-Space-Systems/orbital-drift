import React, { useMemo, useRef, useEffect } from "react";
import { Viewer, Entity, Clock } from "resium";
import {
  Cartesian3,
  Color,
  CallbackProperty,
  Cartesian2,
} from "cesium";
import { useSelector } from "react-redux";
import { RootState } from "../store";
import TleEntities from "./TleEntities";
import GroundTrackEntities from "./GroundTrackEntities";
import NadirLines from "./NadirLines";
import { useCesiumClock } from "../hooks/useCesiumClock";
import { getRenderingSettings } from "../utils/renderingUtils";

interface CesiumViewerProps {
  viewerRef: React.RefObject<any>;
  satPositionProperty: any;
  groundStationPos: Cartesian3 | null;
  nextAosLosLabel: string;
  lineOfSightPositions: Cartesian3[];
  tleHistory: CallbackProperty | null;
  tleFuture: CallbackProperty | null;
  groundTrackHistory: any[];
  groundTrackFuture: any[];
}

const CesiumViewer: React.FC<CesiumViewerProps> = ({
  viewerRef,
  satPositionProperty,
  groundStationPos,
  nextAosLosLabel,
  lineOfSightPositions,
  tleHistory,
  tleFuture,
  groundTrackHistory,
  groundTrackFuture
}) => {
  const selectedSatelliteId = useSelector(
    (state: RootState) => state.mongo.selectedSatId
  );
  const { satellites } = useSelector((state: RootState) => state.mongo);
  const showLineOfSight = useSelector(
    (state: RootState) => state.mongo.showLineOfSight
  );
  const showCesiumOptions = useSelector(
    (state: RootState) => state.mongo.showCesiumOptions
  );
  const renderingQuality = useSelector(
    (state: RootState) => state.mongo.renderingQuality
  );
  const mouseThrottle = useSelector(
    (state: RootState) => state.mongo.mouseThrottle
  );

  // Memoize satellite name to prevent unnecessary renders
  const selectedSatelliteName = useMemo(() => {
    return satellites.find((sat) => sat._id === selectedSatelliteId)?.name || "Satellite";
  }, [satellites, selectedSatelliteId]);

  // Debug: Log when component re-renders (less frequent)
  const renderCount = useRef(0);
  renderCount.current++;
  
  // Use the Cesium clock synchronization hook
  useCesiumClock(viewerRef);
  
  // Apply rendering quality settings when they change
  useEffect(() => {
    if (viewerRef.current?.cesiumElement) {
      const viewer = viewerRef.current.cesiumElement;
      const settings = getRenderingSettings(renderingQuality);
      
      // Apply resolution scaling
      viewer.resolutionScale = settings.resolutionScale;
      
      // Apply terrain settings
      if (viewer.scene.globe) {
        viewer.scene.globe.maximumScreenSpaceError = settings.maximumScreenSpaceError;
      }
      
      // Apply visual effects
      viewer.scene.shadowMap.enabled = settings.shadows;
      viewer.scene.fog.enabled = settings.fog;
      viewer.scene.globe.enableLighting = settings.lighting;
      viewer.scene.skyBox.show = settings.skyBox;
      viewer.scene.skyAtmosphere.show = settings.skyAtmosphere;
      
      console.log(`🎨 CesiumViewer: Applied ${renderingQuality} rendering quality`, settings);
    }
  }, [renderingQuality, viewerRef]);
  
  // Apply mouse throttling settings
  useEffect(() => {
    if (viewerRef.current?.cesiumElement) {
      const viewer = viewerRef.current.cesiumElement;
      const canvas = viewer.canvas;
      
      // Store original event handlers if not already stored
      if (!canvas._originalMouseMove) {
        canvas._originalMouseMove = canvas.onmousemove;
      }
      
      // Create throttled mouse move handler
      let lastMouseMove = 0;
      const throttledMouseMove = (event: MouseEvent) => {
        const now = Date.now();
        if (now - lastMouseMove >= mouseThrottle) {
          lastMouseMove = now;
          if (canvas._originalMouseMove) {
            canvas._originalMouseMove.call(canvas, event);
          }
        }
      };
      
      // Apply throttled handler
      canvas.onmousemove = throttledMouseMove;
      
      console.log(`🖱️ CesiumViewer: Applied mouse throttling: ${mouseThrottle}ms (${Math.round(1000/mouseThrottle)}fps)`);
    }
  }, [mouseThrottle, viewerRef]);
  
  if (renderCount.current % 100 === 1) { // Log every 100th render to reduce spam
    console.log("🔄 CesiumViewer: Component re-rendering", {
      selectedSatelliteId,
      selectedSatelliteName,
      hasSatPositionProperty: !!satPositionProperty,
      renderCount: renderCount.current,
      timestamp: new Date().toISOString()
    });
  }
  
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
        fullscreenButton
      >
        <Clock shouldAnimate={true} />

        {/* Satellite with name label */}
        {satPositionProperty && selectedSatelliteId && (() => {
          console.log("🛰️ CesiumViewer: Rendering satellite entity", {
            selectedSatelliteId,
            selectedSatelliteName,
            satPositionProperty: !!satPositionProperty,
            positionPropertyType: satPositionProperty?.constructor?.name,
            hasTleHistory: !!tleHistory,
            hasTleFuture: !!tleFuture,
            groundTrackHistoryLength: groundTrackHistory?.length || 0,
            groundTrackFutureLength: groundTrackFuture?.length || 0
          });
          
          return (
            <Entity
              key={`satellite-${selectedSatelliteId}`}
              name="Satellite"
              position={satPositionProperty}
              point={{ 
                pixelSize: 12, // Normal size
                color: Color.YELLOW, // Yellow color
                outlineColor: Color.WHITE,
                outlineWidth: 2
              }}
              label={{
                text: selectedSatelliteName,
                font: "14px sans-serif",
                fillColor: Color.WHITE,
                style: 2, // LabelStyle.OUTLINE
                outlineWidth: 2,
                pixelOffset: new Cartesian2(0, -20),
                showBackground: true,
              }}
            />
          );
        })()}

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
          tleHistory={tleHistory}
          tleFuture={tleFuture}
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
          groundTrackHistory={
            groundTrackHistory ? new CallbackProperty(() => groundTrackHistory, false) : null
          }
          groundTrackFuture={
            groundTrackFuture ? new CallbackProperty(() => groundTrackFuture, false) : null
          }
          satPositionProperty={satPositionProperty}
        />

        {/* Nadir Lines */}
        <NadirLines satPositionProperty={satPositionProperty} />
      </Viewer>
    </div>
  );
};

// Custom comparison function to prevent unnecessary re-renders
const areEqual = (prevProps: CesiumViewerProps, nextProps: CesiumViewerProps) => {
  // Only re-render if important props have changed
  const shouldRerender = (
    prevProps.satPositionProperty !== nextProps.satPositionProperty ||
    prevProps.groundStationPos !== nextProps.groundStationPos ||
    prevProps.nextAosLosLabel !== nextProps.nextAosLosLabel ||
    prevProps.lineOfSightPositions !== nextProps.lineOfSightPositions ||
    prevProps.tleHistory !== nextProps.tleHistory ||
    prevProps.tleFuture !== nextProps.tleFuture ||
    prevProps.groundTrackHistory !== nextProps.groundTrackHistory ||
    prevProps.groundTrackFuture !== nextProps.groundTrackFuture
  );
  
  return !shouldRerender;
};

export default React.memo(CesiumViewer, areEqual);