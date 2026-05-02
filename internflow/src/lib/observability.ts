type EventPayload = Record<string, unknown>;

export function captureServerError(error: unknown, context: EventPayload = {}) {
  console.error("[internflow:error]", {
    ...context,
    error: error instanceof Error ? error.message : String(error),
  });
}

export function captureServerEvent(message: string, payload: EventPayload = {}) {
  console.info("[internflow:event]", {
    message,
    ...payload,
  });
}
