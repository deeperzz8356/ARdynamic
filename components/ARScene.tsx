
import React, { useRef, useEffect, useMemo, Suspense, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { Text } from '@react-three/drei';
import { floorPlanData } from '../data/collegeLayout';
import { Wall, Room } from '../types';

interface ARSceneProps {
  path: THREE.Vector3[] | null;
  heading: number | null;
  onUserPositionChange: (position: THREE.Vector3) => void;
  recalibrateSignal: number;
  startPosition: THREE.Vector3;
}

const ARButton: React.FC<{ onSessionStart: (session: THREE.XRSession) => void, onSessionEnd: () => void }> = ({ onSessionStart, onSessionEnd }) => {
  const { gl } = useThree();
  const sessionRef = useRef<THREE.XRSession | null>(null);

  useEffect(() => {
    const setupAR = async () => {
      // FIX: Cast navigator to 'any' to access the experimental 'xr' property, which is not included in the default TypeScript Navigator type.
      if ((navigator as any).xr) {
        try {
          // FIX: Cast navigator to 'any' to access the experimental 'xr' property.
          const session = await (navigator as any).xr.requestSession('immersive-ar', {
            requiredFeatures: ['local-floor', 'hit-test'],
          });
          gl.xr.enabled = true;
          gl.xr.setReferenceSpaceType('local-floor');
          await gl.xr.setSession(session);
          sessionRef.current = session;
          onSessionStart(session);

          session.addEventListener('end', () => {
            sessionRef.current = null;
            gl.xr.enabled = false;
            onSessionEnd();
          });
        } catch (e) {
          console.error("Failed to start AR session", e);
        }
      }
    };
    setupAR();
    
    return () => {
        sessionRef.current?.end();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
};

const CollegeModel = React.memo(() => {
  const model = useMemo(() => {
    const group = new THREE.Group();

    const floorMaterial = new THREE.MeshStandardMaterial({ color: 0x808080, side: THREE.DoubleSide });
    const mergedFloors = new THREE.BufferGeometry();
    const geometries: THREE.BufferGeometry[] = [];

    floorPlanData.rooms.forEach((roomData: Room) => {
      const shape = new THREE.Shape();
      shape.moveTo(roomData.points[0][0], roomData.points[0][1]);
      for (let i = 1; i < roomData.points.length; i++) {
        shape.lineTo(roomData.points[i][0], roomData.points[i][1]);
      }
      shape.closePath();
      const geometry = new THREE.ShapeGeometry(shape);
      geometries.push(geometry);
    });
    
    // Manual merge (BufferGeometryUtils.mergeBufferGeometries is better if available)
    // This is a simplified merge, for complex cases a library is better.
    // For this demo, we'll just add them as separate meshes to avoid complex merge logic.
    geometries.forEach(geom => {
        const floorMesh = new THREE.Mesh(geom, floorMaterial);
        floorMesh.rotation.x = -Math.PI / 2;
        group.add(floorMesh);
    });

    const wallMaterial = new THREE.MeshStandardMaterial({ color: 0xc0c0c0 });
    floorPlanData.walls.forEach((wall: Wall) => {
      const p1 = new THREE.Vector2(wall.p1[0], wall.p1[1]);
      const p2 = new THREE.Vector2(wall.p2[0], wall.p2[1]);
      const length = p1.distanceTo(p2);
      const wallMesh = new THREE.Mesh(
        new THREE.BoxGeometry(length, floorPlanData.wallHeight, floorPlanData.wallThickness),
        wallMaterial
      );
      wallMesh.position.set((p1.x + p2.x) / 2, floorPlanData.wallHeight / 2, (p1.y + p2.y) / 2);
      wallMesh.rotation.y = Math.atan2(p2.y - p1.y, p2.x - p1.x);
      group.add(wallMesh);
    });

    return group;
  }, []);

  return (
      <>
        <primitive object={model} />
        <Suspense fallback={null}>
            {floorPlanData.rooms.map(room => {
                const center = room.points.reduce((acc, p) => [acc[0] + p[0], acc[1] + p[1]], [0, 0]);
                center[0] /= room.points.length;
                center[1] /= room.points.length;
                return (
                    <Text
                        key={room.name}
                        position={[center[0], 2.5, center[1]]}
                        rotation={[-Math.PI / 2, 0, 0]}
                        fontSize={0.5}
                        color="black"
                        anchorX="center"
                        anchorY="middle"
                        maxWidth={5}
                    >
                        {room.name}
                    </Text>
                );
            })}
        </Suspense>
      </>
  );
});

const NavigationPath: React.FC<{ path: THREE.Vector3[] | null }> = ({ path }) => {
  return (
    <>
      {path && path.length > 1 && path.map((point, index) => {
        if (index === path.length - 1) return null;
        const nextPoint = path[index + 1];
        const direction = new THREE.Vector3().subVectors(nextPoint, point).normalize();
        const distance = point.distanceTo(nextPoint);
        return (
          <arrowHelper
            key={index}
            args={[direction, point, distance, 0x00ff00, 0.5, 0.3]}
          />
        );
      })}
    </>
  );
};


const SceneContent: React.FC<ARSceneProps> = ({ path, heading, onUserPositionChange, recalibrateSignal, startPosition }) => {
  const { camera } = useThree();
  const sceneGroup = useRef<THREE.Group>(null!);

  useEffect(() => {
    if (heading !== null && sceneGroup.current) {
        // Initial alignment
        const headingRad = THREE.MathUtils.degToRad(heading);
        sceneGroup.current.rotation.y = headingRad;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [heading]);
  
  useEffect(() => {
    if(recalibrateSignal > 0 && sceneGroup.current && heading !== null) {
      // Recalibrate logic
      const cameraDirection = new THREE.Vector3();
      camera.getWorldDirection(cameraDirection);
      const cameraYaw = Math.atan2(cameraDirection.x, cameraDirection.z);
      
      const headingRad = THREE.MathUtils.degToRad(heading);
      
      // We want the model's negative Z to align with the current heading (North)
      const desiredRotation = headingRad; 
      
      // We want the user's current view direction to match the model's forward view at start point
      // Assume start faces towards positive Z in model space
      const rotationOffset = cameraYaw;

      sceneGroup.current.rotation.y = desiredRotation - rotationOffset;
      
      // Position the model so the start point is at the user's feet
      const startPositionWorld = startPosition.clone().applyMatrix4(sceneGroup.current.matrix);
      const positionOffset = new THREE.Vector3().subVectors(camera.position, startPositionWorld);
      positionOffset.y = 0; // Don't adjust height
      sceneGroup.current.position.add(positionOffset);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recalibrateSignal, heading, startPosition, camera]);

  useFrame(() => {
    // Update user position based on camera in the virtual world
    const userPositionInWorld = camera.position.clone();
    const invertedMatrix = new THREE.Matrix4();
    invertedMatrix.copy(sceneGroup.current.matrixWorld).invert();
    const userPositionInModel = userPositionInWorld.applyMatrix4(invertedMatrix);
    onUserPositionChange(userPositionInModel);
  });

  return (
    <group ref={sceneGroup}>
      <ambientLight intensity={0.8} />
      <directionalLight position={[10, 10, 5]} intensity={1.5} />
      <CollegeModel />
      <NavigationPath path={path} />
    </group>
  );
};

const ARScene: React.FC<ARSceneProps> = (props) => {
  const [session, setSession] = useState<THREE.XRSession | null>(null);

  return (
    <Canvas style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}>
      {session ? (
        <SceneContent {...props} />
      ) : (
        <ARButton onSessionStart={setSession} onSessionEnd={() => setSession(null)} />
      )}
    </Canvas>
  );
};

export default ARScene;
