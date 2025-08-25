// src/client.ts
// Browser-only wrapper around @tosspayments/tosspayments-sdk
import { loadTossPayments, ANONYMOUS } from "@tosspayments/tosspayments-sdk";
import type { InitParams, RequestPaymentParams } from "./types";

let _singleton: TossPaymentsAPI | null = null;

export class TossPaymentsAPI {
  private payment: any;

  private constructor(payment: any) {
    this.payment = payment;
  }

  static async init({ clientKey, customerKey }: InitParams) {
    if (typeof window === "undefined") {
      throw new Error("TossPaymentsAPI can only be initialized in the browser.");
    }
    if (_singleton) return _singleton;

    const tp = await loadTossPayments(clientKey);
    const payment =
      customerKey === "ANONYMOUS"
        ? tp.payment({ customerKey: ANONYMOUS })
        : tp.payment({ customerKey: customerKey ?? generateRandomString() });

    _singleton = new TossPaymentsAPI(payment);
    return _singleton;
  }

  async requestPayment(params: RequestPaymentParams) {
    // 공통 유효성
    if (!params?.method) throw new Error("method is required");
    if (!params?.amount || typeof params.amount.value !== "number") {
      throw new Error("amount is required");
    }
    if (!params.orderId) throw new Error("orderId is required");
    if (!params.orderName) throw new Error("orderName is required");
    if (!params.successUrl || !params.failUrl) {
      throw new Error("successUrl/failUrl are required");
    }
    if (params.method === "FOREIGN_EASY_PAY" && params.amount.currency !== "USD") {
      throw new Error("FOREIGN_EASY_PAY requires amount.currency = 'USD'");
    }

  return this.payment.requestPayment(params as unknown as PaymentOptions);
  }

  async requestBillingAuth(opts: {
    successUrl: string;
    failUrl: string;
    customerEmail?: string;
    customerName?: string;
  }) {
    if (!opts.successUrl || !opts.failUrl) {
      throw new Error("successUrl/failUrl are required");
    }
    return this.payment.requestBillingAuth({
      method: "CARD",
      ...opts,
    });
  }
}

// demo util (prod에서는 서버 생성 ID 권장)
export function generateRandomString(): string {
  return window.btoa(Math.random().toString()).slice(0, 20);
}

export type { InitParams, RequestPaymentParams } from "./types";