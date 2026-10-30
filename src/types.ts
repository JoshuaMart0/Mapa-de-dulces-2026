export interface CandyLocation {
  id: string;
  name: string;
  street: string;
  houseNumber?: string;
  // Normalized coordinates on map: 0..1 (X: 0=left, 1=right; Y: 0=top, 1=bottom)
  mapX: number;
  mapY: number;
  candyType: string;
  treatsList: string[];
  status: 'active' | 'limited' | 'special';
  statusText: string;
  description: string;
  color: string; // candy glow color (e.g. '#ff8800', '#ec4899', '#a855f7')
  ghostNearby?: boolean;
  collected?: boolean;
}

export interface HouseData {
  id: string;
  blockId: string;
  streetName: string;
  houseNumber: string;
  hasCandy: boolean;
  candyNotes?: string;
  treatsList?: string[];
  wallColor?: number;
  roofColor?: number;
  mapX: number;
  mapY: number;
  rotationY?: number;
}

export type TimeOfDay = 'night' | 'twilight' | 'day';

export type CameraPreset = 'isometric' | 'topdown' | 'follow' | 'cinematic';

export interface PlayerPosition {
  mapX: number;
  mapY: number;
  altitude?: number;
  heading?: number;
  accuracy?: number;
  isRealGps: boolean;
}

export interface GpsCalibration {
  originLat: number;
  originLng: number;
  // Scaling factors: meters per lat/lng
  metersPerUnitX: number;
  metersPerUnitY: number;
}

