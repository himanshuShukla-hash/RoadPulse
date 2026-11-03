const { v4: uuidv4 } = require('uuid');

// In-memory relational store with persistence capability & live event stream
class Store {
  constructor() {
    this.reports = [];
    this.locations = []; // clustered risk hotspots
    this.audits = [];
    this.interventions = [];
    this.listeners = []; // SSE or callback hooks
  }

  // Subscribe to live events
  subscribe(fn) {
    this.listeners.push(fn);
    return () => {
      this.listeners = this.listeners.filter(l => l !== fn);
    };
  }

  notify(event, data) {
    this.listeners.forEach(fn => {
      try {
        fn(event, data);
      } catch (err) {
        console.error('Notify error:', err);
      }
    });
  }

  // Calculate distance between two lat/lng in meters (Haversine formula)
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371e3; // metres
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

  // 5-Factor Risk Scoring Engine
  // Score = 0.30R + 0.25V + 0.20T + 0.15E + 0.10C
  computeScore(locationReports) {
    if (!locationReports || locationReports.length === 0) return { score: 0, breakdown: {} };

    // 1. R (Repeated observations - 30%): Frequency of incidents within radius
    const count = locationReports.length;
    // 1 report = 20, 3 reports = 60, 5+ reports = 100
    const R = Math.min(100, count * 20);

    // 2. V (Potential Severity - 25%): Max/average potential hazard severity
    // pedestrian_conflict: 90, blind_turn: 80, sudden_braking: 60, poor_lighting: 50, road_defect: 40
    const severityMap = {
      pedestrian_conflict: 95,
      blind_turn: 85,
      speeding_corridor: 80,
      sudden_braking: 65,
      poor_lighting: 55,
      road_defect: 45,
      other: 40
    };
    const maxSeverity = Math.max(...locationReports.map(r => severityMap[r.category] || 50));
    const V = maxSeverity;

    // 3. T (Recency - 20%): Time decay factor
    const now = Date.now();
    const timestamps = locationReports.map(r => new Date(r.incident_at || r.submitted_at).getTime());
    const latest = Math.max(...timestamps);
    const daysAgo = Math.max(0, (now - latest) / (1000 * 60 * 60 * 24));
    // 0 days ago = 100, 7 days ago = 70, 30 days ago = 30
    const T = Math.max(10, Math.round(100 - Math.min(90, daysAgo * 4)));

    // 4. E (Evidence Quality - 15%): Structured description, photo attachments, clear conditions
    const hasPhoto = locationReports.some(r => r.photo_url || (r.evidence && r.evidence.length > 0));
    const avgDescLength = locationReports.reduce((acc, r) => acc + (r.description?.length || 0), 0) / count;
    let E = 30;
    if (avgDescLength > 30) E += 30;
    if (hasPhoto) E += 40;
    E = Math.min(100, E);

    // 5. C (Independent Corroboration - 10%): Multiple distinct submitters/reporters
    const uniqueReporters = new Set(locationReports.map(r => r.reporter_id || r.session_id || 'anon')).size;
    const C = Math.min(100, uniqueReporters * 35);

    const score = Math.round(0.30 * R + 0.25 * V + 0.20 * T + 0.15 * E + 0.10 * C);

    let priorityBand = 'Routine';
    let bandColor = 'emerald';
    if (score >= 70) {
      priorityBand = 'High Review Priority';
      bandColor = 'amber';
    } else if (score >= 40) {
      priorityBand = 'Elevated Review Priority';
      bandColor = 'amber-light';
    }

    return {
      score,
      priorityBand,
      bandColor,
      breakdown: {
        R: { value: R, weight: 0.30, contribution: (0.30 * R).toFixed(1), label: 'Frequency / Repeated' },
        V: { value: V, weight: 0.25, contribution: (0.25 * V).toFixed(1), label: 'Potential Severity' },
        T: { value: T, weight: 0.20, contribution: (0.20 * T).toFixed(1), label: 'Incident Recency' },
        E: { value: E, weight: 0.15, contribution: (0.15 * E).toFixed(1), label: 'Evidence Quality' },
        C: { value: C, weight: 0.10, contribution: (0.10 * C).toFixed(1), label: 'Corroboration' }
      }
    };
  }

