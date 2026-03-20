import { KeyValuePair } from '@/types';

export interface EnvironmentVariable {
  key: string;
  value: string;
  enabled: boolean;
  isSecret?: boolean;
}

/**
 * Replaces all {{VARIABLE_NAME}} patterns in text with their values.
 * If a variable is not found, leaves the {{VARIABLE_NAME}} as-is.
 * Variables must be enabled to be resolved.
 */
export const resolveVariables = (text: string, variables: EnvironmentVariable[]): string => {
  if (!text) return text;

  return text.replace(/\{\{([^}]+)\}\}/g, (match, variableName) => {
    const variable = variables.find(
      (v) => v.key === variableName.trim() && v.enabled
    );

    if (variable) {
      return variable.value;
    }

    return match; // Return original {{VARIABLE}} if not found
  });
};

/**
 * Resolves variables in both keys and values of key-value pairs.
 * Returns new array without mutating originals.
 */
export const resolveKeyValuePairs = (
  pairs: KeyValuePair[],
  variables: EnvironmentVariable[]
): KeyValuePair[] => {
  return pairs.map((pair) => ({
    ...pair,
    key: resolveVariables(pair.key, variables),
    value: resolveVariables(pair.value, variables),
  }));
};

/**
 * Extracts all {{VARIABLE_NAME}} patterns from text.
 * Returns array of variable names found (without the {{ }}).
 */
export const extractVariables = (text: string): string[] => {
  if (!text) return [];

  const matches = text.match(/\{\{([^}]+)\}\}/g) || [];
  return matches.map((match) =>
    match.replace(/\{\{|\}\}/g, '').trim()
  );
};

/**
 * Checks if text contains unresolved variables.
 * Returns object with hasUnresolved boolean and array of missing variable names.
 */
export const highlightUnresolved = (
  text: string,
  variables: EnvironmentVariable[]
): { hasUnresolved: boolean; missing: string[] } => {
  const found = extractVariables(text);
  const enabledVars = variables.filter((v) => v.enabled).map((v) => v.key);

  const missing = found.filter((varName) => !enabledVars.includes(varName));

  return {
    hasUnresolved: missing.length > 0,
    missing: Array.from(new Set(missing)), // Remove duplicates
  };
};
