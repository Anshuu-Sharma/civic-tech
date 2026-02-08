// ============================================================
// apps/api/src/services/gemini.service.ts
// Google Gemini AI integration for classification, legal
// rights summarization, and semantic similarity.
// ============================================================

import {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
  type GenerativeModel,
  type Part,
} from '@google/generative-ai';
import type { GrievanceClassification, GrievanceCategory, Language } from '@jansunwai/shared';

// ------------------------------------------------------------------
// Initialization
// ------------------------------------------------------------------

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);

const safetySettings = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
];

function getModel(modelName = 'gemini-2.0-flash'): GenerativeModel {
  return genAI.getGenerativeModel({
    model: modelName,
    safetySettings,
    generationConfig: {
      temperature: 0.1,
      topP: 0.8,
      maxOutputTokens: 2048,
    },
  });
}

// ------------------------------------------------------------------
// 3-A. classifyGrievance
// ------------------------------------------------------------------

const CLASSIFICATION_PROMPT = `You are a civic grievance classification engine for Indian municipal systems. Your job is to analyze a citizen complaint and output ONLY a JSON object.

INPUT: A citizen's complaint text describing a civic issue. Optionally, images of the issue may be provided.

OUTPUT: A single JSON object with these exact fields:
{
  "category": "<one of the 12 categories below>",
  "sub_category": "<specific sub-type string>",
  "severity_estimate": "<low | medium | high | critical>",
  "area_type": "<residential | commercial | industrial | highway | public_space>",
  "structured_description": "<clean, structured 1-2 sentence description of the issue>"
}

THE 12 CATEGORIES WITH EXAMPLES:

1. "water_supply"
   - Examples: no water for 3 days, dirty/brown water, low pressure, broken pipeline, water tanker not arriving, contaminated water, handpump broken
   - Sub-categories: no_supply, contaminated, low_pressure, pipeline_leak, tanker_delay, handpump_broken

2. "electricity"
   - Examples: power cut for 12 hours, transformer blast, exposed wires, meter issue, voltage fluctuation, no new connection
   - Sub-categories: power_outage, transformer_failure, exposed_wires, meter_dispute, voltage_fluctuation, new_connection_delay

3. "roads_potholes"
   - Examples: huge pothole on main road, road not paved, road cave-in, speed breaker missing, road flooded, bad road surface
   - Sub-categories: pothole, unpaved, cave_in, speed_breaker, waterlogging, surface_damage

4. "sanitation_garbage"
   - Examples: garbage not collected for a week, open dumping, overflowing dustbin, garbage burning, no door-to-door collection, dead animal on road
   - Sub-categories: collection_missed, open_dumping, dustbin_overflow, garbage_burning, no_collection_service, dead_animal

5. "drainage_sewage"
   - Examples: sewer overflowing, drain blocked, sewage on road, nala/drain not cleaned, manhole open, rainwater flooding
   - Sub-categories: sewer_overflow, drain_blocked, sewage_leak, nala_cleaning, open_manhole, flooding

6. "street_lighting"
   - Examples: no streetlight, bulb fused, pole broken, dark lane at night, new streetlight needed
   - Sub-categories: light_not_working, bulb_fused, pole_damaged, dark_area, new_light_request

7. "public_transport"
   - Examples: bus not on time, overcrowded bus, rude conductor, bus stop damaged, route cancelled, auto/taxi overcharging
   - Sub-categories: bus_delay, overcrowding, staff_misconduct, bus_stop_damage, route_cancelled, overcharging

8. "ration_card_pds"
   - Examples: ration not received, shop owner gives less quantity, new ration card application pending, name not in list, PDS shop closed during hours
   - Sub-categories: ration_not_received, quantity_shortage, card_application_pending, name_missing, shop_closed

9. "pension_welfare"
   - Examples: pension not credited for 2 months, widow pension rejected, old age pension application pending, disability certificate issue, scheme benefits not received
   - Sub-categories: pension_delayed, pension_rejected, application_pending, certificate_issue, scheme_benefit_missing

10. "corruption_misconduct"
    - Examples: officer demanded bribe, work not done without money, false completion certificate, ghost beneficiaries, fund misuse
    - Sub-categories: bribery, extortion, false_certificate, ghost_beneficiary, fund_misuse

11. "building_construction"
    - Examples: illegal construction, building plan violation, dangerous structure, encroachment on public land, unauthorized commercial use
    - Sub-categories: illegal_construction, plan_violation, dangerous_structure, encroachment, unauthorized_use

12. "parks_public_spaces"
    - Examples: park not maintained, broken benches, no lights in park, community hall damaged, public toilet dirty, playground encroached
    - Sub-categories: poor_maintenance, broken_equipment, no_lighting, facility_damage, dirty_toilet, encroachment

SEVERITY GUIDELINES:
- "critical": Immediate threat to life or health (e.g., exposed high-voltage wires, sewage in drinking water, building collapse risk)
- "high": Significant disruption affecting many people (e.g., no water for 3+ days, road cave-in, pension delayed 3+ months)
- "medium": Moderate inconvenience (e.g., pothole, garbage not collected for a few days, streetlight out)
- "low": Minor issue with workaround available (e.g., park bench broken, bus stop needs painting)

AREA TYPE GUIDELINES:
- "residential": Housing colonies, apartments, village areas
- "commercial": Markets, shops, business districts
- "industrial": Factory areas, industrial estates
- "highway": National/state highways, major arterial roads
- "public_space": Parks, government buildings, hospitals, schools, bus stations

RULES:
- Output ONLY the JSON object. No markdown, no explanation, no backticks.
- If the complaint is ambiguous, choose the most likely category.
- The structured_description should be in English regardless of input language.
- If images are provided, use visual evidence to improve classification accuracy.
  For example, a photo showing a large crater in asphalt = roads_potholes/pothole/high.
  A photo showing overflowing black water = drainage_sewage/sewer_overflow/high.
`;

