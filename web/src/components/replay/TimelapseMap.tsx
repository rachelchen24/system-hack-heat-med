"use client";

import { useEffect, useMemo, useState } from "react";
import DeckGL from "@deck.gl/react";
import { FlyToInterpolator } from "@deck.gl/core";
import { PathLayer, ScatterplotLayer } from "@deck.gl/layers";
import { Map, type MapRef } from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
import * as maplibregl from "maplibre-gl";

// Turbopack can't bundle MapLibre's web worker, so serve the prebuilt one from /public
// (copied from node_modules/maplibre-gl/dist/maplibre-gl-worker.mjs, same version).
maplibregl.setWorkerUrl("/maplibre-gl-worker.mjs");
import type { HeatGrid, ReplayPatient } from "@/lib/replay";
import { GROUP_COLORS, heatRgba } from "./colors";

const BASEMAP = "https://tiles.openfreemap.org/styles/positron";
const SCALE = 14; // canvas pixels per grid cell (before blur)
const BAND = 2; // °F per color band

/** Draw the bilinear-interpolated, banded, blurred heat image for fractional time `tf` into `out`
 *  (radar look). Reuses the same canvases every frame so the map can animate them in place. */
function drawHeat(grid: HeatGrid, tf: number, scratch: HTMLCanvasElement, out: HTMLCanvasElement) {
  const nLat = grid.lats.length, nLon = grid.lons.length;
  const t0 = Math.max(0, Math.min(grid.f.length - 1, Math.floor(tf)));
  const t1 = Math.min(grid.f.length - 1, t0 + 1);
  const k = tf - t0;
  const val = (i: number, j: number) => {
    const a = grid.f[t0][i][j], b = grid.f[t1][i][j];
    if (a == null) return b;
    if (b == null) return a;
    return a + (b - a) * k;
  };
  const W = scratch.width, H = scratch.height;
  const ctx = scratch.getContext("2d")!;
  const img = ctx.createImageData(W, H);
  for (let y = 0; y < H; y++) {
    // canvas row 0 = north (last lat)
    const gy = (nLat - 1) * (1 - y / (H - 1));
    const i0 = Math.min(nLat - 2, Math.floor(gy)), fy = gy - i0;
    for (let x = 0; x < W; x++) {
      const gx = (nLon - 1) * (x / (W - 1));
      const j0 = Math.min(nLon - 2, Math.floor(gx)), fx = gx - j0;
      const v00 = val(i0, j0), v01 = val(i0, j0 + 1), v10 = val(i0 + 1, j0), v11 = val(i0 + 1, j0 + 1);
      if (v00 == null || v01 == null || v10 == null || v11 == null) continue;
      const exact = v00 * (1 - fx) * (1 - fy) + v01 * fx * (1 - fy) + v10 * (1 - fx) * fy + v11 * fx * fy;
      // 2 °F bands, like rain radar; the blur below softens the band edges into blobs.
      const v = Math.floor(exact / BAND) * BAND + BAND / 2;
      const [r, g, b, a] = heatRgba(v);
      const o = (y * W + x) * 4;
      img.data[o] = r;
      img.data[o + 1] = g;
      img.data[o + 2] = b;
      img.data[o + 3] = Math.round(a * 255);
    }
  }
  ctx.putImageData(img, 0, 0);
  const octx = out.getContext("2d")!;
  octx.clearRect(0, 0, W, H);
  octx.filter = `blur(${Math.round(SCALE * 0.6)}px)`;
  octx.drawImage(scratch, 0, 0);
  octx.filter = "none";
}

