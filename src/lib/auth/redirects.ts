export function getSafeRedirectPath(value: string | null, fallback = "/trips") {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return fallback;
  }

  return value;
}
