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

    // SDK에 전달할 payload를 안전하게 구성 (메서드별 옵션만 첨부)
    const base = {
      method: params.method,
      amount: params.amount,
      orderId: params.orderId,
      orderName: params.orderName,
      successUrl: params.successUrl,
      failUrl: params.failUrl,
      customerEmail: params.customerEmail,
      customerName: params.customerName,
    };

    const payload =
      params.method === "CARD"
        ? { ...base, card: params.card }
        : params.method === "TRANSFER"
        ? { ...base, transfer: params.transfer }
        : params.method === "VIRTUAL_ACCOUNT"
        ? { ...base, virtualAccount: params.virtualAccount }
        : params.method === "FOREIGN_EASY_PAY"
        ? { ...base, foreignEasyPay: params.foreignEasyPay }
        : // MOBILE_PHONE / (CULTURE|BOOK|GAME)_GIFT_CERTIFICATE 는 추가 옵션 없음
          base;

    // SDK 내부 타입 의존하지 않고 안전하게 전달
    return (this.payment as any).requestPayment(payload);
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