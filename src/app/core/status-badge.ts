import { Component, computed, input } from '@angular/core';

const TONES: Record<string, string> = {
  PAID: 'ok',
  CAPTURED: 'ok',
  AUTHORIZED: 'info',
  CREATED: 'info',
  PENDING: 'warn',
  PAYMENT_PENDING: 'warn',
  REFUNDED: 'muted',
  FAILED: 'bad',
  PAYMENT_FAILED: 'bad',
  UP: 'ok',
  DOWN: 'bad',
};

@Component({
  selector: 'app-status-badge',
  template: `<span class="badge" [class]="'badge badge-' + tone()">{{ label() }}</span>`,
})
export class StatusBadge {
  readonly status = input.required<string>();
  protected readonly tone = computed(() => TONES[this.status()] ?? 'muted');
  protected readonly label = computed(() => this.status().replace(/_/g, ' ').toLowerCase());
}
