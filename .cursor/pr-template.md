# PR Template

## PR 체크리스트
- [ ] 자기 코드 리뷰 완료
- [ ] 포맷팅/린트 무결성 확인 (`npm run lint` 등)
- [ ] 단위/통합 테스트 통과
- [ ] 변경 영향 범위와 롤백 전략 기재

## 목적 및 변경 사항
- 이 PR이 해결하는 문제/사용자 가치:
- 주요 변경 파일/모듈:
- 비호환 변경 여부(Breaking):

## 사용자 스토리 연계
- 관련 사용자 스토리: `US-003 백엔드 인수인계서 데이터 저장 및 관리`
- Acceptance Criteria 요약:
  - 인수인계서 CRUD 및 버전 관리 API가 동작한다
  - 인증된 사용자만 접근 가능하다

## 실행 방법 (로컬)
```bash
# Backend
cd backend
npm install
cp env.example .env    # 필요시 환경변수 설정
npx prisma db push
npm run db:seed        # 선택
npm run dev            # http://localhost:3000

# Frontend (정적 페이지)
cd ../frontend
# 브라우저로 pages/dashboard/index.html 또는 pages/handover/index.html 열기
# 또는 간이 서버
python -m http.server 8000  # 또는: npx serve pages
```

## 테스트 방법
```bash
cd backend
# 단위 테스트
npm run test:unit
# 통합 테스트
npm run test:integration
# 전체 테스트 및 커버리지
npm test
npm run test:coverage
```

## 검증 시나리오(수동)
- 서버 실행 후 `GET /health` 200 확인
- `POST /api/handovers` 생성 → `GET /api/handovers/:id` 조회 → `PUT` 수정 → `DELETE` 삭제 플로우 확인
- 인증 토큰 미포함 시 401 응답 확인

## 스크린샷/증빙(선택)
- 로컬 실행/테스트 캡처 첨부

## 관련 이슈/PR
- 링크: 

## 롤백 계획
- 배포 실패/이슈 시: 이전 태그로 롤백, DB 마이그레이션 리버트 지침


