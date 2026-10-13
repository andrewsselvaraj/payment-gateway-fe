import { Component, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { ApiService } from './core/api.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.html',
})
export class App {
  private readonly api = inject(ApiService);
  protected readonly gatewayUp = signal<boolean | null>(null);

  constructor() {
    this.api.health().subscribe({
      next: (h) => this.gatewayUp.set(h.status === 'UP'),
      error: () => this.gatewayUp.set(false),
    });
  }
}
