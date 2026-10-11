# StockSense: Adaptive Inventory Replenishment Engine

> **Hackathon MVP** — A deterministic supply chain operations research engine paired with a 3D-driven storytelling experience.

---

## 🎯 Core Architectural Philosophy

> **Non-Negotiable Rule:** AI must **NEVER** override deterministic operations research mathematics. The mathematics dictates inventory replenishment thresholds; AI is strictly isolated to classifying and clamping historical demand anomalies to protect variance.

Most legacy ERP and spreadsheet-driven operations rely on static reorder points. When demand surges or supplier lead times fluctuate unexpectedly, static safety buffers collapse and stock drains silently to zero. 

Conversely, naive machine learning systems that forecast unconstrained demand allow erroneous data spikes to inflate mathematical sample variance by 300%+, locking up millions in unproductive working capital. 

**StockSense solves this by pairing pure stochastic operations research with machine-learning anomaly defense:**
1. Pure deterministic formulas compute Safety Stock ($SS$), Reorder Point ($ROP$), and Economic Order Quantity ($EOQ$).
2. AI classifies demand anomalies (Data Entry Errors vs. One-Time Promotions vs. Stockout Censoring).
3. Statistical upper-percentile clamps bound anomalies, ensuring baseline sample variance remains uncontaminated.

---

## 📐 Deterministic Mathematical Engine

All replenishment parameters are computed deterministically using standard operations research formulations:

### 1. Safety Stock ($SS$) with Stochastic Demand & Stochastic Lead Time
$$SS = Z \times \sqrt{(L_{\text{avg}} \times \sigma^2_D) + (D_{\text{avg}}^2 \times \sigma^2_L)}$$
*where $Z$ is the quantile corresponding to the Target Service Level derived via high-accuracy rational approximation of the Inverse Normal Cumulative Distribution Function.*

### 2. Reorder Point ($ROP$)
$$ROP = (D_{\text{avg}} \times L_{\text{avg}}) + SS$$

### 3. Economic Order Quantity ($EOQ$)
$$EOQ = \sqrt{\frac{2 \times D_{\text{annual}} \times S}{H}}$$
*where $S$ is fixed ordering cost and $H$ is annual holding cost per unit.*

### 4. Inventory Position ($IP$)
$$IP = \text{On Hand} + \text{On Order} - \text{Backorders}$$

---

## 🛠 Tech Stack

- **Framework:** Next.js (App Router, Turbopack)
- **Language:** TypeScript 5
- **3D / Immersive:** Three.js with ACESFilmicToneMapping, procedural low-poly product generation, contact shadow planes, and CatmullRomCurve3 camera paths
- **Animation / Scroll:** GSAP & ScrollTrigger
- **2D Data Visualizations:** Recharts (responsive area, line, and dual-axis charts)
- **Styling:** Tailwind CSS (v4) with customized industrial tokens
- **Typography:**
  - Fraunces (Wordmarks & Chapter Headings)
  - Inter (Clean UI & System Labels)
  - JetBrains Mono (Numbers, Equations, Formulas, & Data Readouts)

---

## 🎨 Industrial Design System

- **Backgrounds:** Stone (`#F3F1ED`), Alternate Surface (`#FAF9F7`)
- **Text:** Ink (`#1C1B19`), Muted (`#6D6A64`)
- **Borders:** Border (`#DAD6CE`)
- **Accent:** Deep Teal (`#0F5C5C`)
- **Status Colors (Always paired with text):**
  - **Healthy Nominal:** Moss Green (`#4F7A4A`)
  - **Buffer Watch:** Ochre (`#B7791F`)
  - **Order Now:** Brick Red (`#B23A2E`)
  - **Forecast Baseline:** Slate Blue (`#3F6C8F`)
  - **Anomaly Plum:** (`#7A5A8C`)

---

## 🚀 Key Features

### 1. Persistent 3D Canvas & Storytelling Flow
- **Sequence 1: The Intro (0–7s)**
  - "StockSense" Fraunces wordmark appears.
  - 8 procedural low-poly 3D products (robotic joint assembly, quad drone airframe, stepper motor, cable spool, industrial luminaire, Li-ion battery pack, process tin drum, spiral notebook) revolve in a tilted ring (15°) around the wordmark.
  - Interactive leader lines and status tags face the camera.
  - The camera plunges through the orbital ring into a 3D warehouse environment.
- **Sequence 2: Scroll-Driven Story (GSAP Scrubbing)**
  - **Chapter 1 (The Trap):** Stops at empty warehouse shelves; visualizes the danger of static ROPs collapsing during supplier delays.
  - **Chapter 2 (The Math):** Stops at the blueprint wall with an interactive Target Service Level slider (90% to 99.5%) updating $Z$-scores and safety stock in real-time.
  - **Chapter 3 (The Spikes):** Stops at the automated conveyor sorting belt; demonstrates how AI identifies promotions and typos, applying bounded clamps to shield baseline variance.
  - **Chapter 4 (Stress Testing):** Dynamic network shock simulation buttons (+40% demand surge, +7d supplier delay).
  - **Chapter 5 (The Evidence):** Holdout validation metrics and a CTA transition to the Command Center.
