# 디딤돌 메인 대시보드

## 개요
디딤돌(didimdol) 시스템의 메인 대시보드 UI 구현입니다. 인수인계서 작성 및 관리 기능을 제공합니다.

## 기능
- 현재 진행 중인 인수인계서 현황 표시
- 새 인수인계서 작성 시작
- 기존 인수인계서 작업 계속
- 최근 완료된 인수인계서 목록
- 외부 시스템 연결 상태 확인
- 수집된 자료 현황 표시

## 기술 스택
- HTML5
- CSS3 (Flexbox, Grid)
- Vanilla JavaScript
- Inter 폰트

## 브라우저 지원
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## 실행 방법
1. `src/index.html` 파일을 브라우저에서 열기
2. 또는 로컬 서버 실행:
   ```bash
   # Python 3
   python -m http.server 8000
   
   # Node.js
   npx serve src
   ```

## 디자인 시스템
- **색상**: #e50012 (주요), #00c7bf (보조), #0fba82 (성공)
- **폰트**: Inter (400, 500, 600, 700)
- **레이아웃**: 1920x1080 데스크톱 최적화
- **반응형**: 1600px, 1200px, 768px, 480px 브레이크포인트

## 파일 구조
```
frontend/
├── pages/                      # 페이지별 파일
│   └── dashboard/              # 메인 대시보드
│       ├── index.html         # 대시보드 HTML
│       ├── styles.css         # 대시보드 스타일
│       └── script.js          # 대시보드 로직
├── shared/                     # 공통 자원
│   ├── styles/                # 공통 스타일
│   │   ├── variables.css      # CSS 변수
│   │   └── common.css         # 공통 스타일
│   └── scripts/               # 공통 스크립트
│       ├── utils.js           # 유틸리티 함수
│       └── api.js             # API 통신
├── assets/                     # 정적 자원
│   ├── images/                # 이미지 파일
│   └── fonts/                 # 폰트 파일
└── README.md                  # 프로젝트 문서
```

## 개발 완료 사항
- ✅ HTML 구조 생성
- ✅ CSS 스타일링 (Figma 디자인 기반)
- ✅ JavaScript 인터랙션
- ✅ 반응형 디자인
- ✅ 접근성 지원
- ✅ 애니메이션 효과

## 향후 구현 예정
- 실제 데이터 연동
- 페이지 라우팅
- 사용자 인증
- API 통신
