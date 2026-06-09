# JanSunwai AI - AWS AI for Bharat Hackathon
## Slide-by-Slide Content

---

## SLIDE 1: Title Slide

**Team Name:** JanSunwai AI

**Problem Statement:** AI-Powered Civic Grievance Resolution Platform for India

**Team Leader Name:** [Your Name Here]

---

## SLIDE 2: Brief About the Idea

### JanSunwai AI — "Your Voice Matters. We Make It Heard."

JanSunwai AI is an end-to-end, AI-powered civic grievance resolution platform designed for Indian citizens. It transforms the broken complaint redressal system by combining **multimodal complaint filing** (web form + voice agent), **AI-driven classification & routing**, **automated escalation**, and **public transparency dashboards** — ensuring every citizen's voice reaches the right authority and gets resolved within SLA timelines.

**The Core Vision:**
- A citizen in rural India can **call and speak in Hindi** to file a complaint — no forms, no literacy barrier
- AI automatically **classifies** the issue (water, roads, electricity, sanitation, etc.), **scores severity**, **detects duplicates**, and **routes** it to the right municipal department
- A **5-level auto-escalation engine** ensures no complaint is ignored — escalating all the way to the Commissioner if SLA deadlines are breached
- **Public heatmap dashboards** show ward-level problem hotspots, creating civic pressure for resolution
- Citizens receive **AI-generated legal rights awareness** — empowering them with knowledge of applicable laws (RTI Act, Article 21, Municipal Acts)

**Scale of the Problem:**
- **2.8 Crore** pending civic grievances across India
- **45 days** average resolution time
- **67%** of citizens unaware of their legal rights
- **12+** government departments with zero cross-communication

---

## SLIDE 3: Solution Differentiation & USP

### How is JanSunwai AI different from existing solutions?

| Aspect | Existing Systems (CPGRAMS, 311, etc.) | JanSunwai AI |
|--------|----------------------------------------|--------------|
| Filing Method | Web forms only | **Voice Agent (Hindi) + Web Form + Multi-language** |
| Classification | Manual / keyword-based | **AI-powered (Gemini Vision + NLP)** with photo analysis |
| Routing | Manual department assignment | **Auto-routing** to exact department + ward officer |
| Escalation | None / manual follow-up | **5-level auto-escalation** with SLA tracking |
| Transparency | Opaque — no public data | **Public heatmaps + ward scorecards** |
| Legal Awareness | None | **AI-generated legal rights** per complaint category |
| Duplicate Detection | None | **Semantic + geographic clustering** into community issues |
| Accessibility | Requires literacy + internet | **Voice-first design** — works for low-literacy citizens |

### How does it solve the problem?

1. **Eliminates barriers** — Voice agent allows anyone to file a complaint by simply speaking
2. **Eliminates misrouting** — AI classifies and routes to the exact responsible department
3. **Eliminates negligence** — Auto-escalation ensures every complaint gets attention within SLA
4. **Creates accountability** — Public dashboards expose department performance at ward level
5. **Empowers citizens** — Legal rights summaries inform citizens of their entitlements

### USP (Unique Selling Proposition)

> **"The only platform that combines AI voice filing in Indian languages, automated severity-based escalation, and public ward-level accountability dashboards — making civic grievance resolution accessible, intelligent, and transparent."**

Key differentiators:
- **Voice-first accessibility** — Deepgram STT (Hindi) + Gemini LLM + ElevenLabs TTS
- **Composite severity scoring** — 5-factor algorithm (issue type 30% + affected population 25% + vulnerability 20% + time sensitivity 15% + recurrence 10%)
- **Community issue clustering** — Links geographically similar complaints to surface systemic problems
- **RTI integration** — Auto-drafts Right to Information applications for unresolved complaints

---

## SLIDE 4: List of Features

### Core Features

