# [테스트 PRD v2.0] Vibe Mario: 고도화 품질 관리 시스템

## 1. 테스트 자동화 (v2 추가)

### 1.1 유닛 테스트 (Unit Testing)
- **Physics Test:** 중력, 가속도, 마찰력 연산 값이 예상 범위 내인지 확인.
- **Collision Logic:** 특정 좌표에서의 충돌 판정 여부 확인 (예: x=32, y=64 에서 타일 1번과 충돌해야 함).

### 1.2 통합 테스트 (Integration Testing)
- **Scenario:** `GameStart -> Loading -> Play (Stage 1) -> Die (Pitfall) -> Respawn -> Finish -> Next Stage` 흐름 정상 작동 여부.

## 2. 성능 및 호환성 벤치마크 (v2)

### 2.1 프레임 안정성 (Frame Stability)
- **Low-end Device:** 모바일 브라우저에서도 최소 45FPS 유지 여부 확인.
- **High Refresh Rate:** 120Hz/144Hz 모니터에서 게임 속도가 2배로 빨라지는 버그(Delta Time 누락) 방지.

### 2.2 메모리 누수 (Memory Leak)
- 스테이지 재시작 시 엔티티 및 이벤트 리스너가 제대로 정리(Clean-up)되는지 크롬 개발자 도구로 확인.

## 3. 엣지 케이스 체크리스트 v2.0
- [ ] 게임 중 브라우저 탭을 나갔다 돌아올 때(Pause/Resume) 물리 엔진이 폭주(Delta Time 누적)하지 않는가?
- [ ] 창 크기를 갑자기 조절할 때 캔버스 해상도와 히트박스 비율이 일치하는가?
- [ ] 오디오 로딩 실패 시 에러가 발생하지 않고 게임이 계속 진행되는가?

## 4. 실제 사용자 테스트 (Beta Testing)
- 최소 3명의 테스터에게 Stage 1을 플레이하게 한 후 '조작감(Tightness)'에 대한 피드백 수집.
