# RoadPulse — Safety-Aware Google Maps Companion Extension (Manifest V3)

**RoadPulse** is a Chrome extension companion that adds road-safety intelligence directly to a user's navigation workflow. 

Instead of replacing Google Maps, RoadPulse answers:  
> *"Should I take the fastest route, or spend a little more time avoiding known road hazards?"*

---

## Architecture Overview

```
                      ┌──────────────────────────────────────┐
                      │    Google Maps (Primary Navigation)  │
                      └──────────────────┬───────────────────┘
                                         │ Continues ordinary navigation
                                         ▼
┌────────────────────────────────────────────────────────────────────────┐
│               RoadPulse Chrome Extension (Manifest V3)                 │
├─────────────────────────┬─────────────────────────┬────────────────────┤
│   Popup User Interface  │ Background Service      │ Content Script     │
│  (React 18 + TS + Vite) │ Worker (Permitted ops)  │ (Maps Integration) │
└─────────────────────────┴────────────┬────────────┴────────────────────┘
                                       │ HTTP / REST
                                       ▼
┌────────────────────────────────────────────────────────────────────────┐
│                   RoadPulse Routing & Hazard API                       │
├────────────────────────────────────────────────────────────────────────┤
│ • 5-Factor Risk Engine: R_edge = 0.35P + 0.30N + 0.20L + 0.15C         │
│ • Distance-weighted Route Risk: R_route = Σ(dist_i * R_i) / Σ(dist_i)  │
│ • Generalized Cost: J(route, λ) = T_norm + (λ * R_norm)                │
│ • Graph Router: Dijkstra multi-path generation (18 nodes, 27 edges)    │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 1. Quick Start: Running the Backend

```bash
cd server
npm install
npm test      # Runs automated unit tests for risk formula & lambda mechanics
npm start     # Runs on http://localhost:5001
```

---

## 2. Quick Start: Loading the Chrome Extension

1. **Build the extension package:**
   ```bash
   cd extension
   npm install
   npm run build
   ```
   *(This outputs the unpacked extension bundle into `extension/dist/`)*

2. **Load into Google Chrome:**
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable **Developer mode** (toggle in the top-right corner).
   - Click **"Load unpacked"**.
   - Select the directory:  
     `/Users/himanshushukla/Downloads/RoadPulse/extension/dist`

3. **Pin & Open RoadPulse:**
   - Click the puzzle piece icon in Chrome's toolbar and pin **RoadPulse**.
   - Click the RoadPulse icon to open the companion interface.

---

## 3. Demo Walkthrough for Judges

1. **Deterministic Demo Corridor:**
   - Select **Origin**: *Nexus Tech Park (North Hub)*
   - Select **Destination**: *Grand Market Square (South Hub)*
   - Click **"Analyze Safety Alternatives"**.

2. **Observe Multi-Path Candidates:**
   - **Fastest Route:** Direct arterial flyover (Quickest time, but high pothole and near-miss exposure).
   - **Balanced Route:** Hospital linkway and midtown promenade.
   - **Safety-Prioritized Route:** Speed-calmed greenbelt and residential corridor (Significantly lower risk score).

3. **Adjust the Safety Preference ($\lambda$) Slider:**
   - Slide $\lambda = 0.00$: Fastest route wins (minimized travel time).
   - Slide $\lambda = 0.50$: Balanced candidate wins.
   - Slide $\lambda = 1.00$: Safety-prioritized candidate wins (minimizing hazards $0.35P + 0.30N + 0.20L + 0.15C$).
   - Watch the generalized cost $J = T_{\text{norm}} + \lambda \cdot R_{\text{norm}}$ recalculate and re-rank live.

4. **Launch into Google Maps:**
   - Click **"Continue Route in Google Maps"** to open standard navigation with the selected origin & destination.

5. **Report Citizen Hazard:**
   - Click the **"Report"** button in the header.
   - Select a hazard category (Pothole, Near-Miss, Poor Lighting, Dangerous Turn) with severity slider and submit.
   - The backend immediately logs the hazard into the graph edge and recalculates the candidate routes!

---

## 4. Key Limitations & Assumptions

- **Scope:** First version focuses on a deterministic synthetic demonstration area (tech corridor) to guarantee consistent, crash-proof judging evaluations without depending on thousands of crowdsourced reports.
- **Google Maps Decoupling:** RoadPulse does not manipulate Google Maps internals, inject unverified lines, or scrape private DOM nodes. Google Maps handles ordinary turn-by-turn navigation; RoadPulse provides companion hazard intelligence and risk-cost analysis.
