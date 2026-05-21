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
      Map: new (el: HTMLElement, cfg: Record<string, unknown>) => Record<string, unknown>;
      LatLng: new (lat: number, lng: number) => { lat: () => number; lng: () => number };
      drawing: {
        DrawingManager: new (cfg: {
          map: unknown;
          drawingMode?: unknown;
          drawingControl?: boolean;
          drawingControlOptions?: Record<string, unknown>;
          polygonOptions?: Record<string, unknown>;
        }) => {
          setMap: (map: unknown) => void;
          setDrawingMode: (mode: unknown) => void;
          setOptions: (opts: Record<string, unknown>) => void;
          addListener: (event: string, cb: (...args: unknown[]) => void) => void;
          getDrawingManagerInstance?: () => unknown;
        };
      };
      OverlayType: { POLYGON: unknown };
      marker?: {
        AdvancedMarkerElement: new (cfg: {
          map: unknown;
          position: { lat: number; lng: number };
          title?: string;
          gmpClickable?: boolean;
        }) => { addListener: (e: string, h: () => void) => void; setMap: (m: unknown) => void };
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
        setBounds?: (b: { north: number; south: number; east: number; west: number }) => void;
        setMap?: (m: unknown) => void;
        getBounds?: () => {
          getNorthEast: () => { lat: () => number; lng: () => number };
          getSouthWest: () => { lat: () => number; lng: () => number };
        };
        addListener: (e: string, h: () => void) => void;
      };
      Polygon: new (cfg: {
        map: unknown;
        paths: { lat: number; lng: number }[];
        strokeColor?: string;
        strokeOpacity?: number;
        strokeWeight?: number;
        fillColor?: string;
        fillOpacity?: number;
        editable?: boolean;
        draggable?: boolean;
      }) => {
        setMap: (m: unknown) => void;
        getPath: () => {
          getArray: () => { lat: () => number; lng: () => number }[];
          getLength: () => number;
        };
        addListener: (e: string, h: () => void) => void;
        setOptions: (o: Record<string, unknown>) => void;
      };
    };
  };
  [key: string]: (() => void) | unknown;
};

const SCRIPT_ID = "agri-con-google-maps";
let loader: Promise<void> | null = null;

function loadApi(key: string) {
  if (typeof window === "undefined") return Promise.reject();
  const w = window as unknown as GoogleWindow;
  if (w.google?.maps?.drawing) return Promise.resolve();
  if (loader) return loader;

  loader = new Promise<void>((resolve, reject) => {
    const cb = "agriConMapsReady";
    w[cb] = () => { resolve(); delete w[cb]; };
    const s = document.createElement("script");
    s.id = SCRIPT_ID;
    s.async = true;
    s.src = `https://maps.googleapis.com/maps/api/js?key=${key}&loading=async&libraries=marker,drawing&v=weekly&callback=${cb}`;
    s.onerror = () => { loader = null; reject(); };
    document.head.appendChild(s);
  });
  return loader;
}

