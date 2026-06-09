# Resume Placement Readme - JanSunwai AI (Civic Grievance Redressal Platform)

## 📌 Project Description
**JanSunwai AI** is a state-of-the-art, multi-modal civic grievance resolution platform designed to remove literacy and accessibility barriers in citizen services. Built as a unified monorepo, the platform allows citizens to file complaints either via a structured 4-step web interface or by calling an interactive WebRTC-based AI Voice Agent that speaks Hindi and English. Behind the scenes, the system executes visual damage analysis (using computer vision), detects duplicate complaints (via geographic and semantic clustering), auto-routes tickets to specific municipal departments, and triggers an automated 5-level escalation engine if resolution SLA deadlines are breached.

---

## 🛠️ Tech Stack
- **Architecture & Monorepo**: Turborepo, npm Workspaces, shared type definitions, ESLint, TypeScript 5
- **Frontend App**: Next.js 15 (App Router, Server Components), Tailwind CSS 4, React 19, Google Maps JS API, LiveKit WebRTC Client SDK
- **Backend API Server**: Node.js, Express.js, Prisma ORM, PostgreSQL (PostGIS geospatial extension), Node-Cron, Zod Schema Validators
- **Voice Agent Daemon**: Python 3.11, LiveKit Agents SDK, Gemini 2.5 Flash Voice, Deepgram STT, ElevenLabs TTS, Silero Voice Activity Detector (VAD)
- **AI Models & Engines**: Google Gemini 2.0 Flash (Category/Severity Classification, Gemini Vision Photo Inspection, RTI Application Auto-Drafting)

---

## 💡 Technical Concepts Used
- **WebRTC Event Streaming (Voice Bot)**: Structured a real-time voice pipeline by linking a Python LiveKit agent to Deepgram's streaming STT and ElevenLabs' low-latency TTS, processing audio inputs/outputs concurrently with Silero VAD state control.
- **Geospatial Ward Resolution**: Leveraged PostGIS geocoding queries in PostgreSQL to resolve citizen lat/lng coordinates to specific municipal wards, enabling location-aware routing of service tickets.
- **Geographic & Semantic Deduplication**: Developed deduplication handlers that cluster incoming grievances by geographic proximity (using PostGIS spatial buffers) and semantic text similarity (Gemini classification), linking duplicate complaints to common community threads.
- **Mutex-Locked Background Workers**: Programmed a scheduled cron workflow (`node-cron`) running escalation checks, utilizing a boolean mutex lock to prevent overlapping runs.
- **Empowerment Document Drafting**: Created legal summaries corresponding to Indian Municipal Acts and automatically drafted official RTI (Right to Information) documents in PDF if resolution times breached the 7-day threshold.

---

## 🎓 SDE Resume Rating & Rationale
### **Rating: 9.6 / 10**
- **Pros**: Exemplary systems design. Showcases Turborepo monorepo construction, WebRTC audio processing, Postgres geospatial extensions (PostGIS), scheduled cron execution with concurrency safety (mutexes), and computer vision API processing. Highly applicable to production SDE and infra roles.
- **Cons**: Could incorporate a message queue (e.g., Redis Celery or BullMQ) to separate cron-triggered ticket updates from main Express thread execution under high traffic scales.

---

## 📝 FAANG Resume Bullet Points
* **Architected a high-performance civic monorepo** (Next.js, Express, Python, PostgreSQL) containing shared type packages, orchestrating multi-channel web and voice filing for over 70 zones.
* **Engineered a Python LiveKit WebRTC voice agent** using Deepgram STT and Gemini Flash Voice, managing bidirectional streaming and client audio parsing under 300ms latency.
* **Implemented a PostGIS-driven spatial routing engine** and semantic clustering model to group geographic reports into community tickets, automating officer dispatch via Prisma ORM.
