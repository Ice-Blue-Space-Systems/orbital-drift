import { useEffect, useRef } from "react";
import { Cartesian3, Ellipsoid } from "cesium";

export function useGroundTrackHistory(
  groundTrackPositionProperty: any,
  viewerRef: React.MutableRefObject<any>,
  showGroundTrack: boolean,
  showHistory: boolean
): React.MutableRefObject<Cartesian3[]> {
  const groundTrackHistoryRef = useRef<Cartesian3[]>([]);

  useEffect(() => {
    if (!showGroundTrack || !showHistory || !groundTrackPositionProperty) {
      return;
    }

    // Wait for viewer to be available
    const setupGroundTrackTracking = () => {
      if (!viewerRef.current?.cesiumElement?.clock) {
        // If viewer isn't ready yet, try again in the next tick
        setTimeout(setupGroundTrackTracking, 10);
        return;
      }

      const viewer = viewerRef.current.cesiumElement;

      const recordGroundTrack = () => {
        const now = viewer.clock.currentTime;
        if (!now) return;
        const pos = groundTrackPositionProperty.getValue(now);
        if (pos) {
          const carto = Ellipsoid.WGS84.cartesianToCartographic(pos);
          carto.height = 0;
          groundTrackHistoryRef.current.push(
            Ellipsoid.WGS84.cartographicToCartesian(carto)
          );
        }
      };

      viewer.clock.onTick.addEventListener(recordGroundTrack);
      return () => {
        if (viewer.clock) {
          viewer.clock.onTick.removeEventListener(recordGroundTrack);
        }
      };
    };

    const cleanup = setupGroundTrackTracking();
    return cleanup;
  }, [showGroundTrack, showHistory, groundTrackPositionProperty, viewerRef.current?.cesiumElement]);

  return groundTrackHistoryRef;
}