**1. Multi-Modal Complaint Filing**
- 4-step web wizard (Describe > Location > Details > Review)
- Voice agent — speak in Hindi/English to file complaints hands-free
- 12 grievance categories with AI auto-detection
- Photo upload with Gemini Vision analysis
- Geolocation via Google Maps API
- Support for 10+ Indian languages

**2. AI-Powered Intelligence Engine**
- Gemini-based complaint classification (category, sub-category, severity)
- Image analysis for visual evidence (potholes, leaks, debris)
- Semantic duplicate detection + geographic clustering
- AI-generated structured descriptions from unstructured citizen input

**3. Smart Routing & Severity Scoring**
- Auto-routing to responsible department + ward officer
- Composite severity score (0-100) based on 5 weighted factors
- Priority flags for vulnerable citizens (elderly, disabled, BPL, pregnant)
- Ward-level granularity using PostGIS geocoding

**4. 5-Level Auto-Escalation Engine**
- Level 1 (0-48h): Ward Officer
- Level 2 (48-96h): Department Head (auto-escalate if no acknowledgment)
- Level 3 (96h-7d): Commissioner
- Level 4 (7-14d): Commissioner + Public Flag + RTI Offer
- Level 5 (14d+): Systemic Failure Tag

**5. Public Transparency Dashboard**
- Ward-level heatmaps showing problem hotspots
- Category breakdown, status filters, live stats
- Ward scorecards with department performance metrics
- Trend analysis over time

**6. Admin / Officer Portal**
- Role-based dashboards (Ward Officer, Dept Head, Commissioner)
- Queue management with filters + severity sort
- Complete grievance timeline (filed > acknowledged > resolved)
- Manual escalation with reason logging
- Department-level statistics and SLA tracking

**7. Legal Rights Awareness**
- AI-generated legal summaries per complaint category
- References: Article 21, RTI Act 2005, Municipal Acts
- SLA timelines from applicable laws
- Auto-drafted RTI applications for negligent departments

**8. Citizen Verification & Feedback**
- SMS/WhatsApp verification tokens
- Resolution satisfaction scoring (1-5 stars)
- Reopen capability if unsatisfied

### Feature Visual Overview (Mermaid)

```mermaid
mindmap
  root((JanSunwai AI))
    Complaint Filing
      Web Form (4-step wizard)
      Voice Agent (Hindi/English)
      Photo Upload + Vision AI
      Geolocation
      10+ Languages
    AI Engine
      Gemini Classification
      Severity Scoring
      Duplicate Detection
      Community Issue Clustering
      Legal Rights Generation
    Escalation
      5-Level Auto-Escalation
      SLA Tracking
      Cron Job Automation
      Department Reassignment
    Dashboards
      Public Heatmaps
      Ward Scorecards
      Admin Queue
      Activity Feed
      Department Stats
    Citizen Empowerment
      Legal Rights Summaries
      RTI Applications
      Complaint Tracking
      Verification & Feedback
```

---

## SLIDE 5: Process Flow Diagram

### Grievance Lifecycle — End-to-End Flow

