# JavaFX + Spring Boot Demo Application

> 실무에서 사용할 수 있는 JavaFX와 Spring Boot 통합 예제 프로젝트

## 📋 프로젝트 개요

이 프로젝트는 JavaFX와 Spring Boot를 통합하여 현대적이고 확장 가능한 데스크톱 애플리케이션을 개발하는 **실무 베스트 프랙티스**를 보여줍니다.

### 🎯 주요 목표

- **실용성**: 이론보다는 실제 업무에서 바로 사용할 수 있는 코드 제공
- **유지보수성**: 복잡성을 최소화하고 코드의 가독성과 확장성 우선시
- **안정성**: 외부 라이브러리 의존성을 줄이고 검증된 기술 스택만 사용

### 🛠 기술 스택

| 기술 | 버전 | 역할 |
|------|------|------|
| **Java** | 21 (LTS) | 기본 플랫폼 |
| **JavaFX** | 21.0.2 | GUI 프레임워크 |
| **Spring Boot** | 3.2.0 | 백엔드 프레임워크 |
| **Spring Data JPA** | 포함 | 데이터 액세스 |
| **H2 Database** | 포함 | 개발/데모용 데이터베이스 |
| **Maven** | 3.6+ | 빌드 도구 |
| **Lombok** | 포함 | 코드 간소화 |

## 🚀 빠른 시작

### 1. 사전 요구사항

- **Java 21 LTS** 이상 설치
- **Maven 3.6** 이상 설치
- **Git** 설치

### 2. 프로젝트 클론 및 실행

```bash
# 프로젝트 클론
git clone <repository-url>
cd javaFX-demo

# Maven으로 빌드 및 실행
mvn clean compile javafx:run

# 또는 Spring Boot로 실행 (패키징 후)
mvn clean package
java -jar target/javafx-demo-1.0.0.jar
```

### 3. 개발 모드로 실행

```bash
# 개발 모드 (상세 로그 + 샘플 데이터 로딩)
mvn spring-boot:run -Dspring-boot.run.profiles=dev
```

### 4. 첫 실행 시 확인사항

✅ 애플리케이션이 시작되면 자동으로 샘플 데이터가 로드됩니다  
✅ 사용자 관리 화면에서 10명의 테스트 사용자를 확인할 수 있습니다  
✅ H2 웹 콘솔 접속: `http://localhost:8080/h2-console`  
   - JDBC URL: `jdbc:h2:file:./data/demo`
   - Username: `sa`
   - Password: (빈 칸)

## 📁 프로젝트 구조

```
src/
├── main/
│   ├── java/com/company/javafxdemo/
│   │   ├── JavaFxDemoApplication.java     # 메인 애플리케이션 클래스
│   │   ├── controller/                    # JavaFX 컨트롤러들
│   │   │   └── MainController.java
│   │   ├── service/                       # 비즈니스 로직
│   │   │   └── UserService.java
│   │   ├── repository/                    # 데이터 액세스
│   │   │   └── UserRepository.java
│   │   ├── model/                         # JPA 엔티티
│   │   │   └── User.java
│   │   └── config/                        # 설정 클래스들
│   │       └── SampleDataInitializer.java
│   └── resources/
│       ├── fxml/                          # JavaFX 레이아웃 파일들
│       │   └── main.fxml
│       ├── css/                           # 스타일시트
│       │   └── application.css
│       └── application.yml                # Spring Boot 설정
└── test/
    └── java/                              # 단위 테스트들
        └── com/company/javafxdemo/service/
            └── UserServiceTest.java
```

## 🏗 아키텍처 설계 원칙

### 1. 계층화된 아키텍처

```
Presentation Layer (JavaFX)
       ↓
Business Logic Layer (Spring Services)
       ↓
Data Access Layer (Spring Data JPA)
       ↓
Database (H2/MySQL/PostgreSQL)
```

### 2. 의존성 주입 패턴

- **생성자 주입** 사용으로 불변성 보장
- **@RequiredArgsConstructor**로 코드 간소화
- 인터페이스 기반 설계로 테스트 용이성 확보

### 3. FXML과 CSS 분리

- UI 구조는 **FXML**로 선언적 정의
- 스타일링은 **CSS**로 완전 분리
- 디자이너와 개발자의 독립적 작업 가능

## 🎨 주요 기능

### 📊 사용자 관리

- ✅ 사용자 추가/수정/삭제 (실제로는 비활성화)
- ✅ 실시간 검색 (이름, 이메일)
- ✅ 부서별 필터링
- ✅ 입력 검증 및 실시간 피드백
- ✅ 상태 메시지 표시

