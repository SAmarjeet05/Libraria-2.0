export async function queryNotesAI(text: string, actorType?: 'user' | 'admin', actorId?: string) {
  const payload: any = { text };
  if (actorType) payload.actor_type = actorType;
  if (actorId) payload.actor_id = actorId;

  const res = await fetch('/api/notes/ai/query', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const txt = await res.text();
    try {
      const j = JSON.parse(txt || '{}');
      const msg = (j as any).detail ?? (j.message ?? JSON.stringify(j));
      throw new Error(typeof msg === 'string' ? msg : JSON.stringify(msg));
    } catch (e) {
      throw new Error(txt || 'Notes AI query failed');
    }
  }
  return res.json();
}

export async function summarizeNote(noteId: number) {
  const res = await fetch(`/api/notes/ai/summarize?note_id=${noteId}`, { method: 'POST' });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function notesLogEvent(actionType: string, query?: string, metadata?: any, actorType?: 'user' | 'admin', actorId?: string) {
  const payload: any = { action_type: actionType, query, metadata };
  if (actorType) payload.actor_type = actorType;
  if (actorId) payload.actor_id = actorId;
  const res = await fetch('/api/notes/ai/log', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function notesWelcome() {
  const res = await fetch('/api/notes/ai/welcome');
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export default { queryNotesAI, summarizeNote, notesLogEvent, notesWelcome };
