import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

const rotasPublicas = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
])

export default clerkMiddleware(
  async (auth, req) => {
    if (!rotasPublicas(req)) {
      await auth.protect()
    }
  },
  { clockSkewInMs: 300_000 }
)

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}