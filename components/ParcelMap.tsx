"use client";

import { useEffect, useRef } from "react";

type MapMarkerData = {
  id: number;
  title: string;
  lat: number;
  lng: number;
};

type Props = {
  markers: MapMarkerData[];
  activeMarkerId?: number;
  onSelectMarker: (id: number) => void;
  onBoundsChange: (bounds: { north: number; south: number; east: number; west: number }) => void;
};

type GoogleMapsApi = {
  Map: new (el: HTMLElement, cfg: Record<string, unknown>) => {
    panTo: (coords: { lat: number; lng: number }) => void;
    setZoom: (lvl: number) => void;
  };
  marker?: {
    AdvancedMarkerElement: new (cfg: {
      map: unknown;
      position: { lat: number; lng: number };
      title?: string;
      gmpClickable?: boolean;
    }) => {
      addListener: (event: string, handler: () => void) => void;
    };
  };
  Rectangle: new (cfg: {
    map: unknown;
    bounds: { north: number; south: number; east: number; west: number };
    editable?: boolean;
    draggable?: boolean;
    strokeColor?: string;
    strokeOpacity?: number;
    strokeWeight?: number;
    fillColor?: string;
    fillOpacity?: number;
  }) => {
    setBounds?: (bounds: { north: number; south: number; east: number; west: number }) => void;
    setMap?: (map: unknown) => void;
    getBounds?: () => {
      getNorthEast: () => { lat: () => number; lng: () => number };
      getSouthWest: () => { lat: () => number; lng: () => number };
    };
    addListener: (event: string, handler: () => void) => void;
  };
};

type GoogleWindow = Window & {
  google?: { maps: GoogleMapsApi };
  [key: string]: (() => void) | unknown;
};

const GOOGLE_MAPS_SCRIPT_ID = "agri-con-google-maps";
let googleMapsLoader: Promise<void> | null = null;

function loadGoogleMapsApi(key: string) {
  if (typeof window === "undefined") return Promise.reject();
  const w = window as unknown as GoogleWindow;
  if (w.google?.maps) return Promise.resolve();
  if (googleMapsLoader) return googleMapsLoader;

  googleMapsLoader = new Promise<void>((resolve, reject) => {
    const callback = "agriConGoogleMapsReady";
    w[callback] = () => { resolve(); delete w[callback]; };
    const script = document.createElement("script");
    script.id = GOOGLE_MAPS_SCRIPT_ID;
    script.async = true;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${key}&loading=async&libraries=marker&v=weekly&callback=${callback}`;
    script.onerror = () => { googleMapsLoader = null; reject(); };
    document.head.appendChild(script);
  });
  return googleMapsLoader;
}

export default function ParcelMap({
  markers,
  activeMarkerId,
  onSelectMarker,
  onBoundsChange,
}: Props) {
  const ref = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const rectangleRef = useRef<any>(null);

  const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";
  // Fall back to DEMO_MAP_ID to allow Advanced Markers to render if env is missing
  const mapId = process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID || "DEMO_MAP_ID";

  // Initialize the Base Map Canvas Instance
  useEffect(() => {
    if (!ref.current || !key || mapRef.current) return;

    loadGoogleMapsApi(key).then(() => {
      const w = window as unknown as GoogleWindow;
      if (!w.google?.maps || !ref.current) return;

      const initialCenter = markers.length > 0
        ? { lat: markers[0].lat, lng: markers[0].lng }
        : { lat: 14.5995, lng: 120.9842 };

      const instance = new w.google.maps.Map(ref.current, {
        center: initialCenter,
        zoom: 12,
        mapId: mapId,
        mapTypeControl: false,
        fullscreenControl: false,
        streetViewControl: false,
      });

      mapRef.current = instance;

      const AdvancedMarkerElement = w.google.maps.marker?.AdvancedMarkerElement;
      if (AdvancedMarkerElement) {
        markers.forEach((m) => {
          const advMarker = new AdvancedMarkerElement({
            map: instance,
            position: { lat: m.lat, lng: m.lng },
            title: m.title,
            gmpClickable: true,
          });

          // Fixed: Changed from 'click' to 'gmp-click' for modern advanced markers
          advMarker.addListener("gmp-click", () => {
            onSelectMarker(m.id);
          });
        });
      }
    }).catch(() => {});
  }, [key, mapId, markers, onSelectMarker]);

  // Handle Canvas Resizing Overlay & Center Pan Triggers when active parcel updates
  useEffect(() => {
    const instance = mapRef.current;
    if (!instance) return;

    const w = window as unknown as GoogleWindow;
    const activeTarget = markers.find((m) => m.id === activeMarkerId);

    if (!activeTarget) {
      if (rectangleRef.current) {
        rectangleRef.current.setMap(null);
        rectangleRef.current = null;
      }
      return;
    }

    const targetCoords = { lat: activeTarget.lat, lng: activeTarget.lng };
    instance.panTo(targetCoords);
    instance.setZoom(13);

    if (rectangleRef.current) {
      rectangleRef.current.setBounds({
        north: targetCoords.lat + 0.05,
        south: targetCoords.lat - 0.05,
        east: targetCoords.lng + 0.05,
        west: targetCoords.lng - 0.05,
      });
    } else if (w.google?.maps) {
      const rectangle = new w.google.maps.Rectangle({
        map: instance,
        bounds: {
          north: targetCoords.lat + 0.05,
          south: targetCoords.lat - 0.05,
          east: targetCoords.lng + 0.05,
          west: targetCoords.lng - 0.05,
        },
        editable: true,
        draggable: true,
        strokeColor: "#10b981",
        strokeOpacity: 0.8,
        strokeWeight: 2,
        fillColor: "#10b981",
        fillOpacity: 0.1,
      });

      const bubbleUpNewBounds = () => {
        if (!rectangle.getBounds) return;
        const b = rectangle.getBounds();
        onBoundsChange({
          north: b.getNorthEast().lat(),
          south: b.getSouthWest().lat(),
          east: b.getNorthEast().lng(),
          west: b.getSouthWest().lng(),
        });
      };

      rectangle.addListener("bounds_changed", bubbleUpNewBounds);
      rectangleRef.current = rectangle;
    }
  }, [activeMarkerId, markers, onBoundsChange]);

  // Fixed: Removed absolute height pixel limits (min-h-[500px]) to respect parent canvas coordinates
  return <div ref={ref} className="h-full w-full" />;
}
