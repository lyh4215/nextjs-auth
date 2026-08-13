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

## 주요 보안 속성

- `Session.userId` unique 제약과 upsert로 계정당 활성 세션 하나를 보장
- 256-bit 랜덤 세션 토큰, DB에는 SHA-256 다이제스트만 저장
- HttpOnly, SameSite=Lax, 운영 환경 Secure 쿠키
- 파라미터를 포함한 `scrypt$N$r$p$salt$hash` 비밀번호 형식
- `timingSafeEqual`을 이용한 파생 키 검증
- 보호 페이지와 민감한 Server Action 모두 서버에서 세션 재검증
