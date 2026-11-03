import { DEMO_NODES, DEMO_EDGES } from './demoData.js';

// Default edge risk weights as specified in Section 6:
// R_edge = 0.35P + 0.30N + 0.20L + 0.15C
export const DEFAULT_WEIGHTS = {
  P: 0.35, // Potholes
  N: 0.30, // Near-miss evidence
  L: 0.20, // Poor lighting
  C: 0.15  // Dangerous turns / junctions
};

/**
 * Calculates edge risk: R_edge = 0.35P + 0.30N + 0.20L + 0.15C
 * Normalizes input hazards between [0..100]
 */
export function calculateEdgeRisk(hazards = {}, weights = DEFAULT_WEIGHTS) {
  const P = Math.max(0, Math.min(100, hazards.P ?? 0));
  const N = Math.max(0, Math.min(100, hazards.N ?? 0));
  const L = Math.max(0, Math.min(100, hazards.L ?? 0));
  const C = Math.max(0, Math.min(100, hazards.C ?? 0));

  const risk = (weights.P * P) + (weights.N * N) + (weights.L * L) + (weights.C * C);
  return Math.round(risk * 10) / 10;
}

/**
 * Calculates travel time in seconds given distance (m) and speed (km/h)
 */
export function calculateTravelTime(distanceMeters, speedKmh) {
  const speedMps = Math.max(5, (speedKmh * 1000) / 3600);
  return Math.round(distanceMeters / speedMps);
}

/**
 * Calculate distance-weighted average segment risk for a sequence of edges:
 * R_route = Σ(distance_i * R_edge_i) / Σ(distance_i)
 */
export function calculateRouteRisk(edges, weights = DEFAULT_WEIGHTS) {
  if (!edges || edges.length === 0) return 0;
  let totalWeightedRisk = 0;
  let totalDistance = 0;

  edges.forEach((edge) => {
    const edgeRisk = calculateEdgeRisk(edge.hazards, weights);
    totalWeightedRisk += edge.distance * edgeRisk;
    totalDistance += edge.distance;
  });

  if (totalDistance === 0) return 0;
  return Math.round((totalWeightedRisk / totalDistance) * 10) / 10;
}

/**
 * Pathfinding: Modified Dijkstra with edge penalties to discover k-distinct alternative paths
 */
