import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();

  return new Response(null, {
    status: user ? 204 : 401,
    headers: {
      "Cache-Control": "no-store, max-age=0",
    },
  });
}
