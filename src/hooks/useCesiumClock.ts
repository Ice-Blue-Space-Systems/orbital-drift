import { useEffect, useRef } from "react";
import { updateCesiumClockMultiplier } from "../store/cesiumClockSlice";
import { useDispatch } from "react-redux";

/**
 * Hook that attaches to Cesium clock when available
 * This overrides the global clock when Cesium is active
 */
export function useCesiumClock(viewerRef: React.MutableRefObject<any>) {
  const dispatch = useDispatch();
  const listenerRef = useRef<(() => void) | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isActiveRef = useRef<boolean>(false);

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

      // console.log("useCesiumClock: Cesium clock taking control");

      const updateClock = () => {
        try {
          const multiplier = viewer.clock.multiplier;
          
          // Only dispatch multiplier changes, let useGlobalClock handle time
          dispatch(updateCesiumClockMultiplier(multiplier));
          
        } catch (error) {
          console.error("useCesiumClock: Error updating clock", error);
        }
      };

      listenerRef.current = updateClock;
      viewer.clock.onTick.addEventListener(updateClock);
      // console.log("useCesiumClock: Clock listener attached successfully");
      
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
      // console.log("useCesiumClock: Cesium clock releasing control");

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
  }, [viewerRef, dispatch]);

  // Return whether this hook is actively controlling the clock
  return isActiveRef.current;
}
