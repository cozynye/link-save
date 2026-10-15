# SaveLink v2 설계 스펙

- 작성일: 2026-10-14
- 상태: 사용자 검토 대기
- 이전 버전: Next.js + Supabase 기반 v1. 연결된 Supabase 프로젝트가 소멸했고 데이터 보존은 불필요하다고 결정됨.

## 1. 목적과 성공 기준

**목적.** 유용한 링크를 간단히 저장하고, 저장 시점이든 나중이든 태그와 노트를 자유롭게 고칠 수 있는 개인용 도구.

**성공 기준.**
- iPhone과 데스크톱 어느 쪽에서든 링크 하나를 저장하는 데 조작 두 번 이내, 10초 이내.
- 어느 기기에서 열어도 같은 목록이 보인다.
- 저장된 링크는 제목, 노트, 태그를 언제든 수정할 수 있다.
- 데이터베이스와 로그인 서버가 없다. 외부 의존은 GitHub와 Vercel 둘뿐이다.
- 데이터 파일은 사람이 읽을 수 있는 JSON 하나이고, 앱이 없어져도 그대로 쓸 수 있다.

**사용자.** 본인 한 명. 공유, 협업, 다중 사용자 없음.

## 2. 범위

**포함.**
- 링크 저장, 수정, 삭제, 고정.
- OG 메타데이터 자동 수집: title, description, image URL, siteName.
- 사용자 노트. OG description과 분리.
- 태그 여러 개. 태그 목록은 사용자가 추가, 이름 변경, 색 변경, 삭제.
- 검색, 태그 필터, 고정 필터, 정렬.
- iPhone 단축어와 데스크톱 북마클릿으로 한 번에 저장.
- 모바일과 데스크톱 레이아웃 분리. 다크 모드.
- PWA 설치. iPhone 홈 화면 아이콘과 standalone 표시.

**제외.**
- Docs 기능 전체. 마크다운 노트, 키워드 백과.
- Android 공유 대상. 추후 매니페스트에 share_target만 추가하면 되는 구조로 둔다.
- 오프라인 쓰기 큐. 오프라인에서는 읽기만 된다.
- 이미지 캐싱이나 프록시. og:image URL만 저장한다.
- 브라우저 확장, 북마크 가져오기, 전문 검색, 공개 페이지.

## 3. 아키텍처

```
┌──────────────────────────────┐        ┌─────────────────────────┐
│  브라우저 (Vite SPA, PWA)     │ ─────▶ │ api.github.com          │
│  - vault 스토어 (메모리)      │  PAT   │ Contents API            │
│  - localStorage: 설정, 사본   │ ◀───── │ save-link-data/links.json│
└──────────────┬───────────────┘        └─────────────────────────┘
               │ GET /api/metadata?url=
               ▼
┌──────────────────────────────┐        ┌─────────────────────────┐
│  Vercel 함수 api/metadata.ts │ ─────▶ │ 대상 사이트 HTML         │
│  - SSRF 가드, 5초, 512KB     │        │                         │
└──────────────────────────────┘        └─────────────────────────┘
```

- **앱 레포** `save-link`: Vite + React 19 + TypeScript. Vercel에 배포. 서버 코드는 `api/metadata.ts` 하나.
- **데이터 레포** `save-link-data`: 비공개. 파일 하나 `links.json`. 커밋 이력이 백업.
- 읽기와 쓰기는 모두 브라우저가 GitHub Contents API를 직접 호출한다. 서버는 데이터를 거치지 않는다.
- 서버 함수의 유일한 역할은 CORS 때문에 브라우저가 직접 읽을 수 없는 대상 사이트의 OG 메타데이터를 대신 읽어 주는 것.

## 4. 저장소와 동기화

### 4.1 토큰과 기기 설정

- fine-grained PAT. Resource owner는 사용자, Repository access는 `save-link-data` 하나만, Permissions는 Contents: Read and write. 만료는 최대 1년.
- 기기별 localStorage에 저장. 키와 값:
  - `savelink.settings`: `{ owner, repo, path: "links.json", token, theme: "system" | "light" | "dark" }`
  - `savelink.cache`: `{ data, sha, fetchedAt }` 마지막으로 성공한 사본.
