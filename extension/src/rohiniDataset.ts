// Rohini Golden Pair Dataset
// Start: Rithala Metro Station (Bhagwan Mahavir Marg)
// Destination: M2K Cinemas Rohini (Sector 3, Outer Ring Road)
// 3 Genuinely Different Physical Road Corridors in Rohini with distinct hazards & turn paths

export interface RohiniHazard {
  id: string;
  category: 'pothole' | 'near_miss' | 'poor_lighting' | 'dangerous_turn' | 'accident_zone';
  name: string;
  severity: number;
  location: string;
  lat: number;
  lng: number;
  verified: boolean;
  photoUrl?: string;
  reportedAt: string;
}

export const GOLDEN_PAIR = {
  origin: 'Rithala Metro Station, Bhagwan Mahavir Marg',
  destination: 'M2K Cinemas Rohini, Sector 3, Delhi'
};

// Waypoints to force Google Maps to route through each corridor distinctly
export const GOLDEN_WAYPOINTS = {
  route_1: 'Dr. BSA Hospital, Sector 6 Rohini, Delhi',
  route_2: 'Deepali Chowk, Outer Ring Road, Pitampura, Delhi',
  route_3: 'Swarn Jayanti Japanese Park, Sector 10 Rohini, Delhi'
};

export const ROHINI_HAZARDS: RohiniHazard[] = [
  {
    id: 'rohini_h1',
    category: 'pothole',
    name: 'Mangolpuri Flyover Underpass Sinkholes',
    severity: 85,
    location: 'Mangolpuri Flyover / Road No 316',
    lat: 28.6945,
    lng: 77.0720,
    verified: true,
    photoUrl: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=600&q=80',
    reportedAt: 'Today, 08:30 AM'
  },
  {
    id: 'rohini_h2',
    category: 'near_miss',
    name: 'Madhuban Chowk Red Light Blind Turn',
    severity: 90,
    location: 'Outer Ring Road - Madhuban Chowk Intersection',
    lat: 28.7035,
    lng: 77.1215,
    verified: true,
    photoUrl: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=600&q=80',
    reportedAt: 'Today, 09:15 AM'
  },
  {
    id: 'rohini_h3',
    category: 'poor_lighting',
    name: 'Sultanpuri Railway Crossing Dark Stride',
    severity: 75,
    location: 'Sultanpuri - Nangloi 100ft Road Link',
    lat: 28.6820,
    lng: 77.0650,
    verified: true,
    reportedAt: 'Yesterday, 10:45 PM'
  },
  {
    id: 'rohini_h4',
    category: 'dangerous_turn',
    name: 'Sector 3 M2K Cinema Sharp Blind Curve',
    severity: 65,
    location: 'Bhagwan Mahavir Marg Sector 3',
    lat: 28.7012,
    lng: 77.0980,
    verified: true,
    photoUrl: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=600&q=80',
    reportedAt: '2 days ago'
  },
  {
    id: 'rohini_h5',
    category: 'accident_zone',
    name: 'Rithala Metro Station E-Rickshaw Congestion Choke',
    severity: 85,
    location: 'Rithala Crossing / Sector 11 Link',
    lat: 28.7205,
    lng: 77.1065,
    verified: true,
    reportedAt: 'Today, 11:20 AM'
  },
  {
    id: 'rohini_h6',
    category: 'accident_zone',
    name: 'Deepali Chowk High-Speed T-Junction',
    severity: 80,
    location: 'Outer Ring Road - Deepali Chowk, Rohini',
    lat: 28.6980,
    lng: 77.1140,
    verified: true,
    photoUrl: 'https://images.unsplash.com/photo-1508962914676-134849a727f0?auto=format&fit=crop&w=600&q=80',
    reportedAt: 'Yesterday, 04:30 PM'
  },
  {
    id: 'rohini_h7',
    category: 'near_miss',
    name: 'Dr. BSA Ambedkar Hospital Emergency Gate Merge',
    severity: 78,
    location: 'Ambedkar Hospital Road, Sector 6',
    lat: 28.7060,
    lng: 77.1080,
    verified: true,
    reportedAt: 'Today, 01:15 PM'
  },
  {
    id: 'rohini_h8',
    category: 'poor_lighting',
    name: 'Japanese Park Boundary Perimeter Unlit Stretch',
    severity: 65,
    location: 'Swarn Jayanti Park Road, Sector 10',
    lat: 28.7180,
    lng: 77.1120,
    verified: true,
    reportedAt: 'Yesterday, 09:00 PM'
  }
];

