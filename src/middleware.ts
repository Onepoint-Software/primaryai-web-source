export { auth as middleware } from "@/src/auth";

export const config = {
  matcher: ["/settings/:path*", "/library/:path*"],
};