- 토큰과 레포 좌표는 데이터 파일에 넣지 않는다.

### 4.2 GitHub Contents API 호출 규약

공통 헤더: `Authorization: Bearer <token>`, `Accept: application/vnd.github+json`, `X-GitHub-Api-Version: 2022-11-28`.

- **읽기.** `GET /repos/{owner}/{repo}/contents/{path}`. 응답의 `content`는 줄바꿈이 섞인 base64. 공백 제거 후 디코딩하고 바이트를 UTF-8로 해석한다. `sha`를 함께 보관한다.
- **쓰기.** `PUT /repos/{owner}/{repo}/contents/{path}`에 `{ message, content: base64(UTF-8 JSON), sha }`. 응답의 `content.sha`를 새 sha로 채택한다. 성공 직후 다시 GET하지 않고 로컬 데이터와 응답 sha를 진실로 삼는다.
- **초기 생성.** 파일이 없어 GET이 404면 sha 없이 PUT으로 빈 데이터를 만든다.
- **직렬화.** JSON은 들여쓰기 2칸, 끝에 줄바꿈 하나. GitHub 웹에서 diff를 읽을 수 있게 한다.
- **커밋 메시지.** `Add link: {title}`, `Update link: {title}`, `Delete link: {title}`, `Pin link: {title}`, `Unpin link: {title}`, `Add tag: {name}`, `Update tag: {name}`, `Delete tag: {name}`, `Initialize vault`.

### 4.3 상태 모델과 쓰기 큐

스토어는 두 층으로 나눈다.

- `confirmed: { data, sha }` GitHub에 반영된 것이 확실한 상태.
- `pending: Op[]` 아직 반영되지 않은 연산 목록.
- 화면은 `pending`을 `confirmed.data`에 순서대로 적용한 파생 값을 본다. 낙관적 반영은 이 파생으로 자연히 이루어진다.

큐는 한 번에 연산 하나만 처리한다.

1. `pending[0]`을 `confirmed.data`에 적용해 다음 데이터를 만든다.
2. `confirmed.sha`를 붙여 PUT.
3. 성공: `confirmed`를 새 데이터와 새 sha로 교체하고 `pending`에서 제거. 다음 연산으로.
4. 409: 최신본을 GET해 `confirmed`를 교체하고 1부터 다시. 같은 연산에 대해 최대 2회.
5. 401 또는 403: 큐를 일시정지하고 `pending`을 그대로 유지한다. 화면에는 사용자의 변경이 계속 보인다. 설정에서 재연결에 성공하면 큐를 재개한다.
6. 그 외 실패 또는 재시도 소진: 해당 연산만 `pending`에서 제거하고 토스트로 알린다. 화면은 자동으로 되돌아간다. 다음 연산은 계속 진행한다.

연산은 전부 항목 단위라서 최신본 위에 재적용해도 결과가 결정적이다.

### 4.4 연산 목록

모두 `(vault, payload) => vault` 형태의 순수 함수. 직렬화 가능한 `{ type, payload }`로 큐에 들어간다.

| type | payload | 동작 |
|---|---|---|
| `addLink` | `Link` 전체 | 목록 앞에 추가 |
| `updateLink` | `{ id, patch }` | 병합, `updatedAt` 갱신 |
| `deleteLink` | `{ id }` | 제거 |
| `addTag` | `Tag` 전체 | 추가 |
| `updateTag` | `{ id, patch }` | 이름 또는 색 변경 |
| `deleteTag` | `{ id }` | 태그 제거, 모든 링크의 `tags`에서도 제거 |

고정 토글은 `updateLink`로 표현한다. patch가 `pinned` 하나뿐이면 커밋 메시지는 `Pin link`나 `Unpin link`를 쓴다. 실행 취소는 반대 연산을 큐에 넣는 것이다. 추가의 취소는 `deleteLink`, 삭제의 취소는 삭제 전 객체 그대로 `addLink`.

## 5. 데이터 모델

### 5.1 파일 형식

