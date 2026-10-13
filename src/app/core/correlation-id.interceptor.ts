import { HttpInterceptorFn } from '@angular/common/http';

export const CORRELATION_HEADER = 'X-Correlation-Id';

/** Tags every request so a failure shown in the UI can be traced through the gateway and service logs. */
export const correlationIdInterceptor: HttpInterceptorFn = (req, next) =>
  next(req.headers.has(CORRELATION_HEADER) ? req : req.clone({ setHeaders: { [CORRELATION_HEADER]: crypto.randomUUID() } }));
