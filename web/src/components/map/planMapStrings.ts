// Fixed UI strings for the patient "where to go" map card (PatientPlanMap / PatientPlanMapView).
// Place names, addresses and phone numbers stay as data. Spanish is machine-drafted (usted form) and
// flagged "Traducción automática — por revisar" in the UI.
import { hourLabel } from "./format";

export type PlanMapLang = "en" | "es";

export function planMapLang(language: string | null | undefined): PlanMapLang {
  return (language ?? "").toLowerCase().startsWith("es") ? "es" : "en";
}

function hourLabelEs(h: number): string {
  if (h === 0 || h === 24) return "medianoche";
  if (h === 12) return "mediodía";
  const h12 = h % 12;
  const part = h < 12 ? "de la mañana" : h < 19 ? "de la tarde" : "de la noche";
  return `${h12 === 1 ? "la 1" : `las ${h12}`} ${part}`;
}

/** "5:30 PM" (from clock()) → "5:30 p. m." */
function clockEs(c: string): string {
  return c.replace(/\bAM\b/, "a. m.").replace(/\bPM\b/, "p. m.");
}

export interface PlanMapStrings {
  note: string | null;
  loadError: string;
  loading: string;
  noHome: string;
  sectionLabel: string;
  home: string;
  subwayLabel: (name: string) => string;
  nearest: string;
  walk: (min: number) => string;
  leaveBy: (t: string) => string;
  noPlace: string;
  mapAria: string;
  hottestLabel: string;
  hottest: (from: number, to: number) => string;
  subwayTitle: string;
  subwayAbout: (dist: string) => string;
  callAhead: string;
  callAheadTail: string;
  olderAdults: string;
  coolingCenter: string;
  directions: string;
  deliveryTitle: string;
  deliveryText: string;
  reason: (r: string) => string;
  ifCantLeave: (leave: string | null, from: number, to: number) => string;
  footnote: string;
  sources: string;
}

export const PLAN_MAP_STRINGS: Record<PlanMapLang, PlanMapStrings> = {
  en: {
    note: null,
    loadError: "Could not load the map.",
    loading: "Loading map…",
    noHome: "No home location for this patient. Data would come from data/processed/synthetic/patients.csv (home_lat, home_lon).",
    sectionLabel: "Where to go to cool off",
    home: "Home",
    subwayLabel: (n) => `Subway: ${n}`,
    nearest: "Nearest cool place",
    walk: (m) => `About ${m} min walk`,
    leaveBy: (t) => `Leave by ${t}`,
    noPlace: "No cool place matched. Data would come from data/processed/synthetic/cooling_match.csv.",
    mapAria: "Map from your home to the nearest cool place",
    hottestLabel: "Hottest hours today:",
    hottest: (a, b) => `${hourLabel(a)} to ${hourLabel(b)}. Try to be inside somewhere cool by then.`,
    subwayTitle: "Nearest subway:",
    subwayAbout: (d) => `about ${d} from home.`,
    callAhead: "Call ahead:",
    callAheadTail: "Hours and services can change.",
    olderAdults: "This place is for adults 60 and older.",
    coolingCenter: "It opens as a cooling center only on official heat days. Check that it is open today.",
    directions: "Directions",
    deliveryTitle: "Ask for a delivery instead",
    deliveryText: "Stay in your coolest room. Ask your pharmacy, a family member or a neighbor to bring what you need.",
    reason: (r) => r,
    ifCantLeave: (l, a, b) => `If you can't leave by ${l ?? "then"}, stay in from ${hourLabel(a)} to ${hourLabel(b)} and ask for a delivery instead.`,
    footnote: "Synthetic patient. Line shows the trip, not the exact street route; walk time is from a routed walk at the patient's pace.",
    sources: "Sources:",
  },
  es: {
    note: "Traducción automática — por revisar",
    loadError: "No se pudo cargar el mapa.",
    loading: "Cargando el mapa…",
    noHome: "No tenemos la dirección de su casa. Los datos vendrían de data/processed/synthetic/patients.csv (home_lat, home_lon).",
    sectionLabel: "Adónde ir para refrescarse",
    home: "Casa",
    subwayLabel: (n) => `Metro: ${n}`,
    nearest: "Lugar fresco más cercano",
    walk: (m) => `Unos ${m} min a pie`,
    leaveBy: (t) => `Salga antes de las ${clockEs(t)}`,
    noPlace: "No encontramos un lugar fresco. Los datos vendrían de data/processed/synthetic/cooling_match.csv.",
    mapAria: "Mapa desde su casa hasta el lugar fresco más cercano",
    hottestLabel: "Horas de más calor hoy:",
    hottest: (a, b) => `de ${hourLabelEs(a)} a ${hourLabelEs(b)}. Trate de estar adentro, en un lugar fresco, antes de esa hora.`,
    subwayTitle: "Metro más cercano:",
    subwayAbout: (d) => `a unos ${d} de su casa.`,
    callAhead: "Llame antes de ir:",
    callAheadTail: "El horario y los servicios pueden cambiar.",
    olderAdults: "Este lugar es para personas de 60 años o más.",
    coolingCenter: "Solo abre como centro de enfriamiento en los días de calor oficiales. Confirme que está abierto hoy.",
    directions: "Cómo llegar",
    deliveryTitle: "Mejor pida una entrega a domicilio",
    deliveryText: "Quédese en el cuarto más fresco de su casa. Pida a su farmacia, a un familiar o a un vecino que le lleve lo que necesita.",
    reason: (r) => {
      const walk = /^The walk is long \(about (\d+) minutes\)\.$/.exec(r);
      if (walk) return `La caminata es larga (unos ${walk[1]} minutos).`;
      if (r === "You told us you can't get to a cool place.") return "Usted nos dijo que no puede llegar a un lugar fresco.";
      if (r === "You told us you need help to get to a cool place.") return "Usted nos dijo que necesita ayuda para llegar a un lugar fresco.";
      if (r === "You would be walking in the hottest hours.") return "Estaría caminando en las horas de más calor.";
      return r;
    },
    ifCantLeave: (l, a, b) =>
      `Si no puede salir ${l ? `antes de las ${clockEs(l)}` : "a tiempo"}, quédese en casa de ${hourLabelEs(a)} a ${hourLabelEs(b)} y pida una entrega a domicilio.`,
    footnote: "Paciente de prueba. La línea muestra el trayecto, no la ruta exacta por las calles; el tiempo a pie se calcula al paso de la persona.",
    sources: "Fuentes:",
  },
};
