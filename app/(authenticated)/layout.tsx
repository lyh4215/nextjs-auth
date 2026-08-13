import { SessionMonitor } from "@/app/components/session-monitor";
import { requireUser } from "@/lib/auth";

export default async function AuthenticatedLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  await requireUser();

  return (
    <>
      <SessionMonitor />
      {children}
    </>
  );
}
