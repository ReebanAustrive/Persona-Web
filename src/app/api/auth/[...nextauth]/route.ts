import { handlers } from '@/lib/auth';
// NextAuth v5 beta handler — cast to avoid type mismatch with Next.js 16 route validator
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const GET = handlers.GET as any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const POST = handlers.POST as any;
