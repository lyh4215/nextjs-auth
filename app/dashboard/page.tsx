import { logoutAction } from "@/app/actions/auth";
import { ProfileForm } from "@/app/components/profile-form";
import { SessionMonitor } from "@/app/components/session-monitor";
import { requireUser } from "@/lib/auth";

export default async function DashboardPage() {
  const user = await requireUser();

  return (
    <main className="dashboard-shell">
      <SessionMonitor />
      <section className="dashboard-card">
        <div className="dashboard-header">
          <div>
            <p className="eyebrow">SIGNED IN</p>
            <h1>안녕하세요, {user.displayName ?? user.email}</h1>
            <p className="lead">이 페이지는 서버에서 유효한 세션을 확인한 뒤 표시됩니다.</p>
          </div>
          <form action={logoutAction}>
            <button type="submit" className="secondary">로그아웃</button>
          </form>
        </div>

        <dl className="account-info">
          <div><dt>이메일</dt><dd>{user.email}</dd></div>
          <div><dt>가입일</dt><dd>{user.createdAt.toLocaleDateString("ko-KR")}</dd></div>
        </dl>

        <div className="profile-panel">
          <h2>프로필</h2>
          <ProfileForm displayName={user.displayName ?? ""} />
        </div>
      </section>
    </main>
  );
}
