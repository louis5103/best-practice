# NestJS 백엔드 실습 프로젝트

이 프로젝트는 실제 프로덕션 환경을 고려한 현실적인 NestJS 백엔드 API 서버입니다. 

## 🎯 프로젝트 철학: 점진적 최적화

이 프로젝트는 **점진적 최적화(Progressive Optimization)** 원칙을 따릅니다. 마치 집을 짓는 것처럼 탄탄한 기초부터 시작해서, 필요에 따라 고급 기능을 추가해나가는 방식입니다.

### 현실적인 접근 방식
- 초기에는 단순하고 이해하기 쉬운 구조
- 실제 성능 문제가 발생할 때 최적화 도입
- 복잡성보다는 명확성과 유지보수성을 우선

## 🚀 주요 기술 스택

- **Framework**: NestJS (TypeScript)
- **Database**: PostgreSQL + TypeORM
- **Cache**: Redis (필요한 부분에만 적용)
- **Authentication**: JWT
- **Documentation**: Swagger/OpenAPI
- **Validation**: class-validator
- **Architecture**: 모듈 기반 설계

## 📋 주요 기능

### 인증 시스템
- 회원가입 및 로그인
- JWT 토큰 기반 인증
- 역할 기반 접근 제어 (RBAC)

### 사용자 관리
- 사용자 CRUD 작업
- 권한별 접근 제어
- 비밀번호 변경
- 통계 정보 (캐싱 적용)

### 상품 관리
- 상품 등록/수정/삭제 (관리자)
- 상품 목록 조회 (공개)
- 카테고리별 필터링
- 페이지네이션 지원

### 성능 최적화 (선택적 적용)
- 통계 데이터 캐싱
- 데이터베이스 인덱싱
- 페이지네이션

## 🛠️ 개발환경 세팅

### 1. 필수 소프트웨어 설치

```bash
# Node.js (v18 이상)
# https://nodejs.org/ 에서 다운로드

# Docker & Docker Compose
# https://www.docker.com/ 에서 다운로드
```

### 2. 프로젝트 클론 및 의존성 설치

```bash
# 프로젝트 디렉토리로 이동
cd ~/Desktop/git/practice-NestJS

# 의존성 설치
npm install
```

### 3. 환경 변수 설정

프로젝트 루트에 있는 `.env` 파일을 확인하고 필요에 따라 수정하세요:

```env
# 데이터베이스 설정
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=password
DB_NAME=practice_nestjs

# Redis 설정
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT 설정
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=24h

# 애플리케이션 설정
NODE_ENV=development
PORT=3000
```

### 4. 환경별 데이터베이스 실행

이 프로젝트는 개발, 테스트, 프로덕션 환경을 명확히 분리하여 관리합니다.

**기본 개발 환경 (가장 간단):**
```bash
# 필수 서비스만 실행 (PostgreSQL + Redis)
docker-compose up -d

# 서비스 상태 확인
docker-compose ps
```

**개발 환경 + 관리 도구:**
```bash
# 데이터베이스 관리 도구도 함께 실행
docker-compose -f docker-compose.dev.yml --profile tools up -d

# 접속 가능한 관리 도구:
# - pgAdmin: http://localhost:5050 (admin@example.com / admin)
# - Redis Commander: http://localhost:8081
```

**프로덕션 환경:**
```bash
# 보안이 강화된 프로덕션 설정
docker-compose -f docker-compose.prod.yml up -d
```

### 5. 애플리케이션 실행

```bash
# 개발 모드로 실행 (핫 리로드 지원)
npm run start:dev

# 성공 시 다음과 같은 메시지가 표시됩니다:
# 🚀 애플리케이션이 http://localhost:3000 에서 실행 중입니다
# 📚 API 문서는 http://localhost:3000/api-docs 에서 확인할 수 있습니다
```

### 6. API 문서 및 테스트

- **API 문서**: http://localhost:3000/api-docs
- **헬스체크**: http://localhost:3000/health

## 📚 학습 포인트: 실제 프로덕션에서의 모범 사례

### 의존성 관리의 현실
실제 프로덕션 환경에서는 사용하지 않는 패키지 하나하나가 보안 취약점이 될 수 있습니다. 이 프로젝트에서는 다음과 같은 현실적인 선택을 했습니다:

- `bcrypt` 선택 (bcryptjs 대신): 성능상 이점
- 불필요한 passport 패키지 제거: 커스텀 구현으로 대체
- uuid 패키지 제거: 실제로 사용하지 않았음

### 캐싱 전략의 현실
많은 튜토리얼에서는 모든 곳에 캐싱을 적용하지만, 실제로는 다음과 같이 접근합니다:

**캐싱이 필요한 경우:**
- 복잡한 계산이 필요한 통계 데이터
- 자주 조회되지만 자주 변경되지 않는 데이터
- 외부 API 호출 결과

**캐싱이 오히려 복잡성만 증가시키는 경우:**
- 단순한 ID 기반 조회 (이미 충분히 빠름)
- 자주 변경되는 개인화 데이터
- 캐시 무효화 로직이 비즈니스 로직보다 복잡해지는 경우

### 환경 분리의 중요성
개발, 테스트, 프로덕션 환경을 분리하는 것은 단순한 기술적 선택이 아닙니다:

