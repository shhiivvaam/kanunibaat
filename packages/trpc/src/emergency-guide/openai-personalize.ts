import {
  LEGAL_INFO_DISCLAIMER,
  personalizedGuideSchema,
  type EmergencyScenario,
  type PersonalizedGuide,
} from '@kb/emergency-guide';

export async function personalizeEmergencyGuideWithOpenAI(
  apiKey: string,
  scenario: EmergencyScenario,
  stateName: string,
  answers: Record<string, string>,
): Promise<PersonalizedGuide> {
  const system = [
    'You are an Indian legal information assistant for a public emergency guide.',
    'Output GENERAL information only. Do not give case-specific legal advice.',
    'Do not encourage evasion of law enforcement or destruction of evidence.',
    'Adapt bullet points to the user Indian state/UT name and their short answers.',
    `Always reflect this disclaimer in tone (you may end one bullet with: "${LEGAL_INFO_DISCLAIMER}")`,
    'Return STRICT JSON only, matching this shape:',
    '{"right_now":string[],"your_rights":string[],"documents":string[],"what_not_to_do":string[],',
    '"police_or_court":string[],"timeline":string[],"applicable_laws":string[]}',
    'Use snake_case keys exactly. No markdown.',
  ].join(' ');

  const user = [
    `Scenario (en): ${scenario.titleEn}`,
    `Scenario slug: ${scenario.slug}`,
    `User state/UT: ${stateName}`,
    'Context answers (id: text):',
    JSON.stringify(answers, null, 0).slice(0, 8000),
    '',
    'Base guide (personalise and localise lightly; keep 3–8 bullets per section where sensible):',
    JSON.stringify(
      {
        right_now: scenario.base.rightNow,
        your_rights: scenario.base.rights,
        documents: scenario.base.documents,
        what_not_to_do: scenario.base.whatNotToDo,
        police_or_court: scenario.base.policeOrCourt,
        timeline: scenario.base.timeline,
        applicable_laws: scenario.base.applicableLaws,
      },
      null,
      0,
    ).slice(0, 12000),
  ].join('\n');

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      temperature: 0.25,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`OpenAI personalize failed: ${res.status} ${text}`);
  }

  const json = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const content = json.choices?.[0]?.message?.content;
  if (!content) throw new Error('OpenAI returned empty content.');

  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(content);
  } catch {
    throw new Error('OpenAI returned non-JSON content.');
  }

  const parsed = personalizedGuideSchema.safeParse(parsedJson);
  if (!parsed.success) {
    throw new Error(`OpenAI output failed schema: ${parsed.error.message}`);
  }
  return parsed.data;
}
