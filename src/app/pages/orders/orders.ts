import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { ApiService } from '../../core/api.service';
import { describeError } from '../../core/errors';
import { Order, OrderStatus } from '../../core/models';
import { StatusBadge } from '../../core/status-badge';

@Component({
  selector: 'app-orders',
  imports: [RouterLink, FormsModule, CurrencyPipe, DatePipe, StatusBadge],
  templateUrl: './orders.html',
})
export class Orders {
  private readonly api = inject(ApiService);

  protected readonly statuses: OrderStatus[] = ['PAID', 'PAYMENT_FAILED', 'PAYMENT_PENDING', 'CREATED', 'REFUNDED'];
  protected readonly orders = signal<Order[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly query = signal('');
  protected readonly status = signal<OrderStatus | ''>('');

  protected readonly filtered = computed(() => {
    const q = this.query().trim().toLowerCase();
    const status = this.status();
    return this.orders()
      .filter((o) => !status || o.status === status)
      .filter((o) => !q || [o.id, o.item, o.customerEmail].some((v) => v.toLowerCase().includes(q)))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  });

  constructor() {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
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
