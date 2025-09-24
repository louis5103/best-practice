import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { CacheModule } from '@nestjs/cache-manager';

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
 * ✨ 표준 NestJS 캐싱 시스템:
 * - 안정적인 메모리 캐시 사용 (개발 중에는 Redis 선택사항)
 * - 프로덕션에서는 Redis 연결 시 자동으로 Redis 사용
 * - 에러 발생 시 graceful degradation
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

    // 캐시 설정 (안전한 메모리 캐시 우선, Redis는 선택사항)
    CacheModule.registerAsync({
      isGlobal: true,
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const redisHost = configService.get<string>('REDIS_HOST');
        const redisPort = configService.get<number>('REDIS_PORT');
        
        // Redis 설정이 있고 연결 가능한 경우에만 Redis 사용
        if (redisHost && redisPort && process.env.NODE_ENV === 'production') {
          try {
            // 프로덕션에서만 Redis 시도
            const { redisStore } = await import('cache-manager-redis-yet');
            
            console.log('🔗 Redis 캐시 설정을 시도합니다...');
            
            return {
              store: redisStore,
              socket: {
                host: redisHost,
                port: redisPort,
              },
              password: configService.get<string>('REDIS_PASSWORD'),
              ttl: 300, // 5분 기본 TTL (초 단위)
              max: 1000, // 최대 캐시 항목 수
            };
          } catch (error) {
            console.warn('⚠️ Redis 설정 실패, 메모리 캐시로 전환:', error);
            // Redis 실패 시 메모리 캐시로 fallback
          }
        }
        
        // 개발 환경 또는 Redis 실패 시 메모리 캐시 사용
        console.log('📝 메모리 캐시를 사용합니다');
        return {
          ttl: 300, // 5분 TTL
          max: 100, // 메모리 캐시 최대 100개 항목
        };
      },
      inject: [ConfigService],
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
    
    // 캐시 설정 정보 출력
    const redisHost = this.configService.get<string>('REDIS_HOST');
    const redisPort = this.configService.get<number>('REDIS_PORT');
    
    if (redisHost && redisPort) {
      console.log(`💾 Redis 설정: ${redisHost}:${redisPort}`);
    } else {
      console.log('💾 캐시: 메모리 캐시 사용');
    }
  }
}
