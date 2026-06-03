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
};

export type AppEnv = {
  Bindings: WorkerEnv;
  Variables: {
    userId: string;
  };
};
