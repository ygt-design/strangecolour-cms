const BASE_URL = "https://api.are.na/v3";
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const CACHE_PREFIX = "arena:";

// ─── In-flight dedup + sessionStorage cache ──────────────
const inflight = new Map();

function cacheGet(key) {
  try {
    const raw = sessionStorage.getItem(CACHE_PREFIX + key);
    if (!raw) return undefined;
    const { data, ts } = JSON.parse(raw);
    if (Date.now() - ts > CACHE_TTL) {
      sessionStorage.removeItem(CACHE_PREFIX + key);
      return undefined;
    }
    return data;
  } catch {
    return undefined;
  }
}

function cacheSet(key, data) {
  try {
    sessionStorage.setItem(
      CACHE_PREFIX + key,
      JSON.stringify({ data, ts: Date.now() }),
    );
  } catch { /* quota exceeded — silently skip */ }
}

function invalidateCache() {
  try {
    const keys = [];
    for (let i = 0; i < sessionStorage.length; i++) {
      const k = sessionStorage.key(i);
      if (k?.startsWith(CACHE_PREFIX)) keys.push(k);
    }
    keys.forEach((k) => sessionStorage.removeItem(k));
  } catch { /* ignore */ }
}

function getAuthHeaders() {
  const token = import.meta.env.VITE_ARENA_API_KEY;
  if (!token) throw new Error("VITE_ARENA_API_KEY is not set");
  return { Authorization: `Bearer ${token}` };
}

function getGroupSlug() {
  const slug = import.meta.env.VITE_GROUP_SLUG;
  if (!slug) throw new Error("VITE_GROUP_SLUG is not set");
  return slug;
}

function buildArenaUrl(path, params) {
  const url = new URL(`${BASE_URL}${path}`);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.set(key, value);
      }
    });
  }
  return url.toString();
}

async function parseArenaError(res) {
  const jsonBody = await res.json().catch(() => null);
  const textBody = jsonBody ? null : await res.text().catch(() => null);
  const msg =
    jsonBody?.details?.message ||
    jsonBody?.error ||
    textBody ||
    res.statusText ||
    "Unknown error";

  const err = new Error(`Arena API ${res.status}: ${msg}`);
  err.status = res.status;
  err.body = jsonBody ?? textBody ?? null;
  throw err;
}

async function requestArena(
  path,
  {
    method = "GET",
    params,
    authenticated = true,
    body,
    headers,
    response = "json",
  } = {},
) {
  const resolvedHeaders = { ...(headers ?? {}) };

  if (authenticated) Object.assign(resolvedHeaders, getAuthHeaders());

  const isFormData = typeof FormData !== "undefined" && body instanceof FormData;
  if (!isFormData && body !== undefined && !resolvedHeaders["Content-Type"]) {
    resolvedHeaders["Content-Type"] = "application/json";
  }

  const fetchBody =
    body === undefined
      ? undefined
      : isFormData || typeof body === "string"
        ? body
        : JSON.stringify(body);

  const res = await fetch(buildArenaUrl(path, params), {
    method,
    headers: resolvedHeaders,
    body: fetchBody,
  });

  if (res.status === 304) return null;
  if (!res.ok) return parseArenaError(res);
  if (response === "raw") return res;
  if (res.status === 204) return null;
  return res.json().catch(() => null);
}

async function fetchArena(path, options = {}) {
  const cacheKey = buildArenaUrl(path, options.params);

  // Return cached response if fresh
  const cached = cacheGet(cacheKey);
  if (cached !== undefined) return cached;

  // Deduplicate identical in-flight requests
  if (inflight.has(cacheKey)) return inflight.get(cacheKey);

  const promise = requestArena(path, { ...options, method: "GET" }).then(
    (data) => {
      cacheSet(cacheKey, data);
      return data;
    },
  );

  inflight.set(cacheKey, promise);
  promise.finally(() => inflight.delete(cacheKey));

  return promise;
}

async function postArena(path, { body, params, headers, authenticated = true } = {}) {
  return requestArena(path, { method: "POST", body, params, headers, authenticated });
}

async function putArena(path, { body, params, headers, authenticated = true } = {}) {
  return requestArena(path, { method: "PUT", body, params, headers, authenticated });
}

async function deleteArena(path, { params, headers, authenticated = true } = {}) {
  return requestArena(path, { method: "DELETE", params, headers, authenticated, response: "raw" });
}

const S3_ORIGIN = "https://s3.amazonaws.com";

async function putExternal(url, blob, contentType) {
  let target = url;
  if (import.meta.env.DEV && target.startsWith(S3_ORIGIN)) {
    target = target.replace(S3_ORIGIN, "/__s3");
  }

  const res = await fetch(target, {
    method: "PUT",
    headers: { "Content-Type": contentType },
    body: blob,
  });
  if (!res.ok) {
    throw new Error(`S3 upload failed: ${res.status} ${res.statusText}`);
  }
  return res;
}

export {
  BASE_URL,
  getAuthHeaders,
  getGroupSlug,
  fetchArena,
  postArena,
  putArena,
  deleteArena,
  putExternal,
  requestArena,
  invalidateCache,
};