function extractPolygonCoords(polygon: unknown): { lat: number; lng: number }[] {
  try {
    const p = polygon as {
      getPath: () => { getArray: () => { lat: () => number; lng: () => number }[] };
    };
    const path = p.getPath();
    const arr = path.getArray();
    return arr.map((ll) => ({ lat: ll.lat(), lng: ll.lng() }));
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
  const mapRef = useRef<unknown>(null);
  const rectRef = useRef<unknown>(null);
  const drawingRef = useRef<unknown>(null);
  const polygonRef = useRef<unknown>(null);
  const centerMarkerRef = useRef<unknown>(null);
  const [drawing, setDrawing] = useState(false);

  const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";
  const mapId = process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID || "DEMO_MAP_ID";

  // Init map
  useEffect(() => {
    if (!ref.current || !key || mapRef.current) return;
    loadApi(key).then(() => {
      const w = window as unknown as GoogleWindow;
      const gmap = w.google?.maps;
      if (!gmap || !ref.current) return;

      const center = markers.length > 0
        ? { lat: markers[0].lat, lng: markers[0].lng }
        : { lat: 14.5995, lng: 120.9842 };

      const map = new gmap.Map(ref.current, {
        center,
        zoom: 12,
        mapId,
        mapTypeControl: false,
        fullscreenControl: false,
        streetViewControl: false,
      });
      mapRef.current = map;

      const Adv = gmap.marker?.AdvancedMarkerElement;
      if (Adv) {
        markers.forEach((m) => {
          const am = new Adv({ map, position: { lat: m.lat, lng: m.lng }, title: m.title, gmpClickable: true });
          am.addListener("gmp-click", () => onSelectMarker(m.id));
        });
      }
    }).catch(() => {});
  }, [key, mapId, markers, onSelectMarker]);

  // Handle active marker — show rectangle
  useEffect(() => {
    const gmap = (window as unknown as GoogleWindow).google?.maps;
    const active = markers.find((m) => m.id === activeMarkerId);
    if (!active || !mapRef.current || !gmap) return;

    (mapRef.current as { panTo: unknown; setZoom: unknown }).panTo?.({ lat: active.lat, lng: active.lng });
    (mapRef.current as { setZoom: unknown }).setZoom?.(13);

    if (rectRef.current) {
      (rectRef.current as { setBounds?: (b: Record<string, number>) => void }).setBounds?.({
        north: active.lat + 0.05, south: active.lat - 0.05,
        east: active.lng + 0.05, west: active.lng - 0.05,
      });
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
        const b = rect.getBounds?.();
        if (b) onBoundsChange({
          north: b.getNorthEast().lat(),
          south: b.getSouthWest().lat(),
          east: b.getNorthEast().lng(),
          west: b.getSouthWest().lng(),
        });
      });
      rectRef.current = rect;
    }
  }, [activeMarkerId, markers, onBoundsChange]);

  // Polygon drawing mode
  useEffect(() => {
    const w = window as unknown as GoogleWindow;
    const gmap = w.google?.maps;
    if (!gmap || !mapRef.current) return;

    const dm = drawingRef.current as {
      setDrawingMode?: (m: unknown) => void;
      setMap?: (m: unknown) => void;
    } | null;

    if (drawMode === "polygon" && gmap.drawing) {
      // Remove old polygon and marker
      if (polygonRef.current) {
        (polygonRef.current as { setMap: (m: null) => void }).setMap(null);
        polygonRef.current = null;
      }
      if (centerMarkerRef.current) {
        (centerMarkerRef.current as { setMap: (m: null) => void }).setMap(null);
        centerMarkerRef.current = null;
      }

      if (!dm) {
        const mgr = new gmap.drawing.DrawingManager({
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
            draggable: true,
          },
        });
        mgr.addListener("polygoncomplete", (poly: unknown) => {
          polygonRef.current = poly;
          const coords = extractPolygonCoords(poly);
          if (coords.length >= 3) {
            onPolygonComplete?.(coords);
          }
          // Switch drawing mode off so further clicks don't start new polygons
          mgr.setDrawingMode?.(null);
          setDrawing(false);
        });
        drawingRef.current = mgr;
        setDrawing(true);
      }
    } else if (drawMode === "none") {
      if (dm) {
        dm.setDrawingMode?.(null);
        setDrawing(false);
      }
    } else {
      if (dm) {
        dm.setDrawingMode?.(null);
        setDrawing(false);
      }
    }

    return () => {
      if (dm) dm.setDrawingMode?.(null);
    };
  }, [drawMode, onPolygonComplete]);

  // Display saved polygon overlay + center marker when polygonCoords changes
  useEffect(() => {
    const w = window as unknown as GoogleWindow;
    const gmap = w.google?.maps;
    if (!gmap || !mapRef.current) return;

    // Clear old polygon
    if (polygonRef.current) {
      (polygonRef.current as { setMap: (m: null) => void }).setMap(null);
      polygonRef.current = null;
    }
    // Clear old center marker
    if (centerMarkerRef.current) {
      (centerMarkerRef.current as { setMap: (m: null) => void }).setMap(null);
      centerMarkerRef.current = null;
    }

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
      polygonRef.current = poly;
    }

    if (polygonCenter && gmap.marker?.AdvancedMarkerElement) {
      const Adv = gmap.marker.AdvancedMarkerElement;
      const m = new Adv({
        map: mapRef.current,
        position: polygonCenter,
        title: "Area Center",
        gmpClickable: true,
      });
      centerMarkerRef.current = m;
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