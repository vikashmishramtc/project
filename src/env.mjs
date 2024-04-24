import { z } from 'zod';

const server = z.object({
  DATABASE_URL: z.string().url(),
  NODE_ENV: z.enum(['development', 'test', 'production']),
  NEXTAUTH_SECRET:
    process.env.NODE_ENV === 'production'
      ? z.string().min(1)
      : z.string().min(1).optional(),
  NEXTAUTH_URL: process.env.VERCEL
    ? z
        .string()
        .min(1)
        .transform((str) => process.env.VERCEL_URL ?? str)
    : z.string().url(),
  GITHUB_CLIENT_ID: z.string(),
  GITHUB_CLIENT_SECRET: z.string(),
  GOOGLE_CLIENT_ID: z.string(),
  GOOGLE_CLIENT_SECRET: z.string(),
});

const client = z.object({
  NEXT_PUBLIC_TMDB_MOVIE_URL: z.string(),
  NEXT_PUBLIC_TMDB_API_KEY: z.string(),
});

const processEnv = {
  DATABASE_URL: process.env.DATABASE_URL,
  NODE_ENV: process.env.NODE_ENV,
  NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
  NEXTAUTH_URL: process.env.NEXTAUTH_URL,
  GITHUB_CLIENT_ID: process.env.GITHUB_CLIENT_ID,
  GITHUB_CLIENT_SECRET: process.env.GITHUB_CLIENT_SECRET,
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
  NEXT_PUBLIC_TMDB_MOVIE_URL: process.env.NEXT_PUBLIC_TMDB_MOVIE_URL,
  NEXT_PUBLIC_TMDB_API_KEY: process.env.NEXT_PUBLIC_TMDB_API_KEY,
};

const merged = server.merge(client);

let env = process.env;

const skip =
  !!process.env.SKIP_ENV_VALIDATION &&
  process.env.SKIP_ENV_VALIDATION !== 'false' &&
  process.env.SKIP_ENV_VALIDATION !== '0';
if (!skip) {
  const isServer = typeof window === 'undefined';

  const parsed = isServer
    ? merged.safeParse(processEnv)
    : client.safeParse(processEnv);

  if (parsed.success === false) {
    console.error(
      '❌ Invalid environment variables:',
      parsed.error.flatten().fieldErrors,
    );
    throw new Error('Invalid environment variables');
  }

  env = new Proxy(parsed.data, {
    get(target, prop) {
      if (typeof prop !== 'string') return undefined;
      if (!isServer && !prop.startsWith('NEXT_PUBLIC_'))
        throw new Error(
          process.env.NODE_ENV === 'production'
            ? '❌ Attempted to access a server-side environment variable on the client'
            : `❌ Attempted to access server-side environment variable '${prop}' on the client`,
        );
      return target[prop];
    },
  });
}

export { env, processEnv };