### 🔍 데이터 관리

- ✅ JPA 기반 데이터 영속성
- ✅ 트랜잭션 관리
- ✅ 샘플 데이터 자동 생성
- ✅ H2 웹 콘솔 지원

### 🧪 테스트

- ✅ 단위 테스트 (Mockito)
- ✅ 핵심 비즈니스 로직 검증
- ✅ 경계값 및 예외 상황 테스트

## 🔧 설정 및 커스터마이징

### application.yml 주요 설정

```yaml
# 애플리케이션 기본 설정
app:
  ui:
    title: "JavaFX + Spring Boot Demo"
    width: 1000
    height: 700
    resizable: true
  data:
    load-sample-data: true  # 샘플 데이터 로딩 여부

# 데이터베이스 설정
spring:
  datasource:
    url: jdbc:h2:file:./data/demo
    username: sa
    password: 
  
  # JPA 설정
  jpa:
    hibernate:
      ddl-auto: create-drop  # 개발용 (프로덕션에서는 validate 사용)
    show-sql: true
```

### 프로파일별 설정

- **기본**: 일반 개발 환경
- **dev**: 상세 로그 + 샘플 데이터
- **prod**: 최적화된 프로덕션 설정

## 🧪 테스트 실행

```bash
# 모든 테스트 실행
mvn test

# 특정 테스트 클래스만 실행
mvn test -Dtest=UserServiceTest

# 테스트 커버리지 확인 (JaCoCo 플러그인 추가 시)
mvn jacoco:report
```

## 📦 배포

### 1. 실행 가능한 JAR 생성

```bash
mvn clean package
java -jar target/javafx-demo-1.0.0.jar
```

### 2. 네이티브 이미지 생성 (선택사항)

```bash
# jlink로 커스텀 런타임 생성
jlink --module-path target/modules --add-modules javafx.controls,javafx.fxml \
      --output target/custom-runtime

# jpackage로 플랫폼별 설치 파일 생성
jpackage --input target --main-jar javafx-demo-1.0.0.jar \
         --main-class com.company.javafxdemo.JavaFxDemoApplication \
         --runtime-image target/custom-runtime
```

## 🤝 개발 가이드라인

### 코드 스타일

- **일관성**: 동일한 패턴과 명명 규칙 유지
- **가독성**: 주석과 의미있는 변수명 사용
- **단순성**: 과도한 추상화보다는 명확한 구조 우선

### 새로운 기능 추가

1. **Model**: 필요시 새로운 엔티티 추가
2. **Repository**: 데이터 액세스 메서드 정의
3. **Service**: 비즈니스 로직 구현
4. **Controller**: UI 이벤트 처리
5. **FXML**: 화면 레이아웃 정의
6. **CSS**: 스타일링 적용
7. **Test**: 단위 테스트 작성

### 데이터베이스 변경

```yaml
# PostgreSQL 사용 예시
spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/javafx_demo
    username: your_username
    password: your_password
    driver-class-name: org.postgresql.Driver
  jpa:
    database-platform: org.hibernate.dialect.PostgreSQLDialect
```

## 🐛 문제 해결

### 자주 발생하는 문제들

**Q: JavaFX runtime components are missing 오류**
```bash
# 해결방법: JavaFX 모듈 경로 명시
java --module-path /path/to/javafx/lib --add-modules javafx.controls,javafx.fxml -jar app.jar
```

**Q: H2 데이터베이스 파일 위치**
```
# 기본 위치: 프로젝트 루트/data/demo.mv.db
# 변경하려면 application.yml의 spring.datasource.url 수정
```

**Q: CSS 스타일이 적용되지 않음**
```java
// FXML에서 올바른 CSS 클래스명 확인
// CSS 파일이 resources/css/ 경로에 있는지 확인
```

## 📚 추가 학습 자료

- [JavaFX 공식 문서](https://openjfx.io/)
- [Spring Boot 공식 문서](https://spring.io/projects/spring-boot)
- [Spring Data JPA 가이드](https://spring.io/projects/spring-data-jpa)

## 📄 라이선스

이 프로젝트는 교육 및 학습 목적으로 제공됩니다.

## 👥 기여하기

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

**💡 Tip**: 이 프로젝트는 실무에서 바로 사용할 수 있도록 설계되었습니다. 복잡한 기능보다는 안정성과 유지보수성에 중점을 두었으므로, 프로덕션 환경에서도 안심하고 사용하실 수 있습니다.
