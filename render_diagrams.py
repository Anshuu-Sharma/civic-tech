#!/usr/bin/env python3
"""Re-render all Mermaid diagrams at high resolution with proper sizing."""
import asyncio, os
from pathlib import Path
from playwright.async_api import async_playwright

DIAGRAM_DIR = Path("diagrams")
DIAGRAM_DIR.mkdir(exist_ok=True)

# Each diagram with custom viewport sizes for best rendering
DIAGRAMS = {
    "feature_mindmap": {
        "width": 1800,
        "height": 1000,
        "code": """mindmap
  root((JanSunwai AI))
    Complaint Filing
      Web Form
      Voice Agent
      Photo Upload
      Geolocation
      10+ Languages
    AI Engine
      Gemini Classification
      Severity Scoring
      Duplicate Detection
      Community Clustering
      Legal Rights
    Escalation
      5-Level Auto
      SLA Tracking
      Cron Automation
      Dept Reassignment
    Dashboards
      Public Heatmaps
      Ward Scorecards
      Admin Queue
      Activity Feed
      Department Stats
    Citizen Power
      Legal Summaries
      RTI Applications
      Complaint Tracking
      Verification"""
    },

    "process_flow": {
        "width": 1200,
        "height": 2000,
        "code": """flowchart TD
    A([Citizen]) --> B{Filing Channel}
    B -->|Web Form| C[4-Step Wizard]
    B -->|Voice Call| D[LiveKit Voice Agent]
    C --> E[Validate Input]
    D -->|STT + LLM| E
    E --> F[Find/Create Citizen]
    F --> G[AI Classification<br/>Gemini 2.0 Flash]
    G --> H[Ward Resolution<br/>PostGIS Geocoding]
    H --> I{Duplicate?}
    I -->|Yes| J[Link Community Issue]
    I -->|No| K[New Complaint]
    J & K --> L[Severity Scoring<br/>5-Factor Algorithm]
    L --> M[Auto-Route to Dept]
    M --> N[Generate Complaint #]
    N --> O[Legal Rights + Summary]
    O --> P[(Save to PostgreSQL)]
    P --> Q([Citizen gets Complaint # + Legal Rights])
    Q --> R{Officer Acts in SLA?}
    R -->|Yes| S[Resolve]
    R -->|No| T[Auto-Escalate]
    T --> U[L2: Dept Head]
    U --> V[L3: Commissioner]
    V --> W[L4: Public Flag]
    S --> X{Citizen Verifies}
    X -->|Satisfied| Y([Closed])
    X -->|No| Z[Reopen]
    Z --> R

    style A fill:#4CAF50,color:#fff
    style Q fill:#2196F3,color:#fff
    style Y fill:#4CAF50,color:#fff
    style T fill:#f44336,color:#fff
    style G fill:#FF9800,color:#fff"""
    },

    "architecture": {
        "width": 2200,
        "height": 1400,
        "code": """flowchart TB
    subgraph Client["🖥️ Client Layer"]
        WEB["Next.js 15 Frontend<br/>(Vercel)"]
        VOICE["Voice Client<br/>(LiveKit SDK)"]
    end

    subgraph Infra["☁️ Infrastructure"]
        LK["LiveKit Cloud<br/>(WebRTC SFU)"]
    end

    subgraph App["⚙️ Application Layer — Render"]
        API["Express.js REST API<br/>(TypeScript)"]
        AGENT["Python Voice Agent<br/>(LiveKit Agents)"]

        subgraph AI["🤖 AI Services"]
            GM["Gemini 2.0 Flash<br/>Classification + Vision"]
            GM25["Gemini 2.5 Flash<br/>Voice Conversational LLM"]
        end

        subgraph ExtAI["🎙️ Voice AI"]
            DG["Deepgram<br/>Speech-to-Text (Hindi)"]
            EL["ElevenLabs<br/>Text-to-Speech (Hindi)"]
            SILERO["Silero VAD"]
        end

        subgraph Svc["📋 Business Logic Services"]
            S1["Classification<br/>Service"]
            S2["Severity<br/>Scoring"]
            S3["Department<br/>Router"]
            S4["Duplicate<br/>Detector"]
            S5["Escalation<br/>Engine"]
            S6["Legal Rights<br/>Service"]
        end

        CRON["⏰ Escalation Cron Job<br/>(Hourly)"]
    end

    subgraph Data["💾 Data Layer — Supabase"]
        DB[("PostgreSQL 14+<br/>+ PostGIS 3")]
        ST["Supabase Storage<br/>(Photos/Documents)"]
    end

    subgraph Maps["🗺️ External"]
        GMAP["Google Maps API<br/>Geocoding + Heatmaps"]
    end

    WEB -->|REST API| API
    WEB --> GMAP
    VOICE -->|WebRTC| LK
    LK -->|Audio Stream| AGENT
    AGENT -->|STT| DG
    AGENT -->|TTS| EL
    AGENT -->|VAD| SILERO
    AGENT -->|LLM| GM25
    AGENT -->|Tool Calls| API
    API --> S1 & S2 & S3 & S4 & S5 & S6
    S1 --> GM
    S6 --> GM
    API -->|Prisma ORM| DB
    API -->|File Upload| ST
    CRON -->|Check SLAs| DB
    CRON --> S5

    style WEB fill:#0070f3,color:#fff
    style VOICE fill:#0070f3,color:#fff
    style AGENT fill:#7c3aed,color:#fff
    style GM fill:#FF9800,color:#fff
    style GM25 fill:#FF9800,color:#fff
    style DB fill:#3ECF8E,color:#fff
    style ST fill:#3ECF8E,color:#fff
    style LK fill:#EF4444,color:#fff
    style GMAP fill:#4285F4,color:#fff
    style DG fill:#13EF93,color:#000
    style EL fill:#ffffff,color:#000
    style CRON fill:#8B5CF6,color:#fff"""
    },

    "voice_sequence": {
        "width": 1600,
        "height": 1100,
        "code": """sequenceDiagram
    participant C as 👤 Citizen (Browser)
    participant LK as 📡 LiveKit Cloud
    participant AG as 🤖 Python Voice Agent
    participant DG as 🎙️ Deepgram STT
    participant GM as 🧠 Gemini 2.5 Flash
    participant EL as 🔊 ElevenLabs TTS
    participant API as ⚙️ Express API
    participant DB as 💾 PostgreSQL

    C->>LK: Connect via WebRTC
    LK->>AG: Audio Stream

    rect rgb(30, 41, 59)
    Note over AG,API: Conversation Loop
    AG->>DG: Audio chunk
    DG-->>AG: Transcribed text (Hindi/English)
    AG->>GM: User message + tool definitions

    alt Tool Call: file_grievance
        GM-->>AG: tool_call: file_grievance(phone, desc, location)
        AG->>API: POST /api/v1/grievance/file
        API->>DB: Insert grievance record
        DB-->>API: complaint_number: JSA-2025-XXX
        API-->>AG: Success + complaint number
        AG->>GM: Tool result: complaint filed
        GM-->>AG: "Your complaint has been filed..."
    else Tool Call: check_status
        GM-->>AG: tool_call: check_status(phone)
        AG->>API: GET /api/v1/grievance/search
        API-->>AG: Complaint status + timeline
        GM-->>AG: "Your complaint is being processed..."
    else Direct Response
        GM-->>AG: Conversational reply
    end

    AG->>EL: Response text (Hindi)
    EL-->>AG: Audio speech
    AG->>LK: Audio response
    LK->>C: Play Hindi audio
    end"""
    },

    "escalation_flow": {
        "width": 1400,
        "height": 1000,
        "code": """flowchart TD
    START([⏰ Hourly Cron Job Triggers]) --> FETCH[Fetch All Open Grievances]
    FETCH --> CHECK{Check Each Grievance<br/>Against Time Thresholds}

    CHECK -->|"0-48h, no acknowledgment"| L2["🔶 Level 2<br/>Assign → Department Head"]
    CHECK -->|"48-96h, no action taken"| L3["🔴 Level 3<br/>Assign → Commissioner"]
    CHECK -->|"96h - 7 days"| L4["🚨 Level 4<br/>Public Flag + RTI Offer"]
    CHECK -->|"14+ days"| L5["⛔ Level 5<br/>Systemic Failure Tag"]
    CHECK -->|"Within SLA"| OK["✅ No Action Needed"]

    L2 & L3 & L4 & L5 --> UPD[Update Grievance Record]
    UPD --> TL[Create Timeline Entry]
    TL --> RE[Reassign to Higher Authority]
    RE --> NOTIFY[Log Escalation Event]

    style START fill:#FF9800,color:#fff
    style L2 fill:#F59E0B,color:#fff
    style L3 fill:#EF4444,color:#fff
    style L4 fill:#DC2626,color:#fff
    style L5 fill:#991B1B,color:#fff
    style OK fill:#22C55E,color:#fff
    style UPD fill:#3B82F6,color:#fff
    style NOTIFY fill:#8B5CF6,color:#fff"""
    },

    "er_diagram": {
        "width": 1800,
        "height": 1100,
        "code": """erDiagram
    CITIZENS ||--o{ GRIEVANCES : files
    GRIEVANCES ||--o{ TIMELINE : has_events
    GRIEVANCES }o--|| DEPARTMENTS : assigned_to
    GRIEVANCES }o--|| OFFICERS : handled_by
    GRIEVANCES }o--|| WARDS : located_in
    GRIEVANCES }o--o| COMMUNITY_ISSUES : linked_to
    DEPARTMENTS ||--o{ OFFICERS : employs
    GRIEVANCES ||--o{ VERIFICATION : verified_by
    GRIEVANCES ||--o{ RTI_APPS : triggers

    CITIZENS {
        uuid id PK
        string phone UK
        string name
        string preferred_language
        string preferred_channel
        array vulnerability_flags
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
        int ward_id FK
        int severity_score
        enum status
        int escalation_level
        uuid dept_id FK
        uuid officer_id FK
        text legal_rights_summary
        timestamp created_at
        timestamp resolved_at
    }
    OFFICERS {
        uuid id PK
        string name
        string email UK
        string password_hash
        enum role
        uuid department_id FK
        uuid ward_id FK
    }
    DEPARTMENTS {
        uuid id PK
        string name
        json category_mapping
        uuid head_officer_id FK
    }
    WARDS {
        uuid id PK
        string name
        int number
        polygon boundary
        string zone
    }
    TIMELINE {
        uuid id PK
        uuid grievance_id FK
        enum event_type
        text description
        string actor
        json metadata
        timestamp created_at
    }"""
    },

    "severity_pie": {
        "width": 1000,
        "height": 700,
        "code": """pie title Severity Score Composition (0-100)
    "Issue Type Base (30%)" : 30
    "Affected Population (25%)" : 25
    "Vulnerability Index (20%)" : 20
    "Time Sensitivity (15%)" : 15
    "Recurrence Factor (10%)" : 10"""
    },

    "screen_flow": {
        "width": 1600,
        "height": 1100,
        "code": """flowchart TD
    subgraph Citizen["👤 Citizen-Facing Screens"]
        HP["🏠 Home Page<br/>Hero + Stats + CTAs"] --> FC["📝 File Complaint<br/>4-Step Wizard"]
        HP --> VA["🎙️ Voice Assistant<br/>Call to File"]
        HP --> TR["🔍 Track Complaint<br/>Search by Phone/#"]
        HP --> DB["📊 Public Dashboard<br/>Heatmaps + Stats"]
        HP --> RTI["⚖️ RTI Application<br/>Auto-Draft"]
        FC --> FC1["Step 1: Category + Description + Photos"]
        FC1 --> FC2["Step 2: Location via Google Maps"]
        FC2 --> FC3["Step 3: Name + Phone + Language"]
        FC3 --> FC4["Step 4: Review & Submit"]
        FC4 --> SC(["✅ Success: Complaint # + Legal Rights"])
        VA --> SC
    end

    subgraph Admin["🔐 Admin / Officer Screens"]
        AL["🔑 Login"] --> AD["📊 Dashboard<br/>Stats + Activity Feed"]
        AD --> AQ["📋 Queue View<br/>Filterable Table"]
        AD --> AE["🚨 Escalations<br/>Level 2+ Complaints"]
        AD --> AS["📈 Dept Statistics<br/>SLA Metrics"]
        AQ --> GD["📄 Grievance Detail<br/>Info + Timeline + Actions"]
        GD --> UP["Update Status"]
        GD --> ESC["Manual Escalate"]
        GD --> ASN["Assign Officer"]
    end

    style HP fill:#1a73e8,color:#fff
    style AL fill:#EF4444,color:#fff
    style SC fill:#22C55E,color:#fff
    style FC fill:#3B82F6,color:#fff
    style VA fill:#8B5CF6,color:#fff
    style DB fill:#0EA5E9,color:#fff"""
    },

    "deployment": {
        "width": 1600,
        "height": 1000,
        "code": """flowchart TB
    USER(["👤 Citizen"]) --> CDN["🌐 Edge Network<br/>(Vercel / CloudFront)"]
    USER -->|"🎙️ Voice"| LK["📡 LiveKit Cloud<br/>(WebRTC SFU)"]

    CDN --> FE["⚛️ Next.js 15<br/>(Vercel / AWS Amplify)"]
    LK --> VA["🐍 Python Voice Agent<br/>(Render / AWS ECS)"]

    FE -->|"REST API"| BE["⚙️ Express.js API<br/>(Render / AWS App Runner)"]
    VA -->|"Tool Calls"| BE

    VA --> STT["🎙️ Deepgram<br/>(→ AWS Transcribe)"]
    VA --> TTS["🔊 ElevenLabs<br/>(→ AWS Polly)"]
    VA --> AI["🧠 Gemini 2.5<br/>(→ AWS Bedrock)"]

    BE --> AI2["🧠 Gemini 2.0<br/>(→ AWS Bedrock)"]
    BE --> DB[("💾 PostgreSQL + PostGIS<br/>(Supabase → AWS RDS)")]
    BE --> S3["📦 Photo Storage<br/>(Supabase → AWS S3)"]
    BE --> MAPS["🗺️ Google Maps<br/>(→ AWS Location)"]

    style USER fill:#22C55E,color:#fff
    style AI fill:#FF9800,color:#fff
    style AI2 fill:#FF9800,color:#fff
    style DB fill:#3ECF8E,color:#fff
    style FE fill:#0070f3,color:#fff
    style VA fill:#7c3aed,color:#fff
    style BE fill:#3B82F6,color:#fff
    style LK fill:#EF4444,color:#fff"""
    },

    "roadmap": {
        "width": 1800,
        "height": 700,
        "code": """timeline
    title JanSunwai AI — Product Roadmap
    section Phase 1 — MVP (Current)
        Hackathon Demo : Web + Voice complaint filing
                       : AI classification + vision
                       : 5-level auto-escalation
                       : Public heatmap dashboards
                       : Admin officer portal
    section Phase 2 — Pilot
        Single City Deployment : WhatsApp Bot integration
                               : SMS notification alerts
                               : Officer mobile app
                               : Citizen satisfaction surveys
    section Phase 3 — Regional
        State-wide Rollout : Multi-tenant architecture
                           : Regional language models
                           : CPGRAMS integration
                           : Predictive analytics
    section Phase 4 — National
        Pan-India Scale : Aadhaar verification
                        : DigiLocker integration
                        : Predictive maintenance AI
                        : Parliament oversight dashboard"""
    }
}


