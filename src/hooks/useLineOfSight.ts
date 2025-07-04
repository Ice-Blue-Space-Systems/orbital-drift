// hooks/useLineOfSight.ts
import { useEffect } from "react";
import { Cartesian3, JulianDate } from "cesium";

export function useLineOfSight(
  viewerRef: any,
  satPositionProperty: any,
  groundStationPos: Cartesian3 | null,
  lineOfSightPositionsRef: React.MutableRefObject<Cartesian3[]>
) {
  useEffect(() => {
    if (satPositionProperty && groundStationPos && viewerRef.current) {
      const clock = viewerRef.current.cesiumElement?.clock;
      if (!clock) return;

      const onTick = () => {
        const time = clock.currentTime;
        const satPos = satPositionProperty.getValue(time);
        if (satPos) {
          lineOfSightPositionsRef.current = [groundStationPos, satPos]; // Update the ref
        }
      };

      clock.onTick.addEventListener(onTick);
      return () => clock.onTick.removeEventListener(onTick);
    }
  }, [satPositionProperty, groundStationPos, viewerRef]);
}
