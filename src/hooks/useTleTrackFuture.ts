import { useMemo } from "react";
import { Cartesian3, JulianDate, CallbackProperty } from "cesium";

export function useTleTrackFuture(
  satPositionProperty: any,
  viewerRef: React.MutableRefObject<any>,
  showTle: boolean
): CallbackProperty | null {
  return useMemo(() => {
    if (!showTle || !satPositionProperty) return null;

    return new CallbackProperty(() => {
      const positions: Cartesian3[] = [];
      const viewer = viewerRef.current?.cesiumElement;
      if (!viewer?.clock) return positions;

      const currentTime = viewer.clock.currentTime;
      if (!currentTime) return positions;

      for (let i = 0; i <= 3600; i += 30) {
        const offsetTime = JulianDate.addSeconds(
          currentTime,
          i,
          new JulianDate()
        );
        const pos = satPositionProperty.getValue(offsetTime);
        if (pos) positions.push(pos);
      }
      return positions;
    }, false);
  }, [showTle, satPositionProperty, viewerRef]);
}