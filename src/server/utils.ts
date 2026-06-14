export function getEnv(key: string, defaultValue: string = ''): string {
  return process.env[key] || defaultValue
}

/**
 * Parse env variable that may contain math expressions like "10 * 1000" or "7 * 24 * 60 * 60".
 * Falls back to simple parseInt, then to defaultValue.
 */
export function parseEnvTime(key: string, defaultValue: number): number {
  const value = getEnv(key)
  if (!value) return defaultValue
  if (value.includes('*')) {
    try {
      const nums = value.split('*').map(p => parseFloat(p.trim()))
      if (nums.every(n => !isNaN(n))) return nums.reduce((a, b) => a * b, 1)
    } catch {}
  }
  const parsed = parseInt(value, 10)
  return isNaN(parsed) ? defaultValue : parsed
}
