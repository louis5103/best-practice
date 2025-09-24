import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { ProductsModule } from './modules/products/products.module';
import { HealthModule } from './modules/health/health.module';
import { validateEnvironmentVariables } from './config/env-validation.schema';

/**
 * 애플리케이션의 루트 모듈입니다.
 * 
 * ✨ 개선사항: 
 * - 비표준 Redis 라이브러리 제거
 * - 표준 NestJS 패턴만 사용
 * - TypeScript strict 모드 완전 호환
 * - 더 단순하고 안정적인 구조
 */
@Module({
  imports: [
    // 환경 변수 설정 모듈
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      validate: validateEnvironmentVariables,
      cache: process.env.NODE_ENV === 'production',
    }),

    // TypeORM 데이터베이스 연결 설정
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres' as const,
        host: configService.get<string>('DB_HOST', 'localhost'),
        port: configService.get<number>('DB_PORT', 5432),
        username: configService.get<string>('DB_USERNAME', 'postgres'),
        password: configService.get<string>('DB_PASSWORD', ''),
        database: configService.get<string>('DB_NAME', 'practice_nestjs'),
        
        // 엔티티 파일들의 경로를 지정합니다.
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        
        // 개발 환경에서만 synchronize를 true로 설정
        synchronize: configService.get<string>('NODE_ENV', 'development') === 'development',
        
        // SQL 쿼리 로깅 - 개발 중 디버깅에 유용
        logging: configService.get<string>('NODE_ENV', 'development') === 'development',
        
        // 연결 풀 설정 - 성능 최적화를 위해
        extra: {
          connectionLimit: 10,
          acquireTimeoutMillis: 30000,
          timeout: 30000,
        },
      }),
      inject: [ConfigService],
    }),

    // JWT 전역 설정
    JwtModule.registerAsync({
      global: true,
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET', 'default-secret-key'),
        signOptions: { 
          expiresIn: configService.get<string>('JWT_EXPIRES_IN', '24h'),
          issuer: 'practice-nestjs-api',
          audience: 'practice-nestjs-client',
        },
      }),
      inject: [ConfigService],
    }),

    // 기능별 모듈들을 등록합니다
    AuthModule,
    UsersModule,
    ProductsModule,
    HealthModule,
  ],
  
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {
  /**
   * 모듈이 초기화될 때 실행되는 라이프사이클 훅입니다.
   */
  constructor(private configService: ConfigService) {
    console.log('🏗️  AppModule이 초기화되었습니다');
    console.log(`📊 현재 환경: ${this.configService.get('NODE_ENV', 'development')}`);
  }
}
