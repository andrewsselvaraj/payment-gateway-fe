import { HttpErrorResponse } from '@angular/common/http';

import { CORRELATION_HEADER } from './correlation-id.interceptor';

/** Turns an HTTP failure (Spring ProblemDetail or validation error) into one readable line. */
export function describeError(err: unknown): string {
  if (!(err instanceof HttpErrorResponse)) {
    return 'Unexpected error.';
  }
  if (err.status === 0) {
    return 'Cannot reach the API gateway.';
  }
  const body = err.error as { detail?: string; title?: string; message?: string } | null;
  const detail = body?.detail ?? body?.message ?? body?.title ?? err.statusText;
  const correlationId = err.headers?.get(CORRELATION_HEADER);
  return `${err.status} ${detail}` + (correlationId ? ` (ref ${correlationId})` : '');
}
