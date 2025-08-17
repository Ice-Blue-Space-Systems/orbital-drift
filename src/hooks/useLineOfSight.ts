// hooks/useLineOfSight.ts
import { useEffect } from "react";
import { Cartesian3 } from "cesium";

export function useLineOfSight(
  viewerRef: any,
  satPositionProperty: any,
  groundStationPos: Cartesian3 | null,
  setLineOfSightPositions: React.Dispatch<React.SetStateAction<Cartesian3[]>>
) {
  useEffect(() => {
    if (!satPositionProperty || !groundStationPos) {
      setLineOfSightPositions([]);
      return;
    }

    // Wait for viewer to be available
    const setupLineOfSight = () => {
      if (!viewerRef.current?.cesiumElement?.clock) {
        // If viewer isn't ready yet, try again in the next tick
        setTimeout(setupLineOfSight, 10);
        return;
      }

      const clock = viewerRef.current.cesiumElement.clock;
      let lastUpdate = 0;

      const onTick = () => {
        const now = Date.now();
        // Throttle updates to prevent excessive re-renders
        if (now - lastUpdate < 100) return; // Update max every 100ms
        lastUpdate = now;

        const time = clock.currentTime;
        const satPos = satPositionProperty.getValue(time);
        if (satPos) {
          setLineOfSightPositions(prevPositions => {
            // Only update if positions actually changed significantly
            if (prevPositions.length === 2 && 
                groundStationPos.equals(prevPositions[0]) &&
                satPos.equalsEpsilon(prevPositions[1], 1.0)) { // 1 meter tolerance
              return prevPositions; // Don't create new array if positions haven't changed much
            }
            return [groundStationPos, satPos];
          });
        }
      };

      clock.onTick.addEventListener(onTick);
      return () => {
        if (clock) {
          clock.onTick.removeEventListener(onTick);
        }
      };
    };

    const cleanup = setupLineOfSight();
    return cleanup;
  }, [satPositionProperty, groundStationPos, viewerRef, setLineOfSightPositions]);
}
