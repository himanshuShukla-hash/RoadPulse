# RoadPulse — Safety-Aware Google Maps Companion Extension

**Turning Near-Misses & Hazard Intelligence into Safer Navigation.**

RoadPulse is a Chrome extension that overlays real-time road-safety intelligence directly onto Google Maps.

---

## 🌟 Key Features

1. **Popup Location Input with Instant Google Maps Sync:**
   - Click the RoadPulse extension icon in your Chrome toolbar.
   - Enter your **Starting Point** and **Destination** (or click one-click quick presets like *Rithala Metro Station ➔ M2K Cinemas Rohini*).
   - Click **"Start Route on Google Maps"** — Google Maps immediately opens with those exact locations pre-filled!

2. **In-Page Floating Safety HUD:**
   - Appears automatically in the top-right corner of Google Maps.
   - Stable, locked origin & destination indicators without flickering or unexpected jumping.

3. **3 Genuinely Distinct Safety Route Corridors:**
   - **★ Recommended (Fastest):** *CH Bhim Singh Marg ➔ 100 Feet Rd ➔ Outer Ring Rd Express* (`Risk: 56.8/100`)
   - **Balanced Corridor:** *Bhagwan Mahavir Marg ➔ Sector 3 M2K ➔ Deepali Chowk Bypass* (`Risk: 34.5/100`)
   - **Safety-Prioritized:** *Rohini Sector 16/17 Calmed Parkway ➔ Greenbelt Avenue ➔ Sector 24* (`Risk: 16.5/100`)
   - **One-Click Route Switch:** Clicking any card in the HUD instantly auto-fills and re-routes Google Maps through that safety corridor.

4. **Dedicated Rohini Area Hazard Dataset (`rohiniDataset.ts`):**
   - 15 realistic hazard hotspots across Rohini (e.g. *Mangolpuri Flyover Sinkholes*, *Madhuban Chowk Blind Turn*, *Sultanpuri Dark Stride*, *M2K Cinema Curve*, *Japanese Park Perimeter*, *Dr. BSA Hospital Emergency Cut*).

5. **In-HUD Hazard Reporting (With Photo Proof Verification):**
   - Click **`+ Report Hazard`** directly in the HUD.
   - Choose category: *Pothole*, *Sharp Blind Curve*, *Accident-Prone Junction*, *Broken Streetlamp*, or *Near-Miss*.
   - Upload photo proof with automated geotag & timestamp verification.

6. **Live Driving Safety Guard:**
   - Click **"Start Live Guard"** while navigating to receive proactive notifications (e.g. *"⚠️ In 400m: High near-miss intersection & sharp curve ahead"*).

---

## 🚀 Installation & Setup in Chrome

1. Clone the repository:
   ```bash
   git clone https://github.com/himanshuShukla-hash/RoadPulse.git
   cd RoadPulse
   ```

2. Build the extension bundle:
   ```bash
   cd extension
   npm install
   npm run build
   ```

3. Load unpacked extension in Google Chrome:
   - Navigate to `chrome://extensions/` in Chrome.
   - Toggle **Developer mode** ON (top right corner).
   - Click **"Load unpacked"**.
   - Select the folder:  
     `/Users/himanshushukla/Downloads/RoadPulse/extension/dist`

4. Pin the **RoadPulse** icon to your Chrome toolbar.

---

## 🧭 Live Demo Workflow

1. Click the **RoadPulse** icon in your browser toolbar.
2. Select or enter:
   - **Origin**: `Rithala Metro Station, Bhagwan Mahavir Marg`
   - **Destination**: `M2K Cinemas Rohini, Sector 3, Delhi`
3. Click **"Start Route on Google Maps"**.
4. Notice that Google Maps loads the directions, and the **RoadPulse HUD** appears on the top right showing 3 alternative corridors with **Safety Risk Scores**.
5. Click **"Balanced Corridor"** or **"Safety-Prioritized"** — watch Google Maps immediately re-route through that safer corridor!
6. Click **`+ Report Hazard`** to demonstrate adding a live citizen hazard with photo proof.
