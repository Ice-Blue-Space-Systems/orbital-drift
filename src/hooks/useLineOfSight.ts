// hooks/useLineOfSight.ts
import { useEffect } from "react";
import { Cartesian3 } from "cesium";

export function useLineOfSight(
  viewerRef: any,
  satPositionProperty: any,
  groundStationPos: Cartesian3 | null,
  lineOfSightPositionsRef: React.MutableRefObject<Cartesian3[]>
) {
  useEffect(() => {
    if (!satPositionProperty || !groundStationPos) return;

    // Wait for viewer to be available
    const setupLineOfSight = () => {
      if (!viewerRef.current?.cesiumElement?.clock) {
        // If viewer isn't ready yet, try again in the next tick
        setTimeout(setupLineOfSight, 10);
        return;
      }

      const clock = viewerRef.current.cesiumElement.clock;

      const onTick = () => {
        const time = clock.currentTime;
        const satPos = satPositionProperty.getValue(time);
        if (satPos) {
          lineOfSightPositionsRef.current = [groundStationPos, satPos]; // Update the ref
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
  }, [satPositionProperty, groundStationPos, viewerRef.current?.cesiumElement, lineOfSightPositionsRef]);
}
