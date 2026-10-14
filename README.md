# Next.js Server Session Auth

Next.js App Router, Prisma, SQLite로 구현한 서버 세션 기반 인증 예제입니다. 한 사용자당 DB 세션을 하나만 허용하며 비밀번호는 Node.js `scrypt`로 해시합니다.

## 실행

```bash
cp .env.example .env
npm install
npm run db:generate
npm run db:migrate
npm run dev
```

브라우저에서 `http://localhost:3000/register`로 접속해 계정을 생성할 수 있습니다.

배포 환경에서는 `npx prisma migrate deploy`로 포함된 초기 마이그레이션을 적용하세요. 새 스키마 변경을 만든 경우에는 개발 환경에서 `npm run db:migrate -- --name 변경이름`을 실행합니다.

Codespaces처럼 브라우저 Origin과 프록시 호스트가 다른 개발 환경에서는 `localhost:<PORT>`가 Server Action Origin으로 자동 허용됩니다. 운영 프록시에서 호스트가 다른 경우에만 `.env`의 `SERVER_ACTION_ALLOWED_ORIGINS`에 신뢰할 수 있는 `host[:port]`를 쉼표로 구분해 지정하세요.

## 주요 보안 속성

- `Session.userId` unique 제약과 upsert로 계정당 활성 세션 하나를 보장
- 256-bit 랜덤 세션 토큰, DB에는 SHA-256 다이제스트만 저장
- HttpOnly, SameSite=Lax, 운영 환경 Secure 쿠키
- 파라미터를 포함한 `scrypt$N$r$p$salt$hash` 비밀번호 형식
- `timingSafeEqual`을 이용한 파생 키 검증
- 보호 페이지와 민감한 Server Action 모두 서버에서 세션 재검증
- 단일 Node 프로세스의 SSE 연결로 기존 기기에 세션 교체를 즉시 통지

## 역할 기반 접근 제어

`User`와 `Role`은 `UserRole`로 연결되며 한 사용자가 여러 역할을 가질 수 있습니다.
`Role.key`는 권한 검사에 사용하는 고정 식별자이고 `name`은 표시 이름입니다.
역할 마이그레이션은 `user`, `admin`을 생성하고 기존 사용자에게 `user`만 부여합니다.
신규 가입도 사용자 생성과 같은 트랜잭션에서 `user` 역할을 연결합니다.
기존 DB에는 먼저 `npx prisma migrate deploy`를 실행하고 `npm run db:generate`로 클라이언트를 갱신하세요.

Server Component에서는 페이지 또는 보호된 데이터 조회 직전에 검사합니다.

```tsx
import { requireRole } from "@/lib/auth";

export default async function AdminPage() {
  const user = await requireRole("admin");
  return <h1>{user.displayName}님의 관리자 화면</h1>;
}
```

Server Action에서도 독립적으로 검사합니다. 페이지나 layout의 검사는 Action을 보호하지 않습니다.

```ts
"use server";

import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";

export async function getUserCountAction() {
  await requireRole("admin");
  return db.user.count();
}
```

`requireRole`은 현재 사용자를 반환합니다. 미로그인은 `/login`, 역할이 없으면
`/forbidden`으로 리다이렉트합니다. `/forbidden`은 안내 페이지이며 HTTP 403 응답은 아닙니다.
API에서는 `getCurrentUser()`와 `hasRole()`로 검사한 뒤 각각 401/403 응답을 반환하세요.
검사에 사용할 역할은 서버 코드에서 정하고, 클라이언트 입력으로 정하지 마세요.
리다이렉트를 가로채지 않도록 guard는 Action의 일반적인 `try/catch` 바깥에서 호출하세요.

역할 배열을 전달하면 OR 조건으로 검사합니다. 하나라도 있으면 허용하며 빈 배열은 거부합니다.
`hasRole`과 `RoleGate`도 같은 배열 형식을 지원합니다.

```tsx
await requireRole(["admin", "editor"]);
hasRole(user, ["admin", "editor"]);
<RoleGate role={["admin", "editor"]}>편집 메뉴</RoleGate>;
```

UI 조건부 표시에는 `hasRole(user, "admin")`을 사용합니다.

```tsx
import { requireUser } from "@/lib/auth";
import { hasRole } from "@/lib/roles";

export default async function AccountPage() {
  const user = await requireUser();
  return <>{hasRole(user, "admin") && <a href="/admin">관리자 메뉴</a>}</>;
}
```

반복되는 조건부 표시에는 서버 컴포넌트인 `RoleGate`를 사용할 수 있습니다.

```tsx
import { RoleGate } from "@/app/components/role-gate";

<RoleGate role="admin" fallback={null}>
  <span>관리자 전용 안내</span>
</RoleGate>
```

`RoleGate`는 표시만 제어합니다. 자식이 사용하는 민감한 데이터 조회와 Action에도
`requireRole`을 적용하고, 검사 전에 관리자 데이터를 미리 조회하지 마세요.
`hasRole`은 전달받은 사용자 정보만 검사하므로 Client Component에서 사용한 결과는
서버 권한 검사를 대신할 수 없습니다.

역할은 세션 조회마다 DB에서 읽어 다음 서버 요청에 부여·회수가 반영됩니다.
이미 열린 화면의 역할 표시는 새로고침 전까지 유지될 수 있습니다.
역할 간 자동 상속은 없으며 `admin`도 `user` 역할이 필요하면 명시적으로 함께 부여합니다.
관리자 역할은 신뢰할 수 있는 운영 경로에서 명시적으로 부여하세요.
역할 키 변경·삭제와 역할 부여·회수는 권한 변경이므로 해당 관리 기능에도 guard가 필요합니다.

## SSE 운영 조건

이 예제의 실시간 세션 알림은 단일 온프레미스 Node 프로세스의 메모리 이벤트 버스를 사용합니다. `next start` 프로세스를 하나만 실행하세요. 여러 프로세스나 여러 서버로 확장할 때는 메모리 이벤트 버스를 Redis Pub/Sub으로 교체해야 합니다.

Nginx를 앞에 두는 경우 SSE 경로의 응답 버퍼링을 끄고 긴 연결 시간을 허용해야 합니다. 애플리케이션도 `X-Accel-Buffering: no` 헤더를 반환합니다.

```nginx
location /api/session/events {
    proxy_pass http://127.0.0.1:3000;
    proxy_http_version 1.1;
    proxy_buffering off;
    proxy_read_timeout 1h;
}
```
