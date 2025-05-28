import { Cartesian3, Ellipsoid } from "cesium";

/**
 * Converts a Cartesian3 position to latitude/longitude/altitude.
 */
export function cartesianToLatLonAlt(cartesian: Cartesian3): { lat: number; lon: number; alt: number } {
  const cartographic = Ellipsoid.WGS84.cartesianToCartographic(cartesian);
  return {
    lat: cartographic.latitude * (180 / Math.PI),
    lon: cartographic.longitude * (180 / Math.PI),
    alt: cartographic.height,
  };
}

/**
 * Converts latitude, longitude, altitude to a Cartesian3.
 */
export function latLonAltToCartesian(lat: number, lon: number, alt: number): Cartesian3 {
  return Cartesian3.fromDegrees(lon, lat, alt);
}