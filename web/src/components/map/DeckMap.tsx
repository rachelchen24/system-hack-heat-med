"use client";
// Client-only map canvas: MapLibre (OpenFreeMap positron) + deck.gl overlay.
// Load it through next/dynamic with ssr:false (see MapCanvas.tsx).
import { useCallback, useEffect, useRef } from "react";
import { Map, NavigationControl, useControl, type MapRef } from "react-map-gl/maplibre";
import { MapboxOverlay, type MapboxOverlayProps } from "@deck.gl/mapbox";
import "maplibre-gl/dist/maplibre-gl.css";

export const BASEMAP_STYLE = "https://tiles.openfreemap.org/styles/positron";
const BUILDINGS_ID = "tml-3d-buildings";

function DeckOverlay(props: MapboxOverlayProps) {
  const overlay = useControl<MapboxOverlay>(() => new MapboxOverlay(props));
  overlay.setProps(props);
  return null;
}

export interface DeckMapProps {
  layers: MapboxOverlayProps["layers"];
  initialView: { longitude: number; latitude: number; zoom: number };
  /** Fit to these bounds [[minLon,minLat],[maxLon,maxLat]] when they change. */
  fitBounds?: [[number, number], [number, number]] | null;
  threeD: boolean;
  getTooltip?: MapboxOverlayProps["getTooltip"];
  onZoom?: (z: number) => void;
  height: number | string;
  ariaLabel: string;
}

function setBuildings(map: maplibregl.Map, on: boolean) {
  if (!map.isStyleLoaded() && !map.getSource("openmaptiles")) return;
  if (on && !map.getLayer(BUILDINGS_ID) && map.getSource("openmaptiles")) {
    map.addLayer({
      id: BUILDINGS_ID,
      type: "fill-extrusion",
      source: "openmaptiles",
      "source-layer": "building",
      minzoom: 13,
      paint: {
        "fill-extrusion-color": "#dedcd6",
        "fill-extrusion-height": ["coalesce", ["get", "render_height"], 8],
        "fill-extrusion-base": ["coalesce", ["get", "render_min_height"], 0],
        "fill-extrusion-opacity": 0.75,
      },
    });
  }
  if (!on && map.getLayer(BUILDINGS_ID)) map.removeLayer(BUILDINGS_ID);
}

export default function DeckMap({ layers, initialView, fitBounds, threeD, getTooltip, onZoom, height, ariaLabel }: DeckMapProps) {
  const ref = useRef<MapRef>(null);
  const threeDRef = useRef(threeD);

  const apply3D = useCallback((on: boolean) => {
    const m = ref.current?.getMap();
    if (!m) return;
    setBuildings(m, on);
    m.easeTo({ pitch: on ? 45 : 0, bearing: on ? -17 : 0, duration: 700 });
  }, []);

  useEffect(() => {
    threeDRef.current = threeD;
    apply3D(threeD);
  }, [threeD, apply3D]);

  useEffect(() => {
    if (!fitBounds) return;
    ref.current?.fitBounds(fitBounds, { padding: 48, maxZoom: 16, duration: 600 });
  }, [fitBounds]);

  return (
    <div style={{ height, width: "100%", position: "relative" }} role="region" aria-label={ariaLabel}>
      <Map
        ref={ref}
        initialViewState={{ ...initialView, pitch: 0, bearing: 0 }}
        mapStyle={BASEMAP_STYLE}
        style={{ width: "100%", height: "100%" }}
        maxPitch={60}
        attributionControl={{ compact: true }}
        onLoad={() => { if (threeDRef.current) apply3D(true); onZoom?.(ref.current?.getZoom() ?? initialView.zoom); }}
        onZoomEnd={(e) => onZoom?.(e.viewState.zoom)}
      >
        <NavigationControl position="top-right" visualizePitch />
        <DeckOverlay layers={layers} getTooltip={getTooltip} />
      </Map>
    </div>
  );
}