```json
{
  "version": 1,
  "tags": [
    { "id": "k3f9a2", "name": "AI", "color": "violet" }
  ],
  "links": [
    {
      "id": "6f1c2a7e-3b4d-4c2e-9a1f-0d8e7b6c5a43",
      "url": "https://example.com/post",
      "title": "제목",
      "description": "사이트가 준 OG description",
      "note": "내가 왜 저장했는지 적는 메모",
      "image": "https://example.com/og.png",
      "siteName": "example.com",
      "tags": ["k3f9a2"],
      "pinned": false,
      "createdAt": "2026-10-14T09:00:00.000Z",
      "updatedAt": "2026-10-14T09:00:00.000Z"
    }
  ]
}
```

- `version`은 정수. 현재 1. 읽을 때 1이 아니면 마이그레이션 함수를 거친다. 지금은 1만 존재하므로 다른 값은 "지원하지 않는 버전" 오류.
- 읽을 때 zod로 전체를 검증한다. 실패 시 4.3의 쓰기를 전부 차단한다.
- `links[].id`는 `crypto.randomUUID()`. `tags[].id`는 영숫자 6자 무작위. 둘 다 불변.
- `title`은 필수, 비어 있으면 안 됨. `description`, `note`는 빈 문자열 허용. `image`는 URL 문자열 또는 `null`.
- `tags`는 존재하는 태그 id만 담는다. `deleteTag`가 이를 보장한다.
- 정렬 순서는 파일에 저장하지 않는다. 화면에서 계산한다.

### 5.2 URL 정규화

저장 전과 중복 비교 전에 적용한다. 저장되는 `url`은 정규화된 값이다.

1. 앞뒤 공백 제거. 스킴이 없으면 `https://`를 붙인다.
2. `URL`로 파싱. 실패하면 거절. 프로토콜이 `http:` 또는 `https:`가 아니면 거절.
3. 프로토콜과 호스트를 소문자로.
4. 해시 제거.
5. 추적 파라미터 제거: 이름이 `utm_`으로 시작하는 것, `fbclid`, `gclid`, `igshid`, `mc_cid`, `mc_eid`. 나머지 파라미터는 순서를 유지.
6. 경로가 `/`가 아니면 끝 슬래시 제거.

### 5.3 태그 색 팔레트

색은 다음 열두 키 중 하나: `red`, `orange`, `amber`, `yellow`, `lime`, `green`, `teal`, `cyan`, `blue`, `indigo`, `violet`, `pink`. 각 키는 라이트와 다크 모드의 칩 배경과 글자색 한 쌍에 대응한다. 새 태그를 만들 때는 현재 가장 적게 쓰인 색을 자동 배정하고, 설정에서 바꿀 수 있다.

### 5.4 파생 값

- **태그 사용 횟수.** 사이드바 개수와 색 자동 배정에 사용.
- **최근 사용 태그.** 최근 생성된 링크 20개에 붙은 태그를 먼저 두고, 그 안에서는 더 최근 링크의 태그가 앞선다. 나머지는 사용 횟수 순. 캡처 시트의 칩 순서에 사용. 저장하지 않고 계산한다.

## 6. 저장 플로우

### 6.1 진입 경로

세 경로가 모두 "URL을 들고 캡처 시트를 연다"로 수렴한다.

- **URL 입력창.** 메인 상단. 붙여 넣기 이벤트의 텍스트가 URL로 파싱되면 즉시 시트를 연다. Enter도 같다.
- **딥링크.** 앱이 `?url=` 파라미터와 함께 열리면 `history.replaceState`로 주소에서 지우고 시트를 연다. 토큰이 없으면 URL을 메모리에 들고 온보딩을 먼저 띄우고, 연결이 끝나면 시트를 연다.
- **iPhone 단축어.** 공유 시트에서 URL을 받아 URL 인코딩한 뒤 `https://<앱 도메인>/?url=<인코딩값>`을 연다. 세 액션짜리 단축어이고 설정 화면에 만드는 법을 적어 둔다. Safari에서 열린다. 설치된 PWA로 라우팅되지는 않는다.
- **북마클릿.** `javascript:void(window.open('<origin>/?url='+encodeURIComponent(location.href)))`. 설정 화면이 현재 origin으로 생성해 드래그할 수 있는 링크로 보여준다.

