# [디버그 모드 PRD v2.0] Vibe Mario: 실시간 분석 및 개발자 콘솔

## 1. 개요 (Objective)
- **목적:** 복잡한 물리 상호작용과 자산 로딩 상태를 분석하여 고난도 버그를 즉각 식별.

## 2. 핵심 기능 고도화 (v2 추가)

### 2.1 실시간 속도 및 힘 시각화 (Velocity & Forces)
- **Velocity Vector:** 객체 중심에서 현재 이동 방향과 속도 크기에 비례하는 화살표(Vector) 표시.
- **Raycast Lines:** 플레이어 발밑에 짧은 선을 그려 지면 감지(Ground Detection) 레이가 작동 중인지 시각화.

### 2.2 실시간 데이터 수정 (Runtime Editor)
- **Cheat Console:** 특정 키 입력 시 콘솔 창 활성화.
  - `setGravity(0.5)`: 실시간 중력 수정.
  - `spawnEnemy(x, y)`: 특정 위치에 적 생성.
  - `nextStage()`: 다음 스테이지 강제 이동.

### 2.3 자산 추적 모니터 (Asset Tracker)
- **Memory Monitor:** 현재 캔버스에 그려지는 스프라이트 수와 로드된 이미지 메모리 용량 표시.
- **Audio Debugger:** 재생 중인 사운드 채널 수와 현재 BGM 트랙 확인.

## 3. 기술적 구현 방안 v2.0
- **Overlay Component:** React 상단 레이어에 투명한 전용 디버그 UI 컴포넌트 배치 (Z-index 활용).
- **Log System:** 브라우저 콘솔 외에 화면 우측 하단에 최근 5개의 게임 로그(예: "Coin collected", "Player hit") 실시간 출력.

## 4. 활용 사례 (v2)
- **프레임 드랍 원인 파악:** `FPS` 모니터와 `Entities Count`를 대조하여 연산량 과다 지점 식별.
- **맵 밸런싱:** 중력과 이동 속도를 실시간으로 조절하며 가장 '찰진' 조작감(Game Feel)을 즉석에서 실험.
