// src/types.ts
export type KRW = "KRW";
export type USD = "USD";
export type Currency = KRW | USD;

export type PaymentMethod =
  | "CARD"
  | "TRANSFER"
  | "VIRTUAL_ACCOUNT"
  | "MOBILE_PHONE"
  | "CULTURE_GIFT_CERTIFICATE"
  | "BOOK_GIFT_CERTIFICATE"
  | "GAME_GIFT_CERTIFICATE"
  | "FOREIGN_EASY_PAY";

export type Amount<C extends Currency = Currency> = {
  value: number;
  currency: C;
};

export interface CommonReq<C extends Currency = Currency> {
  amount: Amount<C>;
  orderId: string;
  orderName: string;
  successUrl: string;
  failUrl: string;
  customerEmail?: string;
  customerName?: string;
  // customerMobilePhone?: string;
}

export type CardOptions = {
  card?: {
    useEscrow?: boolean;
    flowMode?: "DEFAULT" | "DIRECT";
    useCardPoint?: boolean;
    useAppCardOnly?: boolean;
  };
};

export type TransferOptions = {
  transfer?: {
    cashReceipt?: { type: "소득공제" | "지출증빙" };
    useEscrow?: boolean;
  };
};

export type VirtualAccountOptions = {
  virtualAccount?: {
    cashReceipt?: { type: "소득공제" | "지출증빙" };
    useEscrow?: boolean;
    validHours?: number;
  };
};

export type ForeignEasyPayOptions = {
  foreignEasyPay?: {
    provider:
      | "PAYPAL"
      | "ALIPAY"
      | "ALIPAYHK"
      | "BILLEASE"
      | "BOOST"
      | "BPI"
      | "DANA"
      | "GCASH"
      | "RABBIT_LINE_PAY"
      | "TOUCHNGO"
      | "TRUEMONEY";
    country?: string;   // ISO 3166-1 alpha-2 e.g. "KR"
    pendingUrl?: string;
  };
};

// 판별 유니온
export type RequestPaymentParams =
  | ({ method: "CARD" } & CommonReq<"KRW"> & CardOptions)
  | ({ method: "TRANSFER" } & CommonReq<"KRW"> & TransferOptions)
  | ({ method: "VIRTUAL_ACCOUNT" } & CommonReq<"KRW"> & VirtualAccountOptions)
  | ({ method: "MOBILE_PHONE" } & CommonReq<"KRW">)
  | ({ method: "CULTURE_GIFT_CERTIFICATE" } & CommonReq<"KRW">)
  | ({ method: "BOOK_GIFT_CERTIFICATE" } & CommonReq<"KRW">)
  | ({ method: "GAME_GIFT_CERTIFICATE" } & CommonReq<"KRW">)
  | ({ method: "FOREIGN_EASY_PAY" } & CommonReq<"USD"> & ForeignEasyPayOptions);

export interface InitParams {
  clientKey: string;
  customerKey?: string | "ANONYMOUS";
}