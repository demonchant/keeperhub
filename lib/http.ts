export async function fetchJson<T>(url: string, init: RequestInit = {}, timeoutMs = 12_000): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      ...init,
      signal: controller.signal,
      headers: { accept: "application/json", ...init.headers }
    });
    const body = await response.text();
    let parsed: unknown;
    try { parsed = body ? JSON.parse(body) : {}; } catch { parsed = { raw: body.slice(0, 500) }; }
    if (!response.ok) throw new Error(`Upstream request failed (${response.status}): ${JSON.stringify(parsed)}`);
    return parsed as T;
  } finally {
    clearTimeout(timeout);
  }
}
