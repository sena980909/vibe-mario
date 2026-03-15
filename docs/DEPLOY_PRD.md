# [배포 PRD v2.0] Vibe Mario: 자동화 및 무중단 배포 전략

## 1. 개요 (Objective)
- **목적:** GitHub와 Vercel을 연동하여 코드 수정 시 자동으로 빌드/배포되는 파이프라인 구축.
- **핵심 가치:** 환경 일관성 유지, 빠른 롤백(Rollback) 능력 확보, 정적 자산(Asset) 최적화.

## 2. 형상 관리 전략 (Git Strategy)

### 2.1 브랜치 전략 (Branching Model)
- **`main`:** 프로덕션 환경. 항상 안정적인 코드만 유지.
- **`develop`:** 개발 통합 브랜치. 기능 구현 후 병합되는 곳.
- **`feature/기능명`:** 개별 기능 개발용 브랜치. 완료 후 `develop`으로 PR(Pull Request).

### 2.2 커밋 컨벤션 (Commit Convention)
- `feat:` 새로운 기능 추가
- `fix:` 버그 수정
- `docs:` 문서 수정
- `refactor:` 코드 리팩토링
- `perf:` 성능 개선

## 3. Vercel 배포 설정 (Deployment Configuration)

### 3.1 빌드 설정 (Build Settings)
- **Framework Preset:** Vite
- **Build Command:** `npm run build`
- **Output Directory:** `dist`
- **Install Command:** `npm install`

### 3.2 환경 변수 (Environment Variables)
- `VITE_APP_ENV`: `development` 또는 `production` 구분.
- `VITE_DEBUG_MODE`: 배포 시 디버그 모드 강제 비활성화 여부.

### 3.3 Vercel Edge Network 최적화
- **Caching:** 게임 자산(이미지, 사운드)은 변경이 잦지 않으므로 `Cache-Control` 헤더를 통해 브라우저 캐싱 극대화.
- **Region:** 사용자와 가까운 위치에서 자산을 서빙하여 로딩 시간 단축.

## 4. 품질 보증 및 보안 (QA & Security)

### 4.1 배포 전 체크리스트 (Pre-deployment Checklist)
- [ ] `npm run build` 실행 시 에러나 경고(Warning)가 없는가?
- [ ] 모든 자산(Image, Audio)의 경로가 상대 경로로 올바르게 설정되었는가? (Vercel 배포 시 경로 깨짐 방지)
- [ ] `console.log` 및 디버그 전용 코드가 제거되었는가?

### 4.2 보안 헤더 설정 (`vercel.json`)
- XSS 공격 방지 및 클릭재킹 방지를 위한 보안 헤더 적용.

## 5. 모니터링 및 복구 (Monitoring & Rollback)
- **Vercel Analytics:** 실시간 방문자 수 및 성능(LCP, CLS) 지표 모니터링.
- **Instant Rollback:** 치명적 버그 발견 시 Vercel 대시보드에서 10초 이내에 이전 버전으로 즉시 복구.
