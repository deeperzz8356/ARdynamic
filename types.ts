
export interface Room {
  name: string;
  points: [number, number][];
}

export interface Wall {
  p1: [number, number];
  p2: [number, number];
}

export interface FloorPlan {
  rooms: Room[];
  walls: Wall[];
  wallHeight: number;
  wallThickness: number;
  planSize: {
    width: number;
    height: number;
  };
}