export function findCandidateRoutes(startNode, endNode, weights = DEFAULT_WEIGHTS, userHazards = []) {
  // Merge live user hazards into edge copies
  const edgeList = DEMO_EDGES.map(e => {
    const edge = { ...e, hazards: { ...e.hazards } };
    const matchingReports = userHazards.filter(h => h.edge_id === edge.id);
    if (matchingReports.length > 0) {
      // incorporate verified/new hazards dynamically
      matchingReports.forEach(rep => {
        if (rep.category === 'pothole') edge.hazards.P = Math.min(100, edge.hazards.P + (rep.severity || 20));
        if (rep.category === 'near_miss') edge.hazards.N = Math.min(100, edge.hazards.N + (rep.severity || 25));
        if (rep.category === 'poor_lighting') edge.hazards.L = Math.min(100, edge.hazards.L + (rep.severity || 20));
        if (rep.category === 'dangerous_turn') edge.hazards.C = Math.min(100, edge.hazards.C + (rep.severity || 25));
      });
    }
    edge.risk = calculateEdgeRisk(edge.hazards, weights);
    edge.travel_time = calculateTravelTime(edge.distance, edge.speed_kmh);
    return edge;
  });

  // Graph adjacency list
  const adj = {};
  Object.keys(DEMO_NODES).forEach(nodeId => { adj[nodeId] = []; });
  edgeList.forEach(edge => {
    if (adj[edge.from]) adj[edge.from].push(edge);
  });

  // Helper: Find single shortest path given custom cost function per edge
  function dijkstra(costFn) {
    const dist = {};
    const prevEdge = {};
    const unvisited = new Set(Object.keys(DEMO_NODES));

    Object.keys(DEMO_NODES).forEach(n => { dist[n] = Infinity; });
    dist[startNode] = 0;

    while (unvisited.size > 0) {
      let curr = null;
      let minVal = Infinity;
      unvisited.forEach(n => {
        if (dist[n] < minVal) {
          minVal = dist[n];
          curr = n;
        }
      });

      if (!curr || dist[curr] === Infinity || curr === endNode) break;
      unvisited.delete(curr);

      const neighbors = adj[curr] || [];
      for (const edge of neighbors) {
        if (!unvisited.has(edge.to)) continue;
        const cost = costFn(edge);
        const alt = dist[curr] + cost;
        if (alt < dist[edge.to]) {
          dist[edge.to] = alt;
          prevEdge[edge.to] = edge;
        }
      }
    }

    if (dist[endNode] === Infinity) return null;

    // Reconstruct edge path
    const pathEdges = [];
    let curr = endNode;
    while (curr !== startNode) {
      const e = prevEdge[curr];
      if (!e) break;
      pathEdges.unshift(e);
      curr = e.from;
    }
    return pathEdges;
  }

  const rawCandidates = [];

  // 1. Time-Optimal Search (Pure travel time)
  const timeRoute = dijkstra(edge => edge.travel_time);
  if (timeRoute && timeRoute.length > 0) rawCandidates.push({ type: 'time', edges: timeRoute });

  // 2. Safety-Optimal Search (Pure risk-weighted length)
  const safeRoute = dijkstra(edge => (edge.travel_time * 0.2) + (edge.distance * (edge.risk / 50)));
  if (safeRoute && safeRoute.length > 0) rawCandidates.push({ type: 'safety', edges: safeRoute });

  // 3. Balanced Search (Penalizing highest risk edges heavily)
  const balancedRoute = dijkstra(edge => edge.travel_time + (Math.pow(edge.risk / 20, 2) * 15));
  if (balancedRoute && balancedRoute.length > 0) rawCandidates.push({ type: 'balanced', edges: balancedRoute });

  // 4. Fallback search by penalizing first edge of time route to guarantee alternative
  if (timeRoute && timeRoute.length > 0) {
    const penalizedId = timeRoute[0].id;
    const altRoute = dijkstra(edge => edge.travel_time + (edge.id === penalizedId ? 500 : 0));
    if (altRoute && altRoute.length > 0) rawCandidates.push({ type: 'alternative', edges: altRoute });
  }

  // De-duplicate candidate paths based on sequence of edge IDs
  const seenPathKeys = new Set();
  const distinctCandidates = [];

  rawCandidates.forEach(cand => {
    const key = cand.edges.map(e => e.id).join('->');
    if (!seenPathKeys.has(key)) {
      seenPathKeys.add(key);
      const totalDistance = cand.edges.reduce((sum, e) => sum + e.distance, 0);
      const totalTimeSeconds = cand.edges.reduce((sum, e) => sum + e.travel_time, 0);
      const routeRisk = calculateRouteRisk(cand.edges, weights);

      // Collect summary of hazards encountered
      const hazardsCount = {
        potholes: cand.edges.filter(e => e.hazards.P >= 50).length,
        near_misses: cand.edges.filter(e => e.hazards.N >= 60).length,
        poor_lighting: cand.edges.filter(e => e.hazards.L >= 50).length,
        dangerous_turns: cand.edges.filter(e => e.hazards.C >= 50).length
      };

      distinctCandidates.push({
        id: `route_${distinctCandidates.length + 1}`,
        pathKey: key,
        edges: cand.edges,
        nodes: [cand.edges[0].from, ...cand.edges.map(e => e.to)],
        summary: cand.edges.map(e => e.name).join(' ➔ '),
        distance_meters: totalDistance,
        travel_time_seconds: totalTimeSeconds,
        travel_time_minutes: Math.ceil(totalTimeSeconds / 60),
        route_risk: routeRisk,
        hazards_count: hazardsCount
      });
    }
  });

  return distinctCandidates;
}

