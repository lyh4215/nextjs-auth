import { getCurrentSession } from "@/lib/auth";
import {
  subscribeToSessionEvents,
  type SessionEvent,
} from "@/lib/session-events";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const encoder = new TextEncoder();
const HEARTBEAT_INTERVAL_MS = 15_000;
const MAX_TIMEOUT_MS = 2_147_483_647;

function encodeEvent(event: SessionEvent) {
  return encoder.encode(`event: ${event}\ndata: {}\n\n`);
}

export async function GET(request: Request) {
  const session = await getCurrentSession();
  if (!session) return new Response(null, { status: 401 });

  let cancelStream = () => {};

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      let closed = false;

      const close = () => {
        if (closed) return;
        closed = true;
        cleanup();
        controller.close();
      };

      const send = (event: SessionEvent) => {
        if (closed) return;
        try {
          controller.enqueue(encodeEvent(event));
        } finally {
          close();
        }
      };

      const unsubscribe = subscribeToSessionEvents(session.user.id, session.id, send);
      const heartbeat = setInterval(() => {
        if (!closed) controller.enqueue(encoder.encode(": heartbeat\n\n"));
      }, HEARTBEAT_INTERVAL_MS);
      let expiration: ReturnType<typeof setTimeout>;
      const scheduleExpiration = () => {
        const expiresIn = Math.max(0, session.expiresAt.getTime() - Date.now());
        expiration = setTimeout(
          expiresIn > MAX_TIMEOUT_MS ? scheduleExpiration : () => send("session-ended"),
          Math.min(expiresIn, MAX_TIMEOUT_MS),
        );
      };
      scheduleExpiration();

      const abort = () => close();
      request.signal.addEventListener("abort", abort, { once: true });

      const cleanup = () => {
        unsubscribe();
        clearInterval(heartbeat);
        clearTimeout(expiration);
        request.signal.removeEventListener("abort", abort);
      };
      cancelStream = () => {
        if (closed) return;
        closed = true;
        cleanup();
      };

      controller.enqueue(encoder.encode("retry: 3000\n: connected\n\n"));

      // Close a race where the session changed between authentication and subscribe.
      void getCurrentSession().then((currentSession) => {
        if (currentSession?.id !== session.id) send("session-replaced");
      });
    },
    cancel() {
      cancelStream();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
