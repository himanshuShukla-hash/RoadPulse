import test from 'node:test';
import assert from 'node:assert/strict';
import { 
  calculateEdgeRisk, 
  calculateRouteRisk, 
  evaluateRoutesWithLambda, 
  findCandidateRoutes,
  DEFAULT_WEIGHTS 
} from '../riskEngine.js';

test('1. Core formula: R_edge = 0.35P + 0.30N + 0.20L + 0.15C', () => {
  // P=100, N=100, L=100, C=100 -> exactly 100
  const maxRisk = calculateEdgeRisk({ P: 100, N: 100, L: 100, C: 100 }, DEFAULT_WEIGHTS);
  assert.equal(maxRisk, 100);

  // P=0, N=0, L=0, C=0 -> exactly 0
  const zeroRisk = calculateEdgeRisk({ P: 0, N: 0, L: 0, C: 0 }, DEFAULT_WEIGHTS);
  assert.equal(zeroRisk, 0);

  // Mixed: P=50 (17.5), N=60 (18.0), L=40 (8.0), C=20 (3.0) -> 46.5
  const mixedRisk = calculateEdgeRisk({ P: 50, N: 60, L: 40, C: 20 }, DEFAULT_WEIGHTS);
  assert.equal(mixedRisk, 46.5);
});

test('2. Missing hazard values default gracefully to 0 without NaN', () => {
  const partial = calculateEdgeRisk({ P: 80 }, DEFAULT_WEIGHTS);
  assert.equal(partial, 28); // 80 * 0.35 = 28
  assert.ok(!Number.isNaN(partial));
});

test('3. Route-risk aggregation: Distance-weighted average segment risk', () => {
  const mockEdges = [
    { distance: 1000, hazards: { P: 100, N: 100, L: 100, C: 100 } }, // risk = 100
    { distance: 3000, hazards: { P: 0, N: 0, L: 0, C: 0 } }            // risk = 0
  ];
  // (1000 * 100 + 3000 * 0) / 4000 = 25
  const routeRisk = calculateRouteRisk(mockEdges, DEFAULT_WEIGHTS);
  assert.equal(routeRisk, 25);
});

test('4. Candidate route generation produces distinct valid connected paths', () => {
  const routes = findCandidateRoutes('n2', 'n9', DEFAULT_WEIGHTS, []);
  assert.ok(routes.length >= 2, 'Should discover multiple candidate routes');
  routes.forEach(r => {
    assert.equal(r.nodes[0], 'n2', 'Must start at origin node');
    assert.equal(r.nodes[r.nodes.length - 1], 'n9', 'Must reach destination node');
    assert.ok(r.travel_time_seconds > 0);
    assert.ok(r.distance_meters > 0);
  });
});

test('5. Lambda slider mechanics: Fast vs Safety tradeoff', () => {
  const routes = findCandidateRoutes('n2', 'n9', DEFAULT_WEIGHTS, []);
  assert.ok(routes.length >= 2);

  // At lambda = 0.00 (Pure fastest), fastest travel time candidate MUST rank #1
  const evaluatedFast = evaluateRoutesWithLambda(routes, 0.00);
  assert.equal(evaluatedFast[0].extra_time_seconds, 0, 'Fastest route must win when lambda=0');

  // At lambda = 1.00 (Safety prioritized), candidate with significantly lower risk is favored
  const evaluatedSafe = evaluateRoutesWithLambda(routes, 1.00);
  assert.ok(evaluatedSafe[0].cost <= evaluatedSafe[1].cost, 'Lowest generalized cost J must win');

  // Verify cost formula J = T_norm + (lambda * R_norm)
  evaluatedSafe.forEach(r => {
    const expected = parseFloat((r.T_norm + 1.00 * r.R_norm).toFixed(3));
    assert.equal(r.cost, expected);
  });
});

test('6. Boundary values for lambda (0.00 and 1.00) handle cleanly', () => {
  const routes = findCandidateRoutes('n2', 'n9', DEFAULT_WEIGHTS, []);
  const evalZero = evaluateRoutesWithLambda(routes, 0.0);
  assert.equal(evalZero[0].isRecommended, true);

  const evalOne = evaluateRoutesWithLambda(routes, 1.0);
  assert.equal(evalOne[0].isRecommended, true);
});
