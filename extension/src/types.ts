export interface DemoLocation {
  id: string;
  name: string;
  lat: number;
  lng: number;
}

export interface HazardsCount {
  potholes: number;
  near_misses: number;
  poor_lighting: number;
  dangerous_turns: number;
}

export interface CandidateRoute {
  id: string;
  pathKey: string;
  summary: string;
  nodes: string[];
  distance_meters: number;
  travel_time_seconds: number;
  travel_time_minutes: number;
  route_risk: number;
  hazards_count: HazardsCount;
  R_norm: number;
  T_norm: number;
  cost: number;
  extra_time_seconds: number;
  extra_time_minutes: number;
  rank: number;
  isRecommended: boolean;
  routeLabel: string;
  explanation: string;
}

export interface RouteResponse {
  success: boolean;
  lambda: number;
  origin: DemoLocation;
  destination: DemoLocation;
  google_maps_url: string;
  routes_count: number;
  routes: CandidateRoute[];
}
