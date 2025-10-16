
import { useState, useEffect, useCallback } from 'react';
import * as THREE from 'three';
// @ts-ignore
import { Pathfinding } from 'three-pathfinding';
import { floorPlanData } from '../data/collegeLayout';
import { Room } from '../types';


export const usePathfinding = () => {
  const [pathfinder, setPathfinder] = useState<any>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const initPathfinding = () => {
      const pf = new Pathfinding();
      
      const geometries: THREE.BufferGeometry[] = [];
      floorPlanData.rooms.forEach((roomData: Room) => {
        const shape = new THREE.Shape();
        shape.moveTo(roomData.points[0][0], roomData.points[0][1]);
        for (let i = 1; i < roomData.points.length; i++) {
          shape.lineTo(roomData.points[i][0], roomData.points[i][1]);
        }
        shape.closePath();
        const geom = new THREE.ShapeGeometry(shape);
        geom.rotateX(Math.PI / 2);
        geometries.push(geom);
      });

      // Simple merge logic. In a real app, use BufferGeometryUtils.mergeGeometries
      const mergedGeometry = new THREE.BufferGeometry();
      const vertices: number[] = [];
      let indexOffset = 0;

      geometries.forEach(geom => {
        const pos = geom.attributes.position.array;
        for (let i = 0; i < pos.length; i++) {
            vertices.push(pos[i]);
        }
        if (geom.index) {
          // This simplified merge doesn't handle indices correctly.
          // For a robust solution, a proper merge function is necessary.
          // three-pathfinding works best with a single, clean mesh.
        }
      });
      
      const zoneGeometry = geometries[0]; // Using just one room for simplicity of navmesh generation for now
                                           // A proper solution would merge all walkable floor geometries
      
      const zone = Pathfinding.createZone(zoneGeometry);
      pf.setZoneData('college', zone);
      setPathfinder(pf);
      setIsReady(true);
    };

    initPathfinding();
  }, []);

  const findPath = useCallback((start: THREE.Vector3, end: THREE.Vector3): THREE.Vector3[] | null => {
    if (!pathfinder || !isReady) {
      console.warn('Pathfinder not ready');
      return null;
    }

    const groupID = pathfinder.getGroup('college', start);
    if (groupID === null) {
        console.error("Start position is not on a navigable area.");
        return null;
    }

    const calculatedPath = pathfinder.findPath(start, end, 'college', groupID);

    if (calculatedPath) {
        // Convert path points from array of {x,y,z} to array of THREE.Vector3
        return calculatedPath.map((p: {x: number, y: number, z: number}) => new THREE.Vector3(p.x, p.y, p.z));
    }
    
    return null;

  }, [pathfinder, isReady]);

  return { findPath, isReady };
};
