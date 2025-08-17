import { useMemo } from "react";
import { Cartesian3, JulianDate, CallbackProperty } from "cesium";

export function useTleTrackHistory(
  satPositionProperty: any,
  viewerRef: React.MutableRefObject<any>,
  showTle: boolean,
  showHistory: boolean,
  historyDuration: number = 3600 // Default to 1 hour if not provided
): CallbackProperty | null {
  return useMemo(() => {
    if (!showTle || !showHistory || !satPositionProperty) return null;

    return new CallbackProperty(() => {
      const positions: Cartesian3[] = [];
      const viewer = viewerRef.current?.cesiumElement;
      if (!viewer?.clock) return positions;

      const currentTime = viewer.clock.currentTime;
      if (!currentTime) return positions;

      // Generate history track using configurable duration
      const stepSize = Math.max(10, Math.floor(historyDuration / 180)); // Adaptive step size, min 10 seconds

      for (let i = -historyDuration; i <= 0; i += stepSize) {
        const offsetTime = JulianDate.addSeconds(
          currentTime,
          i,
          new JulianDate()
        );
        const pos = satPositionProperty.getValue(offsetTime);
        if (pos) positions.push(pos);
      }

      console.log(`TLE History track: ${positions.length} positions over ${historyDuration}s`);
      return positions;
    }, false);
  }, [showTle, showHistory, satPositionProperty, viewerRef, historyDuration]);
}