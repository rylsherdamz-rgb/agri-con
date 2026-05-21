"use client";

import { useEffect, useRef, useState } from "react";

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
  drawMode?: "rect" | "polygon" | "none";
  onPolygonComplete?: (coords: { lat: number; lng: number }[]) => void;
  polygonCoords?: { lat: number; lng: number }[];
  polygonCenter?: { lat: number; lng: number } | null;
};

type GoogleWindow = Window & {
  google?: {
    maps: {
      Map: new (el: HTMLElement, cfg: Record<string, unknown>) => {
        panTo?: (p: unknown) => void;
        setZoom?: (z: number) => void;
        getCenter?: () => { lat: () => number; lng: () => number };
        fitBounds?: (b: unknown) => void;
      };
      LatLng: new (lat: number, lng: number) => unknown;
      LatLngBounds: new (sw: unknown, ne: unknown) => unknown;
      drawing: {
        DrawingManager: new (cfg: Record<string, unknown>) => {
          setMap: (m: unknown) => void;
          setDrawingMode: (mode: unknown) => void;
          setOptions: (opts: Record<string, unknown>) => void;
          addListener: (event: string, cb: (poly: unknown) => void) => google.maps.MapsEventListener;
          getDrawingManagerInstance?: () => unknown;
        };
      };
      OverlayType: { POLYGON: string };
      marker?: {
        AdvancedMarkerElement: new (cfg: Record<string, unknown>) => {
          addListener: (e: string, h: () => void) => void;
          setMap: (m: unknown) => void;
          position?: unknown;
          title?: string;
        };
      };
      MapsEventListener: unknown;
      Rectangle: new (cfg: Record<string, unknown>) => {
        setBounds: (b: unknown) => void;
        setMap: (m: unknown) => void;
        getBounds: () => { getNorthEast: () => { lat: () => number; lng: () => number }; getSouthWest: () => { lat: () => number; lng: () => number } };
        addListener: (e: string, h: () => void) => void;
      };
      Polygon: new (cfg: Record<string, unknown>) => {
        setMap: (m: unknown) => void;
        getPath: () => { getArray: () => { lat: () => number; lng: () => number }[]; getLength: () => number };
        addListener: (e: string, h: () => void) => void;
        setOptions: (o: Record<string, unknown>) => void;
      };
    };
  };
  [key: string]: (() => void) | unknown;
};

const SCRIPT_ID = "agri-con-google-maps";
let loader: Promise<void> | null = null;

function loadApi(key: string): Promise<void> {
  if (typeof window === "undefined") return Promise.reject(new Error("SSR"));
  const w = window as unknown as GoogleWindow;
  if (w.google?.maps?.Map && w.google?.maps?.drawing) return Promise.resolve();
  if (loader) return loader;

  loader = new Promise<void>((resolve, reject) => {
    const cb = "agriConMapsReady";
    w[cb] = () => { resolve(); delete w[cb]; };
    const s = document.createElement("script");
    s.id = SCRIPT_ID;
    s.async = true;
    s.src = `https://maps.googleapis.com/maps/api/js?key=${key}&loading=async&libraries=marker,drawing&v=weekly&callback=${cb}`;
    s.onerror = () => { loader = null; reject(new Error("Maps load failed")); };
    document.head.appendChild(s);
  });
  return loader;
}

function extractPolygonCoords(polygon: unknown): { lat: number; lng: number }[] {
  try {
    const p = polygon as { getPath: () => { getArray: () => { lat: () => number; lng: () => number }[] } };
    return p.getPath().getArray().map((ll) => ({ lat: ll.lat(), lng: ll.lng() }));
  } catch {
    return [];
  }
}