```mermaid
flowchart TD
    A([Citizen]) --> B{Filing Channel}
    B -->|Web Form| C[4-Step Complaint Wizard]
    B -->|Voice Call| D[LiveKit Voice Agent]

    C --> E[Validate Input - Zod Schema]
    D -->|Deepgram STT + Gemini LLM| E

    E --> F[Find / Create Citizen Record]
    F --> G[AI Classification - Gemini 2.0 Flash]

    G --> G1[Category Detection - 12 types]
    G --> G2[Sub-Category Extraction]
    G --> G3[Severity Estimate]
    G --> G4[Photo Analysis - Gemini Vision]

    G1 & G2 & G3 & G4 --> H[Ward Resolution - PostGIS Geocoding]
    H --> I{Duplicate Detection}

    I -->|Match Found| J[Link to Community Issue]
    I -->|No Match| K[Continue as New]

    J & K --> L[Severity Scoring Algorithm]
    L --> M[Department Auto-Routing]
    M --> N[Generate Complaint Number - JSA-YYYY-CITY-XXXXX]
    N --> O[Fetch Legal Rights from DB]
    O --> P[Generate Legal Summary - Gemini]
    P --> Q[(Insert Grievance Record - PostgreSQL + PostGIS)]
    Q --> R[Create Timeline Entry - Filed Event]

    R --> S([Citizen Receives: Complaint Number + Legal Rights + Assigned Dept])

    S --> T{Officer Action Within SLA?}
    T -->|Yes| U[Acknowledged > In Progress > Resolved]
    T -->|No| V[Auto-Escalation Engine]

    V --> V1[Level 2: Department Head]
    V1 --> V2[Level 3: Commissioner]
    V2 --> V3[Level 4: Public Flag + RTI]
    V3 --> V4[Level 5: Systemic Failure]

    U --> W{Citizen Verification}
    W -->|Satisfied| X([Resolved & Closed])
    W -->|Unsatisfied| Y[Reopen Complaint]
    Y --> T

    style A fill:#4CAF50,color:white
    style S fill:#2196F3,color:white
    style X fill:#4CAF50,color:white
    style V fill:#f44336,color:white
    style G fill:#FF9800,color:white
```

### Use Case Diagram

```mermaid
flowchart LR
    subgraph Citizens
        C1([Citizen - Web])
        C2([Citizen - Voice])
    end

    subgraph "JanSunwai AI Platform"
        UC1[File Complaint]
        UC2[Track Complaint Status]
        UC3[View Legal Rights]
        UC4[Verify Resolution]
        UC5[File RTI Application]
        UC6[View Public Dashboard]
    end

    subgraph Officers
        O1([Ward Officer])
        O2([Department Head])
        O3([Commissioner])
    end

    subgraph "Admin Functions"
        AF1[Manage Queue]
        AF2[Acknowledge / Update Status]
        AF3[View Department Stats]
        AF4[Manual Escalation]
        AF5[View Escalations]
        AF6[View Activity Feed]
    end

    subgraph "AI System"
        AI1[Classify Complaint]
        AI2[Score Severity]
        AI3[Detect Duplicates]
        AI4[Auto-Route to Dept]
        AI5[Auto-Escalate]
        AI6[Generate Legal Summary]
    end

    C1 --> UC1 & UC2 & UC3 & UC4 & UC5 & UC6
    C2 --> UC1 & UC2 & UC3

    O1 --> AF1 & AF2 & AF3
    O2 --> AF1 & AF2 & AF3 & AF4 & AF5
    O3 --> AF1 & AF2 & AF3 & AF4 & AF5 & AF6

    UC1 --> AI1 & AI2 & AI3 & AI4
    AI5 -.->|Hourly Cron| AF5
    UC1 --> AI6
```

---

## SLIDE 6: Wireframes / Mock Diagrams

### Screen Flow Map (Mermaid)

