import React from "react";
import { Viewer, Entity, Clock } from "resium";
import {
  Cartesian3,
  Color,
  CallbackProperty,
  Cartesian2,
} from "cesium";
import { JSX } from "react/jsx-runtime";

interface CesiumViewerProps {
  viewerRef: React.RefObject<any>;
  visibilityConeEntities: JSX.Element[];
  satPositionProperty: any;
  satellites: any[];
  selectedSatId: string;
  groundStationPos: Cartesian3 | null;
  nextAosLosLabel: string;
  tleEntities: JSX.Element | null;
  showLineOfSight: boolean;
  lineOfSightPositions: Cartesian3[];
  groundTrackEntities: JSX.Element | null;
}

const CesiumViewer: React.FC<CesiumViewerProps> = ({
  viewerRef,
  visibilityConeEntities,
  satPositionProperty,
  satellites,
  selectedSatId,
  groundStationPos,
  nextAosLosLabel,
  tleEntities,
  showLineOfSight,
  lineOfSightPositions,
  groundTrackEntities,
}) => {
  return (
    <Viewer ref={viewerRef} style={{ position: "absolute", inset: 0 }}>
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
      {tleEntities}

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
      {groundTrackEntities}
    </Viewer>
  );
};

export default CesiumViewer;