export default function ParcelMap({
  markers,
  activeMarkerId,
  onSelectMarker,
  onBoundsChange,
  drawMode = "rect",
  onPolygonComplete,
  polygonCoords = [],
  polygonCenter,
}: Props) {
  const ref = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<Record<string, unknown> | null>(null);
  const markersRef = useRef<unknown[]>([]);
  const rectRef = useRef<{ setBounds: (b: unknown) => void; setMap: (m: unknown) => void; addListener: (e: string, h: () => void) => void } | null>(null);
  const drawingRef = useRef<{ setMap: (m: unknown) => void; setDrawingMode: (m: unknown) => void; addListener: (e: string, cb: (poly: unknown) => void) => void } | null>(null);
  const polygonRef = useRef<{ setMap: (m: unknown) => void } | null>(null);
  const centerMarkerRef = useRef<{ setMap: (m: unknown) => void } | null>(null);
  const [drawing, setDrawing] = useState(false);

  const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";

  type GMap = {
    Map: new (el: HTMLElement, cfg: Record<string, unknown>) => Record<string, unknown>;
    LatLng: new (lat: number, lng: number) => unknown;
    LatLngBounds: new (sw: unknown, ne: unknown) => unknown;
    marker?: { AdvancedMarkerElement: new (cfg: Record<string, unknown>) => Record<string, unknown> };
    Polygon: new (cfg: Record<string, unknown>) => Record<string, unknown>;
    Rectangle: new (cfg: Record<string, unknown>) => {
      setBounds: (b: unknown) => void;
      setMap: (m: unknown) => void;
      getBounds: () => { getNorthEast: () => { lat: () => number; lng: () => number }; getSouthWest: () => { lat: () => number; lng: () => number } };
      addListener: (e: string, h: () => void) => void;
    };
    drawing: {
      DrawingManager: new (cfg: Record<string, unknown>) => {
        setMap: (m: unknown) => void;
        setDrawingMode: (m: unknown) => void;
        addListener: (e: string, cb: (poly: unknown) => void) => void;
      };
      OverlayType: { POLYGON: string };
    };
  };

  // Init map — only once
  useEffect(() => {
    if (!ref.current || !key || mapRef.current) return;
    let cancelled = false;

    loadApi(key).then(() => {
      if (cancelled || !ref.current) return;
      const w = window as unknown as GoogleWindow;
      const gmap = w.google?.maps as GMap | undefined;
      if (!gmap) return;

      const center = markers.length > 0
        ? { lat: markers[0].lat, lng: markers[0].lng }
        : { lat: 14.5995, lng: 120.9842 };

      const map = new gmap.Map(ref.current, {
        center,
        zoom: 12,
        mapTypeControl: false,
        fullscreenControl: false,
        streetViewControl: false,
      });
      mapRef.current = map;
    }).catch(() => {});

    return () => { cancelled = true; };
    // Only run on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  // Update markers whenever markers/onSelectMarker changes
  useEffect(() => {
    const w = window as unknown as GoogleWindow;
    const gmap = w.google?.maps as GMap | undefined;
    if (!gmap?.marker?.AdvancedMarkerElement || !mapRef.current) return;

    // Clear old markers
    markersRef.current.forEach((m) => {
      try { (m as { setMap: (m: null) => void }).setMap(null); } catch {}
    });
    markersRef.current = [];

    const Adv = gmap.marker.AdvancedMarkerElement;
    markers.forEach((m) => {
      const am = new Adv({
        map: mapRef.current,
        position: { lat: m.lat, lng: m.lng },
        title: m.title,
        gmpClickable: true,
      });
      try {
        (am as { addListener: (e: string, h: () => void) => void }).addListener("gmp-click", () => onSelectMarker(m.id));
      } catch {}
      markersRef.current.push(am);
    });
  }, [markers, onSelectMarker]);

  // Handle activeMarkerId — show rectangle
  useEffect(() => {
    const w = window as unknown as GoogleWindow;
    const gmap = w.google?.maps as GMap | undefined;
    if (!gmap || !mapRef.current) return;

    // If no active marker, remove rectangle
    if (activeMarkerId == null) {
      if (rectRef.current) {
        rectRef.current.setMap(null);
        rectRef.current = null;
      }
      return;
    }

    const active = markers.find((m) => m.id === activeMarkerId);
    if (!active) return;

    (mapRef.current as { panTo?: (p: unknown) => void }).panTo?.({ lat: active.lat, lng: active.lng });
    (mapRef.current as { setZoom?: (z: number) => void }).setZoom?.(13);

    if (rectRef.current) {
      const bounds = new gmap.LatLngBounds(
        new gmap.LatLng(active.lat - 0.05, active.lng - 0.05),
        new gmap.LatLng(active.lat + 0.05, active.lng + 0.05),
      );
      rectRef.current.setBounds(bounds);
    } else {
      const rect = new gmap.Rectangle({
        map: mapRef.current,
        bounds: { north: active.lat + 0.05, south: active.lat - 0.05, east: active.lng + 0.05, west: active.lng - 0.05 },
        editable: true,
        draggable: true,
        strokeColor: "#10b981",
        strokeOpacity: 0.8,
        strokeWeight: 2,
        fillColor: "#10b981",
        fillOpacity: 0.1,
      });
      rect.addListener("bounds_changed", () => {
        try {
          const b = rect.getBounds();
          if (b) {
            onBoundsChange({
              north: b.getNorthEast().lat(),
              south: b.getSouthWest().lat(),
              east: b.getNorthEast().lng(),
              west: b.getSouthWest().lng(),
            });
          }
        } catch {}
      });
      rectRef.current = rect;
    }
  }, [activeMarkerId, markers, onBoundsChange]);

  // Polygon drawing mode
  useEffect(() => {
    const w = window as unknown as GoogleWindow;
    const gmap = w.google?.maps as GMap | undefined;
    if (!gmap || !mapRef.current) return;

    if (drawMode === "polygon" && gmap.drawing) {
      // Remove old polygon overlay and center marker before drawing new one
      if (polygonRef.current) { polygonRef.current.setMap(null); polygonRef.current = null; }
      if (centerMarkerRef.current) { centerMarkerRef.current.setMap(null); centerMarkerRef.current = null; }

      // Only create DrawingManager once
      if (!drawingRef.current) {
        const dm = new gmap.drawing.DrawingManager({
          map: mapRef.current,
          drawingMode: gmap.drawing.OverlayType.POLYGON,
          drawingControl: false,
          polygonOptions: {
            strokeColor: "#10b981",
            strokeOpacity: 0.8,
            strokeWeight: 2,
            fillColor: "#10b981",
            fillOpacity: 0.15,
            editable: true,
          },
        });
        dm.addListener("polygoncomplete", (poly: unknown) => {
          polygonRef.current = poly as { setMap: (m: unknown) => void };
          const coords = extractPolygonCoords(poly);
          if (coords.length >= 3) {
            onPolygonComplete?.(coords);
          }
          dm.setDrawingMode(null);
          setDrawing(false);
        });
        drawingRef.current = dm;
      } else {
        drawingRef.current.setMap(mapRef.current);
      }
      drawingRef.current.setDrawingMode(gmap.drawing.OverlayType.POLYGON);
      setDrawing(true);
    } else {
      if (drawingRef.current) {
        drawingRef.current.setDrawingMode(null);
        setDrawing(false);
      }
    }

    return () => {
      if (drawingRef.current) {
        drawingRef.current.setDrawingMode(null);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drawMode]);

  // Display saved polygon overlay + center marker
  useEffect(() => {
    const w = window as unknown as GoogleWindow;
    const gmap = w.google?.maps as GMap | undefined;
    if (!gmap || !mapRef.current) return;

    // Clear old
    if (polygonRef.current) { polygonRef.current.setMap(null); polygonRef.current = null; }
    if (centerMarkerRef.current) { centerMarkerRef.current.setMap(null); centerMarkerRef.current = null; }

    if (polygonCoords.length >= 3 && gmap.Polygon) {
      const poly = new gmap.Polygon({
        map: mapRef.current,
        paths: polygonCoords,
        strokeColor: "#8b5cf6",
        strokeOpacity: 0.8,
        strokeWeight: 2,
        fillColor: "#8b5cf6",
        fillOpacity: 0.15,
        editable: false,
        draggable: false,
      });
      polygonRef.current = poly as { setMap: (m: unknown) => void };
    }

    if (polygonCenter && gmap.marker?.AdvancedMarkerElement) {
      const m = new gmap.marker.AdvancedMarkerElement({
        map: mapRef.current,
        position: polygonCenter,
        title: "Area Center",
        gmpClickable: true,
      });
      centerMarkerRef.current = m as { setMap: (m: unknown) => void };
    }
  }, [polygonCoords, polygonCenter]);

  return (
    <div className="relative h-full w-full">
      <div ref={ref} className="h-full w-full" />
      {drawing && (
        <div className="absolute bottom-3 left-3 rounded-lg bg-emerald-900/85 px-3 py-1.5 text-xs font-medium text-emerald-100 shadow-lg">
          Click to place polygon vertices. Click first vertex again to close.
        </div>
      )}
    </div>
  );
}