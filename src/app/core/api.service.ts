import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { CreateOrderRequest, Health, Notification, Order, Payment } from './models';

/**
 * Talks to the api-gateway only. Paths are relative: in development `ng serve` proxies them to the
 * gateway (proxy.conf.json), and in the container nginx proxies them (nginx/default.conf.template).
 */
@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);

  health(): Observable<Health> {
    return this.http.get<Health>('/actuator/health');
  }

  listOrders(): Observable<Order[]> {
    return this.http.get<Order[]>('/api/orders');
  }

  getOrder(id: string): Observable<Order> {
    return this.http.get<Order>(`/api/orders/${encodeURIComponent(id)}`);
  }

  /** Creates the order; order-service charges it through payment-service in the same call. */
  placeOrder(request: CreateOrderRequest): Observable<Order> {
    return this.http.post<Order>('/api/orders', request);
  }

  getPayment(id: string): Observable<Payment> {
    return this.http.get<Payment>(`/api/payments/${encodeURIComponent(id)}`);
  }

  paymentsForOrder(orderId: string): Observable<Payment[]> {
    return this.http.get<Payment[]>('/api/payments', { params: { orderId } });
  }

  refund(paymentId: string): Observable<Payment> {
    return this.http.post<Payment>(`/api/payments/${encodeURIComponent(paymentId)}/refund`, null);
  }

  notifications(): Observable<Notification[]> {
    return this.http.get<Notification[]>('/api/notifications');
  }
}
