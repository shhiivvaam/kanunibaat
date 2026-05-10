/**
 * In-memory pub/sub so SSE subscribers receive pushes when consultation chat mutations run.
 */
export function createConsultationChatFanout() {
  /** consultationId -> listeners */
  const listeners = new Map<string, Set<() => void>>();

  function emit(consultationId: string) {
    const set = listeners.get(consultationId);
    if (!set) return;
    for (const fn of set) {
      try {
        fn();
      } catch {
        // ignore subscriber errors
      }
    }
  }

  function subscribe(consultationId: string, onEvent: () => void): () => void {
    let set = listeners.get(consultationId);
    if (!set) {
      set = new Set();
      listeners.set(consultationId, set);
    }
    set.add(onEvent);
    return () => {
      const s = listeners.get(consultationId);
      if (!s) return;
      s.delete(onEvent);
      if (s.size === 0) listeners.delete(consultationId);
    };
  }

  return { emit, subscribe };
}

export type ConsultationChatFanout = ReturnType<
  typeof createConsultationChatFanout
>;
