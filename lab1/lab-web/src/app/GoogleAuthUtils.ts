export function parseJwtPayload(token: string): Record<string, unknown> {
  const payload = token.split(".")[1];
  const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
  const decoded = atob(base64);
  return JSON.parse(decoded) as Record<string, unknown>;
}

export function validateGooglePayload(
  payload: Record<string, unknown>,
  googleClientId: string,
): void {
  const audience = String(payload.aud ?? "");
  if (!audience || audience !== googleClientId) {
    throw new Error("Nieprawidlowe audience tokena Google.");
  }

  const issuer = String(payload.iss ?? "");
  const validIssuers = ["accounts.google.com", "https://accounts.google.com"];
  if (!validIssuers.includes(issuer)) {
    throw new Error("Nieprawidlowy issuer tokena Google.");
  }

  const expiration = Number(payload.exp ?? 0);
  if (!Number.isFinite(expiration) || expiration <= Date.now() / 1000) {
    throw new Error("Token Google wygasl.");
  }
}

export function splitName(fullName: string): {
  firstName: string;
  lastName: string;
} {
  const normalized = fullName.trim();
  if (!normalized) {
    return { firstName: "Uzytkownik", lastName: "Google" };
  }
  const parts = normalized.split(/\s+/);
  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(" ") || "Google",
  };
}
