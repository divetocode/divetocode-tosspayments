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

/** ---- 내부 유틸 ---- **/

function authHeader(secretKey: string) {
  const base64 = Buffer.from(`${secretKey}:`).toString("base64");
  return `Basic ${base64}`;
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function shouldRetry(status: number) {
  // 5xx, 429는 재시도
  return status >= 500 || status === 429;
}

async function withTimeout<T>(p: Promise<T>, ms = 10000): Promise<T> {
  return await Promise.race([
    p,
    new Promise<T>((_, rej) => setTimeout(() => rej(new Error("Timeout")), ms)),
  ]);
}

export class TossServer {
  private secretKey: string;
  private defaultTimeoutMs: number;
  private maxRetries: number;

  constructor(secretKey: string, opts?: { timeoutMs?: number; retries?: number }) {
    if (!secretKey) {
      throw new Error("TossServer requires a secretKey");
    }
    this.secretKey = secretKey;
    this.defaultTimeoutMs = opts?.timeoutMs ?? 10000; // 10s
    this.maxRetries = opts?.retries ?? 2; // 총 3회(초기 1 + 재시도 2)
  }

  private async tossFetch<T>(
    path: string,
    opts: RequestInit & { idempotencyKey?: string; timeoutMs?: number } = {}
  ): Promise<T> {
    const headers: Record<string, string> = {
      Authorization: authHeader(this.secretKey),
      "Content-Type": "application/json",
      ...(opts.headers as Record<string, string>),
    };

    if (opts.idempotencyKey) {
      headers["Idempotency-Key"] = opts.idempotencyKey;
    }

    const timeoutMs = opts.timeoutMs ?? this.defaultTimeoutMs;

    // 재시도 루프(지수 백오프: 300ms, 600ms, 1200ms ...)
    let attempt = 0;
    let lastError: unknown;

    while (attempt <= this.maxRetries) {
      try {
        const res = await withTimeout(
          fetch(`${API_BASE}${path}`, {
            ...opts,
            headers,
          }),
          timeoutMs
        );

        if (!res.ok) {
          const text = await res.text();
          if (shouldRetry(res.status) && attempt < this.maxRetries) {
            attempt++;
            await sleep(300 * Math.pow(2, attempt - 1));
            continue;
          }
          throw new Error(`Toss API ${path} failed: ${res.status} ${text}`);
        }

        return (await res.json()) as T;
      } catch (err: any) {
        // 네트워크/타임아웃 오류 재시도
        lastError = err;
        const retriable =
          err?.message === "Timeout" ||
          err?.name === "FetchError" ||
          err?.code === "ECONNRESET" ||
          err?.code === "ETIMEDOUT";

        if (retriable && attempt < this.maxRetries) {
          attempt++;
          await sleep(300 * Math.pow(2, attempt - 1));
          continue;
        }
        throw err;
      }
    }

    // 여기 오면 모든 재시도 실패
    throw lastError ?? new Error("Unknown error");
  }

  /** 결제 승인(Confirm) — Idempotency-Key 권장 */
  confirmPayment(body: ConfirmPayload) {
    return this.tossFetch<TossPaymentObject>("/v1/payments/confirm", {
      method: "POST",
      body: JSON.stringify(body),
      idempotencyKey: `confirm-${body.paymentKey}-${body.orderId}-${body.amount}`,
    });
  }

  /** 결제 조회 */
  retrievePayment(paymentKey: string) {
    return this.tossFetch<TossPaymentObject>(`/v1/payments/${paymentKey}`, {
      method: "GET",
    });
  }

  /** 결제 취소(부분/전체) — Idempotency-Key 적용 */
  cancelPayment(payload: CancelPayload) {
    const { paymentKey, ...rest } = payload;
    return this.tossFetch<TossPaymentObject>(`/v1/payments/${paymentKey}/cancel`, {
      method: "POST",
      body: JSON.stringify(rest),
      idempotencyKey: `cancel-${paymentKey}-${rest?.cancelAmount ?? "full"}`,
    });
  }

  /** 빌링키로 결제 승인 (정기결제 청구) — Idempotency-Key 적용 */
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