export async function classifyGrievance(
  text: string,
  imageUrls?: string[]
): Promise<GrievanceClassification> {
  const model = getModel();

  // Build content parts
  const parts: Part[] = [];

  // Add text
  parts.push({ text: `${CLASSIFICATION_PROMPT}\n\nCITIZEN COMPLAINT:\n"${text}"` });

  // Add images if provided (Gemini Vision multimodal)
  if (imageUrls && imageUrls.length > 0) {
    for (const url of imageUrls) {
      try {
        const response = await fetch(url);
        const arrayBuffer = await response.arrayBuffer();
        const base64 = Buffer.from(arrayBuffer).toString('base64');
        const mimeType = response.headers.get('content-type') || 'image/jpeg';

        parts.push({
          inlineData: {
            mimeType,
            data: base64,
          },
        });
      } catch (err) {
        console.warn(`[Gemini] Failed to fetch image ${url}:`, err);
        // Continue without this image
      }
    }
  }

  const result = await model.generateContent(parts);
  const responseText = result.response.text().trim();

  // Parse JSON -- strip any markdown fences if the model added them
  const jsonString = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

  try {
    const parsed = JSON.parse(jsonString) as GrievanceClassification;

    // Validate category is one of the 12
    const validCategories: GrievanceCategory[] = [
      'water_supply', 'electricity', 'roads_potholes', 'sanitation_garbage',
      'drainage_sewage', 'street_lighting', 'public_transport', 'ration_card_pds',
      'pension_welfare', 'corruption_misconduct', 'building_construction', 'parks_public_spaces',
    ];

    if (!validCategories.includes(parsed.category)) {
      console.warn(`[Gemini] Invalid category "${parsed.category}", defaulting to water_supply`);
      parsed.category = 'water_supply';
    }

    return parsed;
  } catch (err) {
    console.error('[Gemini] Failed to parse classification JSON:', responseText);
    // Fallback classification
    return {
      category: 'water_supply',
      sub_category: 'general',
      severity_estimate: 'medium',
      area_type: 'residential',
      structured_description: text.slice(0, 200),
    };
  }
}

// ------------------------------------------------------------------
// 3-B. generateLegalRightsSummary
// ------------------------------------------------------------------

