"""
Async HTTP client for calling the JanSunwai Express API.

All voice agent tool calls go through this client. It handles:
- POST /api/v1/grievance/file (file a new grievance)
- GET /api/v1/grievance/search (check status by phone or complaint number)
- GET /api/v1/citizen/rights/:category (look up legal rights)

Includes retry logic, timeouts, and structured error handling.
"""

import asyncio
import logging
from typing import Any, Optional

import httpx

from .config import AgentConfig

logger = logging.getLogger(__name__)

# Timeout configuration
# - 10s connect timeout (DNS + TCP handshake)
# - 30s read timeout (Gemini classification in the Express API can take time)
DEFAULT_TIMEOUT = httpx.Timeout(connect=10.0, read=30.0, write=10.0, pool=10.0)

# Retry configuration
MAX_RETRIES = 2
RETRY_DELAY_SECONDS = 1.0


class JanSunwaiAPIClient:
    """
    Async HTTP client for the JanSunwai Express backend API.

    Usage:
        config = load_config()
        client = JanSunwaiAPIClient(config)
        result = await client.file_grievance(phone="9876543210", ...)
        await client.close()
    """

    def __init__(self, config: AgentConfig):
        self.base_url = config.api_base_url.rstrip("/")
        self._client = httpx.AsyncClient(
            base_url=self.base_url,
            timeout=DEFAULT_TIMEOUT,
            headers={
                "Content-Type": "application/json",
                "User-Agent": "JanSunwai-VoiceAgent/1.0",
            },
        )
        logger.info(f"API client initialized: base_url={self.base_url}")

    async def close(self):
        """Close the underlying httpx client."""
        await self._client.aclose()
        logger.info("API client closed")

    # ========================================================================
    # Private helpers
    # ========================================================================

    async def _request(
        self,
        method: str,
        path: str,
        json_body: Optional[dict] = None,
        params: Optional[dict] = None,
    ) -> dict[str, Any]:
        """
        Make an HTTP request with retry logic.

        Args:
            method: HTTP method ("GET" or "POST").
            path: API path (e.g., "/api/v1/grievance/file").
            json_body: JSON body for POST requests.
            params: Query parameters for GET requests.

        Returns:
            dict: Parsed JSON response.

        Raises:
            APIError: If the request fails after all retries.
        """
        last_error = None

        for attempt in range(1, MAX_RETRIES + 1):
            try:
                logger.info(
                    f"API {method} {path} (attempt {attempt}/{MAX_RETRIES})"
                )

                if method == "GET":
                    response = await self._client.get(path, params=params)
                elif method == "POST":
                    response = await self._client.post(path, json=json_body)
                else:
                    raise ValueError(f"Unsupported HTTP method: {method}")

                if response.status_code == 200 or response.status_code == 201:
                    result = response.json()
                    logger.info(f"API response OK: {path}")
                    return result

                # Non-success status code
                error_body = response.text
                try:
                    error_body = response.json()
                except Exception:
                    pass

                logger.warning(
                    f"API error {response.status_code} on {path}: {error_body}"
                )
                last_error = f"HTTP {response.status_code}: {error_body}"

                # Don't retry on 4xx client errors (except 429)
                if 400 <= response.status_code < 500 and response.status_code != 429:
                    break

            except httpx.TimeoutException as e:
                logger.warning(f"API timeout on {path} (attempt {attempt}): {e}")
                last_error = f"Timeout: {e}"

            except httpx.ConnectError as e:
                logger.warning(f"API connection error on {path} (attempt {attempt}): {e}")
                last_error = f"Connection error: {e}"

            except Exception as e:
                logger.error(f"API unexpected error on {path}: {e}", exc_info=True)
                last_error = f"Unexpected error: {e}"
                break

            # Wait before retry (only if not the last attempt)
            if attempt < MAX_RETRIES:
                await asyncio.sleep(RETRY_DELAY_SECONDS * attempt)

        # All retries exhausted
        logger.error(f"API request failed after {MAX_RETRIES} attempts: {path}")
        return {"success": False, "error": str(last_error)}

    # ========================================================================
    # Public API methods
    # ========================================================================

    async def file_grievance(
        self,
        phone: str,
        description: str,
        location_text: str,
        name: Optional[str] = None,
        language: str = "hi",
    ) -> dict[str, Any]:
        """
        File a new grievance via the Express API.

        POST /api/v1/grievance/file

        The Express API handles:
        - AI classification (category, sub_category)
        - Severity scoring (0-100 composite score)
        - Department routing (auto-assign department)
        - Duplicate detection (geo + semantic matching)
        - Legal rights lookup (returns summary)
        - Complaint number generation (JSA-2026-XXX-NNNNN)

        Args:
            phone: Citizen's 10-digit phone number.
            description: Natural language description of the problem.
            location_text: Location as described by citizen (area, landmark, address).
            name: Citizen's name (optional).
            language: Language code ('hi' for Hindi, 'en' for English). Default 'hi'.

        Returns:
            dict with keys:
                - success (bool)
                - complaint_number (str): e.g., "JSA-2026-DEL-00042"
                - category (str): classified category
                - sub_category (str): specific sub-type
                - department (str): assigned department name
                - severity_score (int): 0-100
                - severity_label (str): "low" / "medium" / "high" / "critical"
                - legal_rights_summary (str): plain-language rights info
                - error (str, optional): error message if success is False
        """
        # Normalize language to ISO code (LLM sometimes sends "Hindi" instead of "hi")
        lang_map = {
            "hindi": "hi", "english": "en", "tamil": "ta", "telugu": "te",
            "bengali": "bn", "marathi": "mr", "gujarati": "gu", "kannada": "kn",
            "malayalam": "ml", "punjabi": "pa", "odia": "or", "urdu": "ur",
        }
        lang_code = lang_map.get(language.lower(), language.lower()) if language else "hi"

        payload: dict = {
            "phone": phone,
            "description": description,
            "address": location_text,
            "channel": "voice",
            "language": lang_code,
        }

        if name:
            payload["name"] = name

        logger.info(
            f"Filing grievance: phone={phone}, "
            f"location={location_text[:50]}..., "
            f"description={description[:80]}..."
        )

        return await self._request("POST", "/api/v1/grievance/file", json_body=payload)

    async def check_status(
        self,
        phone: Optional[str] = None,
        complaint_number: Optional[str] = None,
    ) -> dict[str, Any]:
        """
        Check grievance status by phone number or complaint number.

        GET /api/v1/grievance/search?phone=X or ?complaint_number=X

        Args:
            phone: 10-digit phone number to search by.
            complaint_number: Complaint number (e.g., "JSA-2026-DEL-00042").

        Returns:
            dict with keys:
                - success (bool)
                - grievances (list): list of matching grievances, each containing:
                    - complaint_number (str)
                    - status (str): open/acknowledged/in_progress/resolved/reopened/escalated
                    - category (str)
                    - description (str)
                    - escalation_level (int): 1-5
                    - assigned_department (str)
                    - days_open (int)
                    - latest_timeline_event (str)
                    - created_at (str): ISO timestamp
                - error (str, optional)

        Raises:
            ValueError: If neither phone nor complaint_number is provided.
        """
        if not phone and not complaint_number:
            raise ValueError(
                "Either phone or complaint_number must be provided"
            )

        params = {}
        if phone:
            params["phone"] = phone
        if complaint_number:
            params["complaint_number"] = complaint_number

        logger.info(
            f"Checking status: phone={phone}, complaint_number={complaint_number}"
        )

        return await self._request("GET", "/api/v1/grievance/search", params=params)

    async def get_legal_rights(self, category: str) -> dict[str, Any]:
        """
        Look up legal rights for a grievance category.

        GET /api/v1/citizen/rights/:category

        Args:
            category: Grievance category slug (e.g., "water_supply", "roads_potholes").

        Returns:
            dict with keys:
                - success (bool)
                - rights (list): list of applicable laws, each containing:
                    - law_name (str)
                    - summary (str): plain-language explanation
                    - sla_days (int): mandated resolution timeline
                    - source_section (str): specific legal section reference
                - error (str, optional)
        """
        # Convert display category to API slug
        slug = category.lower().replace(" & ", "_").replace(" ", "_").replace("/", "_")

        logger.info(f"Looking up legal rights for category: {slug}")

        return await self._request("GET", f"/api/v1/citizen/rights/{slug}")