### 6.2 캡처 시트

- 열리는 즉시 URL을 정규화하고 중복을 검사한다. 이미 있으면 "이미 저장된 링크" 배너와 "열기" 버튼을 보이고 저장 버튼은 비활성화한다. "열기"는 해당 링크의 상세 시트로 전환한다.
- 중복이 아니면 즉시 `GET /api/metadata?url=`를 호출한다. 제목과 이미지 자리에는 스켈레톤. 응답이 오면 제목, description, 이미지, siteName을 채운다. 시트가 닫히면 요청을 중단한다.
- 입력 필드: 이미지 미리보기, 제목, URL 표시(읽기 전용), 노트, 태그 칩과 새 태그 입력. 저장과 취소.
- 태그 칩은 5.4의 최근 사용 순. 새 태그 입력에 이름을 치고 Enter하면 시트 안에서만 임시 태그로 만들어 선택 상태로 둔다. 실제 `addTag`는 저장을 누를 때 `addLink`보다 먼저 큐에 넣는다. 취소하면 태그도 만들어지지 않는다.
- 태그 이름은 대소문자와 앞뒤 공백을 무시하고 중복될 수 없다. 기존 이름을 입력하면 새로 만들지 않고 그 태그를 선택한다. 설정의 이름 변경에도 같은 규칙을 적용한다.
- 저장: `addLink`를 큐에 넣고 시트를 닫고 "저장됨" 토스트에 "실행 취소"를 붙인다. 가장 빠른 경로는 붙여 넣기와 저장, 조작 두 번이다.
- OG 실패: 제목을 호스트명으로 채우고 "정보를 가져오지 못했어요"를 시트 안에 조용히 표시한다. 저장을 막지 않는다.
- 제목이 빈 채로 저장하려 하면 호스트명으로 대체한다. 빈 제목은 저장되지 않는다.

### 6.3 상세·편집 시트

카드를 누르면 열린다. 모바일은 아래에서 올라오는 드로어, 데스크톱은 다이얼로그.

- 큰 이미지. 깨지면 파비콘, 그것도 없으면 첫 글자 아바타.
- 제목 편집. URL 편집 가능하며 저장 시 정규화하고 자기 자신을 제외한 중복 검사를 한다. 열기와 복사 버튼.
- description은 회색 읽기 전용. 옆에 "다시 가져오기" 버튼. 누르면 OG를 다시 호출해 제목, description, 이미지 세 칸의 폼 값을 바꾼다. 노트는 건드리지 않는다. 저장을 눌러야 반영된다.
- 노트 편집. 태그 토글과 새 태그 입력. 새 태그는 캡처 시트와 같은 규칙으로 저장 시점에 만든다. 고정 토글.
- 저장 버튼은 변경된 필드만 모아 `updateLink` 하나로 큐에 넣는다. 변경이 없으면 비활성.
- 삭제는 확인 다이얼로그를 거쳐 `deleteLink`. 토스트에 "실행 취소".
- 작게 생성일과 수정일을 표시한다.

글자 입력마다 저장하는 자동 저장은 두지 않는다. 변경 하나가 커밋 하나이기 때문이다.

## 7. 화면 구성

라우터를 쓰지 않는다. 경로는 `/` 하나이고 나머지는 상태로 전환되는 전체 화면과 시트다.

### 7.1 온보딩

토큰이 없을 때만 전체 화면으로 뜬다. 세 단계를 한 화면에 세로로 보여준다.

1. **데이터 레포 만들기.** 버튼이 `https://github.com/new?name=save-link-data&visibility=private`를 새 탭으로 연다. 파라미터가 무시될 수 있으므로 "Private를 선택하세요" 안내를 함께 둔다. 소유자 입력과 레포 이름 입력. 레포 이름 기본값 `save-link-data`.
2. **토큰 발급.** 버튼이 `https://github.com/settings/personal-access-tokens/new`를 연다. 아래에 선택해야 할 항목을 글로 적는다. 저장소는 방금 만든 것 하나만, 권한은 Contents 읽기·쓰기, 만료 1년.
3. **붙여 넣고 연결.** 토큰 입력과 "연결" 버튼. 누르면 GET을 보내고, 404면 초기 파일을 만들고, 성공하면 설정을 저장하고 메인으로 간다. 401이나 403이면 "토큰을 확인해 주세요", 그 외는 상태 코드와 함께 실패를 표시한다.

