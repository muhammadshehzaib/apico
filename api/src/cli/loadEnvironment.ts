import { readFileSync } from 'fs';

export const loadEnvironmentFromFile = (path: string): Record<string, string> => {
  let raw: string;
  try {
    raw = readFileSync(path, 'utf-8');
  } catch (err) {
    throw new Error(`Could not read environment file '${path}': ${err instanceof Error ? err.message : err}`);
  }

  let spec: any;
  try {
    spec = JSON.parse(raw);
  } catch (err) {
    throw new Error(`Environment file is not valid JSON: ${err instanceof Error ? err.message : err}`);
  }

  const out: Record<string, string> = {};

  // Postman environment format: { values: [{ key, value, enabled }] }
  if (Array.isArray(spec.values)) {
    for (const v of spec.values) {
      if (!v || typeof v.key !== 'string') continue;
      if (v.enabled === false) continue;
      out[v.key] = typeof v.value === 'string' ? v.value : String(v.value ?? '');
    }
    return out;
  }

  // Plain object format: { KEY: "value", OTHER: "value" }
  if (spec && typeof spec === 'object') {
    for (const [k, v] of Object.entries(spec)) {
      if (typeof v === 'string') out[k] = v;
      else if (v !== null && v !== undefined) out[k] = String(v);
    }
    return out;
  }

  throw new Error('Environment file format not recognized. Expected Postman env format or flat JSON object.');
};