**개발 환경**: 편의성과 빠른 피드백을 우선
**프로덕션 환경**: 보안과 안정성을 최우선

이는 마치 연습실과 공연장이 다른 것과 같습니다. 연습할 때는 편의를 위해 모든 도구를 사용하지만, 공연할 때는 꼭 필요한 것만 무대에 올립니다.

## 🎓 점진적 성장 로드맵

### Phase 1: 기초 다지기 (현재 상태)
- 기본적인 CRUD 작업
- 간단한 JWT 인증
- 기본적인 validation
- 통계 데이터만 캐싱

### Phase 2: 성장 단계 (실제 사용자 증가 시)
- 성능 모니터링 도입
- 더 복잡한 캐싱 전략
- API 문서 자동화 고도화
- 로깅 및 에러 추적 시스템

### Phase 3: 스케일링 단계 (대규모 트래픽 처리)
- 마이크로서비스 아키텍처 고려
- 데이터베이스 샤딩
- CDN 도입
- 로드 밸런싱

## 🔧 유용한 npm 스크립트

```bash
# 개발 모드 실행 (핫 리로드)
npm run start:dev

# 프로덕션 빌드
npm run build

# 프로덕션 모드 실행
npm run start:prod

# 테스트 실행
npm test

# 코드 포맷팅
npm run format

# 린팅
npm run lint
```

## 📝 API 사용 예시

### 회원가입 및 로그인
```bash
# 1. 회원가입
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "name": "홍길동",
    "password": "MyPassword123!",
    "passwordConfirm": "MyPassword123!"
  }'

# 2. 로그인
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "MyPassword123!"
  }'
```

### 상품 관리
```bash
# 상품 목록 조회 (인증 불필요)
curl -X GET "http://localhost:3000/api/products?page=1&limit=10"

# 사용자 정보 조회 (인증 필요)
curl -X GET http://localhost:3000/api/auth/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 🏗️ 프로젝트 구조

```
src/
├── main.ts                    # 애플리케이션 진입점
├── app.module.ts              # 루트 모듈
├── common/                    # 공통 기능
│   ├── decorators/           # 커스텀 데코레이터
│   └── guards/               # 인증/인가 가드
├── database/                  # 데이터베이스 관련
│   └── entities/             # TypeORM 엔티티
└── modules/                   # 기능별 모듈
    ├── auth/                 # 인증 모듈
    ├── users/                # 사용자 관리 모듈
    └── products/             # 상품 관리 모듈
```

## 🧪 테스트

```bash
# 단위 테스트
npm run test

# E2E 테스트
npm run test:e2e

# 테스트 커버리지
npm run test:cov
```

## 🚀 배포 고려사항

### 프로덕션 환경 체크리스트
- [ ] 환경 변수에서 모든 기본값 제거
- [ ] JWT_SECRET을 강력한 값으로 변경
- [ ] 데이터베이스 비밀번호 강화
- [ ] Redis에 비밀번호 설정
- [ ] HTTPS 적용
- [ ] 로그 레벨 조정
- [ ] 에러 메시지에서 민감한 정보 제거

## 💡 배운 점과 다음 단계

이 프로젝트를 통해 학습할 수 있는 핵심 개념들:

**아키텍처 관점:**
- 모듈 기반 설계의 장점
- 의존성 주입의 실제 활용
- 환경별 설정 분리의 중요성

**성능 관점:**
- 언제 최적화가 필요한지 판단하는 방법
- 캐싱 전략의 선택 기준
- 데이터베이스 쿼리 최적화

**보안 관점:**
- JWT 기반 인증의 구현
- 권한 기반 접근 제어 (RBAC)
- 환경별 보안 설정 차이

**개발 프로세스 관점:**
- 점진적 개발의 중요성
- 코드의 가독성과 유지보수성
- 실용주의적 접근 방법

## 📚 추천 학습 자료

- [NestJS 공식 문서](https://docs.nestjs.com/)
- [TypeORM 문서](https://typeorm.io/)
- [Redis 모범 사례](https://redis.io/documentation)
- [PostgreSQL 성능 튜닝](https://wiki.postgresql.org/wiki/Performance_Optimization)

## 🤝 실제 프로젝트 적용 가이드

이 프로젝트의 패턴을 실제 프로젝트에 적용할 때는 다음 순서를 추천합니다:

1. **기본 구조 설정**: 모듈 기반 아키텍처 구성
2. **인증 시스템 구축**: JWT 기반 인증 구현
3. **핵심 기능 구현**: 비즈니스 로직 구현 (캐싱 없이)
4. **성능 모니터링**: 실제 성능 문제 지점 파악
5. **점진적 최적화**: 필요한 부분에만 캐싱 도입
6. **환경 분리**: 개발/프로덕션 환경 설정 분리

이런 순서로 접근하면 과도한 엔지니어링을 피하면서도 확장 가능한 시스템을 구축할 수 있습니다.

---

**기억하세요**: 완벽한 시스템을 처음부터 만들려고 하지 마세요. 작동하는 시스템을 먼저 만들고, 실제 필요에 따라 점진적으로 개선해나가는 것이 성공적인 프로젝트의 비결입니다.
