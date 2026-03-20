export type JsonValueType =
  | 'object'
  | 'array'
  | 'string'
  | 'number'
  | 'boolean'
  | 'null';

export function parseJson(text: string): unknown | null {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

export function getType(value: unknown): JsonValueType {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  if (typeof value === 'object') return 'object';
  if (typeof value === 'string') return 'string';
  if (typeof value === 'number') return 'number';
  if (typeof value === 'boolean') return 'boolean';
  return 'null';
}

export function getSize(value: unknown): number {
  if (typeof value === 'object' && value !== null) {
    if (Array.isArray(value)) return value.length;
    return Object.keys(value).length;
  }
  return 0;
}

export function buildPath(
  parentPath: string,
  key: string | number
): string {
  if (parentPath === '') {
    return String(key);
  }

  if (typeof key === 'number') {
    return `${parentPath}[${key}]`;
  }

  return `${parentPath}.${key}`;
}

export async function copyToClipboard(text: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(text);
  } catch (err) {
    console.error('Failed to copy to clipboard:', err);
  }
}

export function formatValue(value: unknown): string {
  if (typeof value === 'string') return value;
  if (value === null) return 'null';
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  return String(value);
}

export function searchJson(data: unknown, query: string): Set<string> {
  const matches = new Set<string>();
  const queryLower = query.toLowerCase();

  const walk = (obj: unknown, path: string = ''): void => {
    const type = getType(obj);

    if (type === 'object' && obj !== null) {
      const entries = Object.entries(obj as Record<string, unknown>);
      for (const [key, value] of entries) {
        const newPath = buildPath(path, key);

        // Check if key matches
        if (key.toLowerCase().includes(queryLower)) {
          matches.add(newPath);
          if (path) matches.add(path);
        }

        // Check if value (as string) matches
        if (typeof value === 'string' && value.toLowerCase().includes(queryLower)) {
          matches.add(newPath);
          if (path) matches.add(path);
        }

        // Recurse
        walk(value, newPath);
      }
    } else if (type === 'array' && Array.isArray(obj)) {
      for (let i = 0; i < obj.length; i++) {
        const item = obj[i];
        const newPath = buildPath(path, i);

        // Check if value matches
        if (typeof item === 'string' && item.toLowerCase().includes(queryLower)) {
          matches.add(newPath);
          if (path) matches.add(path);
        }

        // Recurse
        walk(item, newPath);
      }
    } else if (typeof obj === 'string' && obj.toLowerCase().includes(queryLower)) {
      if (path) {
        matches.add(path);
      }
    }
  };

  walk(data);
  return matches;
}

// Path format types
export type PathFormat = 'dot' | 'bracket' | 'javascript' | 'optional-chain' | 'lodash' | 'python' | 'jq' | 'jsonpath';

export interface PathFormatResult {
  format: PathFormat;
  label: string;
  code: string;
  language?: string;
}

/**
 * Parse a path string (mixed dot and bracket notation) into segments
 * Examples: "users[0].address.city" -> ["users", 0, "address", "city"]
 */
function parsePathSegments(path: string): (string | number)[] {
  if (!path) return [];

  const segments: (string | number)[] = [];
  const parts = path.split('.');

  for (const part of parts) {
    // Check for bracket notation: "users[0][1]"
    const bracketMatch = part.match(/^(\w+)((?:\[\d+\])*)$/);
    if (bracketMatch) {
      segments.push(bracketMatch[1]);
      // Extract indices from brackets
      const indices = bracketMatch[2].match(/\[\d+\]/g) || [];
      for (const index of indices) {
        segments.push(parseInt(index.slice(1, -1), 10));
      }
    } else if (/^\[\d+\]$/.test(part)) {
      // Standalone bracket notation
      segments.push(parseInt(part.slice(1, -1), 10));
    } else if (part) {
      segments.push(part);
    }
  }

  return segments;
}

export function formatPathDot(path: string): string {
  return path;
}

