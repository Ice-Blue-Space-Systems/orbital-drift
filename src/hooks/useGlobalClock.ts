import { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setCesiumClockTime } from "../store/cesiumClockSlice";
import { RootState } from "../store";

/**
 * Global clock that runs at the Redux simulation rate
 * This ensures time keeps ticking on all pages at the correct speed
 */
export function useGlobalClock() {
  const dispatch = useDispatch();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const cesiumMultiplier = useSelector((state: RootState) => state.cesiumClock.multiplier);
  const cesiumClockTime = useSelector((state: RootState) => state.cesiumClock.iso);
  const baseTimeRef = useRef<Date>(new Date());
  const startTimeRef = useRef<number>(Date.now());

  useEffect(() => {
    // Set base time from current Redux time
    baseTimeRef.current = cesiumClockTime ? new Date(cesiumClockTime) : new Date();
    startTimeRef.current = Date.now();
    
    // console.log(`useGlobalClock: Starting at ${cesiumMultiplier}x speed`);
    
    // Calculate interval based on multiplier (faster updates for higher speeds)
    const updateInterval = cesiumMultiplier > 10 ? 100 : 1000;
    
    intervalRef.current = setInterval(() => {
      const realElapsed = Date.now() - startTimeRef.current;
      const simulatedElapsed = realElapsed * cesiumMultiplier;
      const simulatedTime = new Date(baseTimeRef.current.getTime() + simulatedElapsed);
      
      dispatch(setCesiumClockTime(simulatedTime.toISOString()));
    }, updateInterval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [dispatch, cesiumMultiplier, cesiumClockTime]); // Restart when multiplier or time changes
}