```mermaid
flowchart TD
    subgraph "Citizen-Facing Screens"
        HP[Home Page<br/>Hero + Stats + CTA] --> FC[File Complaint<br/>4-Step Wizard]
        HP --> VA[Voice Assistant<br/>Call to File]
        HP --> TR[Track Complaint<br/>Phone/Complaint # Search]
        HP --> DB[Public Dashboard<br/>Heatmaps + Stats]
        HP --> RTI[RTI Application<br/>Auto-Draft Form]

        FC --> FC1[Step 1: Describe Issue<br/>Category + Description + Photos]
        FC1 --> FC2[Step 2: Location<br/>Google Maps + Auto-detect]
        FC2 --> FC3[Step 3: Details<br/>Name + Phone + Language + Priority]
        FC3 --> FC4[Step 4: Review & Submit]
        FC4 --> SC[Success<br/>Complaint # + Legal Rights]

        VA --> VA1[Connect to Agent<br/>LiveKit WebRTC]
        VA1 --> VA2[Speak Complaint<br/>Hindi/English]
        VA2 --> VA3[Agent Files Grievance<br/>via Tool Call]
        VA3 --> SC

        TR --> TR1[Status Card<br/>Timeline + Legal Info]

        DB --> DB1[Heatmap View<br/>Google Maps Markers]
        DB --> DB2[Ward Scorecards<br/>Department Metrics]
    end

    subgraph "Admin Screens"
        AL[Admin Login<br/>Email + Password] --> AD[Admin Dashboard<br/>Stats + Activity Feed]
        AD --> AQ[Queue View<br/>Filterable Table]
        AD --> AE[Escalations<br/>Level 2+ Complaints]
        AD --> AS[Department Stats<br/>SLA Metrics]
        AQ --> GD[Grievance Detail<br/>Full Info + Timeline + Actions]
        GD --> GD1[Update Status]
        GD --> GD2[Escalate Manually]
        GD --> GD3[Assign Officer]
    end

    style HP fill:#1a73e8,color:white
    style AL fill:#f44336,color:white
    style SC fill:#4CAF50,color:white
```

### Key Screen Descriptions

