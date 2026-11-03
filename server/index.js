const express = require('express');
const cors = require('cors');
const store = require('./store');

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());

// Server-Sent Events (SSE) stream for live updates to the frontend
app.get('/api/stream', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  // Send initial connected ping
  res.write(`data: ${JSON.stringify({ type: 'CONNECTED', timestamp: new Date().toISOString() })}\n\n`);

  const unsubscribe = store.subscribe((event, data) => {
    res.write(`data: ${JSON.stringify({ type: event, payload: data })}\n\n`);
  });

  req.on('close', () => {
    unsubscribe();
  });
});

// Get all hotspots / clustered locations
app.get('/api/locations', (req, res) => {
  res.json({ success: true, locations: store.getLocations() });
});

// Get reports with optional filters
app.get('/api/reports', (req, res) => {
  const { status, category, location_id } = req.query;
  const reports = store.getReports({ status, category, location_id });
  res.json({ success: true, reports });
});

// Submit a new citizen report (Live dynamic update)
app.post('/api/reports', (req, res) => {
  const { category, description, latitude, longitude, address, road_user_type, photo_url, notes } = req.body;
  if (!latitude || !longitude) {
    return res.status(400).json({ error: 'Latitude and Longitude are required coordinates.' });
  }

  const result = store.addReport({
    category,
    description,
    latitude,
    longitude,
    address,
    road_user_type,
    photo_url,
    notes
  });

  res.status(201).json({ success: true, data: result });
});

// Review status update (Verified, Rejected, Duplicate)
app.patch('/api/reports/:id/review', (req, res) => {
  const { status, notes } = req.body;
  const updated = store.updateReportStatus(req.params.id, status, notes);
  if (!updated) return res.status(404).json({ error: 'Report not found' });
  res.json({ success: true, report: updated });
});

// Safety Audits
app.get('/api/audits', (req, res) => {
  res.json({ success: true, audits: store.audits });
});

app.post('/api/audits', (req, res) => {
  const audit = store.createAudit(req.body);
  res.status(201).json({ success: true, audit });
});

// Interventions
app.get('/api/interventions', (req, res) => {
  res.json({ success: true, interventions: store.interventions });
});

app.post('/api/interventions', (req, res) => {
  const intervention = store.recordIntervention(req.body);
  res.status(201).json({ success: true, intervention });
});

// Reset for clean slate or fresh live demo start
app.post('/api/demo/reset', (req, res) => {
  store.clearAll();
  res.json({ success: true, message: 'All demo data cleared for clean live demonstration.' });
});

// Trigger a realistic live demo event sequence
const DEMO_LOCATIONS = [
  {
    address: 'Grand Central Parkway & 7th Ave Blind Corner',
    lat: 40.7580,
    lng: -73.9855,
    category: 'blind_turn',
    road_user_type: 'two_wheeler',
    desc: 'High vehicles parked blocking view of approaching northbound cyclists. Vehicles screeching brakes.'
  },
  {
    address: 'University Boulevard Pedestrian Crossing',
    lat: 40.7592,
    lng: -73.9840,
    category: 'pedestrian_conflict',
    road_user_type: 'pedestrian',
    desc: 'Right-turning buses almost hitting students on crosswalk during yellow change phase.'
  },
  {
    address: 'Metro Hub Transit Underpass',
    lat: 40.7565,
    lng: -73.9868,
    category: 'poor_lighting',
    road_user_type: 'cyclist',
    desc: 'Flickering streetlights creating sudden blind spot at ramp merge point.'
  }
];

let demoPointer = 0;
app.post('/api/demo/simulate', (req, res) => {
  const sample = DEMO_LOCATIONS[demoPointer % DEMO_LOCATIONS.length];
  // add slight jitter so multiple clicks generate clustering
  const jitterLat = sample.lat + (Math.random() - 0.5) * 0.0008;
  const jitterLng = sample.lng + (Math.random() - 0.5) * 0.0008;
  demoPointer++;

  const result = store.addReport({
    category: sample.category,
    description: sample.desc,
    latitude: jitterLat,
    longitude: jitterLng,
    address: sample.address,
    road_user_type: sample.road_user_type,
    photo_url: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=600&q=80',
    notes: 'Live citizen broadcast submitted during demo'
  });

  res.json({ success: true, simulated: result });
});

app.listen(PORT, () => {
  console.log(`RoadPulse API running on http://localhost:${PORT}`);
});
