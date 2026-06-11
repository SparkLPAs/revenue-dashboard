export const AUTH_COOKIE = "rod_session";
export function deriveToken(password: string): string {
  if (typeof btoa === "function") return btoa(`rod:${password}`);
  return Buffer.from(`rod:${password}`).toString("base64");
}
export function expectedToken(): string {
  return deriveToken(process.env.DASHBOARD_PASSWORD ?? "");
}
