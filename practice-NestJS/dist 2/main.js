"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const config_1 = require("@nestjs/config");
const global_exception_filter_1 = require("./common/filters/global-exception.filter");
const response_transform_interceptor_1 = require("./common/interceptors/response-transform.interceptor");
const logging_interceptor_1 = require("./common/interceptors/logging.interceptor");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule, {
        logger: process.env.NODE_ENV === 'production'
            ? ['error', 'warn', 'log']
            : ['error', 'warn', 'log', 'debug', 'verbose']
    });
    const configService = app.get(config_1.ConfigService);
    const isProduction = configService.get('NODE_ENV') === 'production';
    app.useGlobalFilters(new global_exception_filter_1.GlobalExceptionFilter());
    app.useGlobalInterceptors(new logging_interceptor_1.LoggingInterceptor(), new response_transform_interceptor_1.ResponseTransformInterceptor());
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: {
            enableImplicitConversion: false,
            excludeExtraneousValues: true,
        },
        disableErrorMessages: false,
        stopAtFirstError: false,
        skipMissingProperties: false,
        dismissDefaultMessages: false,
        errorHttpStatusCode: 400
    }));
    app.enableCors({
        origin: isProduction
            ? [
                'https://yourdomain.com',
                'https://www.yourdomain.com',
                'https://admin.yourdomain.com'
            ]
            : [
                'http://localhost:3000',
                'http://localhost:3001',
                'http://localhost:4200',
                'http://localhost:5173',
                'http://localhost:8080',
            ],
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
    });
    app.setGlobalPrefix('api', {
        exclude: [
            'health',
            '',
        ],
    });
    if (!isProduction) {
        const config = new swagger_1.DocumentBuilder()
            .setTitle(configService.get('API_TITLE') || 'NestJS Practice API')
            .setDescription(`
        ## 🎉 NestJS 베스트 프랙티스 API - 6단계 완성!

        ### ✨ 완성된 6단계 고급 기능들

        #### 🛡️ 전역 예외 처리 시스템
        - **일관된 에러 응답**: 모든 예외가 표준화된 형태로 처리됩니다
        - **데이터베이스 에러 변환**: PostgreSQL 에러코드 → 사용자 친화적 메시지
        - **민감정보 자동 마스킹**: 로그에서 비밀번호, 토큰 등 자동 제거
        - **환경별 에러 처리**: 개발환경에서는 상세한, 프로덕션에서는 간결한 에러 정보

        #### 📊 응답 표준화 시스템
        - **모든 응답 통일**: success, data, timestamp, path 형태로 표준화
        - **페이지네이션 자동 처리**: items와 meta를 자동으로 구조화
        - **Health Check 특별 처리**: 시스템 상태 확인용 특별 응답 형태
        - **프론트엔드 친화적**: 예측 가능한 응답 구조로 개발 생산성 향상

        #### 🔍 체계적 로깅 시스템
        - **요청/응답 전체 추적**: 모든 API 호출을 체계적으로 기록
        - **성능 모니터링**: 응답 시간 측정 및 느린 요청 자동 감지
        - **보안 로깅**: 민감한 정보는 마스킹하여 안전하게 기록
        - **요청 추적 ID**: 동일한 요청의 모든 로그를 연결하여 추적 가능

        #### ⚡ 고급 데이터 검증
        - **복잡한 비즈니스 규칙**: 할인가격 < 정가 같은 비즈니스 로직 검증
        - **조건부 검증**: @ValidateIf로 특정 조건에서만 필수 필드 설정
        - **배열 검증**: 중첩된 객체 배열까지 완벽하게 검증
        - **자동 데이터 변환**: @Transform으로 데이터 자동 변환

        ### 🚀 API 테스트 가이드

        #### 1. 회원가입
        \`\`\`bash
        curl -X POST http://localhost:3000/api/auth/register \\
          -H "Content-Type: application/json" \\
          -d '{
            "email": "test@example.com",
            "name": "홍길동",
            "password": "SecurePass123!",
            "passwordConfirm": "SecurePass123!"
          }'
        \`\`\`

        #### 2. 로그인 (JWT 토큰 획득)
        \`\`\`bash
        curl -X POST http://localhost:3000/api/auth/login \\
          -H "Content-Type: application/json" \\
          -d '{
            "email": "test@example.com",
            "password": "SecurePass123!"
          }'
        \`\`\`

        #### 3. 상품 생성 (고급 검증 테스트)
        \`\`\`bash
        curl -X POST http://localhost:3000/api/products \\
          -H "Content-Type: application/json" \\
          -H "Authorization: Bearer YOUR_JWT_TOKEN" \\
          -d '{
            "name": "스마트폰",
            "price": 100000,
            "discountPrice": 85000,
            "category": "ELECTRONICS",
            "tags": ["smartphone", "mobile"],
            "isOnSale": true
          }'
        \`\`\`

        ### 📋 표준화된 응답 형태

        #### 성공 응답
        \`\`\`json
        {
          "success": true,
          "data": { "id": 1, "name": "상품명" },
          "timestamp": "2024-01-15T10:30:00.000Z",
          "path": "/api/products"
        }
        \`\`\`

        #### 에러 응답
        \`\`\`json
        {
          "success": false,
          "error": {
            "status": 400,
            "message": "입력값 검증에 실패했습니다.",
            "timestamp": "2024-01-15T10:30:00.000Z",
            "path": "/api/products",
            "validationErrors": ["가격은 0보다 커야 합니다"]
          }
        }
        \`\`\`

        ---
        **🏆 축하합니다! 이제 여러분은 엔터프라이즈급 NestJS 백엔드 시스템을 완성했습니다.**
      `)
            .setVersion(configService.get('API_VERSION') || '1.0.0')
            .addBearerAuth({
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
            name: 'JWT',
            description: '로그인 후 받은 JWT 토큰을 여기에 입력하세요',
            in: 'header',
        }, 'JWT-auth')
            .addTag('🔐 auth', '인증 관련 API - 회원가입, 로그인, 프로필 관리')
            .addTag('👥 users', '사용자 관리 API - CRUD 및 권한 관리')
            .addTag('📦 products', '상품 관리 API - 고급 검증 및 비즈니스 로직')
            .addTag('💗 health', '시스템 상태 확인 API - 서버 및 데이터베이스 상태')
            .build();
        const document = swagger_1.SwaggerModule.createDocument(app, config, {
            deepScanRoutes: true,
        });
        swagger_1.SwaggerModule.setup('api-docs', app, document, {
            swaggerOptions: {
                persistAuthorization: true,
                tagsSorter: 'alpha',
                operationsSorter: 'alpha',
                displayRequestDuration: true,
                filter: true,
                tryItOutEnabled: true,
            },
            customCss: `
        .swagger-ui .topbar { display: none; }
        .swagger-ui .info { margin-bottom: 30px; }
        .swagger-ui .info .title {
          font-size: 2.5rem;
          color: #1976d2;
          margin-bottom: 20px;
        }
        .swagger-ui .info .description {
          font-size: 1.1rem;
          line-height: 1.8;
          color: #555;
        }
        .swagger-ui .scheme-container {
          background: #f8f9fa;
          padding: 20px;
          border-radius: 8px;
          margin-bottom: 20px;
        }
      `,
            customSiteTitle: '🚀 NestJS Practice API - 6단계 완성!',
        });
    }
    app.enableShutdownHooks();
    const port = configService.get('PORT') || 3000;
    await app.listen(port);
    const appUrl = `http://localhost:${port}`;
    console.log('');
    console.log('🎉 ============================================');
    console.log('   🏆 6단계 완성: 엔터프라이즈급 NestJS API   ');
    console.log('🎉 ============================================');
    console.log('');
    console.log(`🌟 서버 정보:`);
    console.log(`   📍 API 서버: ${appUrl}/api`);
    console.log(`   📚 API 문서: ${appUrl}/api-docs`);
    console.log(`   💗 Health Check: ${appUrl}/health`);
    console.log(`   🌍 환경: ${configService.get('NODE_ENV') || 'development'}`);
    console.log('');
    console.log('✨ 완성된 6단계 고급 기능들:');
    console.log('   🛡️  전역 예외 처리 시스템');
    console.log('   📊  응답 표준화 시스템');
    console.log('   🔍  체계적 로깅 시스템');
    console.log('   ⚡  고급 데이터 검증');
    console.log('   🔐  JWT 기반 인증');
    console.log('   👥  사용자 관리 (RBAC)');
    console.log('   📦  상품 관리 (비즈니스 로직)');
    console.log('');
    console.log('🚀 주요 API 엔드포인트:');
    console.log('   POST /api/auth/register  - 회원가입');
    console.log('   POST /api/auth/login     - 로그인');
    console.log('   GET  /api/auth/profile   - 프로필 조회');
    console.log('   GET  /api/users          - 사용자 목록');
    console.log('   POST /api/products       - 상품 생성');
    console.log('   GET  /api/products       - 상품 목록');
    console.log('   GET  /health             - 시스템 상태');
    console.log('');
    if (!isProduction) {
        console.log('🔧 개발 모드 활성화:');
        console.log('   - 상세한 에러 메시지');
        console.log('   - Swagger API 문서');
        console.log('   - 자세한 로깅');
        console.log('   - 모든 CORS 요청 허용');
        console.log('');
        console.log('💡 빠른 테스트:');
        console.log(`   curl ${appUrl}/health`);
        console.log(`   curl ${appUrl}/api/products`);
        console.log('');
    }
    console.log('🎯 다음 단계 추천:');
    console.log('   1. Swagger에서 API 문서 확인');
    console.log('   2. 회원가입/로그인으로 JWT 토큰 획득');
    console.log('   3. 상품 생성으로 고급 검증 기능 테스트');
    console.log('   4. 에러 상황 테스트로 예외 처리 확인');
    console.log('');
    console.log('🏆 축하합니다! 엔터프라이즈급 NestJS 백엔드를 완성했습니다!');
    console.log('============================================');
    console.log('');
}
bootstrap().catch((error) => {
    console.error('');
    console.error('💥 ================================');
    console.error('   애플리케이션 시작 실패!');
    console.error('💥 ================================');
    console.error('');
    console.error('❌ 에러:', error.message);
    if (process.env.NODE_ENV === 'development') {
        console.error('📍 스택 트레이스:', error.stack);
    }
    console.error('');
    console.error('🔧 문제 해결 가이드:');
    console.error('   1. 환경 변수 설정 확인');
    console.error('   2. 데이터베이스 연결 상태 확인');
    console.error('   3. Redis 서버 실행 상태 확인 (설정된 경우)');
    console.error('   4. 포트 사용 중 여부 확인');
    console.error('');
    process.exit(1);
});
process.on('SIGTERM', () => {
    console.log('🔄 SIGTERM 신호 수신, 안전하게 종료합니다...');
});
process.on('SIGINT', () => {
    console.log('🔄 SIGINT 신호 수신, 안전하게 종료합니다...');
});
process.on('unhandledRejection', (reason, promise) => {
    console.error('🚨 처리되지 않은 Promise 거부:', reason);
    console.error('📍 Promise:', promise);
});
process.on('uncaughtException', (error) => {
    console.error('🚨 처리되지 않은 예외:', error);
    process.exit(1);
});
//# sourceMappingURL=main.js.map