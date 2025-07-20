import { useMemo } from "react";
import { Cartesian3, JulianDate, CallbackProperty, Ellipsoid } from "cesium";

export function useFutureGroundTrack(
  groundTrackPositionProperty: any,
  viewerRef: React.MutableRefObject<any>,
  showGroundTrack: boolean
): CallbackProperty | null {
  return useMemo(() => {
    if (!showGroundTrack || !groundTrackPositionProperty) return null;

    return new CallbackProperty(() => {
      const futurePositions: Cartesian3[] = [];
      const viewer = viewerRef.current?.cesiumElement;
      if (!viewer?.clock) return futurePositions;

      const currentTime = viewer.clock.currentTime;
      if (!currentTime) return futurePositions;

      for (let i = 0; i <= 3600; i += 30) {
        const offsetTime = JulianDate.addSeconds(
          currentTime,
          i,
          new JulianDate()
        );
        const pos = groundTrackPositionProperty.getValue(offsetTime);
        if (pos) {
          const carto = Ellipsoid.WGS84.cartesianToCartographic(pos);
          carto.height = 0; // Ensure the ground track stays at ground level
          futurePositions.push(Ellipsoid.WGS84.cartographicToCartesian(carto));
        }
      }
      return futurePositions;
    }, false);
  }, [showGroundTrack, groundTrackPositionProperty, viewerRef]);
}