# RoadPulse

**Turning near misses into safer roads.**

RoadPulse is a near-miss intelligence and road-safety prioritization platform. It collects structured observations of dangerous road situations, groups nearby reports into location-level risk signals, and helps reviewers prioritize field audits and track safety interventions.

> RoadPulse is an early-warning and decision-support tool. It is **not** an accident predictor and **not** an official blackspot identification system.

**Status:** Hackathon MVP (v1.0). Design and architecture are complete; the build is in progress.
**Track:** Open Innovation (civic technology)

---

## Table of contents

- [The problem](#the-problem)
- [How it works](#how-it-works)
- [Features](#features)
- [User roles](#user-roles)
- [Risk scoring model](#risk-scoring-model)
- [Tech stack](#tech-stack)
- [Data model](#data-model)
- [Getting started](#getting-started)
- [Project structure](#project-structure)
- [Roadmap](#roadmap)
- [Success metrics](#success-metrics)
- [Risks and mitigations](#risks-and-mitigations)
- [Scope and boundaries](#scope-and-boundaries)
- [Team](#team)
- [License](#license)

---

## The problem

Road users face dangerous moments that never become recorded accidents: sudden braking at blind turns, pedestrian near-collisions, poor visibility, unsafe crossings and recurring vehicle-pedestrian conflicts. Official crash records only capture fatalities and property damage, so recurring near-miss warnings go unnoticed until serious harm occurs. Citizen observations stay scattered in group chats and isolated complaints, with no structure and no map.

RoadPulse makes these observations structured, geographically discoverable and actionable.

## How it works

1. A citizen submits a near-miss report (location, time, hazard type, optional photo).
2. The backend validates required fields and flags potential duplicates.
3. Reports are grouped by geographic proximity.
4. The scoring engine calculates a transparent screening score.
5. A reviewer verifies evidence and prioritizes a field audit.
6. An administrator records a proposed or completed intervention.
7. Follow-up observations are compared with the baseline period.

## Features

| ID | Feature | Summary |
|----|---------|---------|
| FR-01 | Near-miss reporting | Hazard category, map or device location, incident date/time, road-user type, description, optional photos. Incident time and submission time are stored separately. |
| FR-02 | Interactive map | Markers with category, date range, verification and priority filters. Unverified reports are visibly distinguished. No personal information on public maps. |
| FR-03 | Risk prioritization | Configurable location-level screening score with a human-readable explanation and inspectable contributing reports. |
| FR-04 | Verification workflow | Reviewers mark reports as under review, verified, rejected or duplicate. Decisions and timestamps are recorded. |
| FR-05 | Safety-audit tracking | Create audit tasks per location (owner, due date, status) and record findings, interventions and follow-ups. |
| FR-06 | Outcome monitoring | Compare observations before and after an intervention over defined time windows, without inferring causation from counts alone. |

## User roles

- **Citizen:** submit near-miss observations, view public hazards, corroborate existing reports.
- **Safety reviewer:** review evidence, mark duplicates, verify observations, update review status.
- **Administrator:** manage review workflows, assign audits, configure scoring rules, monitor outcomes.

## Risk scoring model

Each factor is normalized from 0 to 100:

```
Score = 0.30R + 0.25V + 0.20T + 0.15E + 0.10C
```

| Symbol | Factor | Weight |
|--------|--------|--------|
| R | Repeated observations | 30% |
| V | Potential severity | 25% |
| T | Recency | 20% |
| E | Evidence quality | 15% |
| C | Independent corroboration | 10% |

| Score | Display band |
|-------|--------------|
| 0-39 | Routine review |
| 40-69 | Elevated review priority |
| 70-100 | High review priority |

Weights and thresholds are proposed product defaults, to be calibrated during testing. They are **not** validated safety standards. Scores are screening indicators, not accident probabilities. They must be explainable, configurable and subject to human review, and duplicate or coordinated submissions must not automatically raise priority.

## Tech stack

| Layer | Technology |
|-------|------------|
| Frontend | React, Tailwind CSS |
| Backend | Node.js, Express |
| Database | PostgreSQL with PostGIS |
| Mapping | Leaflet, OpenStreetMap |
| Charts | Chart.js |
| Evidence storage | Supabase Storage (or equivalent) |
| Authentication | Supabase Auth (or secure backend-managed auth) |

No custom AI/ML model is required.

## Data model

| Entity | Fields |
|--------|--------|
| Users | id, role, created_at |
| Reports | id, category, description, latitude, longitude, incident_at, submitted_at, status |
| Evidence | id, report_id, file_path, uploaded_at |
| Locations | id, geometry, risk_score, score_updated_at |
| Reviews | id, report_id, reviewer_id, decision, notes |
| Audits | id, location_id, assigned_to, due_date, status |
| Interventions | id, location_id, action, completed_at |
| Observations | id, location_id, observed_at, observation_type |

## Getting started

> The codebase is under active development. The steps below describe the intended setup and will be updated as the project is built.

### Prerequisites

- Node.js (LTS)
- PostgreSQL with the PostGIS extension
- A Supabase project (for auth and evidence storage)

### Setup

```bash
# 1. Clone the repository
git clone https://github.com/<your-username>/roadpulse.git
cd roadpulse

# 2. Install dependencies
cd server && npm install
cd ../client && npm install

# 3. Configure environment variables
cp server/.env.example server/.env
cp client/.env.example client/.env

# 4. Set up the database (enable PostGIS, then apply the schema)
psql -d roadpulse -c "CREATE EXTENSION IF NOT EXISTS postgis;"
psql -d roadpulse -f server/db/schema.sql

# 5. Run the app
cd server && npm run dev
cd client && npm run dev
```

### Environment variables (planned)

| Variable | Used by | Purpose |
|----------|---------|---------|
| `DATABASE_URL` | server | PostgreSQL/PostGIS connection string |
| `SUPABASE_URL` | server, client | Supabase project URL |
| `SUPABASE_ANON_KEY` | client | Public Supabase key |
| `SUPABASE_SERVICE_KEY` | server | Server-side Supabase key (never expose to the client) |

## Project structure

Planned layout:

```
roadpulse/
├── client/          # React + Tailwind frontend
├── server/          # Node.js + Express API
│   └── db/          # Schema, migrations, seed data
├── docs/            # PRD, slides, diagrams
└── README.md
```

## Roadmap

Ten-day implementation plan:

| Days | Focus |
|------|-------|
| 1-2 | Project setup, authentication, database schema |
| 3-4 | Report form, location selection, evidence upload, report list |
| 5-6 | Geographic grouping, scoring rules, map filters |
| 7-8 | Reviewer dashboard, audit tasks, activity logs |
| 9-10 | Synthetic demo data, testing, UI refinement, presentation |

## Success metrics

- Percentage of reports with complete required fields
- Percentage of reports reviewed
- Median submission-to-review time
- Number of locations with independent corroboration
- Number of audit tasks completed
- Change in near-miss reports across defined pre- and post-intervention periods

Report counts are affected by participation and reporting coverage. They must not be presented as direct proof of accident reduction.

## Risks and mitigations

| Risk | Mitigation |
|------|------------|
| False reports | Rate limiting, duplicate flags, human review |
| Limited real-world data | Clearly labelled synthetic data for the demo |
| Lack of official integration | Demonstrate internal audit workflows |
| Misleading scores | Expose scoring factors, require field verification |
| Privacy concerns | Minimize personal data, restrict evidence access |
| Unproven impact | Track interventions without claiming causation |

## Scope and boundaries

**Goals:** structured near-miss reports, interactive map, location-level clustering, explainable and configurable prioritization, verification and audit assignment, intervention tracking.

**Non-goals:** exact accident prediction, automatic official blackspot designation, unauthorised integration with government systems, real-time vehicle tracking, automatic emergency dispatch.

RoadPulse complements existing road-safety reporting and accident-data systems. It does not replace official blackspot criteria, professional road-safety audits, emergency services or government authority decisions.

**Demo data:** the hackathon demo uses clearly labelled synthetic data. A real pilot should use consented, manually verified observations and appropriate safety review.

## Team

KingKong



