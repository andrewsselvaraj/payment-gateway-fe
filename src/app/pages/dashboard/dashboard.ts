import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { ApiService } from '../../core/api.service';
import { describeError } from '../../core/errors';
import { Order } from '../../core/models';
import { StatusBadge } from '../../core/status-badge';

@Component({
  selector: 'app-dashboard',
  imports: [RouterLink, CurrencyPipe, DatePipe, StatusBadge],
  templateUrl: './dashboard.html',
})
export class Dashboard {
  private readonly api = inject(ApiService);

  protected readonly orders = signal<Order[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);

  protected readonly paid = computed(() => this.orders().filter((o) => o.status === 'PAID'));
  protected readonly failed = computed(() => this.orders().filter((o) => o.status === 'PAYMENT_FAILED'));
  protected readonly pending = computed(() => this.orders().filter((o) => o.status === 'PAYMENT_PENDING'));
  /** Paid volume per currency, since orders can be in different currencies. */
  protected readonly volume = computed(() => {
    const totals = new Map<string, number>();
    for (const o of this.paid()) {
      totals.set(o.currency, (totals.get(o.currency) ?? 0) + Number(o.amount));
    }
    return [...totals.entries()].map(([currency, amount]) => ({ currency, amount }));
  });
  protected readonly recent = computed(() =>
    [...this.orders()].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 5),
  );

  constructor() {
    this.api.listOrders().subscribe({
      next: (orders) => {
        this.orders.set(orders);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(describeError(err));
        this.loading.set(false);
      },
    });
  }
}
