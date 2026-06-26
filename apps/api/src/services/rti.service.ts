// ============================================================
// apps/api/src/services/rti.service.ts
// AI-powered RTI (Right to Information) application generation
// using Google Gemini.
// ============================================================

import {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
} from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);

const safetySettings = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
];

// ------------------------------------------------------------------
// Types
// ------------------------------------------------------------------

export interface GrievanceForRti {
  complaint_number: string;
  category: string;
  sub_category: string | null;
  description: string;
  address: string | null;
  created_at: Date;
  escalation_level: number;
  department: { name: string } | null;
  officer: { name: string } | null;
  citizen: { name: string | null; preferred_language: string } | null;
  ward: { name: string; number: number } | null;
  timeline: Array<{
    event_type: string;
    description: string;
    created_at: Date;
  }>;
}

export interface LegalRightRecord {
  law_name: string;
  summary: string;
  sla_days: number;
  source_section: string;
  state: string;
}

export interface RtiGenerationResult {
  subject: string;
  body: string;
  body_hindi: string | null;
  addressed_to: string;
  reference_laws: Array<{ name: string; section: string }>;
  fee_amount: string;
  gemini_model: string;
}

// ------------------------------------------------------------------
// RTI Generation
// ------------------------------------------------------------------

/**
 * Calls Gemini to generate a complete RTI application based on
 * grievance details and applicable legal rights.
 */
export async function generateRtiApplication(
  grievance: GrievanceForRti,
  legalRights: LegalRightRecord[]
): Promise<RtiGenerationResult> {
  const modelName = 'gemini-2.5-flash';
  const model = genAI.getGenerativeModel({
    model: modelName,
    safetySettings,
    generationConfig: {
      temperature: 0.3,
      topP: 0.8,
      maxOutputTokens: 4096,
    },
  });

  // Calculate days unresolved
  const daysUnresolved = Math.ceil(
    (Date.now() - new Date(grievance.created_at).getTime()) / (1000 * 60 * 60 * 24)
  );

  // Build timeline summary
  const timelineSummary = grievance.timeline
    .map(
      (entry) =>
        `${new Date(entry.created_at).toLocaleDateString('en-IN')}: [${entry.event_type}] ${entry.description}`
    )
    .join('\n');

  // Build legal rights context
  const legalRightsText =
    legalRights.length > 0
      ? legalRights
          .map(
            (lr) =>
              `- ${lr.law_name} (${lr.source_section}): ${lr.summary} [SLA: ${lr.sla_days} days]`
          )
          .join('\n')
      : '- Right to Information Act, 2005 (Section 6)\n- Applicable state Municipal Corporation Act';

  // Build relevant law names for the prompt
  const relevantLawNames =
    legalRights.length > 0
      ? legalRights.map((lr) => `${lr.law_name} (${lr.source_section})`).join(', ')
      : 'applicable Municipal Corporation Act and state Right to Public Services Act';

  const departmentName = grievance.department?.name || 'the concerned Municipal Department';
  const wardName = grievance.ward?.name || 'Unknown Ward';
  const wardNumber = grievance.ward?.number || 0;

  const prompt = buildRtiPrompt({
    complaintNumber: grievance.complaint_number,
    category: grievance.category,
    subCategory: grievance.sub_category,
    description: grievance.description,
    address: grievance.address || 'Address not specified',
    createdAt: grievance.created_at,
    daysUnresolved,
    departmentName,
    timelineSummary,
    legalRightsText,
    relevantLawNames,
    wardName,
    wardNumber,
  });

  const result = await model.generateContent(prompt);
  const responseText = result.response.text();

  // Parse JSON response from Gemini -- strip any markdown fences
  const cleaned = responseText
    .replace(/```json\n?/g, '')
    .replace(/```\n?/g, '')
    .trim();

  const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Failed to parse Gemini RTI response as JSON.');
  }

  const parsed = JSON.parse(jsonMatch[0]);

  return {
    subject: parsed.subject,
    body: parsed.body,
    body_hindi: parsed.body_hindi || null,
    addressed_to: parsed.addressed_to,
    reference_laws: parsed.reference_laws || [],
    fee_amount: parsed.fee_amount || '10',
    gemini_model: modelName,
  };
}

// ------------------------------------------------------------------
// Prompt Builder
// ------------------------------------------------------------------

function buildRtiPrompt(params: {
  complaintNumber: string;
  category: string;
  subCategory: string | null;
  description: string;
  address: string;
  createdAt: Date;
  daysUnresolved: number;
  departmentName: string;
  timelineSummary: string;
  legalRightsText: string;
  relevantLawNames: string;
  wardName: string;
  wardNumber: number;
}): string {
  return `Generate a Right to Information (RTI) application under the Right to Information Act, 2005 for the following civic grievance:

Complaint Number: ${params.complaintNumber}
Category: ${params.category}${params.subCategory ? ` (${params.subCategory})` : ''}
Description: ${params.description}
Location: ${params.address} (${params.wardName}, Ward ${params.wardNumber})
Date Filed: ${new Date(params.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
Days Unresolved: ${params.daysUnresolved}
Assigned Department: ${params.departmentName}
Escalation History:
${params.timelineSummary}

Applicable Legal Rights:
${params.legalRightsText}

The RTI application should:
1. Be addressed to the Public Information Officer of ${params.departmentName}
2. State the complaint details and complete timeline of inaction
3. Ask these specific questions:
   a. What action has been taken on complaint number ${params.complaintNumber} filed on ${new Date(params.createdAt).toLocaleDateString('en-IN')}?
   b. Who is the officer responsible for handling this complaint and what is their designation?
   c. What is the specific reason for the delay of ${params.daysUnresolved} days in resolving this complaint?
   d. What is the expected date of resolution?
   e. What are the SLA norms for this category of complaint (${params.category}) under ${params.relevantLawNames}?
   f. Has any action been taken against the responsible officer for non-compliance with the mandated SLA?
   g. How many similar complaints (${params.category}) have been received from ${params.wardName} in the last 12 months, and what is the average resolution time?
4. Reference all applicable laws: ${params.relevantLawNames}
5. Include standard RTI formalities:
   - Application fee of Rs. 10 (mention that it is enclosed/to be paid via postal order)
   - Request for certified copies of any relevant file notings or internal communications
   - 30-day response deadline as per Section 7(1) of the RTI Act, 2005
   - Right to first appeal under Section 19(1) if response is not received within 30 days
6. Be formal, legally precise, and assertive but respectful in tone
7. Provide BOTH an English version and a Hindi version of the application body

Output as a JSON object with exactly these fields:
{
  "subject": "RTI application subject line",
  "body": "Complete RTI application text in English",
  "body_hindi": "Complete RTI application text in Hindi (Devanagari script)",
  "addressed_to": "Full address line: Public Information Officer, Department Name, Municipal Corporation Name, City",
  "reference_laws": [
    { "name": "Law name", "section": "Specific section reference" }
  ],
  "fee_amount": "10"
}

IMPORTANT: Output ONLY the JSON object, no markdown formatting, no code blocks, no additional text before or after.`;
}

export { buildRtiPrompt };
