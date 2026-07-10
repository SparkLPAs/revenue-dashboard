import { NextResponse, type NextRequest } from "next/server";
import { AUTH_COOKIE, verifySession } from "@/lib/auth";

const PUBLIC_PATHS = [
  "/api/webhooks/stripe",
  "/api/sync/stripe",
  "/api/auth",
  "/api/etsy-import",
  "/api/setup",
  "/api/leads/inbound",
  "/login",
  "/setup",
];

// Revenue figures are admin-only. Staff can only ever reach /leads (and
// their own account). "/" needs an exact match -- every path starts with it.
const ADMIN_ONLY_EXACT = ["/"];
const ADMIN_ONLY_PREFIXES = [
  "/entries",
  "/pipelines",
  "/digital-downloads",
  "/etsy-import",
  "/api/entries",
  "/api/pipelines",
  "/api/products",
];

function isAdminOnlyPath(pathname: string): boolean {
  return (
    ADMIN_ONLY_EXACT.includes(pathname) ||
    ADMIN_ONLY_PREFIXES.some((p) => pathname.startsWith(p))
  );
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p))) {
    return NextResponse.next();
  }

  const token = req.cookies.get(AUTH_COOKIE)?.value;
  const session = await verifySession(token);

  if (!session) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("from", pathname);
    return NextResponse.redirect(url);
  }

  const needsAdmin = pathname.startsWith("/admin") || isAdminOnlyPath(pathname);

  if (needsAdmin && session.role !== "ADMIN") {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    return NextResponse.redirect(new URL("/leads", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
