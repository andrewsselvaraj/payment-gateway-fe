import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, effect, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { ApiService } from '../../core/api.service';
import { describeError } from '../../core/errors';
import { Order, Payment } from '../../core/models';
import { StatusBadge } from '../../core/status-badge';

@Component({
  selector: 'app-order-detail',
  imports: [RouterLink, CurrencyPipe, DatePipe, StatusBadge],
  templateUrl: './order-detail.html',
})
export class OrderDetail {
  private readonly api = inject(ApiService);

  /** Bound from the :id route parameter. */
  readonly id = input.required<string>();

  protected readonly order = signal<Order | null>(null);
  protected readonly payments = signal<Payment[]>([]);
  protected readonly error = signal<string | null>(null);
  protected readonly refunding = signal<string | null>(null);

  constructor() {
    effect(() => this.load(this.id()));
  }

  private load(id: string): void {
    this.error.set(null);
    this.api.getOrder(id).subscribe({
      next: (order) => this.order.set(order),
      error: (err) => this.error.set(describeError(err)),
    });
    this.loadPayments(id);
  }

  private loadPayments(orderId: string): void {
    this.api.paymentsForOrder(orderId).subscribe({
      next: (payments) => this.payments.set(payments),
      error: (err) => this.error.set(describeError(err)),
    });
  }

  refund(payment: Payment): void {
    if (!confirm(`Refund ${payment.amount} ${payment.currency} to ${payment.maskedCard ?? 'the card'}?`)) {
      return;
    }
    this.refunding.set(payment.id);
    this.error.set(null);
    this.api.refund(payment.id).subscribe({
      next: (updated) => {
        this.payments.update((list) => list.map((p) => (p.id === updated.id ? updated : p)));
        this.refunding.set(null);
      },
      error: (err) => {
        this.error.set(describeError(err));
        this.refunding.set(null);
      },
    });
  }
}
