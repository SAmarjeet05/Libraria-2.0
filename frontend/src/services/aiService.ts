export async function queryAI(text: string, actorType?: 'user' | 'admin', actorId?: string) {
  const payload: any = { text };
  if (actorType) payload.actor_type = actorType;
  if (actorId) payload.actor_id = actorId;

  const res = await fetch('/api/ai/query', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    // Read body once (as text) and attempt to parse JSON to extract helpful error
    const txt = await res.text();
    try {
      const j = JSON.parse(txt || '{}');
      const msg = (j as any).detail ?? (j.message ?? JSON.stringify(j));
      throw new Error(typeof msg === 'string' ? msg : JSON.stringify(msg));
    } catch (e) {
      // Not JSON — return raw text
      throw new Error(txt || 'AI query failed');
    }
  }
  // successful response: parse as JSON
  return res.json();
}

export async function summarize(bookId: number) {
  const res = await fetch(`/api/ai/summarize?book_id=${bookId}`, { method: 'POST' });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function recommend(bookId: number) {
  const res = await fetch(`/api/ai/recommend?book_id=${bookId}`, { method: 'POST' });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function logEvent(actionType: string, query?: string, metadata?: any, actorType?: 'user' | 'admin', actorId?: string) {
  const payload: any = { action_type: actionType, query, metadata };
  if (actorType) payload.actor_type = actorType;
  if (actorId) payload.actor_id = actorId;
  const res = await fetch('/api/ai/log', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function uploadToCloudinary(file: File) {
  // Send file to backend upload endpoint which proxies Cloudinary
  const body = new FormData();
  body.append('file', file);
  const res = await fetch('/api/ai/upload_cloudinary', { method: 'POST', body });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
