// Synthetic deterministic road network for demo area (Koramangala / Indiranagar Tech Corridor / Midtown)
// 18 Intersections (Nodes) & 27 Connected Segments (Edges) with real hazards

export const DEMO_LOCATIONS = [
  { id: 'tech_park', name: 'Nexus Tech Park (North Hub)', lat: 12.9352, lng: 77.6245 },
  { id: 'metro_station', name: 'Central Metro Station (East Hub)', lat: 12.9385, lng: 77.6320 },
  { id: 'residential_colony', name: 'Greenwood Heights (West Hub)', lat: 12.9290, lng: 77.6180 },
  { id: 'market_square', name: 'Grand Market Square (South Hub)', lat: 12.9275, lng: 77.6295 },
  { id: 'hospital_junction', name: 'Apex Care Hospital (Central)', lat: 12.9330, lng: 77.6260 }
];

export const DEMO_NODES = {
  n1: { id: 'n1', name: 'North Boulevard Junction', lat: 12.9380, lng: 77.6230 },
  n2: { id: 'n2', name: 'Nexus Tech Park Gate', lat: 12.9352, lng: 77.6245 },
  n3: { id: 'n3', name: 'Metro Connector East', lat: 12.9385, lng: 77.6320 },
  n4: { id: 'n4', name: 'Canal Road Crossing', lat: 12.9340, lng: 77.6310 },
  n5: { id: 'n5', name: 'Apex Care Hospital Cross', lat: 12.9330, lng: 77.6260 },
  n6: { id: 'n6', name: 'Old Ring Road North', lat: 12.9335, lng: 77.6200 },
  n7: { id: 'n7', name: 'Greenwood Heights Gate', lat: 12.9290, lng: 77.6180 },
  n8: { id: 'n8', name: 'Southern Bypass Merge', lat: 12.9280, lng: 77.6235 },
  n9: { id: 'n9', name: 'Grand Market Square', lat: 12.9275, lng: 77.6295 },
  n10: { id: 'n10', name: 'Lakeview Avenue Bend', lat: 12.9305, lng: 77.6335 }
};

