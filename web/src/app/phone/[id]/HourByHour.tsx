"use client";

import { useEffect, useState } from "react";
import { heatColor } from "@/components/replay/colors";

type Hour = { hour: number; f: number };

// Compact hour-by-hour heat for the patient plan: same hourly "feels like" data as Rachel's
// time-lapse (replay_heatwave_hourly.csv, June 24), one big line per hour, slider + play.
const L = {
  en: {
    play: "Play", pause: "Pause", feels: "feels like",
    ok: "OK to go out", careful: "Be careful", stay: "Stay inside",
    hour: (h: number) => (h === 0 ? "12 AM" : h < 12 ? `${h} AM` : h === 12 ? "12 PM" : `${h - 12} PM`),
  },
  es: {
    play: "Ver", pause: "Pausa", feels: "se siente como",
    ok: "Puede salir", careful: "Tenga cuidado", stay: "Quédese adentro",
    hour: (h: number) => (h === 0 ? "12 a.m." : h < 12 ? `${h} a.m.` : h === 12 ? "12 p.m." : `${h - 12} p.m.`),
  },
};

export function HourByHour({ hours, hotF, lang, startHour }: { hours: Hour[]; hotF: number; lang: "en" | "es"; startHour?: number }) {
  const l = L[lang];
  const first = Math.max(0, hours.findIndex((h) => h.hour === (startHour ?? 14)));
  const [i, setI] = useState(first);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => {
      setI((x) => {
        if (x >= hours.length - 1) { setPlaying(false); return x; }
        return x + 1;
      });
    }, 700);
    return () => clearInterval(id);
  }, [playing, hours.length]);

  if (!hours.length) return null;
  const h = hours[Math.min(i, hours.length - 1)];
  const f = Math.round(h.f);
  const level = f >= hotF ? "high" : f >= hotF - 6 ? "medium" : "low";
  const word = level === "high" ? l.stay : level === "medium" ? l.careful : l.ok;
  const tone = {
    high: "bg-risk-high-tint text-risk-high-ink",
    medium: "bg-risk-medium-tint text-risk-medium-ink",
    low: "bg-risk-low-tint text-risk-low-ink",
  }[level];

  return (
    <div className="space-y-3">
      <div className={`rounded-lg p-4 text-center ${tone}`} aria-live="polite">
        <p className="text-patient-xl font-bold leading-tight">{l.hour(h.hour)}</p>
        <p className="text-patient-lg font-semibold">{l.feels} {f}°F</p>
        <p className="text-patient-lg font-bold">{word}</p>
      </div>
      <div className="flex h-3 overflow-hidden rounded-full" aria-hidden>
        {hours.map((x, k) => (
          <span key={x.hour} className="flex-1" style={{ background: heatColor(x.f), outline: k === i ? "2px solid currentColor" : undefined }} />
        ))}
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => { if (i >= hours.length - 1) setI(0); setPlaying((p) => !p); }}
          className="min-h-tap shrink-0 rounded-md border border-input bg-background px-5 font-semibold"
        >
          {playing ? l.pause : `▶ ${l.play}`}
        </button>
        <input
          type="range"
          min={0}
          max={hours.length - 1}
          value={i}
          onChange={(e) => { setPlaying(false); setI(Number(e.target.value)); }}
          aria-label={l.hour(h.hour)}
          className="h-tap w-full accent-primary"
        />
      </div>
    </div>
  );
}
