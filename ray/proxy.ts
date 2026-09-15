import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { isDashboardHost } from "@/lib/network";

const JWT_SECRET_VALUE = process.env.JWT_SECRET;

if (!JWT_SECRET_VALUE) {
  throw new Error("JWT_SECRET environment variable is required");
}

const JWT_SECRET = new TextEncoder().encode(JWT_SECRET_VALUE);

// Routes that require dashboard authentication
const PROTECTED_ROUTES = ["/chat", "/dashboard", "/settings", "/servers", "/projects", "/monitor", "/deployments", "/containers", "/cicd", "/github"];
// Routes that should redirect to /chat if already authenticated
const AUTH_ROUTES = ["/login", "/register"];

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const hostHeader = request.headers.get("host") || "";

  // 1. Bypass internal Next.js assets and proxy resolution paths
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/domains/resolve") ||
    pathname.startsWith("/api/domain-proxy") ||
    pathname === "/domain-not-found" ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  // 2. Determine if request is hitting the Ray Dashboard directly (localhost or direct IP)
  const isDashboard = isDashboardHost(hostHeader);

  if (isDashboard) {
    const token = request.cookies.get("ray_token")?.value;

    const isProtected = PROTECTED_ROUTES.some((route) =>
      pathname.startsWith(route)
    );
    const isAuthRoute = AUTH_ROUTES.some((route) => pathname.startsWith(route));

    // Verify token validity
    let isAuthenticated = false;
    if (token) {
      try {
        await jwtVerify(token, JWT_SECRET);
        isAuthenticated = true;
      } catch {
        isAuthenticated = false;
      }
    }

    // Redirect unauthenticated users away from protected routes
    if (isProtected && !isAuthenticated) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("from", pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Redirect authenticated users away from login/register
    if (isAuthRoute && isAuthenticated) {
      return NextResponse.redirect(new URL("/chat", request.url));
    }

    return NextResponse.next();
  }

  // 3. Domain Routing: Inbound request via sslip.io or custom domain
  try {
    const resolveUrl = new URL(`/api/domains/resolve?host=${encodeURIComponent(hostHeader)}`, request.url);
    const res = await fetch(resolveUrl, {
      signal: AbortSignal.timeout(1500),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.found && data.upstream) {
        // Domain is linked to an active project — reverse proxy request
        const forwardHeaders = new Headers(request.headers);
        forwardHeaders.set("x-target-upstream", data.upstream);
        forwardHeaders.set("x-target-path", `${pathname}${search}`);
        forwardHeaders.set("x-domain-requested", hostHeader);

        return NextResponse.rewrite(new URL("/api/domain-proxy", request.url), {
          request: { headers: forwardHeaders },
        });
      }
    }
  } catch (err) {
    // resolution error or timeout
  }

  // 4. Domain is pointing to server IP, but NOT linked to any project:
  // Render generic unbranded Ray-styled 404 page with status code 404.
  const notFoundHeaders = new Headers(request.headers);
  notFoundHeaders.set("x-domain-requested", hostHeader);

  return NextResponse.rewrite(new URL("/domain-not-found", request.url), {
    status: 404,
    request: { headers: notFoundHeaders },
  });
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for static files and favicon
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