| Screen | Key Elements |
|--------|-------------|
| **Home Page** | Hero section, live stats counter (2.8 Cr pending), 3 CTA buttons (File, Track, Dashboard), feature cards |
| **File Complaint** | Stepper UI, category grid (12 icons), photo dropzone, Google Maps picker, language selector, vulnerability checkboxes |
| **Voice Assistant** | Large mic button, connection status, live transcript, call timer, agent avatar |
| **Public Dashboard** | Google Maps heatmap, filter chips (status/category), stats bar, ward list with scores |
| **Track Complaint** | Search bar (phone/complaint#), status card with timeline, legal rights accordion |
| **Admin Queue** | Data table with filters, severity badges, SLA deadline countdown, pagination |
| **Grievance Detail** | Split layout — left: complaint info + photos, right: timeline + actions |

---

## SLIDE 7: Architecture Diagram

### System Architecture

```mermaid
flowchart TB
    subgraph "Client Layer"
        WEB["Next.js 15 Frontend<br/>(Vercel)"]
        VOICE["Voice Client<br/>(LiveKit SDK)"]
    end

    subgraph "Infrastructure Layer"
        LK["LiveKit Cloud<br/>(WebRTC SFU)"]
    end

    subgraph "Application Layer (Render)"
        API["Express.js API<br/>(TypeScript)"]
        AGENT["Python Voice Agent<br/>(LiveKit Agents)"]

        subgraph "AI Services"
            GEMINI["Google Gemini 2.0 Flash<br/>(Classification + Vision)"]
            GEMINI25["Google Gemini 2.5 Flash<br/>(Voice Agent LLM)"]
        end

        subgraph "External AI APIs"
            DG["Deepgram<br/>(Speech-to-Text)"]
            EL["ElevenLabs<br/>(Text-to-Speech)"]
            SILERO["Silero VAD<br/>(Voice Activity Detection)"]
        end

        subgraph "Business Logic Services"
            SVC1["Gemini Classification Service"]
            SVC2["Severity Scoring Engine"]
            SVC3["Department Router"]
            SVC4["Duplicate Detector"]
            SVC5["Escalation Engine"]
            SVC6["Legal Rights Service"]
            SVC7["RTI Generator"]
        end

        subgraph "Scheduled Jobs"
            CRON["Escalation Cron Job<br/>(Hourly)"]
        end
    end

    subgraph "Data Layer (Supabase)"
        DB[("PostgreSQL 14+<br/>+ PostGIS 3")]
        STORE["Supabase Storage<br/>(Photo Uploads)"]
    end

    subgraph "External Services"
        MAPS["Google Maps API<br/>(Geocoding + Heatmaps)"]
        AUTH["NextAuth.js<br/>(JWT Auth)"]
    end

    WEB -->|REST API| API
    WEB -->|Google Maps| MAPS
    WEB -->|Auth| AUTH
    VOICE -->|WebRTC| LK
    LK -->|Audio Stream| AGENT

    AGENT -->|STT| DG
    AGENT -->|LLM| GEMINI25
    AGENT -->|TTS| EL
    AGENT -->|VAD| SILERO
    AGENT -->|Tool Calls| API

    API --> SVC1 & SVC2 & SVC3 & SVC4 & SVC5 & SVC6 & SVC7
    SVC1 -->|AI| GEMINI
    SVC6 -->|AI| GEMINI
    SVC7 -->|AI| GEMINI
    API -->|Prisma ORM| DB
    API -->|File Upload| STORE
    CRON -->|Check SLAs| DB
    CRON -->|Escalate| SVC5

    style WEB fill:#0070f3,color:white
    style AGENT fill:#7c3aed,color:white
    style GEMINI fill:#FF9800,color:white
    style GEMINI25 fill:#FF9800,color:white
    style DB fill:#3ECF8E,color:white
    style LK fill:#ff6b6b,color:white
```

### Data Flow Architecture

```mermaid
flowchart LR
    subgraph "Input Channels"
        W[Web Form]
        V[Voice Agent]
    end

    subgraph "AI Pipeline"
        CL[Classify<br/>Gemini]
        SC[Score<br/>Algorithm]
        DD[Deduplicate<br/>Semantic + Geo]
        RT[Route<br/>PostGIS]
        LR[Legal Rights<br/>Gemini]
    end

    subgraph "Storage"
        PG[(PostgreSQL<br/>+ PostGIS)]
        S3[Supabase<br/>Storage]
    end

    subgraph "Output Channels"
        CD[Citizen<br/>Dashboard]
        AD[Admin<br/>Portal]
        HM[Public<br/>Heatmap]
        ES[Escalation<br/>Alerts]
    end

    W & V --> CL --> SC --> DD --> RT --> LR --> PG
    W -->|Photos| S3
    PG --> CD & AD & HM
    PG -->|Cron| ES

    style CL fill:#FF9800,color:white
    style PG fill:#3ECF8E,color:white
```

---

## SLIDE 8: Technologies Used

### Technology Stack

```mermaid
block-beta
    columns 4

    block:frontend["Frontend"]:1
        A["Next.js 15"]
        B["React 19"]
        C["Tailwind CSS 4"]
        D["TypeScript"]
    end

    block:backend["Backend"]:1
        E["Express.js"]
        F["Prisma ORM"]
        G["Node-Cron"]
        H["Zod Validation"]
    end

    block:ai["AI & ML"]:1
        I["Google Gemini 2.0 Flash"]
        J["Gemini Vision"]
        K["Gemini 2.5 Flash (Voice)"]
        L["Severity Algorithm"]
    end

    block:voice["Voice Agent"]:1
        M["LiveKit Agents (Python)"]
        N["Deepgram STT"]
        O["ElevenLabs TTS"]
        P["Silero VAD"]
    end
```

### Full Technology Breakdown

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | Next.js 15 (App Router) | SSR, routing, React Server Components |
| | React 19 | UI component library |
| | Tailwind CSS 4 | Utility-first styling |
| | TypeScript | Type safety |
| | LiveKit Client SDK | WebRTC voice connection |
| | Google Maps JS API | Geolocation, heatmaps, markers |
| | NextAuth.js | Admin authentication (JWT) |
| **Backend** | Express.js | REST API server |
| | Prisma ORM | Type-safe database access |
| | PostgreSQL 14+ | Primary database |
| | PostGIS 3 | Geographic queries (ward resolution, proximity) |
| | Zod | Input validation schemas |
| | Node-Cron | Scheduled escalation jobs |
| | Helmet + CORS | Security middleware |
| | bcryptjs | Password hashing |
| **AI Engine** | Google Gemini 2.0 Flash | Complaint classification, legal summary generation |
| | Gemini Vision | Photo analysis (damage, infrastructure issues) |
| | Custom Algorithm | 5-factor severity scoring (0-100) |
| **Voice Agent** | LiveKit Agents (Python) | Real-time voice processing framework |
| | Google Gemini 2.5 Flash | Conversational LLM with tool calling |
| | Deepgram (nova-2-general) | Speech-to-Text (Hindi/English) |
| | ElevenLabs (turbo v2.5) | Text-to-Speech (natural Hindi voice) |
| | Silero VAD | Voice activity detection |
| **Database** | Supabase (PostgreSQL) | Managed database hosting |
| | Supabase Storage | Photo/document storage |
| **Deployment** | Vercel | Frontend hosting (edge network) |
| | Render | Backend API + Voice Agent hosting |
| | LiveKit Cloud | WebRTC SFU (media routing) |
| **Monorepo** | npm Workspaces | Shared types & validators across apps |

### AWS Services Mapping

| Current Service | AWS Equivalent | Purpose |
|----------------|---------------|---------|
| Google Gemini | **Amazon Bedrock** (Claude/Titan) | AI classification, legal summary, vision |
| Deepgram STT | **Amazon Transcribe** | Speech-to-text (Hindi) |
| ElevenLabs TTS | **Amazon Polly** | Text-to-speech (Hindi) |
| Supabase PostgreSQL | **Amazon RDS** (PostgreSQL + PostGIS) | Primary database |
| Supabase Storage | **Amazon S3** | Photo/document storage |
| Vercel | **AWS Amplify** | Frontend hosting |
| Render | **AWS App Runner / ECS** | Backend API hosting |
| LiveKit Cloud | **Amazon Chime SDK** | WebRTC real-time voice |
| Google Maps | **Amazon Location Service** | Geocoding, maps, heatmaps |
| Node-Cron | **Amazon EventBridge** | Scheduled escalation jobs |
| NextAuth JWT | **Amazon Cognito** | Authentication & authorization |

---

## SLIDE 9: Estimated Implementation Cost

### Monthly Cost Estimate (AWS Infrastructure)

| AWS Service | Usage Estimate | Monthly Cost (USD) |
|------------|---------------|-------------------|
| **Amazon Bedrock** (Claude/Titan) | ~50K classifications/month | $150 - $300 |
| **Amazon Transcribe** (Hindi STT) | ~500 hours audio/month | $120 |
| **Amazon Polly** (Hindi TTS) | ~2M characters/month | $8 |
| **Amazon RDS** (PostgreSQL + PostGIS) | db.t3.medium, 100GB | $70 |
| **Amazon S3** (Photo Storage) | 50GB + transfers | $5 |
| **AWS Amplify** (Frontend) | Standard hosting | $15 |
| **AWS App Runner** (Backend API) | 2 vCPU, 4GB RAM | $50 |
| **Amazon Chime SDK** (Voice) | ~10K minutes/month | $30 |
| **Amazon Location Service** | ~100K geocoding requests | $50 |
| **Amazon EventBridge** | Hourly cron triggers | $1 |
| **Amazon Cognito** | ~1K admin users | Free tier |
| **Amazon CloudWatch** | Monitoring + logs | $10 |
| | | |
| **Total Estimated** | | **$509 - $659/month** |

### Scaling Projections

| Scale | Users/Month | Complaints/Month | Est. Cost/Month |
|-------|------------|-------------------|----------------|
| **Pilot** (1 city) | 10K | 5K | ~$500 |
| **Regional** (1 state) | 100K | 50K | ~$2,500 |
| **National** | 1M+ | 500K+ | ~$15,000 |

### Cost Optimization Strategies
- **Amazon Bedrock** batch inference for non-real-time classification
- **S3 Intelligent Tiering** for photo storage lifecycle
- **RDS Reserved Instances** for 40% savings on database
- **CloudFront CDN** for frontend caching
- **Lambda** for escalation jobs (pay-per-invocation vs always-on)

---

## SLIDE 10: Additional Information

### Impact Metrics (Projected)

| Metric | Current State | With JanSunwai AI |
|--------|--------------|-------------------|
| Avg. Resolution Time | 45 days | **7-14 days** (SLA-enforced) |
| Citizen Awareness of Rights | 67% unaware | **90%+ informed** (AI-generated) |
| Misrouted Complaints | ~40% | **<5%** (AI classification) |
| Duplicate Complaints | ~30% | **<10%** (semantic dedup) |
| Department Accountability | Near zero | **100% tracked** (public dashboards) |
| Accessibility (low-literacy) | Excluded | **Fully included** (voice agent) |

### Scalability & Future Roadmap

```mermaid
timeline
    title JanSunwai AI — Roadmap
    section Phase 1 - MVP (Current)
        Hackathon Demo : Web + Voice filing
                       : AI classification
                       : Auto-escalation
                       : Public dashboards
    section Phase 2 - Pilot
        Single City Deployment : WhatsApp Bot integration
                               : SMS notifications
                               : Officer mobile app
    section Phase 3 - Regional
        State-wide Rollout : Multi-tenant architecture
                           : Regional language models
                           : Integration with State CPGRAMS
    section Phase 4 - National
        Pan-India Scale : Aadhaar-based citizen verification
                        : DigiLocker integration
                        : Predictive maintenance AI
                        : Parliament dashboard
```

### Alignment with Government Initiatives
- **Digital India** — AI-first citizen services
- **CPGRAMS** — Centralized grievance system integration
- **Smart Cities Mission** — Data-driven municipal governance
- **RTI Act 2005** — Transparency & citizen empowerment
- **Article 21** — Right to clean environment & safe infrastructure

### Team Strengths
- Full-stack development (Next.js, Express, Python)
- AI/ML integration (Gemini, voice agents)
- Civic technology domain knowledge
- AWS cloud architecture experience

---

## SLIDE 11: Thank You / Closing

### JanSunwai AI

**"Your Voice Matters. We Make It Heard."**

An AI-powered platform transforming how 1.4 billion Indians resolve civic grievances — making government accountable, citizens empowered, and cities smarter.

**Built with:** Next.js | Express | Gemini AI | LiveKit | PostGIS | AWS-Ready

---

# APPENDIX: All Mermaid Diagrams (Copy-Paste Ready)

## A1. Voice Agent Architecture

```mermaid
sequenceDiagram
    participant C as Citizen (Browser)
    participant LK as LiveKit Cloud
    participant AG as Python Voice Agent
    participant DG as Deepgram STT
    participant GM as Gemini 2.5 Flash
    participant EL as ElevenLabs TTS
    participant API as Express API
    participant DB as PostgreSQL

    C->>LK: Connect via WebRTC
    LK->>AG: Audio Stream

    loop Conversation Turns
        AG->>DG: Audio chunk
        DG-->>AG: Transcribed text (Hindi/English)
        AG->>GM: User message + tool definitions

        alt Tool Call Required
            GM-->>AG: tool_call: file_grievance(...)
            AG->>API: POST /api/v1/grievance/file
            API->>DB: Insert grievance
            DB-->>API: Complaint number
            API-->>AG: Success response
            AG->>GM: Tool result
            GM-->>AG: Confirmation message
        else Direct Response
            GM-->>AG: Text response
        end

        AG->>EL: Response text
        EL-->>AG: Audio (Hindi speech)
        AG->>LK: Audio response
        LK->>C: Play audio
    end
```

## A2. Escalation Engine Flow

```mermaid
flowchart TD
    START([Hourly Cron Job Triggers]) --> FETCH[Fetch all open grievances]
    FETCH --> CHECK{Check each grievance<br/>against time thresholds}

    CHECK -->|0-48h, no ack| L2[Escalate to Level 2<br/>Assign: Department Head]
    CHECK -->|48-96h, no action| L3[Escalate to Level 3<br/>Assign: Commissioner]
    CHECK -->|96h-7d| L4[Escalate to Level 4<br/>Public Flag + RTI Offer]
    CHECK -->|14d+| L5[Escalate to Level 5<br/>Systemic Failure Tag]
    CHECK -->|Within SLA| SKIP[No action needed]

    L2 & L3 & L4 & L5 --> UPDATE[Update grievance record]
    UPDATE --> TIMELINE[Create timeline entry]
    TIMELINE --> REASSIGN[Reassign to higher authority]
    REASSIGN --> LOG[Log escalation event]

    style START fill:#FF9800,color:white
    style L4 fill:#f44336,color:white
    style L5 fill:#b71c1c,color:white
```

## A3. Severity Scoring Breakdown

```mermaid
pie title Severity Score Composition (0-100)
    "Issue Type Base Score" : 30
    "Affected Population" : 25
    "Vulnerability Index" : 20
    "Time Sensitivity" : 15
    "Recurrence Factor" : 10
```

## A4. Database Entity Relationship

```mermaid
erDiagram
    CITIZENS ||--o{ GRIEVANCES : "files"
    GRIEVANCES ||--o{ GRIEVANCE_TIMELINE : "has"
    GRIEVANCES }o--|| DEPARTMENTS : "assigned to"
    GRIEVANCES }o--|| OFFICERS : "assigned to"
    GRIEVANCES }o--|| WARDS : "located in"
    GRIEVANCES }o--o| COMMUNITY_ISSUES : "linked to"
    DEPARTMENTS ||--o{ OFFICERS : "has"
    OFFICERS }o--|| WARDS : "assigned to"
    GRIEVANCES ||--o{ VERIFICATION_TOKENS : "verified by"
    GRIEVANCES ||--o{ RTI_APPLICATIONS : "triggers"
    LEGAL_RIGHTS }o--|| GRIEVANCES : "applies to"

    CITIZENS {
        uuid id PK
        string phone UK
        string name
        string preferred_language
        string[] vulnerability_flags
        int total_complaints
    }

    GRIEVANCES {
        uuid id PK
        string complaint_number UK
        uuid citizen_id FK
        enum category
        string sub_category
        text description
        point location
        string address
        int severity_score
        enum status
        int escalation_level
        uuid assigned_department_id FK
        uuid assigned_officer_id FK
        text legal_rights_summary
    }

    OFFICERS {
        uuid id PK
        string name
        string email UK
        enum role
        uuid department_id FK
        uuid ward_id FK
    }
```

## A5. Deployment Architecture

```mermaid
flowchart TB
    subgraph "CDN / Edge"
        CF["Vercel Edge Network<br/>(or CloudFront)"]
    end

    subgraph "Compute"
        FE["Next.js 15<br/>(Vercel / Amplify)"]
        BE["Express.js API<br/>(Render / App Runner)"]
        VA["Python Voice Agent<br/>(Render / ECS)"]
    end

    subgraph "AI Services"
        BED["Gemini / Bedrock<br/>(Classification + Vision)"]
        STT["Deepgram / Transcribe<br/>(Speech-to-Text)"]
        TTS["ElevenLabs / Polly<br/>(Text-to-Speech)"]
    end

    subgraph "Data"
        RDS[("PostgreSQL + PostGIS<br/>(Supabase / RDS)")]
        S3["Photo Storage<br/>(Supabase / S3)"]
    end

    subgraph "Messaging"
        LK["LiveKit Cloud<br/>(WebRTC SFU)"]
    end

    USER([Citizen]) --> CF --> FE
    USER -->|Voice| LK --> VA
    FE -->|REST| BE
    VA -->|Tool Calls| BE
    VA --> STT & TTS & BED
    BE --> BED
    BE --> RDS & S3

    style USER fill:#4CAF50,color:white
    style BED fill:#FF9800,color:white
    style RDS fill:#3ECF8E,color:white
```
