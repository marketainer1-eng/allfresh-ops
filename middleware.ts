import { auth } from "@/lib/auth";

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;

  const isAppRoute = nextUrl.pathname.startsWith("/app");
  const isLoginRoute = nextUrl.pathname.startsWith("/login");

  if (isAppRoute && !isLoggedIn) {
    return Response.redirect(new URL("/login", nextUrl));
  }

  if (isLoginRoute && isLoggedIn) {
    return Response.redirect(new URL("/app", nextUrl));
  }
});

export const config = {
  matcher: ["/app/:path*", "/login"],
};
