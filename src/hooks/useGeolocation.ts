import { useState, useEffect, useRef, useCallback } from 'react';
import { PlayerPosition } from '../types';
import { INITIAL_PLAYER_POSITION } from '../data/candyLocations';

// Exact Google Maps start coordinates provided by user
export const START_LATITUDE = 19.782823906462493;
export const START_LONGITUDE = -104.3563869904087;

// Approximate neighborhood dimensions in meters
export const NEIGHBORHOOD_WIDTH_METERS = 280; // West to East
export const NEIGHBORHOOD_HEIGHT_METERS = 190; // North to South

interface UseGeolocationReturn {
  playerPos: PlayerPosition;
  isGpsAvailable: boolean;
  gpsActive: boolean;
  isJourneyStarted: boolean;
  gpsError: string | null;
  rawGps: { lat: number; lng: number; accuracy?: number } | null;
  startJourney: () => void;
  stopJourney: () => void;
  toggleGps: () => void;
  calibrateToCurrentLocation: () => void;
  teleportTo: (mapX: number, mapY: number) => void;
  walkStep: (dx: number, dy: number) => void;
  resetToStart: () => void;
}

export function useGeolocation(): UseGeolocationReturn {
  const [isJourneyStarted, setIsJourneyStarted] = useState<boolean>(false);
  const isJourneyStartedRef = useRef<boolean>(false);
  isJourneyStartedRef.current = isJourneyStarted;

  const [playerPos, setPlayerPos] = useState<PlayerPosition>({
    mapX: INITIAL_PLAYER_POSITION.mapX,
    mapY: INITIAL_PLAYER_POSITION.mapY,
    altitude: 0,
    heading: 0,
    accuracy: 5,
    isRealGps: false,
  });

  const [isGpsAvailable, setIsGpsAvailable] = useState<boolean>(false);
  const [gpsActive, setGpsActive] = useState<boolean>(false);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [rawGps, setRawGps] = useState<{ lat: number; lng: number; accuracy?: number } | null>(null);

  // Calibration anchor: initialized to the exact user start coordinates
  const gpsAnchorRef = useRef<{ lat: number; lng: number; mapX: number; mapY: number }>({
    lat: START_LATITUDE,
    lng: START_LONGITUDE,
    mapX: INITIAL_PLAYER_POSITION.mapX,
    mapY: INITIAL_PLAYER_POSITION.mapY,
  });
  const firstFixReceivedRef = useRef<boolean>(false);
  const watchIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'geolocation' in navigator) {
      setIsGpsAvailable(true);
    }
  }, []);

  const handlePositionSuccess = useCallback((position: GeolocationPosition) => {
    const lat = position.coords.latitude;
    const lng = position.coords.longitude;
    const accuracy = position.coords.accuracy;
    const heading = position.coords.heading ?? undefined;

    setRawGps({ lat, lng, accuracy });
    setGpsError(null);

    const anchor = gpsAnchorRef.current;

    // Check if the user is physically near the neighborhood (~1.5 km)
    // If the user starts the GPS elsewhere, we anchor their first position to INICIO
    // so any relative walking moves them through the neighborhood
    const distFromOriginMeters = Math.hypot(
      (lat - START_LATITUDE) * 111139,
      (lng - START_LONGITUDE) * 111139 * Math.cos((START_LATITUDE * Math.PI) / 180)
    );

    if (!firstFixReceivedRef.current) {
      firstFixReceivedRef.current = true;
      // If user is far from the neighborhood (e.g. testing elsewhere),
      // anchor this first device GPS fix to INICIO (mapX, mapY) so walking tracks properly!
      if (distFromOriginMeters > 1500) {
        anchor.lat = lat;
        anchor.lng = lng;
        anchor.mapX = INITIAL_PLAYER_POSITION.mapX;
        anchor.mapY = INITIAL_PLAYER_POSITION.mapY;
      } else {
        // Physical user is actually at the neighborhood! Use exact anchor
        anchor.lat = START_LATITUDE;
        anchor.lng = START_LONGITUDE;
        anchor.mapX = INITIAL_PLAYER_POSITION.mapX;
        anchor.mapY = INITIAL_PLAYER_POSITION.mapY;
      }
    }

    if (!isJourneyStartedRef.current) {
      // User has not pressed "Comenzar" yet: avatar must stay strictly at INICIO
      return;
    }

    // Calculate delta in meters using equirectangular projection
    const dLat = lat - anchor.lat;
    const dLng = lng - anchor.lng;
    const latRad = (anchor.lat * Math.PI) / 180;

    const deltaMetersY = -dLat * 111139; // North is -Y in map coordinates
    const deltaMetersX = dLng * 111139 * Math.cos(latRad); // East is +X

    const deltaMapX = deltaMetersX / NEIGHBORHOOD_WIDTH_METERS;
    const deltaMapY = deltaMetersY / NEIGHBORHOOD_HEIGHT_METERS;

    const newX = Math.max(0.02, Math.min(0.98, anchor.mapX + deltaMapX));
    const newY = Math.max(0.02, Math.min(0.98, anchor.mapY + deltaMapY));

    setPlayerPos((prev) => ({
      mapX: newX,
      mapY: newY,
      accuracy: accuracy,
      heading: heading ?? prev.heading,
      isRealGps: true,
    }));
  }, []);

  const handlePositionError = useCallback((err: GeolocationPositionError) => {
    let msg = 'Error de GPS';
    if (err.code === 1) msg = 'Permiso de ubicación denegado en el navegador.';
    else if (err.code === 2) msg = 'Ubicación no disponible.';
    else if (err.code === 3) msg = 'Tiempo de espera agotado al consultar GPS.';
    setGpsError(msg);
  }, []);

  const startGpsWatch = useCallback(() => {
    if (!navigator.geolocation) {
      setGpsError('Geolocalización no soportada en este dispositivo.');
      return;
    }
    setGpsActive(true);
    setGpsError(null);

    watchIdRef.current = navigator.geolocation.watchPosition(
      handlePositionSuccess,
      handlePositionError,
      {
        enableHighAccuracy: true,
        maximumAge: 2000,
        timeout: 10000,
      }
    );
  }, [handlePositionSuccess, handlePositionError]);

  const stopGpsWatch = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setGpsActive(false);
    setPlayerPos((prev) => ({ ...prev, isRealGps: false }));
  }, []);

  const startJourney = useCallback(() => {
    setIsJourneyStarted(true);
    isJourneyStartedRef.current = true;
    firstFixReceivedRef.current = false;
    gpsAnchorRef.current = {
      lat: START_LATITUDE,
      lng: START_LONGITUDE,
      mapX: INITIAL_PLAYER_POSITION.mapX,
      mapY: INITIAL_PLAYER_POSITION.mapY,
    };
    startGpsWatch();
  }, [startGpsWatch]);

  const stopJourney = useCallback(() => {
    setIsJourneyStarted(false);
    isJourneyStartedRef.current = false;
    stopGpsWatch();
    setPlayerPos({
      mapX: INITIAL_PLAYER_POSITION.mapX,
      mapY: INITIAL_PLAYER_POSITION.mapY,
      altitude: 0,
      heading: 0,
      accuracy: 5,
      isRealGps: false,
    });
  }, [stopGpsWatch]);

  const toggleGps = useCallback(() => {
    if (isJourneyStartedRef.current) {
      stopJourney();
    } else {
      startJourney();
    }
  }, [startJourney, stopJourney]);

  const calibrateToCurrentLocation = useCallback(() => {
    if (rawGps) {
      // Re-anchor current real GPS coords to current player position or INICIO
      gpsAnchorRef.current = {
        lat: rawGps.lat,
        lng: rawGps.lng,
        mapX: playerPos.mapX,
        mapY: playerPos.mapY,
      };
      setGpsError(null);
    } else {
      startJourney();
    }
  }, [rawGps, playerPos.mapX, playerPos.mapY, startJourney]);

  const teleportTo = useCallback((mapX: number, mapY: number) => {
    if (!isJourneyStartedRef.current) return;
    setPlayerPos((prev) => ({
      ...prev,
      mapX: Math.max(0.02, Math.min(0.98, mapX)),
      mapY: Math.max(0.02, Math.min(0.98, mapY)),
    }));
    // Re-anchor if GPS active
    if (rawGps) {
      gpsAnchorRef.current = {
        lat: rawGps.lat,
        lng: rawGps.lng,
        mapX,
        mapY,
      };
    }
  }, [rawGps]);

  const walkStep = useCallback((dx: number, dy: number) => {
    setPlayerPos((prev) => {
      const nextX = Math.max(0.02, Math.min(0.98, prev.mapX + dx));
      const nextY = Math.max(0.02, Math.min(0.98, prev.mapY + dy));
      let angle = prev.heading || 0;
      if (dx !== 0 || dy !== 0) {
        angle = Math.atan2(dx, -dy) * (180 / Math.PI);
      }
      return {
        ...prev,
        mapX: nextX,
        mapY: nextY,
        heading: angle,
      };
    });
  }, []);

  const resetToStart = useCallback(() => {
    gpsAnchorRef.current = {
      lat: START_LATITUDE,
      lng: START_LONGITUDE,
      mapX: INITIAL_PLAYER_POSITION.mapX,
      mapY: INITIAL_PLAYER_POSITION.mapY,
    };
    firstFixReceivedRef.current = false;
    setPlayerPos({
      mapX: INITIAL_PLAYER_POSITION.mapX,
      mapY: INITIAL_PLAYER_POSITION.mapY,
      altitude: 0,
      heading: 0,
      accuracy: 5,
      isRealGps: false,
    });
  }, []);

  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  return {
    playerPos,
    isGpsAvailable,
    gpsActive,
    isJourneyStarted,
    gpsError,
    rawGps,
    startJourney,
    stopJourney,
    toggleGps,
    calibrateToCurrentLocation,
    teleportTo,
    walkStep,
    resetToStart,
  };
}
