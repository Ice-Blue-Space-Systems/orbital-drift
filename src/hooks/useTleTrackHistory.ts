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
    if (!showTle || !satPositionProperty || !viewerRef.current) return;

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
    return () => viewer.clock.onTick.removeEventListener(recordTleTrack);
  }, [showTle, showHistory, satPositionProperty, viewerRef]);

  return tleHistoryRef;
}