// filepath: /Users/chrischeshire/Documents/IceBlue/hello-world-react-app/src/hooks/useSatellitePosition.ts
import { useEffect, useState } from "react";
import { SampledPositionProperty } from "cesium";
import { useDispatch } from "react-redux";
import { fetchTleBySatelliteId } from "../store/tleSlice";
import { getFuturePositionsWithTime } from "../utils/tleUtils";
import { AppDispatch } from "../store";

export function useSatellitePosition(
  selectedSatId: string | null,
  satellites: any[],
  viewerRef: React.MutableRefObject<any>
): {
  satPositionProperty: SampledPositionProperty | null;
  groundTrackPositionProperty: SampledPositionProperty | null;
} {
  const dispatch: AppDispatch = useDispatch();
  const [satPositionProperty, setSatPositionProperty] =
    useState<SampledPositionProperty | null>(null);
  const [groundTrackPositionProperty, setGroundTrackPositionProperty] =
    useState<SampledPositionProperty | null>(null);

  useEffect(() => {
    const satellite = satellites.find((sat) => sat._id === selectedSatId);
    if (!satellite) {
      setSatPositionProperty(null);
      setGroundTrackPositionProperty(null);
      return;
    }

    const loadTleAndPosition = async () => {
      try {
        let line1 = "";
        let line2 = "";

        if (satellite.type === "simulated" && satellite.currentTleId) {
          const tle = await dispatch(fetchTleBySatelliteId(satellite.currentTleId)).unwrap();
          line1 = tle.line1;
          line2 = tle.line2;
        } else if (satellite.type === "live" && satellite.noradId) {
          const res = await fetch("https://celestrak.com/NORAD/elements/stations.txt");
          const lines = (await res.text()).split("\n");
          const idx = lines.findIndex((l) => l.includes(String(satellite.noradId)));
          if (idx !== -1) {
            line1 = lines[idx];
            line2 = lines[idx + 1];
          }
        }

        if (line1 && line2) {
          const positionProperty = getFuturePositionsWithTime(
            line1,
            line2,
            1060,
            viewerRef.current?.cesiumElement?.clock
          );

          const groundTrackProperty = getFuturePositionsWithTime(
            line1,
            line2,
            1060,
            viewerRef.current?.cesiumElement?.clock
          );

          setSatPositionProperty(positionProperty);
          setGroundTrackPositionProperty(groundTrackProperty);
        } else {
          setSatPositionProperty(null);
          setGroundTrackPositionProperty(null);
        }
      } catch (err) {
        console.error("Failed to fetch TLE or compute position", err);
        setSatPositionProperty(null);
        setGroundTrackPositionProperty(null);
      }
    };

    if (selectedSatId) {
      loadTleAndPosition();
    }
  }, [selectedSatId, satellites, dispatch, viewerRef]);

  return { satPositionProperty, groundTrackPositionProperty };
}