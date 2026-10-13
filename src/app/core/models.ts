// Shapes returned by the backend services, as routed through the api-gateway.

export type OrderStatus = 'CREATED' | 'PAID' | 'PAYMENT_FAILED' | 'PAYMENT_PENDING' | 'REFUNDED';
export type PaymentStatus = 'PENDING' | 'AUTHORIZED' | 'CAPTURED' | 'FAILED' | 'REFUNDED';

export interface CardDetails {
  cardNumber: string;
  expiry: string;
  cvv: string;
}

export interface CreateOrderRequest {
  customerEmail: string;
  item: string;
  amount: number;
  currency: string;
  card: CardDetails;
}

export interface Order {
  id: string;
  customerEmail: string;
  item: string;
  amount: number;
  currency: string;
  status: OrderStatus;
  paymentId: string | null;
  paymentFailureReason: string | null;
  createdAt: string;
}

export interface Payment {
  id: string;
  orderId: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  provider: string;
  providerReference: string | null;
  maskedCard: string | null;
  failureReason: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Notification {
  type: string;
  recipient: string;
  message: string;
  referenceId: string | null;
  receivedAt: string;
}

export interface Health {
  status: string;
}
