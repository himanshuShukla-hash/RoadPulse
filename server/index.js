import express from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import { DEFAULT_WEIGHTS, evaluateRoutesWithLambda } from './riskEngine.js';
import { geocodeAddress, fetchRealWorldRoutes, evaluateRealRouteHazards, parseRawCoords } from './realRouter.js';

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());

const hazardReports = [
  {
    id: 'haz_1',
    category: 'pothole',
    severity: 75,
    latitude: 28.6628,
    longitude: 77.0481,
    description: 'Multiple deep potholes on main transit carriageway.',
    status: 'verified',
    created_at: new Date(Date.now() - 3600000 * 4).toISOString()
  },
  {
    id: 'haz_2',
    category: 'near_miss',
    severity: 85,
    latitude: 28.6700,
    longitude: 77.0520,
    description: 'Blind turn near flyover ramp exit. Frequent high-speed braking.',
    status: 'verified',
    created_at: new Date(Date.now() - 3600000 * 12).toISOString()
  }
];

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'RoadPulse Real-World Safety Routing API', version: '2.2.0' });
});

// Robust alternatives endpoint that NEVER hangs
app.post('/api/routes/alternatives', async (req, res) => {
  const { origin_query, dest_query, lambda } = req.body;

  try {
    // 1. Resolve Origin
    let orig = parseRawCoords(origin_query);
    if (!orig) {
      orig = await geocodeAddress(origin_query || 'Connaught Place Delhi');
    }

    // 2. Resolve Destination (using Origin as proximity anchor)
    let dest = parseRawCoords(dest_query);
    if (!dest) {
      dest = await geocodeAddress(dest_query || 'India Gate Delhi', orig.lat, orig.lng);
    }

    const startLat = orig.lat;
    const startLng = orig.lng;
    const endLat = dest.lat;
    const endLng = dest.lng;

    // 3. Fetch real driving alternatives
    const osrmRoutes = await fetchRealWorldRoutes(startLat, startLng, endLat, endLng);

    // 4. Score each route with RoadPulse 5-Factor risk formula
    const parsedRoutes = osrmRoutes.map((r, index) => {
      const coords = r.geometry ? r.geometry.coordinates : [[startLng, startLat], [endLng, endLat]];
      const totalDistance = Math.max(500, Math.round(r.distance || 3500));
      const durationSeconds = Math.max(60, Math.round(r.duration || 360));
      const durationMinutes = Math.max(1, Math.ceil(durationSeconds / 60));

      const stepNames = [];
      if (r.legs && r.legs[0] && r.legs[0].steps) {
        r.legs[0].steps.forEach(step => {
          if (step.name && !stepNames.includes(step.name)) {
            stepNames.push(step.name);
          }
        });
      }
      const summary = stepNames.length > 0 
        ? stepNames.slice(0, 4).join(' ➔ ') 
        : index === 0 ? 'Main Arterial Bypass' : index === 1 ? 'Secondary Service Corridor' : 'Inner Calmed Sector Link';

      const hazardAnalysis = evaluateRealRouteHazards(coords, hazardReports, index);

      return {
        id: `real_route_${index + 1}`,
        pathKey: `path_${index + 1}`,
        summary,
        distance_meters: totalDistance,
        travel_time_seconds: durationSeconds,
        travel_time_minutes: durationMinutes,
        route_risk: hazardAnalysis.risk,
        hazards_count: hazardAnalysis.matchedHazardsCount,
        coordinates: coords
      };
    });

    const evaluatedRoutes = evaluateRoutesWithLambda(parsedRoutes, lambda ?? 0.50);
    const gmapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(orig.name)}&destination=${encodeURIComponent(dest.name)}&travelmode=driving`;

    res.json({
      success: true,
      mode: 'real_world_gps',
      lambda: parseFloat(lambda ?? 0.50),
      origin: orig,
      destination: dest,
      google_maps_url: gmapsUrl,
      routes_count: evaluatedRoutes.length,
      routes: evaluatedRoutes
    });

  } catch (err) {
    console.error('[RoadPulse Alternatives API] Error:', err);
    res.status(500).json({ error: 'Failed to compute routes: ' + err.message });
  }
});

// Fast recalculation on slider change
app.post('/api/routes/recalculate', (req, res) => {
  const { routes, lambda } = req.body;
  if (!routes || !Array.isArray(routes)) {
    return res.status(400).json({ error: 'Routes array required' });
  }
  const evaluatedRoutes = evaluateRoutesWithLambda(routes, lambda ?? 0.50);
  res.json({
    success: true,
    lambda: parseFloat(lambda ?? 0.50),
    routes: evaluatedRoutes
  });
});

app.listen(PORT, () => {
  console.log(`RoadPulse Real-World Safety Routing API running on http://localhost:${PORT}`);
});
