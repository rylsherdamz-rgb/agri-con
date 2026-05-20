"use client";

import { useEffect, useRef } from "react";

type Props = {
  lat: number;
  lng: number;
  title: string;
  selectedCenter?: { lat: number; lng: number };
  selectionSpan?: number;
  onPick?: (coords: { lat: number; lng: number }) => void;
};

type GoogleMapsApi = {
  Map: new (el: HTMLElement, cfg: Record<string, unknown>) => {
    addListener: (event: string, handler: (evt: { latLng?: { lat: () => number; lng: () => number } }) => void) => void;
  };
  Marker?: new (cfg: {
    map: unknown;
    position: { lat: number; lng: number };
    title?: string;
  }) => {
    setPosition?: (coords: { lat: number; lng: number }) => void;
    setMap?: (map: unknown) => void;
  };
  marker?: {
    AdvancedMarkerElement: new (cfg: {
      map: unknown;
      position: { lat: number; lng: number };
      title?: string;
    }) => {
      position?: { lat: number; lng: number };
      map?: unknown;
    };
  };
  Rectangle: new (cfg: {
    map: unknown;
    bounds: { north: number; south: number; east: number; west: number };
    strokeColor?: string;
    strokeOpacity?: number;
    strokeWeight?: number;
    fillColor?: string;
    fillOpacity?: number;
  }) => {
    setBounds?: (bounds: { north: number; south: number; east: number; west: number }) => void;
  };
};

type GoogleWindow = Window & {
  google?: {
    maps: GoogleMapsApi;
  };
  [key: string]: (() => void) | unknown;
};

const GOOGLE_MAPS_SCRIPT_ID = "agri-con-google-maps";
let googleMapsLoader: Promise<void> | null = null;

function loadGoogleMapsApi(key: string) {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Google Maps can only load in the browser."));
  }

  const w = window as unknown as GoogleWindow;
  if (w.google?.maps) {
    return Promise.resolve();
  }

  if (googleMapsLoader) {
    return googleMapsLoader;
  }

  googleMapsLoader = new Promise<void>((resolve, reject) => {
    const existingScript = document.getElementById(GOOGLE_MAPS_SCRIPT_ID) as HTMLScriptElement | null;
    const callback = "agriConGoogleMapsReady";

    w[callback] = () => {
      resolve();
      delete w[callback];
    };

    if (existingScript) {
      existingScript.addEventListener("load", () => resolve(), { once: true });
      existingScript.addEventListener("error", () => reject(new Error("Google Maps failed to load.")), {
        once: true,
      });
      return;
    }

    const script = document.createElement("script");
    script.id = GOOGLE_MAPS_SCRIPT_ID;
    script.async = true;
    script.defer = true;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${key}&loading=async&libraries=marker&v=weekly&callback=${callback}`;
    script.onerror = () => {
      googleMapsLoader = null;
      reject(new Error("Google Maps failed to load."));
      delete w[callback];
    };
    document.head.appendChild(script);
  });

  return googleMapsLoader;
}

function buildBounds(center: { lat: number; lng: number }, span: number) {
  return {
    north: center.lat + span,
    south: center.lat - span,
    east: center.lng + span,
    west: center.lng - span,
  };
}

export default function ParcelMap({
  lat,
  lng,
  title,
  selectedCenter,
  selectionSpan = 0.08,
  onPick,
}: Props) {
  const ref = useRef<HTMLDivElement | null>(null);
  const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";
  const mapId = process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID ?? "";

  useEffect(() => {
    if (!ref.current || !key) return;
    let cancelled = false;

    void loadGoogleMapsApi(key)
      .then(() => {
        if (cancelled) return;

        const w = window as unknown as GoogleWindow;
        if (!w.google?.maps || !ref.current) return;

        const center = { lat, lng };
        const activeCenter = selectedCenter ?? center;
        const map = new w.google.maps.Map(ref.current, {
          center,
          zoom: 10,
          ...(mapId ? { mapId } : {}),
          mapTypeControl: false,
          fullscreenControl: false,
          streetViewControl: false,
        });

        const AdvancedMarkerElement = w.google.maps.marker?.AdvancedMarkerElement;
        const useAdvancedMarker = Boolean(mapId && AdvancedMarkerElement);
        const advancedMarker = useAdvancedMarker
          ? new AdvancedMarkerElement!({
              map,
              position: activeCenter,
              title,
            })
          : null;
        const legacyMarker =
          !useAdvancedMarker && w.google.maps.Marker
            ? new w.google.maps.Marker({
                map,
                position: activeCenter,
                title,
              })
            : null;
        const rectangle = new w.google.maps.Rectangle({
          map,
          bounds: buildBounds(activeCenter, selectionSpan),
          strokeColor: "#facc15",
          strokeOpacity: 0.9,
          strokeWeight: 2,
          fillColor: "#facc15",
          fillOpacity: 0.12,
        });

        map.addListener("click", (event) => {
          const point = event.latLng;
          if (!point || !onPick) return;
          const next = { lat: point.lat(), lng: point.lng() };
          if (advancedMarker) {
            advancedMarker.position = next;
          }
          if (legacyMarker) {
            legacyMarker.setPosition?.(next);
          }
          rectangle.setBounds?.(buildBounds(next, selectionSpan));
          onPick(next);
        });
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [key, mapId, lat, lng, title, onPick, selectedCenter, selectionSpan]);

  if (!key) {
    return (
      <div className="space-y-3 p-4">
        <iframe
          title={title}
          className="h-80 w-full rounded-2xl border-0"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          src={`https://maps.google.com/maps?q=${lat},${lng}&z=10&output=embed`}
        />
        <button
          type="button"
          onClick={() => onPick?.(selectedCenter ?? { lat, lng })}
          className="inline-flex min-h-11 items-center justify-center rounded-full border border-stone-300 px-4 py-2 text-sm font-semibold text-stone-900"
        >
          Use current parcel center
        </button>
      </div>
    );
  }

  return <div ref={ref} className="h-80 w-full" />;
}
