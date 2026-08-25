import dotenv from 'dotenv';
import { resolve } from 'node:path';
import { existsSync } from 'node:fs';
import { z } from 'zod';

const rootEnv = resolve(process.cwd(), '../.env');
const localEnv = resolve(process.cwd(), '.env');

if (existsSync(rootEnv)) {
  dotenv.config({ path: rootEnv });
} else if (existsSync(localEnv)) {
  dotenv.config({ path: localEnv });
} else {
  dotenv.config();
}

const envSchema = z.object({
  PORT: z.string().default('3001'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  MONGODB_URI: z.string().min(1, 'MONGODB_URI is required'),
  JWT_SECRET: z.string().min(8, 'JWT_SECRET must be at least 8 characters'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  GROQ_API_KEY: z.string().default(''),
  GROQ_MODEL: z.string().default('openai/gpt-oss-120b'),
  CLIENT_URL: z.string().default('http://localhost:5173'),
});

function loadConfig() {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    console.error('❌ Invalid environment variables:');
    console.error(result.error.format());
    process.exit(1);
  }

  return {
    port: parseInt(result.data.PORT, 10),
    nodeEnv: result.data.NODE_ENV,
    mongodbUri: result.data.MONGODB_URI,
    jwtSecret: result.data.JWT_SECRET,
    jwtExpiresIn: result.data.JWT_EXPIRES_IN,
    groqApiKey: result.data.GROQ_API_KEY,
    groqModel: result.data.GROQ_MODEL,
    clientUrl: result.data.CLIENT_URL,
  };
}

export const config = loadConfig();
export type Config = ReturnType<typeof loadConfig>;
