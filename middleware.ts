import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isProtectedRoute = createRouteMatcher([
  "/dashboard(.*)",
  "/lesson-pack(.*)",
  "/ai-planner(.*)",
  "/critical-planner(.*)",
  "/account(.*)",
  "/billing(.*)",
  "/settings(.*)",
  "/library(.*)",
  "/notes(.*)",
  "/coverage(.*)",
  "/school(.*)",
  "/wellbeing-report(.*)",
  "/profile-setup(.*)",
  "/survey-responses(.*)",
]);

const clerkHandler = clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    await auth.protect();
  }
});

export default async function middleware(req: Request) {
  try {
    return await clerkHandler(req as any, {} as any);
  } catch (err: any) {
    const msg = err?.message ?? String(err);
    console.error("[middleware] error:", msg);
    // Surface the error in the response header for debugging — remove after fix
    return NextResponse.next({
      headers: { "x-middleware-error": msg.slice(0, 200) },
    });
  }
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
