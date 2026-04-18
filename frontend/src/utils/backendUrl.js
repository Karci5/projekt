export function apiUrl(path = "") {
  const base = import.meta.env.VITE_BACKEND_URL;
  return `${base}${path}`;
}

export function toAbsoluteUploadUrl(value) {
  if (typeof value !== "string") return value;
  if (/^https?:\/\//i.test(value) || value.startsWith("data:")) return value;
  if (value.startsWith("/uploads/")) return apiUrl(value);
  return value;
}
