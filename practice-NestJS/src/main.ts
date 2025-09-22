import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';

/**
 * 애플리케이션 부트스트랩 함수
 * 이 함수가 애플리케이션이 시작될 때 처음으로 실행되며,
 * 모든 설정과 미들웨어를 구성하는 역할을 담당합니다.
 */
async function bootstrap() {
  // NestJS 애플리케이션 인스턴스를 생성합니다.
  // AppModule을 루트 모듈로 사용하여 전체 애플리케이션 구조를 정의합니다.
  const app = await NestFactory.create(AppModule);

  // ConfigService를 통해 환경 변수에 접근할 수 있습니다.
  const configService = app.get(ConfigService);

  // CORS 설정 - 프론트엔드에서 API에 접근할 수 있도록 허용
  app.enableCors({
    origin: ['http://localhost:3000', 'http://localhost:3001'],
    credentials: true,
  });

  // 전역 API prefix 설정 - 모든 라우트 앞에 '/api' 붙이기
  app.setGlobalPrefix('api');

  // 전역 파이프 설정 - 모든 요청에 대해 자동 유효성 검사 수행
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // DTO에 정의되지 않은 속성은 자동으로 제거
      forbidNonWhitelisted: true, // 정의되지 않은 속성이 있으면 에러 발생
      transform: true, // 요청 데이터를 DTO 클래스 인스턴스로 자동 변환
      disableErrorMessages: configService.get('NODE_ENV') === 'production', // 프로덕션에서는 에러 메시지 숨기기
    })
  );

  // Swagger API 문서 자동 생성 설정
  // 이는 개발자와 프론트엔드 팀 모두에게 매우 유용한 기능입니다.
  const config = new DocumentBuilder()
    .setTitle(configService.get('API_TITLE') || 'NestJS API')
    .setDescription('NestJS로 구축된 백엔드 API 문서')
    .setVersion(configService.get('API_VERSION') || '1.0')
    .addBearerAuth() // JWT 토큰을 사용하는 엔드포인트에 대한 인증 헤더 추가
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document);

  // 애플리케이션 종료 시 graceful shutdown 활성화
  // 이는 Redis, 데이터베이스 연결 등을 안전하게 종료하기 위해 필요합니다.
  app.enableShutdownHooks();

  // 환경 변수에서 포트를 가져오거나 기본값 3000 사용
  const port = configService.get('PORT') || 3000;
  
  await app.listen(port);
  
  console.log(`🚀 애플리케이션이 http://localhost:${port} 에서 실행 중입니다`);
  console.log(`📚 API 문서는 http://localhost:${port}/api-docs 에서 확인할 수 있습니다`);
}

// 애플리케이션을 시작하고, 예상치 못한 에러가 발생하면 로그를 출력합니다.
bootstrap().catch((error) => {
  console.error('❌ 애플리케이션 시작 중 오류가 발생했습니다:', error);
  process.exit(1);
});
