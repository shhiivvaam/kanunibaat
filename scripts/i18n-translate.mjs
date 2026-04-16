import fs from 'node:fs/promises';
import path from 'node:path';

const ROOT = process.cwd();
const SOURCE_PATH = path.join(ROOT, 'apps', 'web', 'src', 'messages', 'en.json');
const OUT_DIR = path.join(ROOT, 'apps', 'web', 'src', 'messages');

const LOCALES = ['hi', 'ta', 'te', 'kn', 'mr', 'gu', 'bn'];

function assertEnv(name) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required env var ${name}`);
  return v;
}

function isPlainObject(x) {
  return Boolean(x) && typeof x === 'object' && !Array.isArray(x);
}

function flatten(obj, prefix = '') {
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (isPlainObject(v)) Object.assign(out, flatten(v, key));
    else out[key] = v;
  }
  return out;
}

function unflatten(flat) {
  const out = {};
  for (const [k, v] of Object.entries(flat)) {
    const parts = k.split('.');
    let cur = out;
    for (let i = 0; i < parts.length; i++) {
      const p = parts[i];
      const last = i === parts.length - 1;
      if (last) cur[p] = v;
      else cur = cur[p] ?? (cur[p] = {});
    }
  }
  return out;
}

async function readJsonMaybe(filePath) {
  try {
    const raw = await fs.readFile(filePath, 'utf8');
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

async function writeJsonPretty(filePath, obj) {
  const raw = JSON.stringify(obj, null, 2) + '\n';
  await fs.writeFile(filePath, raw, 'utf8');
}

async function openaiTranslateBatch({ model, apiKey, locale, items }) {
  if (items.length === 0) return {};

  const system = [
    'You are a professional product UI translator for an Indian legal-tech app.',
    'Translate the given English strings into the requested locale.',
    'Keep placeholders and formatting intact (e.g. {name}, {count}, URLs, punctuation).',
    'Return ONLY valid JSON.',
  ].join('\n');

  const user = JSON.stringify(
    {
      locale,
      items,
      instructions: {
        keepKeysUnchanged: true,
        returnShape: 'object mapping key -> translated string',
      },
    },
    null,
    2,
  );

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      temperature: 0.2,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
      response_format: { type: 'json_object' },
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`OpenAI translate failed (${res.status}): ${body}`);
  }

  const json = await res.json();
  const content = json?.choices?.[0]?.message?.content;
  if (typeof content !== 'string' || content.length === 0) {
    throw new Error('OpenAI translate returned empty content');
  }

  let parsed;
  try {
    parsed = JSON.parse(content);
  } catch {
    throw new Error(`OpenAI translate returned non-JSON content: ${content.slice(0, 200)}`);
  }
  if (!isPlainObject(parsed)) throw new Error('OpenAI translate returned non-object JSON');
  return parsed;
}

async function main() {
  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_MODEL ?? 'gpt-4o-mini';

  const source = JSON.parse(await fs.readFile(SOURCE_PATH, 'utf8'));
  const sourceFlat = flatten(source);

  for (const locale of LOCALES) {
    const outPath = path.join(OUT_DIR, `${locale}.json`);
    const existing = (await readJsonMaybe(outPath)) ?? {};
    const existingFlat = flatten(existing);

    const missing = [];
    for (const [k, v] of Object.entries(sourceFlat)) {
      if (typeof v !== 'string') continue;
      if (typeof existingFlat[k] === 'string' && existingFlat[k].length > 0) continue;
      missing.push({ key: k, value: v });
    }

    if (missing.length === 0) {
      // Keep keys stable: still ensure we have all keys from source.
      const merged = { ...sourceFlat, ...existingFlat };
      await writeJsonPretty(outPath, unflatten(merged));
      continue;
    }

    if (!apiKey) {
      // No API key: fill with English values so runtime never crashes on missing keys.
      const merged = { ...sourceFlat, ...existingFlat };
      await writeJsonPretty(outPath, unflatten(merged));
      continue;
    }

    // Chunk to reduce prompt size.
    const chunkSize = 60;
    const translated = {};
    for (let i = 0; i < missing.length; i += chunkSize) {
      const chunk = missing.slice(i, i + chunkSize);
      const result = await openaiTranslateBatch({
        model,
        apiKey,
        locale,
        items: chunk,
      });
      for (const [k, v] of Object.entries(result)) {
        if (typeof v === 'string') translated[k] = v;
      }
    }

    const merged = { ...sourceFlat, ...existingFlat, ...translated };
    await writeJsonPretty(outPath, unflatten(merged));
  }
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});

