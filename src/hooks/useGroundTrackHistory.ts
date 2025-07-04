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
    if (
      !showGroundTrack ||
      !showHistory ||
      !groundTrackPositionProperty ||
      !viewerRef.current
    ) {
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
    return () => viewer.clock.onTick.removeEventListener(recordGroundTrack);
  }, [showGroundTrack, showHistory, groundTrackPositionProperty, viewerRef]);

  return groundTrackHistoryRef;
}