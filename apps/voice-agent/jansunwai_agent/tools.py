"""
LiveKit function tools for the JanSunwai AI voice agent.

These tools are decorated with @llm.function_tool and registered with the Agent.
When the Gemini LLM decides to call a tool, LiveKit invokes these functions
and feeds the return value back into the conversation as tool output.

Each tool calls the Express API via the shared JanSunwaiAPIClient instance.
"""

import logging
from typing import Annotated, Optional

from livekit.agents import llm

from .api_client import JanSunwaiAPIClient

logger = logging.getLogger(__name__)

# ============================================================================
# Module-level client reference (set by agent.py at startup)
# ============================================================================

_api_client: Optional[JanSunwaiAPIClient] = None


def set_api_client(client: JanSunwaiAPIClient) -> None:
    """
    Set the shared API client instance. Called once from agent.py during startup.

    Args:
        client: Initialized JanSunwaiAPIClient instance.
    """
    global _api_client
    _api_client = client
    logger.info("API client registered with tools module")


def _get_client() -> JanSunwaiAPIClient:
    """Get the API client, raising if not initialized."""
    if _api_client is None:
        raise RuntimeError(
            "API client not initialized. Call set_api_client() first."
        )
    return _api_client


# ============================================================================
# Tool: file_grievance
# ============================================================================

@llm.function_tool
async def file_grievance(
    phone: Annotated[
        str,
        "Citizen's 10-digit Indian mobile number. Must be exactly 10 digits. "
        "Example: 9876543210",
    ],
    description: Annotated[
        str,
        "Detailed description of the civic problem as described by the citizen. "
        "Include what the issue is, how long it has been happening, and any other "
        "relevant details the citizen mentioned. Write in the language the citizen used.",
    ],
    location_text: Annotated[
        str,
        "Location of the problem as described by the citizen. Include area name, "
        "colony, street, landmark, ward number, or any location detail they provided. "
        "Example: 'Sarojini Nagar market ke paas, gate number 2 ke saamne'",
    ],
    name: Annotated[
        str,
        "Citizen's name if they provided it. Leave empty string if they declined.",
    ] = "",
    language: Annotated[
        str,
        "Language the citizen is speaking. 'hi' for Hindi, 'en' for English.",
    ] = "hi",
) -> str:
    """File a new civic grievance complaint for the citizen. Use this tool when you have
    collected the problem description, location, and phone number from the caller.
    The system will automatically classify the category, calculate severity, route to
    the correct department, and generate legal rights information. Do NOT ask the citizen
    for category or severity -- the AI handles this automatically."""

    client = _get_client()

    logger.info(f"Tool: file_grievance called")
    logger.info(f"  phone={phone}")
    logger.info(f"  description={description[:100]}...")
    logger.info(f"  location_text={location_text}")
    logger.info(f"  name={name or '(not provided)'}")
    logger.info(f"  language={language}")

    result = await client.file_grievance(
        phone=phone,
        description=description,
        location_text=location_text,
        name=name if name else None,
        language=language,
    )

    if result.get("success") is False:
        error_msg = result.get("error", "Unknown error")
        logger.error(f"Tool: file_grievance FAILED: {error_msg}")
        return (
            f"FILING FAILED. Error: {error_msg}. "
            f"Tell the citizen there is a technical issue and to try again later "
            f"or use the website."
        )

    # Format successful result for the LLM to speak
    complaint_number = result.get("complaint_number", "N/A")
    category = result.get("category", "N/A")
    department = result.get("department", "N/A")
    severity_score = result.get("severity_score", 0)
    severity_label = result.get("severity_label", "N/A")
    legal_rights = result.get("legal_rights_summary", "")

    logger.info(f"Tool: file_grievance SUCCESS: {complaint_number}")

    return f"""GRIEVANCE FILED SUCCESSFULLY.

Complaint Number: {complaint_number}
Category: {category}
Assigned Department: {department}
Severity Score: {severity_score}/100 ({severity_label})

Legal Rights Summary:
{legal_rights}

INSTRUCTIONS FOR AGENT:
1. Read the complaint number clearly to the citizen, spelling it out letter by letter and digit by digit.
2. Tell them which department has been assigned.
3. Explain the severity in simple terms (low = will be addressed normally, medium = priority attention, high = urgent, critical = emergency response).
4. Share 1-2 key legal rights in simple language.
5. Tell them they can check status anytime by calling back or visiting the website.
6. Ask if they have any other complaints to file."""


# ============================================================================
# Tool: check_status
# ============================================================================

