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