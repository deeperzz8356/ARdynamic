
import { useState, useEffect, useCallback } from 'react';

export const useOrientation = () => {
  const [heading, setHeading] = useState<number | null>(null);
  const [permissionGranted, setPermissionGranted] = useState(false);

  const handleOrientation = (event: any) => {
    // 'webkitCompassHeading' is for iOS Safari
    const compassHeading = event.webkitCompassHeading || (360 - event.alpha);
    setHeading(compassHeading);
  };

  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
      try {
        const permissionState = await (DeviceOrientationEvent as any).requestPermission();
        if (permissionState === 'granted') {
          setPermissionGranted(true);
          return true;
        }
        return false;
      } catch (error) {
        console.error("DeviceOrientationEvent permission request failed.", error);
        return false;
      }
    } else {
      // For devices that don't require explicit permission (e.g., Android)
      setPermissionGranted(true);
      return true;
    }
  }, []);

  useEffect(() => {
    if (permissionGranted) {
      window.addEventListener('deviceorientation', handleOrientation);
    }
    
    return () => {
      window.removeEventListener('deviceorientation', handleOrientation);
    };
  }, [permissionGranted]);

  return { heading, requestPermission };
};
