// src/server.ts
// Server-only helpers for Toss Payments Core API

const API_BASE = "https://api.tosspayments.com";

type PositiveInt = number;

export type ConfirmPayload = {
  paymentKey: string;
  orderId: string;
  amount: PositiveInt;
};

export type CancelPayload = {
  paymentKey: string;
  cancelReason: string;
  cancelAmount?: PositiveInt;
  currency?: "KRW" | "USD";
  refundReceiveAccount?: {
    bank: string;
    accountNumber: string;
    holderName: string;
  };
  taxFreeAmount?: PositiveInt;
};

export type BillingChargePayload = {
  billingKey: string;
  customerKey: string;
  orderId: string;
  orderName: string;
  amount: PositiveInt;
  currency?: "KRW";
  customerEmail?: string;
  customerName?: string;
  taxFreeAmount?: PositiveInt;
  idempotencyKey?: string;
};

export type TossPaymentObject = Record<string, any>;

function authHeader(secretKey: string) {
  const base64 = Buffer.from(`${secretKey}:`).toString("base64");
  return `Basic ${base64}`;
}

export class TossServer {
  private secretKey: string;

  constructor(secretKey: string) {
    if (!secretKey) {
      throw new Error("TossServer requires a secretKey");
    }
    this.secretKey = secretKey;
  }

  private async tossFetch<T>(
    path: string,
    opts: RequestInit & { idempotencyKey?: string } = {}
  ): Promise<T> {
    const headers: Record<string, string> = {
      Authorization: authHeader(this.secretKey),
      "Content-Type": "application/json",
      ...(opts.headers as Record<string, string>),
    };

    if (opts.idempotencyKey) {
      headers["Idempotency-Key"] = opts.idempotencyKey;
    }

    const res = await fetch(`${API_BASE}${path}`, {
      ...opts,
      headers,
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Toss API ${path} failed: ${res.status} ${text}`);
    }
    return (await res.json()) as T;
  }

  /** 결제 승인(Confirm) */
  confirmPayment(body: ConfirmPayload) {
    return this.tossFetch<TossPaymentObject>("/v1/payments/confirm", {
      method: "POST",
      body: JSON.stringify(body),
    });
  }

  /** 결제 조회 */
  retrievePayment(paymentKey: string) {
    return this.tossFetch<TossPaymentObject>(`/v1/payments/${paymentKey}`, {
      method: "GET",
    });
  }

  /** 결제 취소(부분/전체) */
  cancelPayment(payload: CancelPayload) {
    const { paymentKey, ...rest } = payload;
    return this.tossFetch<TossPaymentObject>(
      `/v1/payments/${paymentKey}/cancel`,
      {
        method: "POST",
        body: JSON.stringify(rest),
        idempotencyKey: `cancel-${paymentKey}-${rest?.cancelAmount ?? "full"}`,
      }
    );
  }

  /** 빌링키로 결제 승인 (정기결제 청구) */
  chargeWithBillingKey(payload: BillingChargePayload) {
    const { idempotencyKey, ...body } = payload;
    return this.tossFetch<TossPaymentObject>("/v1/billing/authorizations", {
      method: "POST",
      body: JSON.stringify(body),
      idempotencyKey: idempotencyKey ?? `billing-${body.customerKey}-${body.orderId}`,
    });
  }

  /** 유틸 */
  static toNumber(value: string | string[] | null | undefined) {
    const n = Number(Array.isArray(value) ? value[0] : value);
    if (!Number.isFinite(n)) throw new Error("Invalid number");
    return n;
  }
}
