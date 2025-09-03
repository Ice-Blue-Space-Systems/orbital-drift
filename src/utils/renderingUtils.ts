/**
 * Utility functions for Cesium rendering quality settings
 */

export interface RenderingSettings {
  resolutionScale: number;
  maximumScreenSpaceError: number;
  shadows: boolean;
  fog: boolean;
  lighting: boolean;
  skyBox: boolean;
  skyAtmosphere: boolean;
}

/**
 * Get Cesium rendering settings based on quality level
 */
export function getRenderingSettings(quality: 'low' | 'medium' | 'high'): RenderingSettings {
  switch (quality) {
    case 'low':
      return {
        resolutionScale: 0.5,           // Half resolution for better performance
        maximumScreenSpaceError: 32,    // Lower terrain detail
        shadows: false,                 // Disable shadows
        fog: false,                     // Disable fog
        lighting: false,                // Disable lighting effects
        skyBox: false,                  // Disable sky box
        skyAtmosphere: false,           // Disable atmosphere effects
      };
    
    case 'medium':
      return {
        resolutionScale: 0.75,          // Three-quarter resolution
        maximumScreenSpaceError: 16,    // Medium terrain detail
        shadows: false,                 // Keep shadows off for performance
        fog: true,                      // Enable fog
        lighting: true,                 // Enable lighting
        skyBox: true,                   // Enable sky box
        skyAtmosphere: false,           // Keep atmosphere off for performance
      };
    
    case 'high':
      return {
        resolutionScale: 1.0,           // Full resolution
        maximumScreenSpaceError: 2,     // High terrain detail
        shadows: true,                  // Enable shadows
        fog: true,                      // Enable fog
        lighting: true,                 // Enable lighting
        skyBox: true,                   // Enable sky box
        skyAtmosphere: true,            // Enable atmosphere effects
      };
    
    default:
      return getRenderingSettings('medium');
  }
}

/**
 * Throttle mouse events to reduce performance impact
 */
export function createMouseThrottle(callback: Function, delay: number) {
  let lastCall = 0;
  return function (...args: any[]) {
    const now = Date.now();
    if (now - lastCall >= delay) {
      lastCall = now;
      callback(...args);
    }
  };
}