async def main():
    print("Rendering Mermaid diagrams at high resolution...\n")

    async with async_playwright() as p:
        browser = await p.chromium.launch()

        for name, config in DIAGRAMS.items():
            output_path = DIAGRAM_DIR / f"{name}.png"
            w = config["width"]
            h = config["height"]
            code = config["code"]

            print(f"  [{name}] {w}x{h}...")

            # Create a page with the right viewport
            page = await browser.new_page(
                viewport={"width": w, "height": h},
                device_scale_factor=2  # 2x resolution for crisp images
            )

            html = f"""<!DOCTYPE html>
<html><head>
<script src="https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.min.js"></script>
<style>
  * {{ margin: 0; padding: 0; box-sizing: border-box; }}
  body {{
    background: #0F172A;
    display: flex;
    justify-content: center;
    align-items: flex-start;
    padding: 30px;
    min-height: 100vh;
    font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
  }}
  #container {{
    background: #1E293B;
    border-radius: 16px;
    padding: 30px 40px;
    box-shadow: 0 8px 32px rgba(0,0,0,0.4);
    display: inline-block;
    max-width: 95vw;
  }}
  .mermaid {{
    font-size: 16px;
  }}
  .mermaid svg {{
    max-width: 100%;
  }}
</style>
</head><body>
<div id="container">
<pre class="mermaid">
{code}
</pre>
</div>
<script>
mermaid.initialize({{
    startOnLoad: true,
    theme: 'dark',
    fontSize: 16,
    flowchart: {{
        htmlLabels: true,
        curve: 'basis',
        padding: 15,
        nodeSpacing: 30,
        rankSpacing: 40,
        useMaxWidth: false
    }},
    sequence: {{
        useMaxWidth: false,
        actorFontSize: 14,
        messageFontSize: 14,
        noteFontSize: 13,
        actorMargin: 80,
        boxMargin: 10,
        boxTextMargin: 10,
        noteMargin: 10,
        messageMargin: 30
    }},
    er: {{
        useMaxWidth: false,
        fontSize: 14,
        entityPadding: 15
    }},
    pie: {{
        useMaxWidth: false
    }},
    mindmap: {{
        useMaxWidth: false,
        padding: 20
    }},
    themeVariables: {{
        primaryColor: '#1E40AF',
        primaryTextColor: '#F1F5F9',
        primaryBorderColor: '#3B82F6',
        lineColor: '#64748B',
        secondaryColor: '#7C3AED',
        tertiaryColor: '#059669',
        background: '#1E293B',
        mainBkg: '#1E293B',
        nodeBkg: '#1E293B',
        nodeTextColor: '#F1F5F9',
        clusterBkg: '#0F172A',
        clusterBorder: '#334155',
        titleColor: '#F1F5F9',
        edgeLabelBackground: '#1E293B',
        fontFamily: 'Segoe UI, system-ui, sans-serif',
        fontSize: '16px',
        actorBkg: '#1E40AF',
        actorTextColor: '#F1F5F9',
        actorBorder: '#3B82F6',
        activationBorderColor: '#3B82F6',
        activationBkgColor: '#1E293B',
        signalColor: '#94A3B8',
        signalTextColor: '#F1F5F9',
        labelBoxBkgColor: '#1E293B',
        labelBoxBorderColor: '#334155',
        labelTextColor: '#F1F5F9',
        loopTextColor: '#94A3B8',
        noteBkgColor: '#334155',
        noteTextColor: '#F1F5F9',
        noteBorderColor: '#475569',
        sectionBkgColor: '#1E293B',
        sectionBkgColor2: '#0F172A',
        altSectionBkgColor: '#1E293B',
        taskBkgColor: '#1E40AF',
        taskTextColor: '#F1F5F9',
        taskBorderColor: '#3B82F6',
        doneTaskBkgColor: '#059669',
        activeTaskBkgColor: '#7C3AED',
        gridColor: '#334155',
        todayLineColor: '#EF4444',
        pie1: '#3B82F6',
        pie2: '#22C55E',
        pie3: '#F59E0B',
        pie4: '#EF4444',
        pie5: '#8B5CF6',
        pie6: '#EC4899',
        pie7: '#06B6D4',
        pieTitleTextSize: '20px',
        pieTitleTextColor: '#F1F5F9',
        pieSectionTextSize: '14px',
        pieSectionTextColor: '#F1F5F9',
        pieLegendTextSize: '14px',
        pieLegendTextColor: '#F1F5F9',
        pieStrokeColor: '#0F172A',
        pieStrokeWidth: '2px',
        pieOuterStrokeColor: '#0F172A',
        pieOuterStrokeWidth: '2px',
        pieOpacity: '0.9'
    }}
}});
</script>
</body></html>"""

            await page.set_content(html)
            await page.wait_for_timeout(4000)  # Wait for mermaid render

            # Screenshot the container for tight framing
            try:
                container = await page.query_selector("#container")
                if container:
                    box = await container.bounding_box()
                    if box and box["width"] > 50 and box["height"] > 50:
                        await container.screenshot(path=str(output_path), type="png")
                        size_kb = os.path.getsize(output_path) / 1024
                        print(f"    -> {output_path} ({size_kb:.0f} KB, {box['width']:.0f}x{box['height']:.0f})")
                    else:
                        await page.screenshot(path=str(output_path), type="png", full_page=True)
                        print(f"    -> {output_path} (full page fallback)")
                else:
                    await page.screenshot(path=str(output_path), type="png", full_page=True)
                    print(f"    -> {output_path} (no container found)")
            except Exception as e:
                await page.screenshot(path=str(output_path), type="png", full_page=True)
                print(f"    -> {output_path} (error: {e})")

            await page.close()

        await browser.close()

    print("\nAll diagrams rendered!")


if __name__ == "__main__":
    asyncio.run(main())
