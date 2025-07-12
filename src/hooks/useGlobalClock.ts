import { useEffect, useRef } from "react";
import { useDispatch } from "react-redux";
import { setCesiumClockTime, setCesiumClockMultiplier } from "../store/cesiumClockSlice";

/**
 * Global clock that runs when no Cesium viewer is available
 * This ensures time keeps ticking on all pages
 */
export function useGlobalClock() {
  const dispatch = useDispatch();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Start a simple real-time clock
    console.log("useGlobalClock: Starting real-time fallback clock");
    
    // Reset multiplier to 1x when global clock takes over
    dispatch(setCesiumClockMultiplier(1));
    
    intervalRef.current = setInterval(() => {
      const now = new Date();
      dispatch(setCesiumClockTime(now.toISOString()));
    }, 1000); // Update every second at real-time

    return () => {
      if (intervalRef.current) {
        console.log("useGlobalClock: Stopping fallback clock");
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [dispatch]);
}
