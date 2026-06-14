import type { StoryGenerationJob } from './lib/queue/story-generation-jobs';
import type { RateLimiter } from './lib/middleware/rate-limit';

export type WorkerEnv = {
  DATABASE_URL: string;
  JWT_SECRET: string;
  AI_GATEWAY_API_KEY: string;
  CF_COVER_WORKER_URL: string;
  STORY_GENERATION_QUEUE: Queue<StoryGenerationJob>;
  // 네이티브 Rate Limiting 바인딩. 미설정 시 미들웨어가 통과(no-op).
  AUTH_RATE_LIMITER?: RateLimiter; // 인증 엔드포인트 — IP 키
  GEN_RATE_LIMITER?: RateLimiter; // AI 생성 엔드포인트 — userId 키
  USE_STORY_HARNESS?: string;
  APPLE_IAP_KEY_ID: string;
  APPLE_IAP_ISSUER_ID: string;
  APPLE_IAP_PRIVATE_KEY: string;
  // Sign in with Apple key — used to revoke tokens on account deletion. Optional:
  // when unset, revocation is skipped (account deletion still works).
  APPLE_SIGNIN_TEAM_ID?: string;
  APPLE_SIGNIN_KEY_ID?: string;
  APPLE_SIGNIN_PRIVATE_KEY?: string;
  GOOGLE_IOS_CLIENT_ID: string;
  GOOGLE_WEB_CLIENT_ID: string;
  // Review-only demo login code. When unset, /api/auth/demo is disabled.
  DEMO_LOGIN_CODE?: string;
  // Google Play service account (Android Publisher API) used to verify
  // Google Play Billing purchases. When unset, Android purchase grants are
  // rejected. Sourced from the play-publisher service-account JSON key.
  GOOGLE_PLAY_SA_CLIENT_EMAIL?: string;
  GOOGLE_PLAY_SA_PRIVATE_KEY?: string;
  // 운영자 텔레그램 알림(신규 가입·새 이야기 등). 둘 다 설정돼야 동작, 없으면 no-op.
  TELEGRAM_BOT_TOKEN?: string;
  TELEGRAM_CHAT_ID?: string;
  // 토스(앱인토스) 파트너 API 호출용 mTLS 클라이언트 인증서 바인딩.
  TOSS_MTLS?: Fetcher;
  // 토스 유저 PII(name/email 등) 복호화용 — 콘솔 발급 이메일로 받음(AES-256-GCM).
  // 미설정 시 로그인은 userKey만으로 동작(PII 복호화는 건너뜀).
  TOSS_AAD_STRING?: string;
  TOSS_DECRYPTION_KEY?: string; // base64 256-bit 키
  // 앱인토스 스마트 발송(기능성 메시지) 템플릿 코드. 콘솔 등록+검수 후 설정. 미설정 시 토스 푸시 skip.
  TOSS_MESSAGE_TEMPLATE_CODE?: string;
  // 'true'면 IAP 지급 전 토스 주문검증(getIapOrderStatus) 통과를 강제. 스키마 확정·프로덕션 전 'true'로.
  // 미설정/그외엔 검증 결과를 로깅만 하고 지급 진행(샌드박스 테스트용).
  TOSS_IAP_ENFORCE_VERIFY?: string;
};

export type AppEnv = {
  Bindings: WorkerEnv;
  Variables: {
    userId: string;
  };
};
