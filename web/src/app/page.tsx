import type { Metadata } from "next";
import MapPage from "./map/page";

export const metadata: Metadata = { title: "The Missing Label" };

// Home is the map: same experience as /map, clean URL.
export default MapPage;
