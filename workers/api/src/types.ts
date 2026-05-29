import type { StoryGenerationJob } from './lib/queue/story-generation-jobs';

export type WorkerEnv = {
  DATABASE_URL: string;
  JWT_SECRET: string;
  AI_GATEWAY_API_KEY: string;
  CF_COVER_WORKER_URL: string;
  STORY_GENERATION_QUEUE: Queue<StoryGenerationJob>;
  APPLE_IAP_KEY_ID: string;
  APPLE_IAP_ISSUER_ID: string;
  APPLE_IAP_PRIVATE_KEY: string;
  GOOGLE_IOS_CLIENT_ID: string;
  GOOGLE_WEB_CLIENT_ID: string;
};

export type AppEnv = {
  Bindings: WorkerEnv;
  Variables: {
    userId: string;
  };
};
