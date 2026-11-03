import express from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import { DEMO_LOCATIONS, DEMO_NODES, DEMO_EDGES, LOCATION_TO_NODE } from './demoData.js';
import { 
  DEFAULT_WEIGHTS, 
  calculateEdgeRisk, 
  findCandidateRoutes, 
  evaluateRoutesWithLambda 
} from './riskEngine.js';

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());

// In-memory hazard reports store with preloaded demo reports
const hazardReports = [
  {
    id: 'haz_1',
    category: 'pothole',
    severity: 70,
    edge_id: 'e14',
    latitude: 12.9320,
    longitude: 77.6325,
    description: 'Cluster of deep potholes on Lakeview shoreline bend.',
    status: 'verified',
    created_at: new Date(Date.now() - 3600000 * 4).toISOString()
  },
  {
    id: 'haz_2',
    category: 'near_miss',
    severity: 85,
    edge_id: 'e2',
    latitude: 12.9385,
    longitude: 77.6280,
    description: 'Frequent sudden braking near flyover ramp exit during peak hours.',
    status: 'verified',
    created_at: new Date(Date.now() - 3600000 * 12).toISOString()
  },
  {
    id: 'haz_3',
    category: 'poor_lighting',
    severity: 65,
    edge_id: 'e3',
    latitude: 12.9360,
    longitude: 77.6315,
    description: 'Broken sodium streetlights along canal curve.',
    status: 'verified',
    created_at: new Date(Date.now() - 3600000 * 24).toISOString()
  }
];

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'RoadPulse Safety-Aware Routing API', version: '2.0-mv3' });
});

// 1. GET /api/demo/locations - Supported origin/destination hubs
app.get('/api/demo/locations', (req, res) => {
  res.json({
    success: true,
    data: DEMO_LOCATIONS
  });
});

// 2. GET /api/roads - Supported road segments and current risk
app.get('/api/roads', (req, res) => {
  const roads = DEMO_EDGES.map(e => ({
    ...e,
    risk: calculateEdgeRisk(e.hazards, DEFAULT_WEIGHTS)
  }));
  res.json({
    success: true,
    nodes: DEMO_NODES,
    roads
  });
});

// 3. GET /api/hazards - List all active hazard evidence
app.get('/api/hazards', (req, res) => {
  res.json({
    success: true,
    count: hazardReports.length,
    hazards: hazardReports
  });
});

// 4. POST /api/hazards - Submit citizen hazard report
app.post('/api/hazards', (req, res) => {
  const { category, severity, description, latitude, longitude, edge_id } = req.body;

  if (!category) {
    return res.status(400).json({ error: 'Hazard category is required' });
  }

  const validSeverity = Math.max(10, Math.min(100, parseInt(severity) || 50));
  let targetEdgeId = edge_id || 'e1';

  const newReport = {
    id: 'haz_' + uuidv4().substring(0, 8),
    category,
    severity: validSeverity,
    edge_id: targetEdgeId,
    latitude: parseFloat(latitude) || 12.9330,
    longitude: parseFloat(longitude) || 77.6260,
    description: description || 'Reported hazard observation via RoadPulse extension',
    status: 'under_review',
    created_at: new Date().toISOString()
  };

  hazardReports.unshift(newReport);

  res.status(201).json({
    success: true,
    message: 'Hazard observation logged into RoadPulse safety network',
    hazard: newReport
  });
});

// 5. POST /api/routes/alternatives - Calculate candidate routes & evaluate with lambda
app.post('/api/routes/alternatives', (req, res) => {
  const { origin_id, destination_id, lambda } = req.body;

  if (!origin_id || !destination_id) {
    return res.status(400).json({ error: 'Both origin_id and destination_id are required' });
  }

  const startNode = LOCATION_TO_NODE[origin_id] || origin_id;
  const endNode = LOCATION_TO_NODE[destination_id] || destination_id;

  if (startNode === endNode) {
    return res.status(400).json({ error: 'Origin and destination must be distinct intersections' });
  }

  // Find genuine candidate graph paths
  const candidateRoutes = findCandidateRoutes(startNode, endNode, DEFAULT_WEIGHTS, hazardReports);

  if (!candidateRoutes || candidateRoutes.length === 0) {
    return res.status(404).json({ error: 'No viable connecting routes found in demo network' });
  }

  // Evaluate candidate routes against user lambda
  const evaluatedRoutes = evaluateRoutesWithLambda(candidateRoutes, lambda ?? 0.50);

  // Construct Google Maps directions URL for the origin & destination
  const originObj = DEMO_LOCATIONS.find(l => l.id === origin_id);
  const destObj = DEMO_LOCATIONS.find(l => l.id === destination_id);
  const gmapsUrl = (originObj && destObj)
    ? `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(originObj.name)}&destination=${encodeURIComponent(destObj.name)}&travelmode=driving`
    : `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(startNode)}&destination=${encodeURIComponent(endNode)}&travelmode=driving`;

  res.json({
    success: true,
    lambda: parseFloat(lambda ?? 0.50),
    origin: originObj || { id: startNode, name: startNode },
    destination: destObj || { id: endNode, name: endNode },
    google_maps_url: gmapsUrl,
    routes_count: evaluatedRoutes.length,
    routes: evaluatedRoutes
  });
});

// 6. POST /api/routes/recalculate - Fast recalculate existing candidate set when slider moves
app.post('/api/routes/recalculate', (req, res) => {
  const { routes, lambda } = req.body;

  if (!routes || !Array.isArray(routes) || routes.length === 0) {
    return res.status(400).json({ error: 'Existing candidate routes array is required' });
  }

  const evaluatedRoutes = evaluateRoutesWithLambda(routes, lambda ?? 0.50);

  res.json({
    success: true,
    lambda: parseFloat(lambda ?? 0.50),
    routes: evaluatedRoutes
  });
});

app.listen(PORT, () => {
  console.log(`RoadPulse Routing API running on http://localhost:${PORT}`);
});
