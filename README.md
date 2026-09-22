# AI-Based Disaster Intelligence System (Academic Web Prototype)

> **Academic & Research Prototype Notice**  
> This system is an academic proof-of-concept for multimodal disaster intelligence and crisis response decision support. It integrates meteorological telemetry, zero-shot computer vision, optical change detection, emergency message triage, and geospatial shelter matching into a unified command console.  
> **It is NOT certified, production-hardened emergency response infrastructure and must not be used as the sole basis for real-world life-safety decisions.**

---

## 1. Project Overview

The **AI-Based Disaster Intelligence System** is an end-to-end web prototype that synthesizes heterogeneous disaster data streams into actionable situational intelligence. Rather than assessing risk solely based on user coordinates or tabular weather in isolation, the platform unifies four distinct analytical modalities:

```
[Target Coordinates & Live Weather] ──┐
[Disaster Aerial Imagery (CLIP)]    ──┼──> [AI Analysis Pipeline] ──> [Deterministic Severity] ──> [Shelter Logistics] ──> [Alerts & SitRep]
[Pre/Post Satellite Tiles (OpenCV)] ──┤
[Citizen Emergency Text (BART)]    ──┘
```

### Core Pipeline Flow:
1. **Location & Weather Telemetry:** Live meteorological parameters (precipitation, wind velocity, temperature, humidity) are ingested from the Open-Meteo API for selected coordinates.
2. **Meteorological Risk Evaluation:** A trained XGBoost model computes an empirical disaster risk probability and score ($0-100$).
3. **Computer Vision & Object Detection:** OpenAI CLIP performs zero-shot hazard classification (flood, wildfire, earthquake, cyclone, landslide), while YOLO11 registers detected objects (people, vehicles, boats).
4. **Before/After Surface Damage:** OpenCV computes optical pixel displacement matrices and generates a false-color JET damage heatmap.
5. **Citizen Dispatch NLP Triage:** BART zero-shot text classification categorizes incoming text reports and assigns contextual urgency levels.
6. **Deterministic Multimodal Severity:** An assessment engine deterministically fuses all independent signals into a final incident severity level (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`).
7. **GIS Evacuation Routing:** Geodesic distance algorithms identify the nearest available municipal shelter and plot a prototype evacuation path.
8. **Automated Incident Reporting & Alerts:** Generates downloadable Situation Reports (SitRep in Markdown/JSON) and dispatches automated SMTP emergency broadcast emails for high-threat incidents.

---

## 2. Main Features

- **Authentication & Role-Based Access Control:** Secure JWT Bearer token authentication with bcrypt password hashing and pre-seeded administrative/operator roles.
- **Interactive Command Dashboard:** Centralized operations console with live telemetry widgets, coordinates input, high-risk location presets, active multi-modal context cards, and dynamic alert banners.
- **Location Presets & Manual Geocoding:** Instant preset loading for high-risk zones (Hyderabad, Jakarta, Mumbai, Miami, Manila) or custom latitude/longitude inputs.
- **Live Meteorological Telemetry:** Real-time atmospheric ingestion from the public Open-Meteo REST API.
- **XGBoost Meteorological Risk Assessment:** Statistical disaster risk evaluation predicting risk probability ($0.0-1.0$), risk score ($0-100$), and atmospheric factor impacts.
- **Zero-Shot Visual Classification (CLIP):** Aerial image classification across 6 disaster taxonomies using natural-language prompt ensembles with `openai/clip-vit-base-patch32`.
- **Supplementary Object Detection (YOLO11):** Entity recognition (persons, vehicles, vessels) using pretrained `yolo11n.pt` with annotated bounding-box overlays.
- **Before/After Damage Analysis (OpenCV):** Absolute frame differencing, structural pixel delta quantification, and visual damage heatmaps.
- **Emergency Message NLP Triage (BART):** Citizen dispatch categorization into 6 categories with automated urgency classification via `facebook/bart-large-mnli`.
- **Multimodal Overall Severity Synthesis:** Explicit deterministic decision rules preserving life-safety boundaries between `HIGH` (serious hazard / evacuation needed) and `CRITICAL` (immediate acute peril to life).
- **GIS Shelter Recommendation:** Nearest shelter calculation using Geopy geodesic distance, tracking shelter capacity, phone hotlines, and verified physical addresses.
- **Prototype Evacuation Path Visualization:** Leaflet map interface rendering epicenters, shelter markers, and a straight-line evacuation path.
- **SMTP Emergency Email Alerts:** Asynchronous background dispatch of formatted HTML warning emails for incidents assessed at `HIGH` or `CRITICAL` threat levels.
- **Historical Assessment Audit Log:** SQLite database storage of past incident evaluations, enabling retrospective review and verification.
- **Situation Report (SitRep) Engine:** Automated executive briefing synthesis covering all four intelligence modalities with one-click export to `.md` and `.json`.
- **Administrative Portal:** System telemetry counts, shelter CRUD registry management, and one-click database re-seeding.

---

## 3. Technology Stack

### Backend
| Component | Technology | Description |
| :--- | :--- | :--- |
| **Runtime & Language** | Python 3.12+ | Core backend execution environment |
| **API Framework** | FastAPI (0.110+) | High-performance asynchronous REST API framework |
| **ASGI Server** | Uvicorn (0.28+) | Production-grade ASGI server with auto-reload |
| **Database & ORM** | SQLite 3 & SQLAlchemy (2.0+) | Lightweight relational database and ORM layer |
| **Data Validation** | Pydantic (v2) | Strict schema definitions and request/response parsing |
| **Meteorological ML** | XGBoost (2.0+) & scikit-learn | Trained gradient-boosted decision tree risk classifier |
| **Vision Foundation Model**| OpenAI CLIP (`ViT-B/32`) | Zero-shot multi-prompt image hazard classifier |
| **Object Detection** | Ultralytics YOLO11 (`yolo11n.pt`)| Pretrained neural network for visual entity detection |
| **NLP Foundation Model** | BART Large MNLI (`facebook/bart-large-mnli`) | Zero-shot sequence classification for citizen dispatches |
| **Optical Processing** | OpenCV (`opencv-python-headless`) | Matrix absolute difference, Gaussian blur, and JET heatmap |
| **Geospatial Processing**| Geopy (2.4+) | Geodesic distance calculation between coordinates |
| **Authentication** | `python-jose`, `passlib`, `bcrypt` | JWT Bearer token encoding and password hashing |
| **Email Protocol** | `smtplib` & `ssl` (Standard Library) | Asynchronous TLS SMTP emergency email dispatch |

### Frontend
| Component | Technology | Description |
| :--- | :--- | :--- |
| **Framework & UI** | React 19 & Vite 8 | Reactive component architecture with instant HMR |
| **Styling** | Tailwind CSS (v3) & PostCSS | Utility-first responsive dark-mode styling |
| **GIS Mapping** | Leaflet (1.9+) | Interactive mapping, custom markers, and route polylines |
| **Iconography** | Lucide React | Clean, modern operational iconography |
| **HTTP Client** | Axios (1.20+) | Promise-based HTTP client with JWT request interceptors |

---

## 4. Project Structure

```
reddit-project/
├── README.md                      # Comprehensive project documentation
├── backend/
│   ├── disaster_intel.db          # Active SQLite database file
│   ├── requirements.txt           # Python dependencies
│   ├── run.py                     # Entry point for backend server (port 8000)
│   ├── .env.example               # Example environment variable template
│   ├── app/
│   │   ├── config.py              # Configuration, directories, and environment variables
│   │   ├── database.py            # SQLAlchemy engine, declarative base, and session
│   │   ├── main.py                # FastAPI app initialization, middleware, static mounts
│   │   ├── models/                # SQLAlchemy database models
│   │   │   ├── assessment.py      # Assessment record model (4-modality storage)
│   │   │   ├── report.py          # Generated SitRep metadata model
│   │   │   ├── shelter.py         # Municipal shelter model (with address and capacity)
│   │   │   ├── social.py          # Social dispatch model
│   │   │   └── user.py            # User account model
│   │   ├── schemas/               # Pydantic request/response schemas
│   │   ├── routers/               # API route definitions
│   │   │   ├── admin.py           # Administrative statistics, shelter CRUD, reseed
│   │   │   ├── assessments.py     # Assessment save, history, and deletion
│   │   │   ├── auth.py            # Authentication (/login, /register, /me)
│   │   │   ├── gis.py             # Nearest shelter calculation and list
│   │   │   ├── reports.py         # SitRep generation and download
│   │   │   ├── risk.py            # Meteorological risk calculation
│   │   │   ├── social.py          # Citizen emergency dispatch feed and triage
│   │   │   ├── vision.py          # CLIP image classification and OpenCV damage assessment
│   │   │   └── weather.py         # Open-Meteo live weather and preset retrieval
│   │   └── services/              # Business logic and AI model inference
│   │       ├── auth_service.py    # Password hashing and JWT token creation
│   │       ├── email_service.py   # HTML emergency email generator and SMTP dispatch
│   │       ├── gis_service.py     # Geodesic distance calculation and routing
│   │       ├── nlp_service.py     # BART zero-shot classification and urgency logic
│   │       ├── report_service.py  # SitRep Markdown and JSON synthesis
│   │       ├── risk_service.py    # XGBoost model loading and inference
│   │       ├── vision_service.py  # CLIP prompt ensemble, YOLO11, and OpenCV damage
│   │       └── weather_service.py # Open-Meteo REST API client
│   ├── data/
│   │   ├── seed_dispatches.json   # Seed citizen dispatches
│   │   ├── seed_shelters.json     # Seed municipal shelters with addresses
│   │   ├── xgboost_risk_model.json# Trained XGBoost classifier weights
│   │   └── samples/               # Benchmark imagery (flood, before, after)
│   └── uploads/                   # Runtime storage for raw and annotated images
└── frontend/
    ├── package.json               # Node.js dependencies and scripts
    ├── vite.config.js             # Vite configuration with backend proxy
    ├── tailwind.config.js         # Tailwind styling configuration
    ├── index.html                 # Main HTML entry point
    └── src/
        ├── App.jsx                # Main application state and tab navigation
        ├── api/
        │   └── client.js          # Axios client with JWT interceptor and base URL
        └── views/                 # View components
            ├── AdminView.jsx      # Admin telemetry and shelter management
            ├── DamageAssessmentView.jsx # Before/After optical differencing view
            ├── DashboardView.jsx  # Main command console and assessment synthesizer
            ├── EmergencyMessagesView.jsx# BART citizen dispatch triage view
            ├── HistoryView.jsx    # Assessment audit log history
            ├── ImageAnalysisView.jsx # CLIP + YOLO11 vision analysis view
            ├── LoginView.jsx      # Login view with quick-login buttons
            ├── RegisterView.jsx   # User registration view
            ├── ReportsView.jsx    # Situation Report view and download
            └── ShelterMapView.jsx # Full-screen GIS shelter map view
```

---

## 5. Prerequisites

Before installing, ensure the following software is installed on your operating system:

- **Python:** `3.10` or higher (verified on **Python 3.12.3**)
- **Node.js:** `18.0.0` or higher (verified on **Node.js v24.20.0**)
- **Package Managers:** `pip` (Python) and `npm` (Node.js v11+)
- **System Libraries (Linux):** Standard C/C++ build tools and OpenGL runtime for OpenCV (`libgl1`, `libglib2.0-0` or headless equivalent). `opencv-python-headless` is used to minimize external GUI library dependencies.
- **Model Checkpoint Storage:** Approximately 2.5 GB of free disk space is required on first launch to cache pre-trained weights from Hugging Face (`openai/clip-vit-base-patch32` ~1.5 GB, `facebook/bart-large-mnli` ~1.6 GB) and Ultralytics (`yolo11n.pt` ~6 MB).
  - *Tip: If running on a low-memory machine, set `FAST_DEV_MODE=1` in `backend/.env` to run with deterministic fallback heuristics without downloading large models.*

---

## 6. Installation

### 6.1 Backend Installation

1. **Clone the repository and enter the backend directory:**
   ```bash
   git clone <repository-url>
   cd reddit-project/backend
   ```

2. **Create and activate a Python virtual environment:**
   ```bash
   python3 -m venv venv
   source venv/bin/activate
   ```
   *(On Windows PowerShell: `venv\Scripts\Activate.ps1`)*

3. **Install Python dependencies:**
   ```bash
   pip install --upgrade pip
   pip install -r requirements.txt
   ```

4. **Configure environment variables:**
   Copy the example environment file:
   ```bash
   cp .env.example .env
   ```
   *(Edit `.env` if you want to configure live Gmail SMTP alert delivery; otherwise default safe fallbacks are used).*

5. **Start the backend server:**
   ```bash
   python run.py
   ```
   - The database (`disaster_intel.db`) is automatically initialized on startup.
   - Initial administrative accounts (`admin@disaster.intel`, `operator@disaster.intel`), municipal shelters, and sample dispatches are automatically seeded.
   - The backend will listen at `http://localhost:8000`.

---

### 6.2 Frontend Installation

1. **Open a new terminal and navigate to the frontend directory:**
   ```bash
   cd reddit-project/frontend
   ```

2. **Install Node.js dependencies:**
   ```bash
   npm install
   ```

3. **Start the Vite development server:**
   ```bash
   npm run dev
   ```
   - The frontend console will be accessible at `http://localhost:5173`.

---

## 7. Environment Variables

All backend configuration is loaded from `backend/.env`.

| Variable | Required | Description | Example / Default |
| :--- | :---: | :--- | :--- |
| `SECRET_KEY` | No | Secret key for signing JWT authentication tokens | `academic-disaster-intel-secret-key-2026` |
| `FAST_DEV_MODE` | No | Set to `1` to bypass heavy HuggingFace model downloads and use heuristic fallbacks | `0` |
| `SMTP_HOST` | No | SMTP relay host for emergency alert emails | `smtp.gmail.com` |
| `SMTP_PORT` | No | SMTP relay port (TLS) | `587` |
| `SMTP_USER` | No | Sender email account username | `user@gmail.com` |
| `SMTP_PASSWORD` | No | SMTP authentication password or Gmail 16-character App Password | `xxxx xxxx xxxx xxxx` |
| `SMTP_FROM_EMAIL` | No | Display email address for outbound alerts | `user@gmail.com` |
| `ALERT_RECIPIENT_EMAIL` | No | Default destination email for incident broadcasts | `emergency-officer@agency.org` |
| `VITE_API_URL` | No | (Frontend) Base URL for API requests. Defaults to `/api/v1` via Vite proxy | `/api/v1` |

> [!CAUTION]
> **Security Reminder:** Never commit real email passwords, Gmail App Passwords, or production JWT keys to a public GitHub repository. The `.gitignore` file is configured to exclude `.env` files.

---

## 8. Running the Application

### 1. Start Backend Server
```bash
cd backend
source venv/bin/activate
python run.py
```
- **REST API Base:** `http://localhost:8000`
- **Interactive Swagger Documentation:** `http://localhost:8000/docs`
- **Alternative ReDoc Documentation:** `http://localhost:8000/redoc`

### 2. Start Frontend Server
```bash
cd frontend
npm run dev
```
- **Web Application:** `http://localhost:5173`

### 3. Application Access & Proxy Communication
- The frontend runs on port `5173`.
- In development, Vite automatically proxies `/api` and `/uploads` requests to `http://127.0.0.1:8000`. Direct CORS is also enabled on the FastAPI backend for flexibility.

### 4. Pre-seeded Demo Credentials
For convenient demonstration, the login screen includes one-click quick-login buttons:

| Role | Email | Password | Scope |
| :--- | :--- | :--- | :--- |
| **Chief Incident Commander** | `admin@disaster.intel` | `admin123` | Full access, shelter CRUD, database reseed, audit history |
| **Field Operations Officer** | `operator@disaster.intel` | `operator123` | Assessment analysis, context injection, and SitRep export |

---

## 9. API Overview

All primary endpoints are grouped under `/api/v1`.

| Module | Method | Endpoint | Description |
| :--- | :--- | :--- | :--- |
| **Auth** | `POST` | `/api/v1/auth/register` | Register new user account |
| | `POST` | `/api/v1/auth/login` | Authenticate user and return JWT bearer token |
| | `GET` | `/api/v1/auth/me` | Retrieve authenticated user profile |
| **Weather** | `GET` | `/api/v1/weather/live?lat={lat}&lon={lon}` | Ingest real-time weather from Open-Meteo |
| | `GET` | `/api/v1/weather/presets` | Get high-risk regional coordinate presets |
| **Risk** | `POST` | `/api/v1/risk/evaluate` | Run XGBoost meteorological risk classifier |
| **Vision** | `POST` | `/api/v1/vision/analyze` | Run CLIP hazard classification + YOLO11 object detection |
| | `POST` | `/api/v1/vision/damage-assessment` | Run OpenCV Before/After optical differencing |
| **Social / NLP** | `GET` | `/api/v1/social/feed` | Retrieve simulated regional citizen emergency dispatches |
| | `POST` | `/api/v1/social/triage` | Triage dispatch feed with BART |
| | `POST` | `/api/v1/social/classify-custom` | Run BART zero-shot triage on arbitrary emergency text |
| **GIS** | `GET` | `/api/v1/gis/shelters` | Retrieve list of all registered municipal shelters |
| | `GET` | `/api/v1/gis/nearest?lat={lat}&lon={lon}` | Calculate nearest shelter via geodesic distance |
| **Assessments** | `POST` | `/api/v1/assessments/save` | Persist multimodal assessment and trigger alerts |
| | `GET` | `/api/v1/assessments/history` | Retrieve chronological assessment audit log |
| | `GET` | `/api/v1/assessments/{id}` | Retrieve individual assessment record by ID |
| | `DELETE` | `/api/v1/assessments/{id}` | Delete assessment record |
| **Reports** | `POST` | `/api/v1/reports/generate` | Generate formal Situation Report (Markdown / JSON) |
| | `GET` | `/api/v1/reports/download/{id}` | Download generated SitRep file |
| | `GET` | `/api/v1/reports/list` | List past generated reports |
| **Admin** | `GET` | `/api/v1/admin/stats` | Retrieve system telemetry and entity counts |
| | `POST` | `/api/v1/admin/shelters` | Add a new municipal shelter |
| | `DELETE` | `/api/v1/admin/shelters/{id}` | Remove a shelter from the registry |
| | `POST` | `/api/v1/admin/reseed` | Reset and reseed prototype shelters and dispatches |

---

## 10. AI/ML Pipeline

The analytical core of the platform is designed to illustrate how specialized foundation models and classical machine learning models operate in concert.

### 1. XGBoost Meteorological Risk Model
- **Purpose:** Statistical evaluation of ambient meteorological parameters to assess the probability of a localized weather disaster (e.g. storm surge, extreme flood conditions).
- **Input Features:** `rainfall` (mm), `temperature` (°C), `humidity` (%), `wind_speed` (km/h).
- **Model:** `XGBClassifier` loaded from `backend/data/xgboost_risk_model.json`.
- **Output Definition:**
  $$\text{risk\_probability} \in [0.0, 1.0]$$
  $$\text{risk\_score} = \text{risk\_probability} \times 100.0$$
- **Classification Rules:**
  - `risk_probability < 0.35` $\rightarrow$ `LOW`
  - `0.35 <= risk_probability < 0.65` $\rightarrow$ `MEDIUM`
  - `risk_probability >= 0.65` $\rightarrow$ `HIGH`
- **Important Distinction:** `risk_score` represents **solely the meteorological risk** calculated by XGBoost. It is not an aggregated multi-modal score.

### 2. OpenAI CLIP (`ViT-B/32`)
- **Purpose:** Zero-shot visual hazard classification of aerial and drone photography.
- **Model Architecture:** `openai/clip-vit-base-patch32` loaded via Hugging Face Transformers.
- **Methodology:** Rather than single-word labels, it uses descriptive prompt ensembles per taxonomy (e.g., *"an aerial photograph of a flooded area with water covering roads and buildings"*) to maximize cosine similarity alignment with aerial perspectives.
- **Categories:** `flood`, `wildfire`, `earthquake damage`, `cyclone hurricane storm`, `landslide`, `normal scene`.
- **Academic Scope:** This is a zero-shot implementation using OpenAI's public base model weights; it has not been fine-tuned on specialized aerial disaster datasets.

### 3. Ultralytics YOLO11 (`yolo11n.pt`)
- **Purpose:** Supplementary visual object detection to identify vulnerable entities or infrastructure in disaster imagery.
- **Model Architecture:** Pretrained `yolo11n.pt` (Nano) object detector.
- **Detected Classes:** Identifies common emergency-relevant entities such as `person`, `car`, `truck`, `boat`, and `bus`.
- **Academic Scope:** YOLO11 operates strictly as a supplementary visual indicator. Entity detection does not classify the disaster type on its own.

### 4. OpenCV Before/After Optical Damage Assessment
- **Purpose:** Optical change detection comparing pre-disaster and post-disaster satellite or aerial imagery.
- **Algorithm:**
  1. Grayscale conversion and bilateral Gaussian filtering ($5 \times 5$).
  2. Absolute pixel difference matrix computation: $|\mathbf{I}_{\text{after}} - \mathbf{I}_{\text{before}}|$.
  3. Otsu automated thresholding and morphological opening/closing to isolate significant displacement clusters.
  4. Percentage surface delta score: $\frac{\text{Changed Pixels}}{\text{Total Pixels}} \times 100$.
  5. False-color JET colormap heatmap overlay generation.
- **Academic Scope:** This is an optical frame-differencing detector, not a structural civil engineering collapse model. It identifies visual surface discrepancies across aligned image pairs.

### 5. BART Large MNLI (`facebook/bart-large-mnli`)
- **Purpose:** Zero-shot citizen emergency message triage and urgency classification.
- **Model Architecture:** `facebook/bart-large-mnli` zero-shot sequence classification pipeline.
- **Candidate Categories:** `medical emergency`, `people trapped`, `road blockage`, `flood report`, `weather warning`, `other information`.
- **Urgency Mapping:** Deterministic rule engine evaluating predicted category, confidence score, and acute peril keywords (e.g., *"trapped"*, *"drowning"*, *"collapsed"*, *"urgent rescue"*) to assign an urgency rating (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`).

---

## 11. Overall Severity Logic

The multi-modal assessment engine synthesizes all independent intelligence signals into a final incident threat rating. To prevent false alarms, the logic maintains a strict life-safety distinction:

### Severity Hierarchy:

1. **`CRITICAL` (Immediate Threat to Life):**
   - Citizen text dispatch evaluated as `CRITICAL` by BART (explicit keywords such as mass casualties, drowning, collapsed structures, or urgent rescue), **OR**
   - Citizen text dispatch evaluated as `HIGH` with a life-safety category of `people trapped` or `medical emergency`.

2. **`HIGH` (Serious Disaster Condition / Evacuation Needed):**
   - Any XGBoost meteorological risk of `HIGH`, **OR**
   - Any CLIP image hazard severity of `HIGH`, **OR**
   - Any Before/After damage assessment categorized as `HIGH CHANGE`, `HEAVY`, or `EXTREME`, **OR**
   - Any BART emergency text dispatch of `HIGH` that does not qualify for `CRITICAL` (such as road blockages or general evacuation advisories).

3. **`MEDIUM` (Localized Disruption / Standby Warning):**
   - Any XGBoost risk of `MEDIUM`, **OR**
   - Any CLIP image hazard severity of `MEDIUM`, **OR**
   - Any Before/After damage assessment categorized as `MODERATE CHANGE`, **OR**
   - Any BART text urgency of `MEDIUM`.

4. **`LOW`:**
   - Default baseline when all individual signals are minimal or normal.

> [!IMPORTANT]
> **No False Escalation:** Multiple environmental `HIGH` signals (for example, `XGBoost HIGH` + `CLIP HIGH` + `Damage HIGH`) **reinforce `HIGH` severity**, but do **NOT** automatically escalate to `CRITICAL`. The `CRITICAL` designation is strictly guarded for explicit life-safety emergencies involving trapped individuals or acute medical trauma.

---

## 12. GIS / Shelter System

- **Epicenter Positioning:** Operators can select predefined high-risk presets (e.g., Jakarta Coastal Submersion Zone, Hyderabad Flood Zone) or input custom geographic coordinates.
- **Nearest Shelter Calculation:** The system executes geodesic distance computations across all active shelters in the SQLite registry using the WGS-84 ellipsoid:
  $$\text{distance} = \text{geodesic}(\text{incident\_coords}, \text{shelter\_coords}).\text{kilometers}$$
- **Shelter Verification Details:** Shelter listings include the registered physical address, operational capacity, available bed count, and 24/7 hotline contact number.
- **Prototype Evacuation Path:** An interactive Leaflet map renders a direct polyline between the incident coordinates and the recommended shelter.
  - *Note: The evacuation polyline is a direct geometric path for prototype demonstration and does NOT represent real-time turn-by-turn road navigation.*
- **Shelter Records:** All pre-loaded shelters represent prototype seed data modeled after real-world municipal facilities.

---

## 13. Email Alerts

When an assessment is saved with an overall severity level of **`HIGH`** or **`CRITICAL`**, the backend automatically triggers an asynchronous background email task.

- **Protocol:** Standard TLS SMTP using Python's native `smtplib` via FastAPI `BackgroundTasks` (non-blocking).
- **Email Content Breakdown:**
  - Target incident epicenter and timestamp
  - Final synthesized Disaster Severity Level (`HIGH ALERT` or `CRITICAL ALERT`)
  - **Meteorological Risk (XGBoost):** Clearly labeled as the meteorological risk score (e.g., `0.0 / 100` or `88.5 / 100`), ensuring operators understand it represents atmospheric conditions rather than a combined score
  - Computer Vision hazard classification and confidence percentage (if attached)
  - YOLO11 detected objects (if attached)
  - Nearest recommended shelter name, physical street address, geodesic distance (km), and telephone contact
- **Configuration:** Set `SMTP_USER`, `SMTP_PASSWORD` (Gmail App Password), and `ALERT_RECIPIENT_EMAIL` in `backend/.env` to enable real outbound transmission.

---

## 14. Demo Flow

Follow this step-by-step walkthrough to demonstrate the full multi-modal workflow:

1. **Log In:** Navigate to `http://localhost:5173`. Click the **"Chief Incident Commander"** quick-login button (`admin@disaster.intel` / `admin123`).
2. **Select Location:** On the Dashboard, select a preset (e.g., **"Jakarta (Coastal Submersion Zone)"**). Observe the live Open-Meteo weather ingestion and XGBoost meteorological risk score.
3. **Analyze Disaster Image:**
   - Click **"Image Analysis"** in the sidebar.
   - Click **"Load Sample Flood Image"** (or upload your own).
   - Click **"Run Multi-Modal Vision Analysis"**. Observe the CLIP classification (`flood`) and YOLO11 detected objects (`person`, `boat`, `car`).
   - Click **"Use in Disaster Assessment"**. The system attaches this finding and automatically routes back to the Dashboard.
4. **Analyze Before/After Damage:**
   - Click **"Damage Assessment"** in the sidebar.
   - Click **"Load Sample Satellite Pair"**.
   - Click **"Run OpenCV Damage Analysis"**. Observe the optical surface delta percentage and generated JET colormap heatmap.
   - Click **"Use in Disaster Assessment"**.
5. **Triage Citizen Emergency Dispatch:**
   - Click **"Emergency Messages"** in the sidebar.
   - In the custom input box, enter:  
     `"URGENT: 4 people trapped on roof with rising floodwaters, immediate rescue needed!"`
   - Click **"Test BART Model"**. Observe the classification (`people trapped`) and urgency rating (`CRITICAL`).
   - Click **"Use in Disaster Assessment"**.
6. **Review Integrated Dashboard:**
   - Return to the Dashboard.
   - Observe the **Active Multi-Modal Incident Context** panel displaying all attached signals.
   - Note that the overall severity banner has dynamically escalated to **`URGENT: CRITICAL DISASTER ALERT DECLARED`** due to the acute life-safety dispatch.
   - Observe the recommended evacuation shelter and evacuation polyline.
7. **Save & Broadcast:**
   - Click **"Save Assessment"**. The assessment is saved to the SQLite audit database, and an SMTP alert is dispatched in the background.
8. **Generate Situation Report (SitRep):**
   - Click **"Reports"** in the sidebar.
   - Click **"Generate SitRep"** for the saved incident.
   - Inspect the compiled multi-modal report and click **"Download Markdown (.md)"** or **"Download JSON (.json)"**.

---

## 15. Important Prototype Limitations

1. **Academic Proof-of-Concept:** This platform is designed for academic demonstration and methodology validation. It is not intended for operational emergency dispatch centers.
2. **Pretrained / Zero-Shot Foundations:** Visual classification (CLIP) and NLP triage (BART) utilize off-the-shelf foundation model weights without domain-specific supervised fine-tuning. Model predictions are probabilistic estimates and should not be treated as ground truth.
3. **Simplified Evacuation Paths:** The evacuation path displayed on the Leaflet map is a direct geometric representation between coordinates. It does not account for real-time road closures, traffic congestion, or elevation contours.
4. **Prototype Shelter Data:** Pre-seeded shelter registries represent prototype mock facilities for demonstration purposes.
5. **Simulated Social Feed:** The emergency message feed contains synthetic seed dispatches. The prototype does not include automated real-time social media scraping or firehose ingestion.
6. **Single-Node Architecture:** The prototype is configured for single-instance local execution and does not implement distributed task queues (e.g. Celery/Redis) or horizontally scaled database clustering.

---

## 16. Security & Credentials

- **Demo Credentials:** The pre-seeded demo users (`admin@disaster.intel` / `admin123` and `operator@disaster.intel` / `operator123`) are provided exclusively for local prototype evaluation.
- **Credential Segregation:** All authentication secrets, SMTP passwords, and sensitive configurations must remain in `backend/.env`.
- **No Hardcoded Secrets:** The codebase contains no hardcoded private API keys, SMTP credentials, or sensitive tokens.

---

## 17. Academic & Research Note

This repository contains the complete web implementation of the Disaster Intelligence System developed as part of an applied AI research workflow:

- **Original Research Reference:** The architecture operationalizes methodologies prototyped in exploratory Jupyter notebooks, specifically adapting tabular risk classification, zero-shot visual prompt ensembles, structural frame differencing, and contextual text triage.
- **Future Research Directions:**
  - Supervised fine-tuning of CLIP on dedicated disaster benchmarks (e.g., CrisisMMD, Damage-10k).
  - Integration of OSRM (Open Source Routing Machine) for true turn-by-turn road network evacuation routing.
  - Multi-sensor satellite imagery alignment using deep homography estimation for before/after change detection.

---

## 18. Troubleshooting

### Backend Dependency Installation Fails
- Ensure you are using Python 3.10 to 3.12 (`python3 --version`).
- Upgrade pip and wheel before installing:
  ```bash
  pip install --upgrade pip setuptools wheel
  pip install -r requirements.txt
  ```

### Memory Exhaustion on Model Download
- Downloading CLIP and BART concurrently requires ~3 GB of system RAM.
- If running on a resource-constrained machine, set `FAST_DEV_MODE=1` in `backend/.env` to enable lightweight heuristic fallbacks.

### Port Conflicts
- **Backend (Port 8000):** If port 8000 is occupied, run:
  ```bash
  uvicorn app.main:app --host 0.0.0.0 --port 8080 --reload
  ```
- **Frontend (Port 5173):** Vite will automatically select the next available port (e.g., 5174) if 5173 is in use.

### Database Schema Updates
- If you manually alter SQLAlchemy models and need to reset the SQLite database:
  ```bash
  rm backend/disaster_intel.db
  # Restart backend/run.py to recreate and auto-seed fresh tables
  ```

### Vite Proxy / CORS Issues
- Verify that the backend is running at `http://localhost:8000` before sending requests from the frontend.
- Vite dev server proxies `/api` requests to `http://127.0.0.1:8000`. If running backend on a different port, update the `target` in `frontend/vite.config.js`.

---

## 19. Disclaimer

**DISCLAIMER:**  
This software is provided "as is" for academic research, education, and prototype demonstration purposes only. Neither the authors nor contributors assume any liability for direct, indirect, or consequential damages resulting from the use of this software, its analytical predictions, or its shelter routing recommendations in real-world emergency situations.