export function formatPathBracket(path: string): string {
  const segments = parsePathSegments(path);
  if (segments.length === 0) return '';

  let result = '';
  for (const segment of segments) {
    if (typeof segment === 'number') {
      result += `[${segment}]`;
    } else {
      result += `["${segment}"]`;
    }
  }
  return result;
}

export function formatPathJavaScript(path: string): string {
  if (!path) return 'data';
  return `data.${path}`;
}

export function formatPathOptionalChain(path: string): string {
  if (!path) return 'data';
  const segments = parsePathSegments(path);
  if (segments.length === 0) return 'data';

  let result = 'data';
  for (const segment of segments) {
    if (typeof segment === 'number') {
      result += `?.[${segment}]`;
    } else {
      result += `?.${segment}`;
    }
  }
  return result;
}

export function formatPathLodash(path: string): string {
  if (!path) return "_.get(data, '')";
  return `_.get(data, '${path}')`;
}

export function formatPathPython(path: string): string {
  if (!path) return 'data';
  const segments = parsePathSegments(path);
  if (segments.length === 0) return 'data';

  let result = 'data';
  for (const segment of segments) {
    if (typeof segment === 'number') {
      result += `[${segment}]`;
    } else {
      result += `["${segment}"]`;
    }
  }
  return result;
}

export function formatPathJq(path: string): string {
  if (!path) return '.';
  return `.${path}`;
}

export function formatPathJsonPath(path: string): string {
  if (!path) return '$';
  const segments = parsePathSegments(path);
  if (segments.length === 0) return '$';

  let result = '$';
  for (const segment of segments) {
    if (typeof segment === 'number') {
      result += `[${segment}]`;
    } else {
      result += `.${segment}`;
    }
  }
  return result;
}

export function getPathInFormat(path: string, format: PathFormat): string {
  switch (format) {
    case 'dot':
      return formatPathDot(path);
    case 'bracket':
      return formatPathBracket(path);
    case 'javascript':
      return formatPathJavaScript(path);
    case 'optional-chain':
      return formatPathOptionalChain(path);
    case 'lodash':
      return formatPathLodash(path);
    case 'python':
      return formatPathPython(path);
    case 'jq':
      return formatPathJq(path);
    case 'jsonpath':
      return formatPathJsonPath(path);
    default:
      return path;
  }
}

export function getAllFormats(path: string): PathFormatResult[] {
  return [
    { format: 'dot', label: 'Dot', code: formatPathDot(path), language: 'javascript' },
    { format: 'bracket', label: 'Bracket', code: formatPathBracket(path), language: 'javascript' },
    { format: 'javascript', label: 'JavaScript', code: formatPathJavaScript(path), language: 'javascript' },
    { format: 'optional-chain', label: 'Optional Chaining', code: formatPathOptionalChain(path), language: 'javascript' },
    { format: 'lodash', label: 'Lodash', code: formatPathLodash(path), language: 'javascript' },
    { format: 'python', label: 'Python', code: formatPathPython(path), language: 'python' },
    { format: 'jq', label: 'jq', code: formatPathJq(path), language: 'jq' },
    { format: 'jsonpath', label: 'JSONPath', code: formatPathJsonPath(path), language: 'jsonpath' },
  ];
}

/**
 * Get value at a given path in nested data
 * Path format: "users[0].address.city"
 */
export function getValueAtPath(data: unknown, path: string): unknown {
  if (!path || path === '') return data;

  const segments = parsePathSegments(path);
  let current = data;

  for (const segment of segments) {
    if (current === null || current === undefined) {
      return undefined;
    }

    if (typeof segment === 'number') {
      if (Array.isArray(current)) {
        current = current[segment];
      } else {
        return undefined;
      }
    } else {
      if (typeof current === 'object') {
        current = (current as Record<string, unknown>)[segment];
      } else {
        return undefined;
      }
    }
  }

  return current;
}