export const USER_REPORTED_HAZARDS: RohiniHazard[] = [];

// Core 5-Factor Edge Risk Formula: R_edge = 0.35P + 0.30N + 0.20L + 0.15C
export function calculateRohiniRisk(hazards: { P: number; N: number; L: number; C: number }) {
  const P = Math.min(100, Math.max(0, hazards.P || 0));
  const N = Math.min(100, Math.max(0, hazards.N || 0));
  const L = Math.min(100, Math.max(0, hazards.L || 0));
  const C = Math.min(100, Math.max(0, hazards.C || 0));

  const risk = (0.35 * P) + (0.30 * N) + (0.20 * L) + (0.15 * C);
  return Math.round(risk * 10) / 10;
}

// Generate the 3 genuinely different routes for this Golden Pair
export function generateRohiniCandidateRoutes(origStr?: string, destStr?: string) {
  // Route 1: Fastest Arterial (via Bhagwan Mahavir Marg direct & Dr. BSA Ambedkar Hospital Cut)
  // Distance: 3.8 km | Time: 11 min | High pedestrian conflicts & hospital emergency merges
  const r1Hazards = { P: 45, N: 85, L: 20, C: 40 }; // 0.35*45 + 0.30*85 + 0.20*20 + 0.15*40 = 15.75 + 25.5 + 4 + 6 = 51.3
  const risk1 = calculateRohiniRisk(r1Hazards);

  // Route 2: Balanced Outer Bypass (via Deepali Chowk & Outer Ring Road Link)
  // Distance: 4.9 km | Time: 14 min | Moderate commercial traffic, wider divided road
  const r2Hazards = { P: 30, N: 40, L: 25, C: 35 }; // 0.35*30 + 0.30*40 + 0.20*25 + 0.15*35 = 10.5 + 12 + 5 + 5.25 = 32.8
  const risk2 = calculateRohiniRisk(r2Hazards);

  // Route 3: Safety-Prioritized Green Corridor (via Swarn Jayanti Japanese Park Sector 10 Calmed Boulevard)
  // Distance: 5.4 km | Time: 16 min | Wide tree-lined residential parkway, continuous LED lighting, speed tables
  const r3Hazards = { P: 15, N: 20, L: 15, C: 15 }; // 0.35*15 + 0.30*20 + 0.20*15 + 0.15*15 = 5.25 + 6 + 3 + 2.25 = 16.5
  const risk3 = calculateRohiniRisk(r3Hazards);

  return [
    {
      id: 'route_1',
      summary: 'via Bhagwan Mahavir Marg & Dr. BSA Ambedkar Hospital Cut',
      travel_time_minutes: 11,
      distance_km: 3.8,
      route_risk: risk1,
      hazards: r1Hazards,
      routeLabel: '★ Fastest Arterial',
      description: 'Quickest driving time, but high near-miss collision risk near hospital emergency gate.',
      waypoint: GOLDEN_WAYPOINTS.route_1,
      isRecommended: true
    },
    {
      id: 'route_2',
      summary: 'via Deepali Chowk & Outer Ring Road Link',
      travel_time_minutes: 14,
      distance_km: 4.9,
      route_risk: risk2,
      hazards: r2Hazards,
      routeLabel: 'Balanced Outer Bypass',
      description: 'Bypasses hospital crowd via divided carriageway (+3 min extra time).',
      waypoint: GOLDEN_WAYPOINTS.route_2,
      isRecommended: false
    },
    {
      id: 'route_3',
      summary: 'via Japanese Park Sector 10 Calmed Green Parkway',
      travel_time_minutes: 16,
      distance_km: 5.4,
      route_risk: risk3,
      hazards: r3Hazards,
      routeLabel: 'Safety-Prioritized Green Link',
      description: 'Lowest risk route: Wide parkway, speed tables, no blind curves, 100% LED lighting.',
      waypoint: GOLDEN_WAYPOINTS.route_3,
      isRecommended: false
    }
  ];
}