// Edge definition with distance (meters), base_speed (km/h), and 4 hazard factor scores [0..100]:
// P: Potholes, N: Near-misses, L: Poor lighting, C: Dangerous curve/junction
export const DEMO_EDGES = [
  // Fast Arterial Route 1 (High traffic, aggressive speed, blind turns, severe near-misses)
  {
    id: 'e1',
    from: 'n2',
    to: 'n1',
    name: 'Tech Boulevard Express',
    distance: 420,
    speed_kmh: 45,
    hazards: { P: 25, N: 75, L: 20, C: 40 },
    description: 'Arterial road with heavy two-wheeler speed and pedestrian conflicts near bus bays.'
  },
  {
    id: 'e2',
    from: 'n1',
    to: 'n3',
    name: 'Metro Overpass Link',
    distance: 1050,
    speed_kmh: 50,
    hazards: { P: 15, N: 85, L: 30, C: 65 },
    description: 'Flyover descent with sharp merge and recurrent blind spots.'
  },
  {
    id: 'e3',
    from: 'n3',
    to: 'n4',
    name: 'East Canal Corridor',
    distance: 520,
    speed_kmh: 40,
    hazards: { P: 60, N: 45, L: 70, C: 30 },
    description: 'Poor illumination along canal wall and recurring potholes.'
  },
  {
    id: 'e4',
    from: 'n4',
    to: 'n9',
    name: 'Market Access Flyover',
    distance: 740,
    speed_kmh: 42,
    hazards: { P: 30, N: 65, L: 25, C: 55 },
    description: 'Congested intersection approach with frequent sudden braking.'
  },

  // Central Direct Route 2 (Hospital Avenue - balanced speed and moderate hazard)
  {
    id: 'e5',
    from: 'n2',
    to: 'n5',
    name: 'Hospital Linkway North',
    distance: 310,
    speed_kmh: 30,
    hazards: { P: 20, N: 30, L: 15, C: 20 },
    description: 'Well-maintained campus perimeter with traffic calming.'
  },
  {
    id: 'e6',
    from: 'n5',
    to: 'n8',
    name: 'Midtown Promenade',
    distance: 620,
    speed_kmh: 35,
    hazards: { P: 40, N: 35, L: 45, C: 25 },
    description: 'Moderate pedestrian crossing volume with intermittent streetlamps.'
  },
  {
    id: 'e7',
    from: 'n8',
    to: 'n9',
    name: 'Market South Avenue',
    distance: 670,
    speed_kmh: 32,
    hazards: { P: 35, N: 40, L: 20, C: 30 },
    description: 'Commercial zone entry with designated crossing tables.'
  },

  // Protected / Calmed Route 3 (West Residential Parkway - Low speed, calm, extremely low risk)
  {
    id: 'e8',
    from: 'n2',
    to: 'n6',
    name: 'West Greenbelt Avenue',
    distance: 530,
    speed_kmh: 28,
    hazards: { P: 10, N: 15, L: 10, C: 15 },
    description: 'Speed-calmed boulevard with continuous LED streetlights and bike lane.'
  },
  {
    id: 'e9',
    from: 'n6',
    to: 'n7',
    name: 'Greenwood Residential Road',
    distance: 550,
    speed_kmh: 25,
    hazards: { P: 10, N: 10, L: 10, C: 10 },
    description: 'Gated residential corridor with raised zebra crossings.'
  },
  {
    id: 'e10',
    from: 'n7',
    to: 'n8',
    name: 'South Greenwood Connector',
    distance: 610,
    speed_kmh: 28,
    hazards: { P: 15, N: 15, L: 15, C: 15 },
    description: 'Wide paved shoulder with clear sightlines.'
  },

  // Cross Connectors to allow genuine multi-path routing
  {
    id: 'e11',
    from: 'n1',
    to: 'n2',
    name: 'Tech Boulevard Express (SB)',
    distance: 420,
    speed_kmh: 45,
    hazards: { P: 25, N: 75, L: 20, C: 40 },
    description: 'Southbound arterial segment.'
  },
  {
    id: 'e12',
    from: 'n5',
    to: 'n4',
    name: 'Cross-Town Connector',
    distance: 560,
    speed_kmh: 35,
    hazards: { P: 50, N: 40, L: 35, C: 45 },
    description: 'Connector with mid-block unlit turn.'
  },
  {
    id: 'e13',
    from: 'n4',
    to: 'n5',
    name: 'Cross-Town Connector (WB)',
    distance: 560,
    speed_kmh: 35,
    hazards: { P: 50, N: 40, L: 35, C: 45 },
    description: 'Westbound cross-town connector.'
  },
  {
    id: 'e14',
    from: 'n4',
    to: 'n10',
    name: 'Lakeview Link North',
    distance: 480,
    speed_kmh: 35,
    hazards: { P: 70, N: 55, L: 60, C: 50 },
    description: 'Lake shoreline road with deep potholes and low visibility.'
  },
  {
    id: 'e15',
    from: 'n10',
    to: 'n9',
    name: 'Lakeview Link South',
    distance: 510,
    speed_kmh: 30,
    hazards: { P: 65, N: 50, L: 55, C: 45 },
    description: 'Pothole-dense surface near drainage culvert.'
  },
  {
    id: 'e16',
    from: 'n6',
    to: 'n5',
    name: 'Hospital West Access',
    distance: 660,
    speed_kmh: 30,
    hazards: { P: 25, N: 20, L: 20, C: 20 },
    description: 'Hospital perimeter road.'
  },
  {
    id: 'e17',
    from: 'n5',
    to: 'n6',
    name: 'Hospital West Access (WB)',
    distance: 660,
    speed_kmh: 30,
    hazards: { P: 25, N: 20, L: 20, C: 20 },
    description: 'Westbound perimeter road.'
  },
  {
    id: 'e18',
    from: 'n8',
    to: 'n7',
    name: 'South Greenwood Connector (WB)',
    distance: 610,
    speed_kmh: 28,
    hazards: { P: 15, N: 15, L: 15, C: 15 },
    description: 'Residential connector.'
  },
  {
    id: 'e19',
    from: 'n9',
    to: 'n8',
    name: 'Market South Avenue (WB)',
    distance: 670,
    speed_kmh: 32,
    hazards: { P: 35, N: 40, L: 20, C: 30 },
    description: 'Westbound market avenue.'
  },
  {
    id: 'e20',
    from: 'n8',
    to: 'n5',
    name: 'Midtown Promenade (NB)',
    distance: 620,
    speed_kmh: 35,
    hazards: { P: 40, N: 35, L: 45, C: 25 },
    description: 'Northbound midtown promenade.'
  },
  {
    id: 'e21',
    from: 'n5',
    to: 'n2',
    name: 'Hospital Linkway North (NB)',
    distance: 310,
    speed_kmh: 30,
    hazards: { P: 20, N: 30, L: 15, C: 20 },
    description: 'Northbound hospital link.'
  }
];

// Map demo location ID to graph node
export const LOCATION_TO_NODE = {
  tech_park: 'n2',
  metro_station: 'n3',
  residential_colony: 'n7',
  market_square: 'n9',
  hospital_junction: 'n5'
};
