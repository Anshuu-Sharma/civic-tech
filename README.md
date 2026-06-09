# JanSunwai AI 🎙️🏛️
> **"Your Voice Matters. We Make It Heard."**

**JanSunwai AI** is a state-of-the-art, multi-modal civic grievance resolution platform designed to remove literacy and accessibility barriers in citizen services for India.

Built as an AI-powered unified monorepo, it transforms the broken complaint redressal system by combining **voice-agent complaint filing**, **AI-driven classification & routing**, **automated escalation**, and **public transparency dashboards** — ensuring every citizen's voice reaches the right authority and gets resolved within SLA timelines.

---

## 📋 Table of Contents

- [Project Overview](#project-overview)
- [Unique Selling Proposition (USP)](#unique-selling-proposition-usp)
- [Core Features](#core-features)
- [Tech Stack](#tech-stack)
- [System Architecture](#system-architecture)
- [Database Schema & AI Interactions](#database-schema--ai-interactions)
- [Setup & Installation](#setup--installation)
- [Project Structure](#project-structure)

---

## 🎯 Project Overview

**The Core Vision:**
- A citizen in rural India can **call and speak in Hindi** to file a complaint — removing the literacy and internet access barriers.
- AI automatically **classifies** the issue (water, roads, electricity, sanitation, etc.), **scores severity**, **detects duplicates**, and **routes** it to the exact municipal department and ward officer.
- A **5-level auto-escalation engine** ensures no complaint is ignored, automatically escalating the issue all the way to the Commissioner if SLA deadlines are breached.
- **Public heatmap dashboards** display ward-level problem hotspots, enforcing civic pressure for resolution.
- Citizens receive **AI-generated legal rights awareness** empowering them with knowledge of applicable laws (RTI Act, Article 21, Municipal Acts).

---

## 💡 Unique Selling Proposition (USP)

> **"The only platform that combines AI voice filing in Indian languages, automated severity-based escalation, and public ward-level accountability dashboards — making civic grievance resolution accessible, intelligent, and transparent."**

**How it differs from existing systems:**
* **Voice-first accessibility:** Deepgram STT + Gemini LLM + ElevenLabs TTS over LiveKit WebRTC handling low-literacy citizens seamlessly.
* **Composite severity scoring:** 5-factor AI algorithm (Issue Type + Affected Population + Vulnerability + Time Sensitivity + Recurrence).
* **Community issue clustering:** PostGIS spatial buffers link geographically and semantically similar complaints.
* **Empowerment Document Drafting:** Automatically drafts Right to Information (RTI) applications if SLA timelines are breached.

---

## ✨ Core Features

1. **Multi-Modal Complaint Filing**
   - **4-step Web Wizard** or **Voice Agent (Hindi/English)**.
   - 12 grievance categories with Gemini Vision photo analysis and Google Maps geolocation.
2. **AI-Powered Intelligence Engine**
   - Gemini 2.0 Flash classifies category, sub-category, and severity.
   - Vision analysis for infrastructure damage (potholes, leaks).
3. **Smart Routing & Geospatial Operations**
   - PostGIS geocoding resolves lat/lng to municipal wards to auto-route service tickets.
4. **5-Level Auto-Escalation Engine**
   - Level 1: Ward Officer ➔ Level 2: Dept Head ➔ Level 3: Commissioner ➔ Level 4: Public Flag + RTI ➔ Level 5: Systemic Failure Tag.
   - Powered by Node-Cron scheduled workflows with mutex-locking.
5. **Transparency Dashboards**
   - Public ward-level heatmaps, activity feeds, and department performance scorecards.

---

## 💻 Tech Stack

- **Architecture**: Turborepo, npm Workspaces, TypeScript 5.
- **Frontend App (`apps/web`)**: Next.js 15 (App Router), React 19, Tailwind CSS 4, Google Maps JS API, LiveKit Client SDK.
- **Backend API Server (`apps/api`)**: Node.js, Express.js, Prisma ORM, Node-Cron, Zod.
- **Database**: PostgreSQL with **PostGIS** geospatial extension, Supabase Storage.
- **Voice Agent Daemon (`apps/voice-agent`)**: Python 3.11, LiveKit Agents SDK.
- **AI Models & Pipeline**: 
  - Google Gemini 2.0 Flash (Classification & Vision)
  - Google Gemini 2.5 Flash (Voice Agent Logic)
  - Deepgram STT & ElevenLabs TTS
  - Silero Voice Activity Detector (VAD)

---

## 🏗️ System Architecture

1. **Input**: Citizen files a complaint via Web Form or Voice Call.
2. **AI Pipeline**: 
   - Transcribed/input text and images are sent to **Gemini 2.0 Flash** for classification, severity scoring, and legal rights summarization.
   - Spatial coordinates are used with **PostGIS** to find existing community issues within a 500m radius and link duplicates.
3. **Storage**: Saved securely to Supabase PostgreSQL. Images to Supabase Storage.
4. **Escalation Loop**: An hourly Node-Cron job checks unresolved complaints against legal SLA timelines and reassigns them to higher authorities if deadlines pass.

---

## 🗄️ Database Schema & AI Interactions

The PostgreSQL database leverages Prisma and the PostGIS extension heavily:
- **`citizens`**: Tracks preferred language, channels, and vulnerability flags (elderly, disabled, BPL).
- **`grievances`**: Stores geospatial `location` as `Unsupported("geometry(Point,4326)")`, linked to `wards`, `departments`, and `officers`. Contains the `severity_score` calculated by the AI engine.
- **`community_issues`**: Clusters geographically similar complaints using a centroid point and radius bounding.
- **`rti_applications`**: Applications auto-generated in Hindi/English by Gemini for unresolved issues.
- **`legal_rights`**: Stores the statutory SLA limits used by the cron job to trigger escalations.

---

## 🚀 Setup & Installation

### Prerequisites
- **Node.js 18+** & npm/pnpm
- **Python 3.11+**
- **Supabase** instance (with PostGIS enabled)
- API Keys: Gemini, Deepgram, ElevenLabs, LiveKit, Google Maps.

### 1. Unified Setup
```bash
# Clone and install dependencies
npm install
```

### 2. Configure Environment Variables
Set up `.env` in the respective apps (`apps/web`, `apps/api`, `apps/voice-agent`) with keys for:
- `DATABASE_URL`
- `GEMINI_API_KEY`
- `DEEPGRAM_API_KEY`, `ELEVENLABS_API_KEY`, `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET`, `LIVEKIT_URL`

### 3. Database Migration & Seeding
```bash
npm run db:migrate
npm run db:seed
```

### 4. Running the Development Servers
You can run the web and API servers concurrently using the workspace scripts:
```bash
# Terminal 1: Starts both Web (Next.js) and API (Express)
npm run dev

# Terminal 2: Start the Python Voice Agent
cd apps/voice-agent
uv pip install -r pyproject.toml # or pip install if using requirements
python agent.py
```

---

## 📂 Project Structure

```text
civic-tech/
├── apps/
│   ├── web/               # Next.js Frontend (Citizen UI & Dashboards)
│   ├── api/               # Express.js REST API & Cron Jobs
│   │   ├── prisma/        # PostgreSQL Schema & PostGIS configs
│   │   ├── src/           # API routes, controllers, AI services
│   └── voice-agent/       # Python LiveKit WebRTC Daemon
├── packages/
│   └── shared/            # Shared TypeScript interfaces & Zod validators
├── package.json           # Turborepo/npm workspaces config
└── SLIDE_CONTENT.md       # Full project presentation & details
```

---
*Developed for the AWS AI for Bharat Hackathon.*
