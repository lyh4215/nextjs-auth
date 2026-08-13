import "server-only";

import { randomUUID } from "node:crypto";

export type SessionEvent = "session-replaced" | "session-ended";
type SessionListener = (event: SessionEvent) => void;
type Subscription = { sessionId: string; listener: SessionListener };

type SessionEventStore = Map<string, Map<string, Subscription>>;

const globalForSessionEvents = globalThis as unknown as {
  sessionEventStore?: SessionEventStore;
};

// This in-memory broker is appropriate for a single long-running Node process.
const subscriptions =
  globalForSessionEvents.sessionEventStore ?? new Map<string, Map<string, Subscription>>();

globalForSessionEvents.sessionEventStore = subscriptions;

export function subscribeToSessionEvents(
  userId: string,
  sessionId: string,
  listener: SessionListener,
) {
  const subscriptionId = randomUUID();
  const userSubscriptions = subscriptions.get(userId) ?? new Map<string, Subscription>();
  userSubscriptions.set(subscriptionId, { sessionId, listener });
  subscriptions.set(userId, userSubscriptions);

  return () => {
    const currentSubscriptions = subscriptions.get(userId);
    currentSubscriptions?.delete(subscriptionId);
    if (currentSubscriptions?.size === 0) subscriptions.delete(userId);
  };
}

export function publishSessionReplacement(userId: string, currentSessionId: string) {
  const userSubscriptions = subscriptions.get(userId);
  if (!userSubscriptions) return;

  for (const { sessionId, listener } of userSubscriptions.values()) {
    if (sessionId !== currentSessionId) {
      try {
        listener("session-replaced");
      } catch {
        // A disconnected stream must not prevent the login from completing.
      }
    }
  }
}
