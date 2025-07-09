import { useEffect, useRef } from "react";
import { JulianDate } from "cesium";
import { setCesiumClockTime } from "../store/cesiumClockSlice";
import { useDispatch } from "react-redux";

/**
 * Simple hook that attaches to Cesium clock and dispatches time to Redux
 * This is the single source of truth for time in the app
 */
export function useCesiumClock(viewerRef: React.MutableRefObject<any>) {
  const dispatch = useDispatch();
  const listenerRef = useRef<(() => void) | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    let currentViewer: any = null; // Capture the viewer reference

    const attachListener = () => {
      const viewer = viewerRef.current?.cesiumElement;
      if (!viewer) {
        console.log("useCesiumClock: No viewer found, will retry");
        return false;
      }

      // Store the current viewer for cleanup
      currentViewer = viewer;

      // Remove existing listener if any
      if (listenerRef.current) {
        viewer.clock.onTick.removeEventListener(listenerRef.current);
      }

      console.log("useCesiumClock: Attaching clock listener");

      const updateClock = () => {
        try {
          const curTime = viewer.clock.currentTime;
          const dateObject = JulianDate.toDate(curTime);
          dispatch(setCesiumClockTime(dateObject.toISOString()));
        } catch (error) {
          console.error("useCesiumClock: Error updating clock", error);
        }
      };

      // Store reference to the listener
      listenerRef.current = updateClock;
      
      // Attach the clock listener
      viewer.clock.onTick.addEventListener(updateClock);
      console.log("useCesiumClock: Clock listener attached successfully");
      
      return true;
    };

    // Try to attach immediately
    if (!attachListener()) {
      // If failed, set up an interval to retry
      intervalRef.current = setInterval(() => {
        if (attachListener()) {
          // Success! Clear the interval
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
        }
      }, 100);
    }

    return () => {
      // Clear retry interval
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }

      // Clean up listener using the captured viewer reference
      if (currentViewer && listenerRef.current) {
        console.log("useCesiumClock: Removing clock listener");
        currentViewer.clock.onTick.removeEventListener(listenerRef.current);
      }
    };
  }, [viewerRef, dispatch]);
}