@llm.function_tool
async def check_status(
    phone: Annotated[
        str,
        "Citizen's 10-digit phone number to look up complaints. "
        "Provide this OR complaint_number, not both.",
    ] = "",
    complaint_number: Annotated[
        str,
        "Specific complaint number to look up (e.g., JSA-2026-DEL-00042). "
        "Provide this OR phone, not both.",
    ] = "",
) -> str:
    """Check the status of existing grievance complaints. Use this when a citizen wants
    to know the current status of their previously filed complaint. You can search by
    their phone number (returns all complaints for that number) or by a specific
    complaint number."""

    client = _get_client()

    logger.info(f"Tool: check_status called")
    logger.info(f"  phone={phone or '(not provided)'}")
    logger.info(f"  complaint_number={complaint_number or '(not provided)'}")

    if not phone and not complaint_number:
        return (
            "ERROR: No phone number or complaint number provided. "
            "Ask the citizen for their phone number or complaint number."
        )

    result = await client.check_status(
        phone=phone if phone else None,
        complaint_number=complaint_number if complaint_number else None,
    )

    if result.get("success") is False:
        error_msg = result.get("error", "Unknown error")
        logger.error(f"Tool: check_status FAILED: {error_msg}")
        return (
            f"STATUS CHECK FAILED. Error: {error_msg}. "
            f"Tell the citizen there is a technical issue."
        )

    grievances = result.get("grievances", [])

    if not grievances:
        search_by = phone if phone else complaint_number
        logger.info(f"Tool: check_status - no grievances found for {search_by}")
        return (
            f"NO COMPLAINTS FOUND for {'phone ' + phone if phone else 'complaint ' + complaint_number}. "
            f"Tell the citizen no complaints were found. Ask if they want to file a new one."
        )

    # Format all found grievances for the LLM
    lines = [f"FOUND {len(grievances)} COMPLAINT(S):\n"]

    for i, g in enumerate(grievances, 1):
        status = g.get("status", "unknown")
        escalation = g.get("escalation_level", 1)
        department = g.get("assigned_department", "N/A")
        days_open = g.get("days_open", 0)
        latest_event = g.get("latest_timeline_event", "No updates yet")
        category = g.get("category", "N/A")
        comp_num = g.get("complaint_number", "N/A")

        # Translate status to citizen-friendly language
        status_map = {
            "open": "Darj (Filed - waiting for acknowledgment)",
            "acknowledged": "Sweekar (Acknowledged by department)",
            "in_progress": "Kaam chal raha hai (Work in progress)",
            "resolved": "Samaadhaan ho gaya (Resolved - pending your verification)",
            "reopened": "Dobara khola gaya (Reopened)",
            "escalated": "Badhaya gaya (Escalated to higher authority)",
        }
        status_friendly = status_map.get(status, status)

        escalation_desc = {
            1: "Ward Officer level",
            2: "Department Head level",
            3: "Commissioner level",
            4: "Public flagged + RTI eligible",
            5: "Systemic Failure tag",
        }
        esc_friendly = escalation_desc.get(escalation, f"Level {escalation}")

        lines.append(f"--- Complaint {i} ---")
        lines.append(f"Number: {comp_num}")
        lines.append(f"Category: {category}")
        lines.append(f"Status: {status_friendly}")
        lines.append(f"Department: {department}")
        lines.append(f"Escalation: {esc_friendly}")
        lines.append(f"Days Open: {days_open}")
        lines.append(f"Latest Update: {latest_event}")
        lines.append("")

    lines.append("INSTRUCTIONS FOR AGENT:")
    lines.append("1. Read each complaint's status clearly.")
    lines.append("2. If resolved, ask: 'Kya yeh samasya sach mein theek hui hai?' (Has this actually been fixed?)")
    lines.append("3. If escalated, explain: 'Aapki complaint upper adhikari ko bhej di gayi hai kyunki samay par kaarvaai nahi hui.' (Your complaint has been sent to a higher authority because action was not taken on time.)")
    lines.append("4. If open for many days, reassure: 'Main samajh sakta/sakti hoon. Aapki complaint par nazar rakhi ja rahi hai.' (I understand. Your complaint is being monitored.)")

    logger.info(f"Tool: check_status returned {len(grievances)} grievances")

    return "\n".join(lines)


# ============================================================================
# Tool: get_legal_rights
# ============================================================================

@llm.function_tool
async def get_legal_rights(
    category: Annotated[
        str,
        "Grievance category to look up legal rights for. Must be one of: "
        "water_supply, electricity, roads_potholes, sanitation_garbage, "
        "drainage_sewage, street_lighting, public_transport, ration_card_pds, "
        "pension_welfare, corruption_misconduct, building_construction, "
        "parks_public_spaces",
    ],
) -> str:
    """Look up the legal rights applicable to a specific grievance category.
    Use this after filing a grievance (with the classified category) or when
    a citizen specifically asks about their rights. Returns relevant laws,
    mandated resolution timelines, and what actions the citizen can take."""

    client = _get_client()

    logger.info(f"Tool: get_legal_rights called for category={category}")

    result = await client.get_legal_rights(category)

    if result.get("success") is False:
        error_msg = result.get("error", "Unknown error")
        logger.error(f"Tool: get_legal_rights FAILED: {error_msg}")
        return (
            f"LEGAL RIGHTS LOOKUP FAILED. Error: {error_msg}. "
            f"Tell the citizen you could not retrieve rights information right now."
        )

    rights = result.get("rights", [])

    if not rights:
        return (
            f"No specific legal rights found for category '{category}'. "
            f"Tell the citizen that general civic rights apply and they can "
            f"file an RTI application if their complaint is not resolved within "
            f"the expected timeline."
        )

    lines = [f"LEGAL RIGHTS FOR {category.upper().replace('_', ' ')}:\n"]

    for r in rights:
        law_name = r.get("law_name", "N/A")
        summary = r.get("summary", "N/A")
        sla_days = r.get("sla_days", "N/A")
        source = r.get("source_section", "N/A")

        lines.append(f"Law: {law_name}")
        lines.append(f"Your Right: {summary}")
        lines.append(f"Mandated Timeline: {sla_days} days")
        lines.append(f"Legal Reference: {source}")
        lines.append("")

    lines.append("INSTRUCTIONS FOR AGENT:")
    lines.append("1. Explain the most relevant right in SIMPLE language.")
    lines.append("2. Tell them the mandated timeline (e.g., 'Kanoon ke mutabik yeh 7 din mein theek hona chahiye').")
    lines.append("3. If the complaint is older than the SLA, tell them about the RTI option.")
    lines.append("4. Do NOT read law names or section numbers unless the citizen specifically asks.")

    logger.info(f"Tool: get_legal_rights returned {len(rights)} applicable rights")

    return "\n".join(lines)


# ============================================================================
# Exported tool list (imported by agent.py)
# ============================================================================

ALL_TOOLS = [
    file_grievance,
    check_status,
    get_legal_rights,
]