  // Add report & dynamically assign/update cluster location
  addReport(data) {
    const report = {
      id: 'rep_' + uuidv4().substring(0, 8),
      category: data.category || 'blind_turn',
      description: data.description || '',
      latitude: parseFloat(data.latitude),
      longitude: parseFloat(data.longitude),
      address: data.address || `${data.latitude.toFixed(4)}, ${data.longitude.toFixed(4)}`,
      road_user_type: data.road_user_type || 'pedestrian',
      speed_context: data.speed_context || 'moderate',
      incident_at: data.incident_at || new Date().toISOString(),
      submitted_at: new Date().toISOString(),
      status: data.status || 'under_review', // under_review, verified, rejected, duplicate
      reporter_id: data.reporter_id || 'user_' + Math.floor(Math.random() * 9000 + 1000),
      photo_url: data.photo_url || null,
      notes: data.notes || ''
    };

    this.reports.unshift(report);

    // Grouping: Check if report falls within 150m of an existing cluster hotspot
    const CLUSTER_RADIUS_METERS = 180;
    let matchingLoc = this.locations.find(loc => {
      const dist = this.calculateDistance(loc.latitude, loc.longitude, report.latitude, report.longitude);
      return dist <= CLUSTER_RADIUS_METERS;
    });

    if (matchingLoc) {
      report.location_id = matchingLoc.id;
      matchingLoc.reports_count += 1;
      // Adjust centroid slightly toward new report
      matchingLoc.latitude = (matchingLoc.latitude * (matchingLoc.reports_count - 1) + report.latitude) / matchingLoc.reports_count;
      matchingLoc.longitude = (matchingLoc.longitude * (matchingLoc.reports_count - 1) + report.longitude) / matchingLoc.reports_count;
    } else {
      matchingLoc = {
        id: 'loc_' + uuidv4().substring(0, 8),
        title: data.address || `Hotspot near ${report.latitude.toFixed(4)}, ${report.longitude.toFixed(4)}`,
        latitude: report.latitude,
        longitude: report.longitude,
        reports_count: 1,
        created_at: new Date().toISOString(),
        status: 'active'
      };
      this.locations.push(matchingLoc);
      report.location_id = matchingLoc.id;
    }

    // Recompute score for this location
    const clusterReports = this.reports.filter(r => r.location_id === matchingLoc.id);
    const scoreResult = this.computeScore(clusterReports);
    matchingLoc.risk_score = scoreResult.score;
    matchingLoc.priorityBand = scoreResult.priorityBand;
    matchingLoc.bandColor = scoreResult.bandColor;
    matchingLoc.breakdown = scoreResult.breakdown;
    matchingLoc.score_updated_at = new Date().toISOString();

    // Notify live subscribers
    this.notify('REPORT_CREATED', { report, location: matchingLoc });

    return { report, location: matchingLoc };
  }

  getLocations() {
    return this.locations;
  }

  getReports(filter = {}) {
    let result = [...this.reports];
    if (filter.status) result = result.filter(r => r.status === filter.status);
    if (filter.category) result = result.filter(r => r.category === filter.category);
    if (filter.location_id) result = result.filter(r => r.location_id === filter.location_id);
    return result;
  }

  updateReportStatus(reportId, status, notes = '') {
    const report = this.reports.find(r => r.id === reportId);
    if (!report) return null;
    report.status = status;
    if (notes) report.notes = notes;
    report.reviewed_at = new Date().toISOString();

    // Recalculate location
    if (report.location_id) {
      const loc = this.locations.find(l => l.id === report.location_id);
      if (loc) {
        const clusterReports = this.reports.filter(r => r.location_id === loc.id);
        const scoreResult = this.computeScore(clusterReports);
        loc.risk_score = scoreResult.score;
        loc.priorityBand = scoreResult.priorityBand;
        loc.breakdown = scoreResult.breakdown;
      }
    }

    this.notify('REPORT_UPDATED', report);
    return report;
  }

  createAudit(data) {
    const audit = {
      id: 'aud_' + uuidv4().substring(0, 8),
      location_id: data.location_id,
      assigned_to: data.assigned_to || 'City Safety Engineer',
      due_date: data.due_date || new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
      status: 'pending', // pending, in_progress, completed
      notes: data.notes || '',
      created_at: new Date().toISOString()
    };
    this.audits.unshift(audit);
    this.notify('AUDIT_CREATED', audit);
    return audit;
  }

  recordIntervention(data) {
    const intervention = {
      id: 'int_' + uuidv4().substring(0, 8),
      location_id: data.location_id,
      title: data.title || 'Safety Improvement Deployed',
      action_type: data.action_type || 'signage_and_mirror', // speed_calming, mirror, lighting, crossing, signal_retiming
      notes: data.notes || '',
      completed_at: new Date().toISOString(),
      baseline_incidents_count: data.baseline_count || 3,
      post_intervention_count: 0
    };
    this.interventions.unshift(intervention);
    this.notify('INTERVENTION_RECORDED', intervention);
    return intervention;
  }

  clearAll() {
    this.reports = [];
    this.locations = [];
    this.audits = [];
    this.interventions = [];
    this.notify('STATE_CLEARED', {});
  }
}

module.exports = new Store();
