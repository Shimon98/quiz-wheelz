const DEFAULT_TIMEOUT_MS = 10000;

async function fetchAudioBytes(url, { fetchImpl = fetch, timeoutMs = DEFAULT_TIMEOUT_MS } = {}) {
  const abort = new AbortController();
  const timer = setTimeout(() => abort.abort(), timeoutMs);
  try {
    const response = await fetchImpl(url, { signal: abort.signal });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    // Static hosts (and the Vite dev server) answer a missing file with index.html and status 200.
    if (response.headers.get("content-type")?.includes("text/html")) throw new Error("expected audio, received HTML");
    return await response.arrayBuffer();
  } finally {
    clearTimeout(timer);
  }
}

function decodeAudioBytes(context, bytes) {
  return new Promise((resolve, reject) => {
    const fail = (error) => reject(error ?? new Error("decodeAudioData failed"));
    // Older WebKit supports only the callback form; newer engines also return a promise.
    context.decodeAudioData(bytes, resolve, fail)?.then?.(resolve, fail);
  });
}

export function createAudioLoader({ fetchImpl, timeoutMs } = {}) {
  const entries = new Map();

  const entryFor = (url) => {
    if (!entries.has(url)) entries.set(url, {});
    return entries.get(url);
  };

  const forget = (url, entry) => {
    if (entries.get(url) === entry) entries.delete(url);
  };

  const download = (url) => fetchAudioBytes(url, { fetchImpl, timeoutMs });

  return {
    prefetch(url) {
      const entry = entryFor(url);
      if (entry.buffer || entry.decoding || entry.bytes) return;
      entry.bytes = download(url);
      entry.bytes.catch(() => forget(url, entry));
    },
    loadBuffer(context, url) {
      const entry = entryFor(url);
      if (entry.buffer) return Promise.resolve(entry.buffer);
      if (!entry.decoding) {
        const bytes = entry.bytes ?? download(url);
        entry.decoding = bytes.then((data) => decodeAudioBytes(context, data)).then(
          (buffer) => {
            entry.buffer = buffer;
            entry.decoding = null;
            return buffer;
          },
          (cause) => {
            // decodeAudioData detaches the bytes even when it fails, so a retry must download again.
            forget(url, entry);
            throw new Error(`Audio asset failed to load: ${url}`, { cause });
          },
        );
      }
      return entry.decoding;
    },
    getBuffer: (url) => entries.get(url)?.buffer ?? null,
    clear: () => entries.clear(),
  };
}
