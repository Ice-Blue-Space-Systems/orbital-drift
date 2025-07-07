import { CallbackProperty, JulianDate } from "cesium";

/**
 * Resolves the value of a CallbackProperty or returns the property directly.
 * @param property - The property to resolve.
 * @returns The resolved value or the property itself.
 */
export function resolveCallbackProperty(
  property: CallbackProperty | any
): any {
  if (property instanceof CallbackProperty) {
    return property.getValue(JulianDate.now());
  }
  return property || [];
}

export const getCesiumDate = (iso: string) => new Date(iso);
export const getCesiumUTC = (iso: string) => new Date(iso).toUTCString();
export const getCesiumLocal = (iso: string) => new Date(iso).toLocaleString();