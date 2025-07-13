import React, { JSX } from "react";
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

interface CesiumViewerProps {
  viewerRef: React.RefObject<any>;
  visibilityConeEntities: JSX.Element[];
  satPositionProperty: any;
  groundStationPos: Cartesian3 | null;
  nextAosLosLabel: string;
  lineOfSightPositions: Cartesian3[];
  tleHistory: any[];
  tleFuture: any[];
  groundTrackHistory: any[];
  groundTrackFuture: any[];
}

const CesiumViewer: React.FC<CesiumViewerProps> = ({
  viewerRef,
  visibilityConeEntities,
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
  const showNadirLines = useSelector(
    (state: RootState) => state.mongo.showNadirLines
  );

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
        {visibilityConeEntities}
        <Clock shouldAnimate={true} />

        {/* Satellite with name label */}
        {satPositionProperty && selectedSatelliteId && (
          <Entity
            name="Satellite"
            position={satPositionProperty}
            point={{ pixelSize: 12, color: Color.YELLOW }}
            label={{
              text:
                satellites.find((sat) => sat._id === selectedSatelliteId)?.name ||
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
          groundTrackHistory={
            new CallbackProperty(() => groundTrackHistory, false)
          }
          groundTrackFuture={
            new CallbackProperty(() => groundTrackFuture, false)
          }
          satPositionProperty={satPositionProperty}
        />

        {/* Nadir Lines */}
        <NadirLines satPositionProperty={satPositionProperty} />
      </Viewer>
    </div>
  );
};

export default CesiumViewer;