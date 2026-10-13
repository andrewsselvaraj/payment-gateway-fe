import { DatePipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { ApiService } from '../../core/api.service';
import { describeError } from '../../core/errors';
import { Notification } from '../../core/models';

@Component({
  selector: 'app-notifications',
  imports: [DatePipe, RouterLink],
  templateUrl: './notifications.html',
})
export class Notifications {
  private readonly api = inject(ApiService);

  protected readonly items = signal<Notification[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);

  constructor() {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.api.notifications().subscribe({
      next: (items) => {
        this.items.set([...items].sort((a, b) => (b.receivedAt ?? '').localeCompare(a.receivedAt ?? '')));
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(describeError(err));
        this.loading.set(false);
      },
    });
  }
}
