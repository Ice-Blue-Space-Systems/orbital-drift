import { Cartesian3, Ellipsoid, Matrix3, Transforms } from "cesium";

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

/**
 * Converts ECEF coordinates to ENU (East-North-Up) coordinates relative to a reference point.
 * @param ecefPosition - The position in ECEF coordinates.
 * @param referencePosition - The reference point in ECEF coordinates.
 * @returns The ENU vector as a Cartesian3.
 */
export function convertEcefToEnu(
  ecefPosition: Cartesian3,
  referencePosition: Cartesian3
): Cartesian3 {
  const transformMatrix = Transforms.eastNorthUpToFixedFrame(referencePosition);

  const relativePosition = Cartesian3.subtract(
    ecefPosition,
    referencePosition,
    new Cartesian3()
  );

  return Matrix3.multiplyByVector(transformMatrix, relativePosition, new Cartesian3());
}