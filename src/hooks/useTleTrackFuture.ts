import { useMemo } from "react";
import { Cartesian3, JulianDate, CallbackProperty } from "cesium";

export function useTleTrackFuture(
  satPositionProperty: any,
  viewerRef: React.MutableRefObject<any>,
  showTle: boolean,
  futureDuration: number = 7200 // Default to 2 hours if not provided
): CallbackProperty | null {
  return useMemo(() => {
    if (!showTle || !satPositionProperty) return null;

    return new CallbackProperty(() => {
      const positions: Cartesian3[] = [];
      const viewer = viewerRef.current?.cesiumElement;
      if (!viewer?.clock) return positions;

      const currentTime = viewer.clock.currentTime;
      if (!currentTime) return positions;

      // Generate future track using configurable duration
      const stepSize = Math.max(15, Math.floor(futureDuration / 240)); // Adaptive step size, min 15 seconds

      for (let i = 0; i <= futureDuration; i += stepSize) {
        const offsetTime = JulianDate.addSeconds(
          currentTime,
          i,
          new JulianDate()
        );
        const pos = satPositionProperty.getValue(offsetTime);
        if (pos) positions.push(pos);
      }

      console.log(`TLE Future track: ${positions.length} positions over ${futureDuration}s`);
      return positions;
    }, false);
  }, [showTle, satPositionProperty, viewerRef, futureDuration]);
}