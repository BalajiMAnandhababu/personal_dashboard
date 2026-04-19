import Groq from 'groq-sdk';

// Read key lazily so it always picks up the value after dotenv override
function getGroq() {
  return new Groq({ apiKey: process.env.GROQ_API_KEY?.trim() });
}

export async function suggestTaskFields(title, description = '') {
  const prompt = `You are a task classifier for a business dashboard managing 6 companies.

Companies: Unified Paygate (fintech/payments), Thangapanam Gold (gold procurement), Iraivi (NBFC/lending), Digitus360 (digital/IT), Infinex (corporation), Personal (family/health/personal)

Given the task below, return ONLY a valid JSON object. No explanation, no markdown, no extra text.

Task title: "${title}"
Task description: "${description}"

Return this exact JSON structure:
{
  "company": "<one of the 6 company names above>",
  "category": "<one of: strategy, operations, follow-up, development>",
  "priority_quadrant": <1=urgent+important, 2=important not urgent, 3=urgent delegate, 4=low priority>,
  "estimated_hours": <decimal number like 0.5 or 2.0>
}

Rules:
- Match company based on keywords (HDFC/MDR/payment/retailer = Unified Paygate, gold/appraisal/melt = Thangapanam Gold, loan/LOS/KYC/NBFC/CIRF = Iraivi, IT/system/tech/code/server = Digitus360, startup/platform/product = Infinex, family/health/personal/daughter/school = Personal)
- If unclear, default company to Personal
- category MUST be exactly one of: strategy, operations, follow-up, development — no other values allowed
- follow-up = contact someone or check status, strategy = planning/decisions, operations = day-to-day execution, development = building/coding/designing
- personal tasks like errands, family, health → category = operations
- priority 1 = deadline today or business-critical, 2 = important but can wait, 3 = someone else should do it, 4 = nice to have`;

  const response = await getGroq().chat.completions.create({
    model: 'llama-3.1-8b-instant',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.1,
    max_tokens: 150,
  });

  const raw = response.choices[0]?.message?.content?.trim();

  try {
    const cleaned = raw.replace(/```json|```/g, '').trim();
    return JSON.parse(cleaned);
  } catch {
    return {
      company: 'Personal',
      category: 'operations',
      priority_quadrant: 2,
      estimated_hours: 1.0,
    };
  }
}