- **Sequence 3: Smooth Dashboard Backdrop Transition**
  - Entering the dashboard applies `blur(12px) brightness(0.92)` to the 3D canvas, turning it into a filmic background.

### 2. The Command Center Dashboard
- **The Crisis Simulator (Critical Feature):**
  - User-adjustable sliders for **Supplier Lead Time Delay** (0 to 30 days) and **Demand Surge Multiplier** (1.0x to 3.0x).
  - Instant live redraw using Recharts, showing the ROP line shooting up, the Safety Stock band widening, and dynamic replenishment cycles.
  - Before & After metrics: Base vs. Stressed ROP, Base vs. Stressed SS, Expected Annual Holding Cost, Stockout Probability Risk, and Working Capital Buffer Required.
- **Autonomous Product Grid:**
  - 8 dense industrial cards displaying SKU, name, category, inventory position, days of cover, service level, and status badge.
  - Clicking any card opens a mathematical audit modal detailing exact formula steps and the 10 observed lead times.
- **Anomaly Classification & Clamp Audit Log:**
  - Filterable audit table showing historical spikes, raw demand, clamped targets, variance shield impact, AI classification badge, confidence score, and justification.
- **90-Day Hidden Chronological Holdout Prover:**
  - Direct split chart comparing ground truth actual demand vs. naive 14-day moving average vs. StockSense clamped forecast.
  - Displays MAE reduction (+34.8% error reduction) and false over-order cycles prevented.
- **Mechanical Rolling Digit Ticker:**
  - Animated rolling digit counter for total network safety stock buffer with a "Shift Network" simulation trigger.

---

## 💻 Local Setup & Execution

### Prerequisites
- Node.js (v18+ or v20+)
- npm (v9+)

### Installation
```bash
# Clone the repository
git clone -b frontend https://github.com/VIVEKBSUTAR/lesquad_vortexa.git
cd lesquad_vortexa

# Install dependencies
npm install

# Run the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

To skip the 3D intro directly for fast testing, navigate to:
```
http://localhost:3000/?skip=1
```
*(or click the floating "Skip to App" pill button in the top-right corner)*

### Production Build
```bash
# Build optimized production bundle
npm run build

# Start production server
npm run start
```

---

## 📂 Project Architecture

```
stocksense/
├── src/
│   ├── app/
│   │   ├── globals.css           # Tailwind v4 theme tokens & custom range sliders
│   │   ├── layout.tsx            # Google Fonts (Fraunces, Inter, JetBrains Mono)
│   │   └── page.tsx              # Main orchestrator (Canvas, Intro, Story, Dashboard)
│   ├── components/
│   │   ├── canvas/
│   │   │   └── StockSense3D.tsx  # Persistent WebGL canvas, 8 procedural 3D products, warehouse
│   │   ├── dashboard/
│   │   │   ├── AnomalyAuditLog.tsx    # Filterable anomaly clamp table
│   │   │   ├── CrisisSimulator.tsx    # Interactive stress sliders & reactive Recharts
│   │   │   ├── DashboardView.tsx      # Main command center layout & tab orchestrator
│   │   │   ├── HoldoutProver.tsx      # 90-day MAE split comparison chart
│   │   │   ├── NetworkTicker.tsx      # Mechanical rolling digit buffer counter
│   │   │   ├── ProductDetailModal.tsx # Full formula audit & lead time breakdown
│   │   │   └── ProductGrid.tsx        # 8 dense SKU cards with status badges
│   │   ├── intro/
│   │   │   └── IntroOverlay.tsx  # Sequence 1 orbital intro (0-7s) & Skip button
│   │   ├── navigation/
│   │   │   └── Header.tsx        # Brand wordmark, Story/Dashboard toggle, status badge
│   │   └── story/
│   │       └── StoryView.tsx     # 5-chapter scroll-driven storytelling view
│   └── lib/
│       ├── data.ts               # Synthetic 8-product dataset, 365d demand, anomalies, holdouts
│       ├── math.ts               # Pure deterministic OR formulas (SS, ROP, EOQ, InvPos, Z-Score)
│       └── types.ts              # Strict TypeScript data contracts
├── package.json
└── README.md
```

---

## 🛡 Performance & Constraints Compliance

- **Draw Calls:** Kept under 250 calls via shared geometry instances, contact shadow texture planes (no expensive real-time shadow passes), and clean disposal.
- **Responsive & Accessible:** Strict semantic markup, WCAG contrast compliant status pairing, keyboard accessible modal.
- **Deterministic Pure Math:** All formulas unit-tested with verified operations research standards.