### 7.2 메인, 데스크톱

- 좌측 사이드바 고정 폭. 위에서부터 전체, 고정됨, 구분선, 태그 목록. 각 항목 오른쪽에 개수. 태그는 여러 개 선택 가능하고 OR로 합친다. 맨 아래 "태그 관리"가 설정의 태그 탭을 연다.
- 본문 상단에 URL 입력창과 검색창. 그 옆에 정렬 메뉴 하나.
- 카드 그리드. 화면 폭에 따라 2열 또는 3열. 카드는 위에 OG 이미지 16:9, 아래에 제목 두 줄, 사이트명과 날짜 한 줄, 노트 한 줄, 태그 칩. 호버 시 고정과 열기 버튼이 나타난다. 카드 전체 클릭은 상세 시트.
- 헤더에는 앱 이름, 동기화 상태 점, 설정 아이콘.

### 7.3 메인, 모바일

- 사이드바 없음. 검색창 아래에 가로 스크롤 칩 줄. 전체, 고정됨, 태그들.
- URL 입력창은 상단 고정.
- 카드는 컴팩트한 행. 좌측 썸네일 정사각형, 우측에 제목 두 줄, 사이트명과 날짜, 태그 칩 최대 세 개와 넘침 표시. 탭하면 상세 시트.

### 7.4 정렬과 검색

- 고정된 항목은 항상 먼저. 그 다음 선택한 정렬.
- 정렬 옵션: 최신순(`createdAt` 내림차순, 기본), 오래된순, 제목순(`localeCompare`, 한국어).
- 검색은 공백으로 나눈 토큰 전부가 제목, URL, 노트, description, siteName 중 어딘가에 대소문자 무관하게 포함되어야 일치.
- 필터와 정렬 상태는 세션 안에서만 유지한다.

### 7.5 설정 시트

탭 네 개.

- **연결.** 소유자, 레포, 경로, 토큰. 재연결 버튼. 연결 해제 버튼은 localStorage의 설정과 사본을 지운다.
- **태그.** 목록에서 이름 편집, 색 선택, 삭제. 삭제는 사용 중인 링크 수를 보여주고 확인을 받는다. 새 태그 추가.
- **모양.** 테마: 시스템, 라이트, 다크.
- **빠른 저장.** 북마클릿 드래그 링크. iPhone 단축어 만드는 법 세 줄.
- 맨 아래 정보: 링크 수, 파일 크기, 마지막 동기화 시각, 앱 버전.

### 7.6 빈 상태

- 링크가 하나도 없음: 안내 문구와 URL 입력창에 포커스.
- 필터 결과 없음: "조건에 맞는 링크가 없어요"와 필터 초기화 버튼.

## 8. 디자인 방향

현재 모습은 shadcn 기본값이라 템플릿처럼 보인다. 구현 시 프론트엔드 디자인 스킬을 적용해 아래 방향 안에서 실제 토큰 값을 정한다.

- **서체.** Pretendard Variable. npm 패키지의 dynamic subset CSS를 import해 자체 호스팅. 제목은 자간을 살짝 좁히고 본문은 줄간을 넉넉히.
- **색.** 순수 회색을 쓰지 않는다. 라이트는 미색이 섞인 종이 톤, 다크는 같은 온도의 차콜. 강조색은 하나만 두고 저장 버튼과 고정 표시에만 쓴다. 따뜻한 베이스와 대비되는 채도 중간의 색을 고른다. 태그 칩은 5.3의 열두 색조에 옅은 배경을 더한 형태로 통일한다.
- **형태.** 카드는 얇은 테두리와 넉넉한 둥글기. 그림자는 호버에서만. 이미지 아래쪽에 옅은 그라데이션.
- **움직임.** 시트 슬라이드, 칩 눌림, 스켈레톤 반짝임만. `prefers-reduced-motion`을 따른다.
- **밀도.** 모바일은 컴팩트, 데스크톱은 여유 있게. 터치 대상은 최소 44px.
- Tailwind v4의 `@theme`로 색, 반경, 간격을 변수로 정의하고 컴포넌트는 변수만 참조한다.

