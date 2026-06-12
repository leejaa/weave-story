import type { StoryGenerationJob } from './lib/queue/story-generation-jobs';

export type WorkerEnv = {
  DATABASE_URL: string;
  JWT_SECRET: string;
  AI_GATEWAY_API_KEY: string;
  CF_COVER_WORKER_URL: string;
  STORY_GENERATION_QUEUE: Queue<StoryGenerationJob>;
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
};

export type AppEnv = {
  Bindings: WorkerEnv;
  Variables: {
    userId: string;
  };
};
