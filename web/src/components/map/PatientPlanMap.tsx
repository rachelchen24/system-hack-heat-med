// <PatientPlanMap patientId="S01" height={320} />
//
// USAGE (server component — e.g. web/src/app/phone/[id]/page.tsx):
//   import PatientPlanMap from "@/components/map/PatientPlanMap";
//   <PatientPlanMap patientId={id} height={320} />
//
// From a CLIENT component, use the client view instead (it fetches /api/map/plan?id=…):
//   import { PatientPlanMapView } from "@/components/map/PatientPlanMapView";
//   <PatientPlanMapView patientId={id} height={320} />
// Or load server-side and pass data:
//   import { getPatientPlanMapData } from "@/components/map/patientPlanData";
//   <PatientPlanMapView data={getPatientPlanMapData(id)} />
//
// Shows home, nearest cool place (cooling_match.csv rank 1) with a line + walk minutes,
// "Leave by X", hottest hours (replay_heatwave_hourly.csv), nearest subway, Directions,
// and "Ask for a delivery instead" when the walk is > 15 min, q5_can_reach_cool_place is
// "no"/"with_help", or the leave time falls in the hottest hours. 2D default, 3D toggle.
import { getPatientPlanMapData } from "./patientPlanData";
import { PatientPlanMapView } from "./PatientPlanMapView";

export default function PatientPlanMap({ patientId, height = 320 }: { patientId: string; height?: number }) {
  const data = getPatientPlanMapData(patientId);
  return <PatientPlanMapView data={data} height={height} />;
}