export default function TimelapseMap({
  grid,
  tf,
  patients,
  selected,
  route,
  onSelect,
}: {
  grid: HeatGrid;
  tf: number; // fractional hour index into grid.times
  patients: ReplayPatient[];
  selected: ReplayPatient | null;
  route: [number, number][] | null; // only for the selected patient, only when asked
  onSelect: (p: ReplayPatient | null) => void;
}) {
  const homeView = useMemo(() => {
    const lon = patients.reduce((s, p) => s + p.lon, 0) / Math.max(1, patients.length);
    const lat = patients.reduce((s, p) => s + p.lat, 0) / Math.max(1, patients.length);
    // Frame the patients' neighborhoods with enough of the city around them to see where heat differs.
    return { longitude: (lon || -73.89) - 0.03, latitude: (lat || 40.845) - 0.04, zoom: 10.9, pitch: 0, bearing: 0 };
  }, [patients]);
  // When a route is shown, fly in to it; otherwise stay where the user is.
  const initialViewState = useMemo(() => {
    if (!route || route.length < 2) return homeView;
    const xs = route.map((c) => c[0]), ys = route.map((c) => c[1]);
    const span = Math.max(Math.max(...xs) - Math.min(...xs), (Math.max(...ys) - Math.min(...ys)) * 1.3, 0.004);
    const zoom = Math.min(16.5, Math.max(12, Math.log2(360 / span) - 1.6));
    return {
      longitude: (Math.min(...xs) + Math.max(...xs)) / 2,
      latitude: (Math.min(...ys) + Math.max(...ys)) / 2,
      zoom,
      pitch: 0,
      bearing: 0,
      transitionDuration: 900,
      transitionInterpolator: new FlyToInterpolator(),
    };
  }, [route, homeView]);

  // The heat is drawn INSIDE the base map (under roads and labels, so streets stay readable) from one
  // live canvas that MapLibre re-reads every frame ("canvas" source, animate: true). Swapping in a new
  // image per frame doesn't work: each image loads asynchronously and gets cancelled by the next one.
  const [canvases] = useState(() => {
    const W = (grid.lons.length - 1) * SCALE, H = (grid.lats.length - 1) * SCALE;
    const mk = () => {
      const c = document.createElement("canvas");
      c.width = W;
      c.height = H;
      return c;
    };
    return { scratch: mk(), out: mk() };
  });
  useEffect(() => {
    drawHeat(grid, tf, canvases.scratch, canvases.out);
  }, [grid, tf, canvases]);
  const w = grid.lons[0], e = grid.lons[grid.lons.length - 1], s = grid.lats[0], n = grid.lats[grid.lats.length - 1];
  const coords: [[number, number], [number, number], [number, number], [number, number]] = [[w, n], [e, n], [e, s], [w, s]];
  function onMapLoad(ev: { target: ReturnType<MapRef["getMap"]> }) {
    const map = ev.target;
    const styleLayers = map.getStyle().layers ?? [];
    // Heat goes just below the first water layer (so water, roads and labels draw on top): the blobs
    // show over land, where people live. Falls back to below the first road / label layer.
    const before =
      styleLayers.find((l) => /water/i.test(l.id)) ??
      styleLayers.find((l) => /road|highway|tunnel|bridge|street|transportation/i.test(l.id) || l.type === "symbol");
    if (!map.getSource("heat")) {
      map.addSource("heat", { type: "canvas", canvas: canvases.out, coordinates: coords, animate: true });
      map.addLayer(
        { id: "heat-layer", type: "raster", source: "heat", paint: { "raster-opacity": 1, "raster-fade-duration": 0, "raster-resampling": "linear" } },
        before?.id,
      );
    }
  }

  const layers = [
    route &&
      new PathLayer({
        id: "route",
        data: [{ path: route }],
        getPath: (d: { path: [number, number][] }) => d.path,
        getColor: [20, 20, 20, 230],
        getWidth: 5,
        widthUnits: "pixels",
        capRounded: true,
        jointRounded: true,
      }),
    new ScatterplotLayer({
      id: "patients",
      data: patients,
      getPosition: (p: ReplayPatient) => [p.lon, p.lat],
      getRadius: (p: ReplayPatient) => (selected?.id === p.id ? 9 : 5),
      radiusUnits: "pixels",
      getFillColor: (p: ReplayPatient) => [...GROUP_COLORS[p.group].rgb, selected && selected.id !== p.id ? 110 : 255] as [number, number, number, number],
      getLineColor: (p: ReplayPatient) => (selected?.id === p.id ? [20, 20, 20] : p.group === "Medium" ? [122, 92, 0] : [255, 255, 255]),
      getLineWidth: (p: ReplayPatient) => (selected?.id === p.id ? 3 : 1),
      lineWidthUnits: "pixels",
      stroked: true,
      pickable: true,
      autoHighlight: true,
      highlightColor: [20, 20, 20, 60],
      updateTriggers: { getRadius: [selected?.id], getFillColor: [selected?.id], getLineColor: [selected?.id], getLineWidth: [selected?.id] },
    }),
    selected?.place &&
      new ScatterplotLayer({
        id: "place",
        data: [selected.place],
        getPosition: (d: NonNullable<ReplayPatient["place"]>) => [d.lon, d.lat],
        getRadius: 9,
        radiusUnits: "pixels",
        getFillColor: [255, 255, 255],
        getLineColor: [0, 114, 178],
        getLineWidth: 3,
        lineWidthUnits: "pixels",
        stroked: true,
      }),
  ].filter(Boolean);

  return (
    <DeckGL
      initialViewState={initialViewState}
      controller={{ dragRotate: false }}
      layers={layers}
      onClick={(info) => onSelect(info.layer?.id === "patients" ? (info.object as ReplayPatient) : null)}
      getCursor={({ isHovering }) => (isHovering ? "pointer" : "grab")}
      getTooltip={({ object, layer }) =>
        layer?.id === "patients" && object ? { text: `${(object as ReplayPatient).name} · ${(object as ReplayPatient).group} risk\nClick for their plan` } : null
      }
    >
      <Map mapLib={maplibregl} mapStyle={BASEMAP} attributionControl={{ compact: true }} onLoad={onMapLoad}>
      </Map>
    </DeckGL>
  );
}
