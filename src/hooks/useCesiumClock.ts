import { useEffect, useRef } from "react";
import { updateCesiumClockMultiplier } from "../store/cesiumClockSlice";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../store";

/**
 * Hook that attaches to Cesium clock when available
 * This synchronizes between Redux store and Cesium clock
 */
export function useCesiumClock(viewerRef: React.MutableRefObject<any>) {
  const dispatch = useDispatch();
  const reduxMultiplier = useSelector((state: RootState) => state.cesiumClock.multiplier);
  const listenerRef = useRef<(() => void) | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isActiveRef = useRef<boolean>(false);
  const lastSyncedMultiplier = useRef<number>(1);

  useEffect(() => {
    let currentViewer: any = null;

    const attachListener = () => {
      const viewer = viewerRef.current?.cesiumElement;
      if (!viewer) {
        // console.log("useCesiumClock: No viewer found, will retry");
        return false;
      }

      currentViewer = viewer;
      isActiveRef.current = true;

      // Remove existing listener if any
      if (listenerRef.current) {
        viewer.clock.onTick.removeEventListener(listenerRef.current);
      }

      console.log("useCesiumClock: Cesium clock taking control");

      const updateClock = () => {
        try {
          const cesiumMultiplier = viewer.clock.multiplier;
          
          // Only dispatch multiplier changes if it's different from what we set
          // This prevents infinite loops when we update the Cesium clock from Redux
          if (Math.abs(cesiumMultiplier - lastSyncedMultiplier.current) > 0.001) {
            console.log("useCesiumClock: Cesium clock changed to", cesiumMultiplier);
            dispatch(updateCesiumClockMultiplier(cesiumMultiplier));
          }
          
        } catch (error) {
          console.error("useCesiumClock: Error updating clock", error);
        }
      };

      listenerRef.current = updateClock;
      viewer.clock.onTick.addEventListener(updateClock);
      console.log("useCesiumClock: Clock listener attached successfully");
      
      return true;
    };

    // Try to attach immediately
    if (!attachListener()) {
      // If failed, set up an interval to retry
      intervalRef.current = setInterval(() => {
        if (attachListener()) {
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
        }
      }, 100);
    }

    return () => {
      isActiveRef.current = false;
      console.log("useCesiumClock: Cesium clock releasing control");

      // Clear retry interval
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }

      // Clean up listener
      if (currentViewer && listenerRef.current) {
        currentViewer.clock.onTick.removeEventListener(listenerRef.current);
      }
    };
  }, [dispatch, viewerRef]);

  // Sync Redux multiplier changes to Cesium clock
  useEffect(() => {
    const viewer = viewerRef.current?.cesiumElement;
    if (!viewer) return;

    // Only update if the multiplier actually changed and we're not in the middle of updating from Cesium
    if (Math.abs(viewer.clock.multiplier - reduxMultiplier) > 0.001) {
      console.log("useCesiumClock: Syncing Redux multiplier to Cesium:", reduxMultiplier);
      viewer.clock.multiplier = reduxMultiplier;
      lastSyncedMultiplier.current = reduxMultiplier;
    }
  }, [reduxMultiplier, viewerRef]);

  return { isActive: isActiveRef.current };
}