/**
 * Evaluates candidate routes for a given user safety preference lambda [0.00 .. 1.00]
 * Formula:
 * R_norm = R_route / 100
 * T_norm = (time - min_time) / (max_time - min_time)  [or time / max_time if normalized relative to baseline]
 * J(route, λ) = T_norm(route) + λ * R_norm(route)
 */
export function evaluateRoutesWithLambda(candidateRoutes, lambda = 0.50) {
  if (!candidateRoutes || candidateRoutes.length === 0) return [];

  const validLambda = Math.max(0, Math.min(1.0, parseFloat(lambda) || 0));

  // Determine min & max travel times across the candidate set for consistent [0..1] normalization
  const times = candidateRoutes.map(r => r.travel_time_seconds);
  const minTime = Math.min(...times);
  const maxTime = Math.max(...times);
  const timeSpread = maxTime - minTime;

  // Evaluate each route
  const evaluated = candidateRoutes.map(route => {
    // R_norm between 0.00 and 1.00
    const R_norm = route.route_risk / 100.0;

    // T_norm between 0.00 and 1.00 (normalized consistently across candidate set)
    // If all routes have same time, T_norm is 0
    const T_norm = timeSpread === 0 ? 0 : (route.travel_time_seconds - minTime) / timeSpread;

    // Generalized route cost: J(route, λ) = T_norm + (λ * R_norm)
    const cost = T_norm + (validLambda * R_norm);

    // Extra time relative to the fastest candidate
    const extraTimeSeconds = Math.max(0, route.travel_time_seconds - minTime);
    const extraTimeMinutes = Math.round(extraTimeSeconds / 60);

    return {
      ...route,
      R_norm: parseFloat(R_norm.toFixed(3)),
      T_norm: parseFloat(T_norm.toFixed(3)),
      cost: parseFloat(cost.toFixed(3)),
      extra_time_seconds: extraTimeSeconds,
      extra_time_minutes: extraTimeMinutes
    };
  });

  // Sort strictly by generalized cost J (lowest cost wins)
  evaluated.sort((a, b) => a.cost - b.cost);

  // Identify Fastest, Balanced, and Safety-Prioritized based on genuine metrics
  const fastest = [...evaluated].sort((a, b) => a.travel_time_seconds - b.travel_time_seconds)[0];
  const safest = [...evaluated].sort((a, b) => a.route_risk - b.route_risk)[0];

  return evaluated.map((route, idx) => {
    const isRecommended = idx === 0; // lowest generalized cost
    let label = 'Alternative';

    if (route.id === fastest.id && route.id === safest.id) {
      label = 'Optimal (Fastest & Safest)';
    } else if (route.id === fastest.id) {
      label = 'Fastest';
    } else if (route.id === safest.id) {
      label = 'Safety-Prioritized';
    } else {
      label = 'Balanced Corridor';
    }

    // Human-readable explanation
    let explanation = '';
    if (isRecommended) {
      if (validLambda <= 0.25) {
        explanation = `Recommended for λ = ${validLambda.toFixed(2)} (Fast-focused): Minimizes travel time (${route.travel_time_minutes} min) with manageable risk score of ${route.route_risk}/100.`;
      } else if (validLambda >= 0.75) {
        explanation = `Recommended for λ = ${validLambda.toFixed(2)} (Safety-focused): Avoids severe near-misses and blind turns, achieving lower risk score of ${route.route_risk}/100 with only +${route.extra_time_minutes} min travel time.`;
      } else {
        explanation = `Recommended for λ = ${validLambda.toFixed(2)} (Balanced): Best trade-off between time (${route.travel_time_minutes} min) and safety (${route.route_risk}/100 risk score).`;
      }
    } else {
      explanation = `Alternative option: Generalized cost J = ${route.cost} (+${(route.cost - evaluated[0].cost).toFixed(2)} over recommendation).`;
    }

    return {
      ...route,
      rank: idx + 1,
      isRecommended,
      routeLabel: label,
      explanation
    };
  });
}
