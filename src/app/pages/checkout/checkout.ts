import { Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { ApiService } from '../../core/api.service';
import { describeError } from '../../core/errors';
import { Order } from '../../core/models';
import { StatusBadge } from '../../core/status-badge';

/** Test cards understood by payment-service's mock provider. */
export const TEST_CARDS = [
  { label: 'Succeeds', number: '4242 4242 4242 4242' },
  { label: 'Declined', number: '4000 0000 0000 0002' },
  { label: 'Insufficient funds', number: '4000 0000 0000 9995' },
];

@Component({
  selector: 'app-checkout',
  imports: [ReactiveFormsModule, RouterLink, StatusBadge],
  templateUrl: './checkout.html',
})
export class Checkout {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);
  private readonly fb = inject(NonNullableFormBuilder);

  protected readonly testCards = TEST_CARDS;
  protected readonly submitting = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly result = signal<Order | null>(null);

  // Validation mirrors CreateOrderRequest (order-service) and PaymentRequest (payment-service).
  protected readonly form = this.fb.group({
    customerEmail: ['', [Validators.required, Validators.email]],
    item: ['', Validators.required],
    amount: [10, [Validators.required, Validators.min(0.01)]],
    currency: ['USD', [Validators.required, Validators.pattern(/^[A-Za-z]{3}$/)]],
    card: this.fb.group({
      cardNumber: ['', [Validators.required, Validators.pattern(/^[0-9 ]{12,23}$/)]],
      expiry: ['', [Validators.required, Validators.pattern(/^(0[1-9]|1[0-2])\/[0-9]{2}$/)]],
      cvv: ['', [Validators.required, Validators.pattern(/^[0-9]{3,4}$/)]],
    }),
  });

  useTestCard(number: string): void {
    this.form.controls.card.patchValue({ cardNumber: number, expiry: '12/30', cvv: '123' });
  }

  invalid(path: string): boolean {
    const control = this.form.get(path);
    return !!control && control.invalid && (control.touched || control.dirty);
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    this.submitting.set(true);
    this.error.set(null);
    this.result.set(null);
    this.api
      .placeOrder({
        ...value,
        amount: Math.round(value.amount * 100) / 100,
        currency: value.currency.toUpperCase(),
        card: { ...value.card, cardNumber: value.card.cardNumber.replace(/\s+/g, '') },
      })
      .subscribe({
        next: (order) => {
          this.result.set(order);
          this.submitting.set(false);
          this.form.controls.card.reset();
        },
        error: (err) => {
          this.error.set(describeError(err));
          this.submitting.set(false);
        },
      });
  }

  viewOrder(order: Order): void {
    this.router.navigate(['/orders', order.id]);
  }
}
