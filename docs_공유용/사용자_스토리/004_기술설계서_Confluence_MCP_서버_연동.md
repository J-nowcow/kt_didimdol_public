# 004 기술설계서: Confluence MCP 서버 연동

**문서 버전**: v1.0  
**작성일**: 2025-09-19  
**작성자**: Architect (Winston)  
**연관 스토리**: `004_사용자스토리_Confluence_MCP_서버_연동.md`

---

## 1. 개요

- **목적**: Confluence에 저장된 문서를 MCP 서버를 통해 자동 수집하고, 메타데이터/본문을 하이브리드 DB(PostgreSQL/MongoDB)에 저장하며, 연결 상태를 실시간 노출한다.
- **범위**: Confluence MCP 서버, 오케스트레이터 연동, 데이터 수집 파이프라인, 저장, 상태 모니터링, 에러 처리.
- **비범위(Out of Scope)**: 고급 검색/필터, AI 분석·요약, 실시간 동기화, 타 SaaS 연동.

## 2. 요구사항 요약

- MCP 오케스트레이터에 Confluence MCP 서버 등록/해제
- Confluence API 인증 및 연결
- 문서·메타데이터 자동 수집, 중복 필터링, 출처 추적(URL, 페이지ID, 수집시간)
- 저장: PostgreSQL(메타데이터), MongoDB(본문), Redis(세션/캐시)
- 상태 모니터링 및 오류 처리(재시도, 대기, 알림)
- 성능: API 응답 ≤ 3s, 동시 수집 ≤ 100, 문서 ≤ 10MB, 진행률 실시간

## 3. 아키텍처

### 3.1 구성요소
- MCP 오케스트레이터: MCP 서버의 수명주기/상태 관리
- Confluence MCP 서버: Confluence API 래퍼, 수집 작업자(queue consumer)
- Backend(API, Node/Express/TS): 트리거/상태 조회/진행률 노출
- 데이터 계층: PostgreSQL(문서 메타), MongoDB(본문), Redis(작업큐/진행률 캐시)

### 3.2 데이터 흐름(시퀀스)
1) 사용자: 대시보드에서 Confluence 연결 및 수집 트리거  
2) Backend: 오케스트레이터에 작업 생성 → 큐에 투입  
3) Confluence MCP 서버 워커: API 호출 → 문서 페이징 수집 → 중복체크 → 저장  
4) 저장: 메타데이터(PostgreSQL), 본문(MongoDB), 진행률(Redis)  
5) Backend: 진행률/상태 조회 API로 UI에 실시간 표시

## 4. 데이터베이스 설계

### 4.1 PostgreSQL: 문서 메타데이터(`confluence_documents`)
- id(PK, UUID)
- space_key(varchar)
- page_id(varchar, unique)
- title(text)
- author(varchar)
- last_modified_at(timestamptz)
- url(text)
- collected_at(timestamptz)
- hash(varchar) — 중복 판단용(제목+수정시간 등 해시)
- source("confluence")

인덱스: (page_id unique), (last_modified_at), (space_key)

### 4.2 MongoDB: 문서 본문(`confluence_pages`)
- _id(ObjectId)
- pageId(string, unique)
- content(markdown/html/raw)
- attachments([{name, url, sizeBytes}])
- collectedAt(Date)

인덱스: pageId unique, text index(title/content) 추후 적용

### 4.3 Redis (keys 예시)
- progress: `collect:confluence:{jobId}:progress` (0-100)
- status: `collect:confluence:{jobId}:status` (pending|running|failed|done)
- rate-limit/backoff 키: `collect:confluence:ratelimit`

## 5. API 설계(백엔드)

Base: `/api/confluence`

- POST `/connect`  
  - req: { baseUrl, email, apiToken }  
  - res: { connected: true }
- POST `/collect`  
  - req: { spaces?: string[], since?: string, limit?: number }  
  - res: { jobId }
- GET `/status/{jobId}`  
  - res: { status, progress, collectedCount, error?: { code, message } }
- GET `/health`  
  - res: { ok: true, services: { confluence, db, redis } }

권한: 내부 사용자 인증 토큰 필요. 감사로깅 필수.

## 6. MCP 서버 설계

- 등록: 오케스트레이터에 `{ id: "confluence", endpoint, heartbeatIntervalMs }`
- 헬스체크: `/mcp/confluence/health` 200/ok
- 작업 수신: 큐 구독(`collect.confluence`)
- 수집 로직: 
  - 페이지네이션 호출(Confluence Cloud REST API: `/wiki/api/v2/pages` 등)
  - 레이트리밋 대응(429 시 지수백오프, 최소 30s 대기)
  - 변환: 본문은 원형 저장, 필요 시 HTML→MD 변환
  - 저장: upsert 전략(page_id 기준)
  - 진행률/상태 업데이트: Redis publish

## 7. 오류 처리/복구

- 네트워크/429: 최대 3회 재시도, 백오프(예: 5s, 15s, 30s)
- 부분 성공: 실패 문서는 스킵, 에러 이벤트 기록 및 관리자 알림 훅
- 영속 로그: 애플리케이션 로그/오류 로그/감사 로그 분리

## 8. 성능/용량 기준

- 응답시간(트리거 API): ≤ 3s  
- 동시 수집 문서: ≤ 100  
- 문서 크기: ≤ 10MB  
- 진행률: 실시간(≤ 1s 갱신)  
- 저장 처리량: 최소 20 docs/sec(평균) 목표

## 9. 보안/인증

- Backend↔MCP: 내부 네트워크/토큰 기반 인증
- Confluence 인증: API 토큰 보관 시 KMS/환경변수, 저장 금지
- 데이터 암호화: 전송 TLS, 민감 메타는 저장 시 암호화 고려
- 접근제어: 역할 기반(관리자만 수집 트리거 가능 옵션)

## 10. 모니터링/로깅

- Health: backend `/health`, MCP `/mcp/confluence/health`
- Metrics: 응답시간, 처리량, 실패율, 재시도 횟수
- Logs: 수집 시작/종료, 실패 내역, 외부 API 상태
- 알림: 실패율 임계치 초과 시 Slack/Email 훅

## 11. 테스트 전략

- 단위: Confluence API 클라이언트, 변환기, 중복체크
- 통합: 수집→저장 파이프라인 E2E, 레이트리밋 시나리오
- 성능: 1k 페이지 샘플 부하, 평균/95p 처리량 확인
- 회귀: DB 스키마 변경 시 조회/저장 영향 검증

## 12. 변경 영향/마이그레이션

- PostgreSQL 테이블 신설, 인덱스 추가 필요
- MongoDB 컬렉션 신설, 유니크 인덱스 생성
- 환경변수 추가: CONFLUENCE_BASE_URL, CONFLUENCE_EMAIL, CONFLUENCE_API_TOKEN

## 13. 개방 이슈(Open Questions)

- Cloud/Server 에디션별 API 차이 범위
- HTML→MD 변환 여부와 시점(저장 vs 조회)
- 다중 스페이스 대량 수집 시 스로틀링 정책

---

## 14. 참고 문서

- `004_사용자스토리_Confluence_MCP_서버_연동.md`
- `temp/Architect_기술설계서_작성요청서.md`
- Backend 코드: `backend/src/services/*`, `backend/src/routes/*`


