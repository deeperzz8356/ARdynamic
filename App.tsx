
import React, { useState, useCallback, useMemo } from 'react';
import * as THREE from 'three';
import ARScene from './components/ARScene';
import UIControls from './components/UIControls';
import { useOrientation } from './hooks/useOrientation';
import { usePathfinding } from './hooks/usePathfinding';
import { floorPlanData } from './data/collegeLayout';

// Helper to find the center of a room
const getRoomCenter = (roomName: string): THREE.Vector3 | null => {
  const room = floorPlanData.rooms.find(r => r.name === roomName);
  if (!room) return null;
  const center = room.points.reduce((acc, p) => [acc[0] + p[0], acc[1] + p[1]], [0, 0]);
  center[0] /= room.points.length;
  center[1] /= room.points.length;
  return new THREE.Vector3(center[0], 0, center[1]);
};

const App: React.FC = () => {
  const [destination, setDestination] = useState<string>('');
  const [path, setPath] = useState<THREE.Vector3[] | null>(null);
  const [isInAR, setIsInAR] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const [userPosition, setUserPosition] = useState(new THREE.Vector3(28, 0, 29)); // Start at Entrance Lobby
  const [recalibrateSignal, setRecalibrateSignal] = useState(0);

  const { heading, requestPermission } = useOrientation();
  const { findPath, isReady } = usePathfinding();

  const roomNames = useMemo(() => floorPlanData.rooms.map(room => room.name), []);
  const startPosition = useMemo(() => getRoomCenter('ENTRANCE\nLOBBY'), []);

  const handleStartNavigation = useCallback(() => {
    if (!destination || !isReady || !startPosition) return;
    const endPosition = getRoomCenter(destination);
    if (!endPosition) return;

    // In a real app, userPosition would be continuously updated from the AR camera pose.
    // For this simulation, we use the last known position.
    const calculatedPath = findPath(userPosition, endPosition);
    setPath(calculatedPath);
    setIsNavigating(true);
  }, [destination, isReady, findPath, userPosition, startPosition]);

  const handleStopNavigation = useCallback(() => {
    setIsNavigating(false);
    setPath(null);
  }, []);
  
  const handleRecalibrate = useCallback(() => {
    setRecalibrateSignal(prev => prev + 1);
  }, []);

  const handlePermissionsAndAR = async () => {
    const permGranted = await requestPermission();
    if (permGranted) {
      setIsInAR(true);
    } else {
      alert("Sensor permissions are required for navigation alignment.");
    }
  };

  if (!isInAR) {
    return (
      <div className="w-screen h-screen bg-gray-900 text-white flex flex-col items-center justify-center">
        <h1 className="text-4xl font-bold mb-4">AR Indoor Navigation</h1>
        <p className="mb-8 text-lg text-center max-w-md">Follow 3D arrows in AR to navigate the campus. Please grant permissions to start.</p>
        <button
          onClick={handlePermissionsAndAR}
          className="px-8 py-4 bg-blue-600 hover:bg-blue-700 rounded-lg text-xl font-semibold transition-transform transform hover:scale-105"
        >
          Start AR Experience
        </button>
      </div>
    );
  }

  return (
    <div className="w-screen h-screen">
      <ARScene
        path={path}
        heading={heading}
        onUserPositionChange={setUserPosition}
        recalibrateSignal={recalibrateSignal}
        startPosition={startPosition || new THREE.Vector3()}
      />
      <UIControls
        destinations={roomNames}
        selectedDestination={destination}
        onDestinationChange={setDestination}
        onStart={handleStartNavigation}
        onStop={handleStopNavigation}
        onRecalibrate={handleRecalibrate}
        isNavigating={isNavigating}
        onExitAR={() => setIsInAR(false)}
      />
    </div>
  );
};

export default App;