## 9. OG 서버리스 함수

경로 `api/metadata.ts`. Vercel Node 런타임. Web 표준 `Request`와 `Response`로 작성해 테스트에서 직접 호출할 수 있게 한다.

**요청.** `GET /api/metadata?url=<인코딩된 URL>`.

**응답.** 200에 `{ title: string, description: string, image: string | null, siteName: string }`. `siteName`이 비어 있으면 `www.`를 뗀 호스트명. `Cache-Control: public, s-maxage=86400, stale-while-revalidate=604800`.

**검사 순서.**
1. 출처 검사. `Sec-Fetch-Site` 헤더가 `same-origin`이면 통과. 그 헤더가 없으면 `Origin` 또는 `Referer`의 호스트가 요청 호스트와 같은지 본다. 같은 origin의 GET에는 브라우저가 `Origin`을 보내지 않으므로 `Referer`까지 봐야 한다. 개발 중 `localhost`는 허용. 어느 것도 없으면 403.
2. `url` 파싱 실패 또는 `http`, `https` 외 프로토콜이면 400.
3. 호스트가 `localhost`, 루프백, 사설 대역 IP 리터럴, 링크 로컬이면 400.
4. `redirect: 'manual'`로 요청하고 3xx는 최대 3회까지 직접 따라가며 각 목적지에 3을 다시 적용한다.
5. 5초 타임아웃. 응답 본문은 스트림으로 읽으며 512KB에서 끊는다.
6. 문자 인코딩은 `Content-Type`의 charset, 없으면 `<meta charset>`을 보고 `TextDecoder`로 해석한다. 실패하면 UTF-8.

**파싱.** `<meta>` 태그를 먼저 찾고 그 안의 속성을 순서와 무관하게 읽는다. 우선순위는 `og:*`, 그 다음 `twitter:*`, 그 다음 `<title>`과 `meta[name=description]`. 상대 경로 이미지는 최종 URL 기준으로 절대 경로로 바꾼다. HTML 엔티티는 기본 명명 엔티티와 10진, 16진 숫자 엔티티를 디코딩한다.

**오류.** 403 출처 불일치, 400 잘못된 URL, 408 타임아웃, 502 대상 응답 실패. 클라이언트는 200이 아니면 "메타데이터 없음"으로 처리한다.

**남는 위험.** 로그인이 없어 출처 검사는 브라우저 밖에서 우회된다. 반환값이 파싱된 네 필드뿐이고 크기와 시간 제한이 있어 악용 가치가 낮다고 판단해 감수한다. DNS 리바인딩은 막지 않는다.

## 10. 에러 처리

| 상황 | 감지 | 앱의 동작 |
|---|---|---|
| 토큰 없음 | 설정 없음 | 온보딩 전체 화면 |
| 토큰 만료, 권한 부족 | 401, 403 | 상태 점 빨강, 설정 시트 연결 탭 열림, 쓰기 큐 일시정지와 `pending` 유지, 상단 배너. 재연결 성공 시 큐 재개 |
| 파일 없음 | GET 404 | 초기 파일 생성 PUT |
| 쓰기 충돌 | PUT 409 | 최신본 GET 후 재적용, 같은 연산 최대 2회, 소진 시 연산 폐기와 토스트 |
| 네트워크 끊김 | fetch 실패, `navigator.onLine` | 읽기는 사본, 쓰기는 "오프라인이라 저장할 수 없어요"로 거절 |
| OG 실패 | 200 아님, 타임아웃 | 제목은 호스트명, 안내 문구, 저장 허용 |
| 파일 형식 깨짐 | zod 실패 | 쓰기 전부 차단, "파일 형식이 올바르지 않습니다. GitHub에서 확인해 주세요" |
| 지원하지 않는 version | `version !== 1` | 쓰기 차단, 버전 안내 |
| 파일 1MB 초과 | GET의 `content`가 빈 문자열이고 `size > 1MB` | 쓰기 차단, 한계 안내 |
| 이미지 깨짐 | `onError` | 파비콘, 첫 글자 아바타 순으로 대체 |
| 중복 URL | 정규화 후 일치 | 저장 비활성, "이미 저장된 링크"와 열기 버튼 |

