# 디딤돌 백엔드 API

인수인계서 데이터 저장 및 관리 백엔드 시스템

## 🚀 시작하기

### 개발 환경 설정

1. **의존성 설치**
```bash
cd backend
npm install
```

2. **환경 변수 설정**
```bash
cp env.example .env
```

3. **데이터베이스 설정**
```bash
# PostgreSQL 스키마 생성
npx prisma db push

# 테스트 데이터 생성
npm run db:seed
```

4. **개발 서버 실행**
```bash
npm run dev
```

### Docker로 실행

```bash
# 전체 스택 실행
docker-compose up -d

# 백엔드만 실행
docker-compose up backend
```

## 📚 API 문서

### 기본 엔드포인트

- **Health Check**: `GET /health`
- **API Base**: `http://localhost:3000/api`

### 인수인계서 API

> **인증 필요**: 모든 `/api/*` 요청은 `Authorization: Bearer <JWT>` 헤더가 필요합니다. 프론트엔드 개발 중에는 브라우저 콘솔에서 `localStorage.setItem('didimdol.authToken', '<발급받은 JWT>')` 로 토큰을 저장하면 공통 API 모듈이 자동으로 사용합니다.

| Method | Endpoint | Description |
|------|----------|-------------|
| GET | `/api/handovers` | 인수인계서 목록 조회 |
| POST | `/api/handovers` | 인수인계서 생성 |
| GET | `/api/handovers/:id` | 인수인계서 상세 조회 |
| PUT | `/api/handovers/:id` | 인수인계서 수정 |
| DELETE | `/api/handovers/:id` | 인수인계서 삭제 |
| POST | `/api/handovers/:id/versions` | 버전 생성 |
| GET | `/api/handovers/:id/versions` | 버전 목록 조회 |
| POST | `/api/handovers/:id/share` | 인수인계서 공유 |
| GET | `/api/handovers/:id/shares` | 공유 목록 조회 |
| DELETE | `/api/handovers/:id/shares/:shareId` | 공유 삭제 |
| GET | `/api/handovers/:id/comments` | 댓글 목록 조회 |
| POST | `/api/handovers/:id/comments` | 댓글 작성 |
| PUT | `/api/comments/:id` | 댓글 수정 |
| DELETE | `/api/comments/:id` | 댓글 삭제 |

### 사용자 API

| Method | Endpoint | Description |
|------|----------|-------------|
| GET | `/api/users` | 사용자 목록 조회 |
| GET | `/api/users/:id` | 사용자 상세 조회 |
| PUT | `/api/users/:id` | 사용자 정보 수정 |
| GET | `/api/users/:id/handovers` | 사용자 인수인계서 목록 |

### 백업 API

| Method | Endpoint | Description |
|------|----------|-------------|
| POST | `/api/backup/create` | PostgreSQL + MongoDB 전체 백업 생성 (gzip)|
| GET | `/api/backup/list` | 백업 파일 목록 조회 |
| GET | `/api/backup/status` | 백업 상태 요약 |
| POST | `/api/backup/restore/:backupId` | 선택한 백업으로 복구 |
| DELETE | `/api/backup/:backupId` | 백업 파일 삭제 |

## 🏗️ 아키텍처

### 기술 스택

- **Runtime**: Node.js 18+
- **Framework**: Express.js 4.x
- **Language**: TypeScript 5.x
- **Database**: PostgreSQL 15+ (메타데이터), MongoDB 6.x (문서 데이터)
- **Cache**: Redis 7.x
- **ORM**: Prisma (PostgreSQL), Mongoose (MongoDB)

### 데이터베이스 구조

#### PostgreSQL (메타데이터)
- `users`: 사용자 정보
- `handover_documents`: 인수인계서 메타데이터
- `handover_versions`: 버전 관리
- `handover_shares`: 공유 관리
- `handover_comments`: 댓글 관리

#### MongoDB (문서 데이터)
- `handover_content`: 인수인계서 본문
- `handover_templates`: 템플릿 관리

## 🔧 개발 명령어

```bash
# 개발 서버 실행
npm run dev

# 프로덕션 빌드
npm run build

# 프로덕션 실행
npm start

# 테스트 실행
npm test

# 린팅
npm run lint

# 데이터베이스 마이그레이션
npm run db:migrate

# 테스트 데이터 생성
npm run db:seed
```

## 📊 성능 최적화

### 캐싱 전략
- **Redis**: 자주 조회되는 데이터 캐싱
- **TTL**: 1시간 (사용자 데이터), 30분 (인기 데이터)
- **무효화**: 데이터 변경 시 관련 캐시 자동 삭제

### 데이터베이스 최적화
- **인덱싱**: 자주 조회되는 필드에 인덱스 설정
- **연결 풀링**: 데이터베이스 연결 최적화
- **쿼리 최적화**: N+1 문제 해결

## 🔒 보안

### 인증 및 인가
- **JWT**: 토큰 기반 인증
- **권한 관리**: 문서별 접근 권한 제어
- **Rate Limiting**: API 호출 제한

### 데이터 보안
- **암호화**: 민감한 데이터 필드 암호화
- **TLS**: 전송 중 데이터 암호화
- **입력 검증**: 모든 입력 데이터 검증

## 📝 로깅

### 로그 레벨
- **ERROR**: 에러 및 예외 상황
- **WARN**: 경고 및 성능 이슈
- **INFO**: 일반적인 정보
- **DEBUG**: 개발 시 디버깅 정보

### 로그 파일
- `logs/error.log`: 에러 로그
- `logs/combined.log`: 전체 로그

## 🚀 배포

### Docker 배포
```bash
# 이미지 빌드
docker build -t didimdol-backend .

# 컨테이너 실행
docker run -p 3000:3000 didimdol-backend
```

### 환경 변수
```bash
# 데이터베이스
DATABASE_URL="postgresql://user:password@localhost:5432/didimdol"
MONGODB_URI="mongodb://user:password@localhost:27017/didimdol"
REDIS_URL="redis://localhost:6379"

# JWT
JWT_SECRET="your-secret-key"
JWT_EXPIRES_IN="7d"

# 서버
PORT=3000
NODE_ENV="production"
```

## 🤝 기여하기

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 라이선스

This project is licensed under the MIT License.
