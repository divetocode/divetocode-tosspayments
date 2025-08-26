# @divetocode/tosspayments

[![npm version](https://img.shields.io/npm/v/@divetocode/tosspayments.svg)](https://www.npmjs.com/package/@divetocode/tosspayments)
[![license](https://img.shields.io/npm/l/@divetocode/tosspayments.svg)](https://github.com/divetocode/divetocode-tosspayments/blob/main/LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

**React, Next.js, Node.js를 위한 토스페이먼츠 TypeScript 래퍼**

토스페이먼츠 SDK를 더 쉽고 안전하게 사용할 수 있도록 설계된 TypeScript 우선 라이브러리입니다.

## ✨ 특징

- 🔒 **완전한 타입 안전성**: TypeScript로 작성된 end-to-end 타입 지원
- 🌐 **클라이언트/서버 분리**: 브라우저용 클라이언트와 Node.js 서버 API 별도 제공
- ⚛️ **React/Next.js 최적화**: React 18+ 및 Next.js 환경에서 완벽 호환
- 🔄 **스마트 재시도**: 네트워크 오류 시 지수 백오프를 통한 자동 재시도
- 🛡️ **Idempotency 지원**: 중요한 API 호출에 대한 자동 중복 방지
- 📦 **ESM/CJS 듀얼 지원**: 모던 프로젝트와 레거시 프로젝트 모두 지원
- ⚡ **트리 셰이킹**: 필요한 부분만 번들에 포함

## 📋 시스템 요구사항

- **Node.js**: 18.0.0 이상
- **React**: 18.0.0 이상 (클라이언트 사용 시)
- **TypeScript**: 5.0.0 이상 권장

## 📦 설치

```bash
# npm
npm install @divetocode/tosspayments

# yarn
yarn add @divetocode/tosspayments

# pnpm
pnpm add @divetocode/tosspayments
```

## 🚀 빠른 시작

### 모듈 가져오기

```typescript
// 전체 패키지
import { TossPaymentsAPI, TossServer } from '@divetocode/tosspayments';

// 클라이언트만 (번들 사이즈 최적화)
import { TossPaymentsAPI } from '@divetocode/tosspayments/client';

// 서버만
import { TossServer } from '@divetocode/tosspayments/server';

// 타입만
import type { RequestPaymentParams } from '@divetocode/tosspayments/types';
```

## 🖥️ 클라이언트 사용법 (브라우저)

### 기본 설정

```typescript
import { TossPaymentsAPI } from '@divetocode/tosspayments/client';

// 익명 사용자
const toss = await TossPaymentsAPI.init({
  clientKey: 'test_ck_D5GePWvyJnrK0W0k6q8gLzN97Eoqo9O',
  customerKey: 'ANONYMOUS'
});

// 회원 사용자
const toss = await TossPaymentsAPI.init({
  clientKey: 'test_ck_D5GePWvyJnrK0W0k6q8gLzN97Eoqo9O',
  customerKey: 'customer_123'
});
```

### React 컴포넌트 예제

```tsx
import React from 'react';
import { TossPaymentsAPI, generateRandomString } from '@divetocode/tosspayments/client';

export default function PaymentButton() {
  const handlePayment = async () => {
    try {
      const toss = await TossPaymentsAPI.init({
        clientKey: process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY!,
        customerKey: 'ANONYMOUS'
      });

      await toss.requestPayment({
        method: 'CARD',
        amount: {
          value: 15000,
          currency: 'KRW'
        },
        orderId: generateRandomString(),
        orderName: '토스 티셔츠',
        successUrl: `${window.location.origin}/payment/success`,
        failUrl: `${window.location.origin}/payment/fail`,
        customerEmail: 'customer@example.com',
        customerName: '김토스'
      });
    } catch (error) {
      console.error('결제 실패:', error);
    }
  };

  return (
    <button onClick={handlePayment}>
      결제하기
    </button>
  );
}
```

### 카드 결제

```typescript
await toss.requestPayment({
  method: 'CARD',
  amount: {
    value: 15000,
    currency: 'KRW'
  },
  orderId: 'order_123',
  orderName: '토스 티셔츠',
  successUrl: 'https://mysite.com/success',
  failUrl: 'https://mysite.com/fail',
  customerEmail: 'customer@example.com',
  customerName: '김토스',
  card: {
    useEscrow: false,
    flowMode: 'DEFAULT',
    useCardPoint: true,
    useAppCardOnly: false
  }
});
```

### 계좌이체

```typescript
await toss.requestPayment({
  method: 'TRANSFER',
  amount: {
    value: 50000,
    currency: 'KRW'
  },
  orderId: 'order_456',
  orderName: '온라인 강의',
  successUrl: 'https://mysite.com/success',
  failUrl: 'https://mysite.com/fail',
  transfer: {
    cashReceipt: { type: '소득공제' },
    useEscrow: true
  }
});
```

### 가상계좌

```typescript
await toss.requestPayment({
  method: 'VIRTUAL_ACCOUNT',
  amount: {
    value: 100000,
    currency: 'KRW'
  },
  orderId: 'order_789',
  orderName: '도서 구매',
  successUrl: 'https://mysite.com/success',
  failUrl: 'https://mysite.com/fail',
  virtualAccount: {
    cashReceipt: { type: '지출증빙' },
    validHours: 24,
    useEscrow: false
  }
});
```

### 해외 간편결제 (USD)

```typescript
await toss.requestPayment({
  method: 'FOREIGN_EASY_PAY',
  amount: {
    value: 50,
    currency: 'USD'  // USD 필수
  },
  orderId: 'order_usd_123',
  orderName: 'Global Product',
  successUrl: 'https://mysite.com/success',
  failUrl: 'https://mysite.com/fail',
  foreignEasyPay: {
    provider: 'PAYPAL',
    country: 'US',  // ISO 3166-1 alpha-2
    pendingUrl: 'https://mysite.com/pending'
  }
});
```

### 정기결제 빌링키 발급

```typescript
await toss.requestBillingAuth({
  successUrl: 'https://mysite.com/billing-success',
  failUrl: 'https://mysite.com/billing-fail',
  customerEmail: 'customer@example.com',
  customerName: '김토스'
});
```

## 🖧 서버 사용법 (Node.js)

### 기본 설정

```typescript
import { TossServer } from '@divetocode/tosspayments/server';

const toss = new TossServer(process.env.TOSS_SECRET_KEY!, {
  timeoutMs: 15000,  // 15초 타임아웃 (기본값: 10초)
  retries: 3         // 재시도 횟수 (기본값: 2)
});
```

### Next.js API 라우트 예제

```typescript
// app/api/payments/confirm/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { TossServer } from '@divetocode/tosspayments/server';

const toss = new TossServer(process.env.TOSS_SECRET_KEY!);

export async function POST(request: NextRequest) {
  try {
    const { paymentKey, orderId, amount } = await request.json();

    const result = await toss.confirmPayment({
      paymentKey,
      orderId,
      amount: TossServer.toNumber(amount)
    });

    return NextResponse.json({ success: true, payment: result });
  } catch (error: any) {
    console.error('결제 승인 실패:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 400 }
    );
  }
}
```

### 결제 승인

```typescript
try {
  const result = await toss.confirmPayment({
    paymentKey: 'payment_key_from_success_callback',
    orderId: 'order_123',
    amount: 15000
  });
  
  console.log('결제 승인 성공:', result);
} catch (error) {
  console.error('결제 승인 실패:', error);
}
```

### 결제 조회

```typescript
try {
  const payment = await toss.retrievePayment('payment_key_123');
  console.log('결제 정보:', payment.status, payment.method);
} catch (error) {
  console.error('결제 조회 실패:', error);
}
```

### 결제 취소

```typescript
// 전체 취소
const result = await toss.cancelPayment({
  paymentKey: 'payment_key_123',
  cancelReason: '고객 요청'
});

// 부분 취소 (환불 계좌 지정)
const result = await toss.cancelPayment({
  paymentKey: 'payment_key_123',
  cancelReason: '부분 환불',
  cancelAmount: 5000,
  currency: 'KRW',
  refundReceiveAccount: {
    bank: '신한',
    accountNumber: '110-123-456789',
    holderName: '김토스'
  },
  taxFreeAmount: 0
});
```

### 정기결제 청구

```typescript
const result = await toss.chargeWithBillingKey({
  billingKey: 'billing_key_123',
  customerKey: 'customer_123',
  orderId: 'subscription_order_456',
  orderName: '월간 구독료',
  amount: 9900,
  currency: 'KRW',
  customerEmail: 'customer@example.com',
  customerName: '김토스',
  idempotencyKey: 'custom-idempotency-key' // 선택사항
});
```

## 💳 지원하는 결제 방식

| 결제 방식 | 메서드명 | 통화 | 설명 |
|-----------|----------|------|------|
| 💳 카드 | `CARD` | KRW | 신용카드, 체크카드 |
| 🏦 계좌이체 | `TRANSFER` | KRW | 실시간 계좌이체 |
| 🏧 가상계좌 | `VIRTUAL_ACCOUNT` | KRW | 가상계좌 입금 |
| 📱 휴대폰 | `MOBILE_PHONE` | KRW | 휴대폰 소액결제 |
| 🎫 문화상품권 | `CULTURE_GIFT_CERTIFICATE` | KRW | 문화상품권 |
| 📚 도서문화상품권 | `BOOK_GIFT_CERTIFICATE` | KRW | 도서문화상품권 |
| 🎮 게임문화상품권 | `GAME_GIFT_CERTIFICATE` | KRW | 게임문화상품권 |
| 🌍 해외 간편결제 | `FOREIGN_EASY_PAY` | USD | PayPal, AliPay 등 |

### 해외 간편결제 제공업체

`FOREIGN_EASY_PAY` 방식에서 지원하는 제공업체:

| 제공업체 | 코드 | 지역 |
|----------|------|------|
| PayPal | `PAYPAL` | 글로벌 |
| 알리페이 | `ALIPAY` | 중국 |
| 알리페이 홍콩 | `ALIPAYHK` | 홍콩 |
| Billease | `BILLEASE` | 필리핀 |
| Boost | `BOOST` | 말레이시아 |
| BPI | `BPI` | 필리핀 |
| Dana | `DANA` | 인도네시아 |
| GCash | `GCASH` | 필리핀 |
| 래빗 라인페이 | `RABBIT_LINE_PAY` | 태국 |
| TouchNGo | `TOUCHNGO` | 말레이시아 |
| TrueMoney | `TRUEMONEY` | 태국 |

## ⚠️ 오류 처리

라이브러리는 자동으로 재시도를 수행하지만, 최종적으로 실패한 경우 적절한 오류 처리가 필요합니다:

```typescript
try {
  const result = await toss.confirmPayment({
    paymentKey: 'payment_key',
    orderId: 'order_123',
    amount: 15000
  });
} catch (error: any) {
  // 타임아웃
  if (error.message.includes('Timeout')) {
    console.error('⏰ 요청 타임아웃');
  }
  // 잘못된 요청
  else if (error.message.includes('400')) {
    console.error('❌ 잘못된 요청 파라미터');
  }
  // 인증 실패
  else if (error.message.includes('401')) {
    console.error('🔐 인증 실패 - Secret Key 확인 필요');
  }
  // 서버 오류 (자동 재시도 후 실패)
  else if (error.message.includes('5')) {
    console.error('🔥 서버 오류 - 잠시 후 다시 시도해주세요');
  }
  else {
    console.error('❓ 알 수 없는 오류:', error);
  }
}
```

## 🛠️ 유틸리티 함수

### 안전한 숫자 변환

```typescript
import { TossServer } from '@divetocode/tosspayments/server';

// URL 쿼리 파라미터나 폼 데이터를 안전하게 숫자로 변환
const amount = TossServer.toNumber(req.query.amount); // string | string[] → number
const price = TossServer.toNumber("15000"); // 15000
```

### 랜덤 문자열 생성

```typescript
import { generateRandomString } from '@divetocode/tosspayments/client';

const randomOrderId = generateRandomString(); // "aBc1De2Fg3Hi4Jk5"
const customerId = `customer_${generateRandomString()}`;
```

## 🔒 보안 가이드라인

### 🚨 필수 보안 사항

1. **Secret Key 보안**: 서버용 Secret Key는 절대 클라이언트에 노출되지 않도록 주의하세요.
2. **환경 변수 사용**: API 키는 반드시 환경 변수로 관리하세요.
3. **HTTPS 필수**: 프로덕션 환경에서는 반드시 HTTPS를 사용하세요.
4. **금액 재검증**: 클라이언트에서 전송된 금액을 서버에서 반드시 재검증하세요.

### 환경 변수 설정 예제

```bash
# .env.local (Next.js)
NEXT_PUBLIC_TOSS_CLIENT_KEY=test_ck_D5GePWvyJnrK0W0k6q8gLzN97Eoqo9O
TOSS_SECRET_KEY=test_sk_zXLkKEypNArWmo50nX3lmeaxYG5R

# .env (Node.js)
TOSS_SECRET_KEY=test_sk_zXLkKEypNArWmo50nX3lmeaxYG5R
```

### 서버 사이드 검증 예제

```typescript
// 클라이언트에서 전송된 결제 정보를 서버에서 재검증
export async function verifyPayment(orderId: string, expectedAmount: number) {
  const order = await getOrderFromDatabase(orderId);
  
  if (order.amount !== expectedAmount) {
    throw new Error('결제 금액이 일치하지 않습니다');
  }
  
  return order;
}
```

## 🏗️ 프로젝트 구조

```
@divetocode/tosspayments/
├── client          # 브라우저 전용 (TossPaymentsAPI)
├── server          # Node.js 전용 (TossServer)
├── types           # 공통 타입 정의
└── index           # 통합 내보내기
```

## 📈 버전 히스토리

- **v1.0.2**: 현재 안정 버전
- React 18+ 지원
- Next.js App Router 완전 호환
- ESM/CJS 듀얼 지원

## 🤝 기여하기

버그 리포트나 기능 제안은 [GitHub Issues](https://github.com/divetocode/divetocode-tosspayments/issues)를 통해 부탁드립니다.

## 📧 지원

- **이메일**: [divetocode.official@gmail.com](mailto:divetocode.official@gmail.com)
- **웹사이트**: [https://divetocode.com](https://divetocode.com)
- **GitHub**: [https://github.com/divetocode/divetocode-tosspayments](https://github.com/divetocode/divetocode-tosspayments)

## 📄 라이센스

[MIT License](https://github.com/divetocode/divetocode-tosspayments/blob/main/LICENSE)

---

**Made with ❤️ by [Divetocode](https://divetocode.com)**