## 11. 테스트

기존 Playwright 테스트는 실제 Supabase에 의존해 전부 폐기한다. 새 테스트는 외부 네트워크 없이 돈다.

**Vitest 유닛.**
- `normalizeUrl`: 스킴 보정, 소문자화, 해시 제거, 추적 파라미터 제거, 끝 슬래시, 거절 케이스.
- `extractMetadata`: og 우선순위, twitter 폴백, title 폴백, 속성 순서 뒤바뀜, 엔티티 디코딩, 상대 이미지 경로.
- `isPrivateUrl`: 루프백, 사설 대역, 링크 로컬, 프로토콜.
- `ops`: 여섯 연산 각각, `deleteTag`가 링크에서 제거하는지, `updateLink`가 `updatedAt`을 갱신하는지.
- `github`: base64 UTF-8 왕복, GET 404 처리, PUT 성공 시 sha 채택, 409 후 재읽기와 재적용, 2회 소진.
- `queue`: 직렬 실행, 실패한 연산만 폐기, 다음 연산 계속.
- `schema`: 올바른 파일 통과, 깨진 필드 거절, 알 수 없는 version 거절.
- 파생 값: 태그 사용 횟수, 최근 사용 태그 순서, 필터와 정렬.

**서버리스 함수.** 핸들러에 `Request`를 넘겨 직접 호출. `fetch`는 모킹. 출처 검사, SSRF 거절, 리다이렉트 추적, 크기 제한, 타임아웃, 응답 형식.

**Playwright E2E.** GitHub API와 `/api/metadata`를 `page.route`로 모킹. 모바일과 데스크톱 뷰포트 각 1개.
1. 온보딩에서 토큰 입력 후 연결, 초기 파일 생성.
2. URL 붙여 넣기, OG 채워짐, 저장, 목록에 나타남.
3. `?url=` 딥링크로 열어 캡처 시트가 열림.
4. 태그 필터와 검색 결과.
5. 상세 시트에서 노트 수정 후 저장, PUT 본문에 반영.

**CI.** GitHub Actions에서 타입체크, lint, Vitest, Playwright. 배포는 Vercel이 main 푸시마다 자동.

## 12. 스택과 프로젝트 구조

**스택.** Vite, React 19, TypeScript, Tailwind v4, shadcn/ui, vaul, lucide-react, sonner, zustand, zod, vite-plugin-pwa, Vitest, Testing Library, Playwright.

```
save-link/
├─ api/
│  └─ metadata.ts           OG 서버리스 함수
├─ src/
│  ├─ main.tsx
│  ├─ App.tsx               온보딩과 메인 전환
│  ├─ app/
│  │  ├─ Onboarding.tsx
│  │  ├─ Main.tsx           사이드바와 본문 레이아웃
│  │  └─ Settings.tsx       설정 시트
│  ├─ features/
│  │  ├─ links/             LinkCard, LinkRow, LinkGrid, CaptureSheet, DetailSheet, UrlInput
│  │  ├─ tags/              TagChip, TagSidebar, TagChipRow, TagManager, palette
│  │  └─ search/            SearchBar, SortMenu, filterLinks, sortLinks
│  ├─ vault/                React를 import하지 않는 데이터 계층
│  │  ├─ schema.ts          zod 스키마, 타입, version
│  │  ├─ ops.ts             순수 연산
│  │  ├─ github.ts          Contents API 클라이언트
│  │  ├─ queue.ts           직렬 쓰기 큐와 409 재시도
│  │  ├─ derive.ts          개수, 최근 태그
│  │  └─ store.ts           zustand 상태와 액션
│  ├─ metadata/
│  │  ├─ fetchMetadata.ts   /api/metadata 호출
│  │  └─ normalizeUrl.ts
│  ├─ components/ui/        shadcn
│  └─ lib/                  settings(localStorage), theme, useMediaQuery, useDebounce
├─ public/                  매니페스트 아이콘
├─ tests/e2e/
├─ vercel.json              헤더(CSP), 함수 설정
└─ vite.config.ts
```

