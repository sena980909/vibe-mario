# [개발 PRD v2.0] Vibe Mario: 고성능 2D 엔진 아키텍처

## 1. 아키텍처 디자인 패턴 (Design Patterns)

### 1.1 상태 패턴 (State Pattern)
- `PlayerState`: `StandingState`, `JumpingState`, `FallingState`, `HurtState` 등으로 분리하여 로직 복잡도 해결.
- 상태별로 다른 입력 처리 및 애니메이션 프레임 자동 할당.

### 1.2 옵저버 패턴 (Observer Pattern)
- 점수 증가, 아이템 획득 등의 이벤트를 UI 시스템과 분리하여 연동.

## 2. 핵심 고도화 로직

### 2.1 자산 프리로더 (Asset Preloader)
- `Image` 및 `Audio` 객체들을 사전에 로딩하고 로딩률(Percentage)을 반환하는 유틸리티 구현.
- `AssetManager`: 한 번 불러온 자산은 캐싱하여 재사용.

### 2.2 델타 타임 (Delta Time) 기반 물리
- `update(dt)`: `dt = currentTime - lastTime`.
- 프레임 레이트(30FPS, 144Hz 등)와 상관없이 일정한 속도로 이동하도록 모든 물리 연산에 `dt` 곱함.

### 2.3 타일 맵 최적화 (Culling)
- 캔버스 화면 밖의 타일은 렌더링하지 않아 대규모 맵에서도 60FPS 유지.

## 3. 데이터 구조 v2.0
- **World 데이터:** 스테이지 간 연결 관계 및 클리어 상태 정보.
- **Entity Pool:** 빈번한 객체 생성을 막기 위해 `Bullet`이나 `Particle`을 미리 생성해 두고 재사용.

## 4. 인프라 및 배포 (v2)
- **CI/CD:** GitHub Actions 연동하여 배포 전 테스트 자동 실행.
- **Vercel Edge:** 정적 자산(이미지, 사운드)의 빠른 로딩을 위해 Edge Network 최적화.
