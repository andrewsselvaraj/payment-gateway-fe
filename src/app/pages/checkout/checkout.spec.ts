import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { Checkout } from './checkout';

describe('Checkout', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [Checkout],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    });
  });

  it('does not call the API while the form is invalid', () => {
    const fixture = TestBed.createComponent(Checkout);
    fixture.componentInstance.submit();
    TestBed.inject(HttpTestingController).expectNone('/api/orders');
  });

  it('sends a normalised order and shows the result', async () => {
    const fixture = TestBed.createComponent(Checkout);
    const component = fixture.componentInstance;
    const form = (component as unknown as { form: Checkout['form'] }).form;
    form.patchValue({ customerEmail: 'jane@example.com', item: 'Plan', amount: 9.999, currency: 'eur' });
    component.useTestCard('4242 4242 4242 4242');
    component.submit();

    const req = TestBed.inject(HttpTestingController).expectOne('/api/orders');
    expect(req.request.body).toEqual({
      customerEmail: 'jane@example.com',
      item: 'Plan',
      amount: 10,
      currency: 'EUR',
      card: { cardNumber: '4242424242424242', expiry: '12/30', cvv: '123' },
    });
    req.flush({ id: 'o-1', status: 'PAID', paymentFailureReason: null });
    await fixture.whenStable();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Payment captured');
  });
});
