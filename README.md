# SaveLink

유용한 링크를 저장하고, 태그와 노트를 언제든 고칠 수 있는 개인용 도구입니다. 데이터베이스와 로그인 서버가 없습니다. 브라우저가 GitHub 비공개 레포의 `links.json` 파일 하나를 직접 읽고 씁니다.

## 어떻게 동작하나

- **저장소**: 내 GitHub 비공개 레포 `save-link-data`의 `links.json`. 커밋 이력이 곧 백업입니다.
- **인증**: 그 레포 하나에만 Contents 읽기·쓰기 권한을 준 fine-grained 토큰. 기기마다 한 번 붙여 넣고 브라우저에만 저장됩니다.
- **서버**: OG 메타데이터를 대신 읽어 주는 Vercel 함수 `api/metadata.ts`와, 연결 시 계정을 확인하는 `api/allowed.ts`.
- **개인용**: `api/_owner.ts`의 `ALLOWED_GITHUB_LOGINS`에 적힌 GitHub 계정만 연결하고 메타데이터를 쓸 수 있습니다. 서버가 토큰으로 GitHub에 주인을 물어 확인하며, 다른 계정은 잘못된 토큰과 같은 오류를 받습니다. 사람을 추가하려면 이 목록에 계정 이름을 더하면 됩니다.
- **쓰기**: 모든 변경은 커밋 하나. 다른 기기가 먼저 썼으면 최신본을 받아 재적용합니다.

설계 문서: `docs/superpowers/specs/2026-10-14-save-link-v2-design.md`

## 처음 설정

1. GitHub에서 비공개 레포 `save-link-data`를 만듭니다.
2. [fine-grained 토큰](https://github.com/settings/personal-access-tokens/new)을 만듭니다. Repository access는 그 레포 하나, Permissions는 Contents: Read and write, 만료는 최대 1년.
3. 배포된 앱을 열고 사용자명과 토큰을 붙여 넣으면 빈 `links.json`이 자동으로 생깁니다.

## 빠른 저장

- **데스크톱**: 설정 → 빠른 저장의 "SaveLink에 저장" 버튼을 북마크 바로 끌어 놓습니다.
- **iPhone**: 단축어 앱에서 "공유 시트에서 URL 받기 → URL 인코딩 → `https://<앱 주소>/?url=<인코딩 결과>` 열기" 세 액션짜리 단축어를 만듭니다.
- 둘 다 앱을 `?url=` 파라미터로 여는 것뿐이라 어떤 환경에서도 같은 방식으로 붙일 수 있습니다.

## 개발

```bash
npm install
npm run dev        # http://localhost:5173, /api/metadata도 함께 동작
npm test           # Vitest
npm run test:e2e   # Playwright (GitHub API는 모킹)
npm run build
```

## 배포

Vercel에 레포를 연결하면 됩니다. 프레임워크는 Vite로 자동 감지되고 `api/`는 서버리스 함수로 올라갑니다. 환경 변수는 필요하지 않습니다. `vercel.json`의 CSP가 서드파티 스크립트를 막으므로 외부 스크립트를 추가하려면 함께 고쳐야 합니다.

## 한계

- 토큰이 브라우저 localStorage에 있습니다. 공용 기기에서는 쓰지 마세요.
- 계정 확인을 위해 토큰이 이 앱의 Vercel 함수로 전송됩니다. 함수는 토큰을 저장하지 않고, 해시만 10분간 메모리에 둡니다.
- GitHub Contents API의 JSON 응답 상한은 1MB입니다. 링크 약 2,000개 근처에서 파일 분할이 필요합니다.
- 두 기기가 같은 항목을 동시에 고치면 나중 쓰기가 이깁니다.
- 오프라인에서는 읽기만 됩니다.
- 메타데이터 함수는 IP 주소로 쓴 내부 주소는 막지만, 내부 IP로 해석되는 도메인 이름(DNS)까지는 막지 않습니다.
