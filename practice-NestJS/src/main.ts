import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';

/**
 * 애플리케이션 부트스트랩 함수
 * 
 * 이번 버전에서는 단순한 ValidationPipe 설정을 넘어서
 * 우리가 만든 고급 DTO들이 완벽하게 작동할 수 있도록
 * 모든 세부 설정을 최적화했습니다.
 * 
 * 마치 정교한 시계 공장에서 각각의 기어가 완벽하게 맞물려
 * 작동할 수 있도록 모든 부품을 정밀하게 조정하는 것과 같습니다.
 */
async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    // 로거 설정을 환경에 따라 조정
    logger: process.env.NODE_ENV === 'production' 
      ? ['error', 'warn', 'log'] 
      : ['error', 'warn', 'log', 'debug', 'verbose']
  });

  const configService = app.get(ConfigService);
  const isProduction = configService.get('NODE_ENV') === 'production';

  // ========================================================================
  // 🔍 고급 ValidationPipe 설정
  // ========================================================================

  /**
   * 이 ValidationPipe 설정은 우리가 만든 복잡한 DTO들의 모든 기능을
   * 완벽하게 지원하도록 세밀하게 조정되었습니다.
   * 
   * 각 옵션이 어떤 역할을 하는지 자세히 살펴보겠습니다.
   */
  app.useGlobalPipes(
    new ValidationPipe({
      /**
       * whitelist: DTO에 정의되지 않은 속성 자동 제거
       * 
       * 예를 들어, CreateProductDto에는 없는 'maliciousField'가 요청에 있다면
       * 이를 자동으로 제거합니다. 이는 보안상 매우 중요합니다.
       */
      whitelist: true,

      /**
       * forbidNonWhitelisted: 정의되지 않은 속성이 있으면 에러 발생
       * 
       * whitelist와 함께 사용하면, 허용되지 않은 필드가 포함된 요청을
       * 아예 거부합니다. 이는 API 남용을 방지하는 강력한 방어막입니다.
       */
      forbidNonWhitelisted: true,

      /**
       * transform: 자동 타입 변환 활성화
       * 
       * 문자열 "123"을 숫자 123으로, "true"를 boolean true로 자동 변환합니다.
       * 우리의 @Type(() => Number) 데코레이터들이 정상 작동하려면 필수입니다.
       */
      transform: true,

      /**
       * transformOptions: 변환 과정의 세부 설정
       * 
       * enableImplicitConversion을 true로 설정하면 @Type 데코레이터 없이도
       * 기본적인 타입 변환이 가능합니다. 하지만 명시적 선언을 선호하므로
       * false로 설정했습니다.
       */
      transformOptions: {
        enableImplicitConversion: false,
        // 순환 참조 문제를 방지합니다
        excludeExtraneousValues: true,
      },

      /**
       * validationError: 검증 에러 정보의 세부 수준 설정
       * 
       * 개발 환경에서는 디버깅을 위해 상세한 정보를 제공하고,
       * 프로덕션에서는 보안을 위해 최소한의 정보만 제공합니다.
       */
      validationError: {
        target: !isProduction, // 검증 대상 객체 정보 포함 여부
        value: !isProduction,  // 실제 입력값 정보 포함 여부
      },

      /**
       * disableErrorMessages: 에러 메시지 비활성화
       * 
       * 프로덕션에서는 내부 정보 노출을 방지하기 위해 비활성화할 수 있습니다.
       * 하지만 우리는 커스텀 메시지를 제공하므로 false로 설정합니다.
       */
      disableErrorMessages: false,

      /**
       * validatorOptions: class-validator 라이브러리의 세부 옵션
       * 
       * 이 설정들은 우리가 사용한 고급 검증 기능들이 올바르게 작동하도록 합니다.
       */
      validatorOptions: {
        // 첫 번째 에러에서 중단하지 않고 모든 에러를 수집
        skipMissingProperties: false,
        // 중첩된 객체의 검증을 활성화 (배열 내 객체 검증 등)
        skipNullProperties: false,
        skipUndefinedProperties: false,
        // 조건부 검증(@ValidateIf)을 정확히 처리
        whitelist: true,
        forbidNonWhitelisted: true,
        // 그룹별 검증 지원 (향후 확장 가능)
        groups: [],
        // 항상 모든 검증 규칙을 실행
        dismissDefaultMessages: false,
        // 검증 컨텍스트 정보 유지
        validationError: {
          target: !isProduction,
          value: !isProduction,
        }
      },

      /**
       * errorHttpStatusCode: 검증 실패 시 HTTP 상태 코드
       * 
       * 기본값은 400(Bad Request)이며, 이는 클라이언트 오류를 나타냅니다.
       * 우리의 비즈니스 로직상 이것이 가장 적절합니다.
       */
      errorHttpStatusCode: 400
    })
  );

  // ========================================================================
  // 🌐 네트워크 및 라우팅 설정
  // ========================================================================

  /**
   * CORS 설정 개선
   * 
   * 환경에 따라 다른 origin을 허용하도록 설정했습니다.
   * 프로덕션에서는 명시적으로 허용된 도메인만 접근할 수 있습니다.
   */
  const corsOrigins = isProduction
    ? configService.get('CORS_ORIGINS')?.split(',') || []
    : ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:8080'];

  app.enableCors({
    origin: corsOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  });

  /**
   * API 버전 관리 설정
   * 
   * 향후 API 버전 관리를 위한 기반을 마련합니다.
   * Header나 URI를 통한 버전 지정이 가능합니다.
   */
  app.enableVersioning({
    type: VersioningType.HEADER,
    header: 'X-API-Version',
    defaultVersion: '1',
  });

  /**
   * 전역 prefix 설정
   * 
   * 모든 API 엔드포인트 앞에 '/api'를 붙입니다.
   * 이는 웹서버에서 정적 파일과 API를 구분하는 데 유용합니다.
   */
  app.setGlobalPrefix('api', {
    exclude: ['/health', '/'] // 헬스체크 엔드포인트는 제외
  });

  // ========================================================================
  // 📚 Swagger API 문서 설정
  // ========================================================================

  /**
   * Swagger 설정 개선
   * 
   * 우리가 만든 복잡한 DTO들의 모든 검증 규칙과 비즈니스 로직이
   * API 문서에 정확히 반영되도록 설정했습니다.
   */
  if (!isProduction || configService.get('SWAGGER_ENABLED') === 'true') {
    const config = new DocumentBuilder()
      .setTitle(configService.get('API_TITLE') || 'NestJS Practice API')
      .setDescription(`
        ## 🚀 NestJS 베스트 프랙티스 API

        이 API는 실무에서 사용되는 NestJS 패턴들을 종합적으로 보여줍니다.

        ### ✨ 주요 기능
        - 🔐 JWT 기반 인증 시스템
        - 👥 사용자 관리 (RBAC 지원)
        - 📦 상품 관리 (고급 검증 로직)
        - 🛡️ 종합적인 보안 및 에러 처리
        - 📊 Redis를 활용한 성능 최적화

        ### 🔍 검증 시스템
        모든 API 엔드포인트는 엄격한 검증을 거칩니다:
        - 필드별 세부 검증 (타입, 길이, 형식 등)
        - 비즈니스 규칙 검증 (할인가격 < 정가 등)
        - 조건부 검증 (특정 조건에서만 필수)
        - 배열 및 중첩 객체 검증

        ### 📖 사용 방법
        1. 회원가입 또는 로그인으로 JWT 토큰 획득
        2. Authorization 헤더에 'Bearer {token}' 형식으로 토큰 포함
        3. API 호출 시 반환되는 표준화된 응답 형식 확인
      `)
      .setVersion(configService.get('API_VERSION') || '1.0.0')
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          name: 'JWT',
          description: 'JWT 토큰을 입력하세요',
          in: 'header',
        },
        'JWT-auth'
      )
      .addApiKey(
        {
          type: 'apiKey',
          name: 'X-API-Version',
          in: 'header',
          description: 'API 버전 (기본값: 1)'
        },
        'api-version'
      )
      .addTag('인증', '사용자 인증 관련 API')
      .addTag('사용자 관리', '사용자 CRUD 및 관리 API')
      .addTag('상품 관리', '상품 CRUD 및 재고 관리 API')
      .addTag('시스템', '헬스체크 및 시스템 정보 API')
      .build();

    const document = SwaggerModule.createDocument(app, config, {
      // 모든 DTO의 상세 정보를 문서에 포함
      deepScanRoutes: true,
      // 응답 예시 자동 생성
      operationIdFactory: (controllerKey: string, methodKey: string) => 
        `${controllerKey}_${methodKey}`
    });

    SwaggerModule.setup('api-docs', app, document, {
      swaggerOptions: {
        persistAuthorization: true,
        displayRequestDuration: true,
        docExpansion: 'none',
        filter: true,
        showExtensions: true,
        showCommonExtensions: true,
        syntaxHighlight: {
          theme: 'arta'
        }
      },
      customCss: `
        .swagger-ui .topbar { display: none; }
        .swagger-ui .info .title { font-size: 2rem; color: #1976d2; }
        .swagger-ui .info .description { font-size: 1.1rem; line-height: 1.6; }
      `,
      customSiteTitle: 'NestJS Practice API Documentation'
    });

    console.log(`📚 API 문서: http://localhost:${configService.get('PORT') || 3000}/api-docs`);
  }

  // ========================================================================
  // 🔧 시스템 설정
  // ========================================================================

  /**
   * Graceful Shutdown 설정
   * 
   * 애플리케이션 종료 시 모든 연결을 안전하게 정리합니다.
   * 이는 특히 데이터베이스와 Redis 연결 정리에 중요합니다.
   */
  app.enableShutdownHooks();

  /**
   * 서버 시작
   */
  const port = configService.get<number>('PORT') || 3000;
  await app.listen(port);

  // ========================================================================
  // 📋 시작 완료 로그
  // ========================================================================

  const serverUrl = `http://localhost:${port}`;
  
  console.log(`
  🎉 ===================================================
     NestJS Practice API 서버가 성공적으로 시작되었습니다!
  ===================================================

  🌐 서버 URL: ${serverUrl}/api
  📚 API 문서: ${serverUrl}/api-docs
  🏥 헬스체크: ${serverUrl}/health
  
  🔧 환경: ${configService.get('NODE_ENV')}
  📊 로그 레벨: ${app.getHttpAdapter().getInstance().get('env') === 'production' ? '최소' : '상세'}
  
  🚀 이제 다음과 같은 고급 기능들을 테스트할 수 있습니다:
     • 복잡한 비즈니스 규칙 검증 (할인가격 < 정가 등)
     • 조건부 필드 검증 (ValidateIf)
     • 배열 및 중첩 객체 검증
     • 자동 데이터 변환 (Transform)
     • 표준화된 에러 응답
     • JWT 기반 인증 시스템
  
  ===================================================
  `);
}

// ========================================================================
// 🚨 전역 에러 처리
// ========================================================================

/**
 * 처리되지 않은 Promise 거부 포착
 */
process.on('unhandledRejection', (reason, promise) => {
  console.error('🚨 처리되지 않은 Promise 거부:', reason);
  console.error('📍 Promise:', promise);
  // 프로덕션에서는 모니터링 시스템에 알림 발송
  process.exit(1);
});

/**
 * 처리되지 않은 예외 포착
 */
process.on('uncaughtException', (error) => {
  console.error('🚨 처리되지 않은 예외:', error);
  // 프로덕션에서는 모니터링 시스템에 알림 발송
  process.exit(1);
});

/**
 * 신호 처리 (Graceful Shutdown)
 */
['SIGINT', 'SIGTERM'].forEach((signal) => {
  process.on(signal, () => {
    console.log(`🛑 ${signal} 신호를 받았습니다. 애플리케이션을 종료합니다...`);
    process.exit(0);
  });
});

// 애플리케이션 시작
bootstrap().catch((error) => {
  console.error('❌ 애플리케이션 시작 중 치명적 오류:', error);
  process.exit(1);
});
