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
