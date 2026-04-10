import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

const rotasPublicas = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
])

const rotasSemOrg = createRouteMatcher([
  '/selecionar-loja(.*)',
])

export default clerkMiddleware(
  async (auth, req) => {
    if (rotasPublicas(req)) {
      return
    }

    await auth.protect()

    const { userId, orgId } = await auth()

    if (userId && !orgId && !rotasSemOrg(req)) {
      const url = new URL('/selecionar-loja', req.url)
      return NextResponse.redirect(url)
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