import type { Env } from './env';

const COOKIE_NAME = 'sr_admin';

export function isAuthed(req: Request, env: Env): boolean {
  const auth = req.headers.get('Authorization');
  if (auth === `Bearer ${env.ADMIN_TOKEN}`) return true;

  const cookie = req.headers.get('Cookie') || '';
  const match = cookie.match(new RegExp(`(?:^|;\\s*)${COOKIE_NAME}=([^;]+)`));
  return !!match && match[1] === env.ADMIN_TOKEN;
}

export function setAuthCookie(token: string): string {
  return `${COOKIE_NAME}=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=2592000`;
}

export function clearAuthCookie(): string {
  return `${COOKIE_NAME}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;
}

export function unauthorized(): Response {
  return new Response('Unauthorized', { status: 401 });
}
