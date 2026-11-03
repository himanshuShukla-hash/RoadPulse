// Real-World Routing Service using OSRM & Nominatim Geocoding
// Fetches genuine real-world road geometries, turn steps, distance, and duration.
// Correlates real GPS coordinates with RoadPulse hazard intelligence.

import { calculateEdgeRisk, DEFAULT_WEIGHTS } from './riskEngine.js';

// Calculate distance between two lat/lng in meters (Haversine formula)
export function getDistanceMeters(lat1, lon1, lat2, lon2) {
  const R = 6371e3;
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Geocode free-text address to lat/lng
export async function geocodeAddress(query) {
  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'RoadPulse-Safety-Companion/2.0' }
    });
    const data = await res.json();
    if (data && data.length > 0) {
      return {
        name: data[0].display_name.split(',').slice(0, 3).join(','),
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon)
      };
    }
  } catch (e) {
    console.error('Geocoding error:', e);
  }
  return null;
}

// Fetch real-world alternative driving routes from Open Source Routing Machine (OSRM)
export async function fetchRealWorldRoutes(startLat, startLng, endLat, endLng) {
  const url = `https://router.project-osrm.org/route/v1/driving/${startLng},${startLat};${endLng},${endLat}?overview=full&alternatives=3&steps=true&geometries=geojson`;

  const response = await fetch(url);
  const json = await response.json();

  if (json.code !== 'Ok' || !json.routes || json.routes.length === 0) {
    throw new Error('Unable to find real-world driving paths between coordinates.');
  }

  return json.routes;
}

// Intersect real-world GPS polyline coordinates with RoadPulse hazard database
export function evaluateRealRouteHazards(coordinates, hazardReports = []) {
  // Base hazard distribution if road is newly mapped
  let potholeScore = 20;
  let nearMissScore = 25;
  let lightingScore = 20;
  let curveScore = 20;

  let matchedHazardsCount = {
    potholes: 0,
    near_misses: 0,
    poor_lighting: 0,
    dangerous_turns: 0
  };

  // Check proximity of every coordinate point to known hazard reports within 120 meters
  hazardReports.forEach(h => {
    let isNear = false;
    // sample coordinates every 5 points to keep speed high
    for (let i = 0; i < coordinates.length; i += 3) {
      const [lng, lat] = coordinates[i];
      const dist = getDistanceMeters(lat, lng, h.latitude, h.longitude);
      if (dist <= 150) {
        isNear = true;
        break;
      }
    }

    if (isNear) {
      if (h.category === 'pothole') {
        potholeScore = Math.min(100, potholeScore + (h.severity * 0.4));
        matchedHazardsCount.potholes++;
      } else if (h.category === 'near_miss') {
        nearMissScore = Math.min(100, nearMissScore + (h.severity * 0.45));
        matchedHazardsCount.near_misses++;
      } else if (h.category === 'poor_lighting') {
        lightingScore = Math.min(100, lightingScore + (h.severity * 0.35));
        matchedHazardsCount.poor_lighting++;
      } else if (h.category === 'dangerous_turn') {
        curveScore = Math.min(100, curveScore + (h.severity * 0.4));
        matchedHazardsCount.dangerous_turns++;
      }
    }
  });

  const edgeHazards = {
    P: Math.round(potholeScore),
    N: Math.round(nearMissScore),
    L: Math.round(lightingScore),
    C: Math.round(curveScore)
  };

  const calculatedRisk = calculateEdgeRisk(edgeHazards, DEFAULT_WEIGHTS);

  return {
    edgeHazards,
    risk: calculatedRisk,
    matchedHazardsCount
  };
}