const LEGAL_RIGHTS_PROMPT = `You are a legal rights advisor for Indian citizens. Given information about relevant laws for a civic grievance category, generate a simple, easy-to-understand summary of the citizen's legal rights.

RULES:
- Write in the specified language (use the language code provided).
- Use simple, everyday language that a person with basic education can understand.
- Mention the specific law name and section.
- Mention the mandated SLA (days to resolve) if available.
- Mention what the citizen can do if the deadline is not met (file RTI, approach court, etc.).
- Keep it to 3-5 sentences maximum.
- Be encouraging -- the citizen has rights and the system must respond.
- Do NOT use legal jargon. Explain like talking to a neighbor.
`;

interface LegalRight {
  law_name: string;
  summary: string;
  sla_days: number;
  source_section: string;
  state: string;
}

export async function generateLegalRightsSummary(
  category: GrievanceCategory,
  language: Language,
  legalRights: LegalRight[]
): Promise<string> {
  if (legalRights.length === 0) {
    return language === 'hi'
      ? '\u0906\u092A\u0915\u0940 \u0936\u093F\u0915\u093E\u092F\u0924 \u0926\u0930\u094D\u091C \u0915\u0930 \u0932\u0940 \u0917\u0908 \u0939\u0948\u0964 \u0938\u0902\u092C\u0902\u0927\u093F\u0924 \u0935\u093F\u092D\u093E\u0917 \u0915\u094B \u0938\u0942\u091A\u093F\u0924 \u0915\u0930 \u0926\u093F\u092F\u093E \u0917\u092F\u093E \u0939\u0948\u0964'
      : 'Your complaint has been registered. The relevant department has been notified.';
  }

  const model = getModel();

  const rightsContext = legalRights
    .map(
      (r, i) =>
        `${i + 1}. Law: ${r.law_name}\n   Section: ${r.source_section}\n   Summary: ${r.summary}\n   Mandated SLA: ${r.sla_days} days\n   Jurisdiction: ${r.state}`
    )
    .join('\n\n');

  const LANGUAGE_NAMES: Record<string, string> = {
    hi: 'Hindi',
    en: 'English',
    ta: 'Tamil',
    te: 'Telugu',
    bn: 'Bengali',
    mr: 'Marathi',
    gu: 'Gujarati',
    kn: 'Kannada',
    ml: 'Malayalam',
    pa: 'Punjabi',
    or: 'Odia',
    ur: 'Urdu',
  };

  const prompt = `${LEGAL_RIGHTS_PROMPT}

CATEGORY: ${category}
OUTPUT LANGUAGE: ${LANGUAGE_NAMES[language] || 'Hindi'} (code: ${language})

RELEVANT LAWS:
${rightsContext}

Generate the citizen-friendly summary now:`;

  const result = await model.generateContent(prompt);
  return result.response.text().trim();
}

// ------------------------------------------------------------------
// 3-C. checkSemanticSimilarity
// ------------------------------------------------------------------

const SIMILARITY_PROMPT = `You are a semantic similarity scorer for civic grievance complaints. Compare the two complaint descriptions below and output ONLY a single decimal number between 0.0 and 1.0 representing their semantic similarity.

SCORING GUIDE:
- 1.0 = identical issue at identical location
- 0.8-0.9 = same type of issue, very similar description, likely same incident
- 0.6-0.7 = same category, similar area, could be related
- 0.3-0.5 = loosely related (same broad category but different specific issue)
- 0.0-0.2 = completely unrelated issues

Output ONLY the number. No text, no explanation.

COMPLAINT A:
"{desc1}"

COMPLAINT B:
"{desc2}"

Similarity score:`;

export async function checkSemanticSimilarity(
  desc1: string,
  desc2: string
): Promise<number> {
  const model = getModel();

  const prompt = SIMILARITY_PROMPT
    .replace('{desc1}', desc1)
    .replace('{desc2}', desc2);

  const result = await model.generateContent(prompt);
  const text = result.response.text().trim();

  const score = parseFloat(text);

  if (isNaN(score) || score < 0 || score > 1) {
    console.warn(`[Gemini] Invalid similarity score "${text}", defaulting to 0.0`);
    return 0.0;
  }

  return Math.round(score * 100) / 100; // 2 decimal places
}
