// Shared error serializer for generation runs. AI SDK structured-output errors
// (AI_NoObjectGeneratedError) carry the raw model output in `text` and the validation
// failure in a chain of `cause`s; capture both so a failed run records exactly which
// schema field/length the model violated.
export function serializeGenerationError(err: unknown): Record<string, unknown> {
  if (!(err instanceof Error)) return { message: String(err) };
  const e = err as Error & Record<string, unknown>;
  const out: Record<string, unknown> = {
    name: e.name,
    message: e.message,
    stack: e.stack,
  };
  if (typeof e.text === 'string') out.text = e.text.slice(0, 4000);

  const causes: unknown[] = [];
  let cause: unknown = e.cause;
  for (let i = 0; i < 3 && cause != null; i += 1) {
    if (cause instanceof Error) {
      const c = cause as Error & Record<string, unknown>;
      causes.push({
        name: c.name,
        message: typeof c.message === 'string' ? c.message.slice(0, 2000) : undefined,
        value: c.value !== undefined ? JSON.stringify(c.value).slice(0, 4000) : undefined,
      });
      cause = c.cause;
    } else {
      causes.push({ value: JSON.stringify(cause).slice(0, 2000) });
      cause = undefined;
    }
  }
  if (causes.length) out.causes = causes;
  return out;
}