**보안 헤더.** `vercel.json`에 CSP를 둔다. 스크립트와 스타일은 self, 연결은 self와 `https://api.github.com`, 이미지는 `https:` 전체와 `data:`, 폰트는 self. 토큰이 localStorage에 있으므로 서드파티 스크립트는 넣지 않는다.

**PWA.** 매니페스트 이름 SaveLink, `display: standalone`, 192와 512 아이콘, apple-touch-icon. 서비스 워커는 앱 셸만 프리캐시하고 `/api/`는 제외. `registerType: 'autoUpdate'`.

## 13. v1에서 가져올 것과 버릴 것

**가져오기.** `src/components/ui/*` shadcn 파일들, `api/metadata/route.ts`의 OG 파서와 SSRF 가드(9절에 맞게 개선), zod 폼 검증 패턴, `useDebounce`. `useMediaQuery`는 lint 오류가 있어 `useSyncExternalStore`로 재작성.

**버리기.** Supabase 클라이언트와 타입, 인증 모듈, 미들웨어, 로그인 페이지, 랜딩 페이지, Docs 도메인 전체, 하드코딩 태그 상수, React Query 훅과 Provider, SQL과 마이그레이션, 기존 Playwright 테스트, `SUPABASE_*.md`, `claudedocs/` DB 컨벤션 문서, `.playwright-mcp/` 스크린샷.

**git.** 이력은 보존한다. 기존 파일을 지우는 커밋 하나로 리셋한 뒤 그 위에 쌓는다. 커밋은 사용자가 요청할 때만 수행한다.

## 14. 한계

- 토큰이 브라우저 localStorage에 있다. XSS가 생기면 토큰이 유출된다. CSP와 서드파티 스크립트 배제로 낮추되 없애지는 못한다. 토큰 권한이 데이터 레포 하나뿐이라 피해 범위는 그 레포로 한정된다.
- Contents API의 JSON 응답 상한은 1MB다. 링크 1,000개가 약 0.5MB로 추정되므로 2,000개 근처에서 raw 엔드포인트 전환이나 연도별 분할이 필요하다.
- 두 기기가 같은 항목을 동시에 고치면 나중 쓰기가 이긴다. 충돌은 감지하되 필드 단위 병합은 하지 않는다.
- OG 함수는 출처 검사 외의 접근 제어가 없다.
- iPhone 딥링크는 Safari에서 열리고 설치된 PWA로 들어가지 않는다.
- GitHub가 내려가면 쓰기가 되지 않는다. 읽기는 사본으로 가능하다.

## 15. 결정 로그

| 결정 | 대안 | 이유 |
|---|---|---|
| Vite SPA | Next.js 유지 | 전부 클라이언트 코드라 서버 렌더링 층이 비용만 됨 |
| 브라우저가 GitHub 직접 호출 | 서버리스 경유, Gist | DB와 인증 서버 없음, 레포 단위 토큰, SHA 충돌 감지 |
| 파일 하나 | 태그와 링크 분리 | 쓰기가 항상 커밋 하나로 원자적 |
| 태그 여러 개 | 카테고리 하나 | 교차 분류, 기존 UI 재사용 |
| OG는 저장 시 수집 | 목록 로드 시 수집 | 즉시 표시, 링크 소멸에 견딤, 저장 전 편집 가능 |
| 노트와 description 분리 | 하나로 합침 | 다시 가져오기가 사용자 메모를 지우지 않음 |
| 명시적 저장 버튼 | 자동 저장 | 변경 하나가 커밋 하나 |
| 오프라인 쓰기 미지원 | 오프라인 큐 | 복잡도 대비 개인용 가치 낮음 |
