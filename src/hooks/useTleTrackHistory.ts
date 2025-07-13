import { useEffect, useRef } from "react";
import { Cartesian3 } from "cesium";

export function useTleTrackHistory(
  satPositionProperty: any,
  viewerRef: React.MutableRefObject<any>,
  showTle: boolean,
  showHistory: boolean
): React.MutableRefObject<Cartesian3[]> {
  const tleHistoryRef = useRef<Cartesian3[]>([]);

  useEffect(() => {
    if (!showTle || !satPositionProperty) return;

    // Wait for viewer to be available
    const setupTleTracking = () => {
      if (!viewerRef.current?.cesiumElement?.clock) {
        // If viewer isn't ready yet, try again in the next tick
        setTimeout(setupTleTracking, 10);
        return;
      }

      const viewer = viewerRef.current.cesiumElement;

      const recordTleTrack = () => {
        const now = viewer.clock.currentTime;
        if (!now) return;
        const pos = satPositionProperty.getValue(now);
        if (pos) {
          if (showHistory) {
            tleHistoryRef.current.push(pos);
          } else {
            tleHistoryRef.current.length = 0;
            tleHistoryRef.current.push(pos);
          }
        }
      };

      viewer.clock.onTick.addEventListener(recordTleTrack);
      return () => {
        if (viewer.clock) {
          viewer.clock.onTick.removeEventListener(recordTleTrack);
        }
      };
    };

    const cleanup = setupTleTracking();
    return cleanup;
  }, [showTle, showHistory, satPositionProperty, viewerRef.current?.cesiumElement]);

  return tleHistoryRef;
}