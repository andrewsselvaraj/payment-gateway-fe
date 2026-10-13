import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { ApiService } from './api.service';
import { CORRELATION_HEADER, correlationIdInterceptor } from './correlation-id.interceptor';

describe('ApiService', () => {
  let api: ApiService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(withInterceptors([correlationIdInterceptor])), provideHttpClientTesting()],
    });
    api = TestBed.inject(ApiService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('places an order through the gateway with a correlation id', () => {
    const request = {
      customerEmail: 'a@b.com',
      item: 'Book',
      amount: 12.5,
      currency: 'USD',
      card: { cardNumber: '4242424242424242', expiry: '12/30', cvv: '123' },
    };
    api.placeOrder(request).subscribe();
    const req = http.expectOne('/api/orders');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(request);
    expect(req.request.headers.get(CORRELATION_HEADER)).toBeTruthy();
    req.flush({});
  });

  it('looks up payments by order id', () => {
    api.paymentsForOrder('o-1').subscribe();
    const req = http.expectOne((r) => r.url === '/api/payments');
    expect(req.request.params.get('orderId')).toBe('o-1');
    req.flush([]);
  });

  it('refunds a payment', () => {
    api.refund('p-1').subscribe();
    const req = http.expectOne('/api/payments/p-1/refund');
    expect(req.request.method).toBe('POST');
    req.flush({});
  });
});
