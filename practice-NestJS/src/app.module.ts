import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { RedisModule } from '@liaoliaots/nestjs-redis';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { ProductsModule } from './modules/products/products.module';

/**
 * 애플리케이션의 루트 모듈입니다.
 * 
 * 이 모듈은 마치 건물의 설계도와 같은 역할을 합니다.
 * 모든 기능 모듈들을 하나로 연결하고, 전역 설정을 관리하며,
 * 의존성 주입 시스템의 최상위 컨테이너 역할을 수행합니다.
 */
@Module({
  imports: [
    // 환경 변수 설정 모듈 - 전역에서 사용 가능하도록 isGlobal: true 설정
    // 이렇게 하면 모든 모듈에서 ConfigService를 별도 import 없이 사용할 수 있습니다.
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      // 환경 변수 검증을 위한 스키마를 추가할 수 있습니다 (선택사항)
      // validationSchema: Joi.object({...}),
    }),

    // TypeORM 데이터베이스 연결 설정
    // forRootAsync를 사용하는 이유는 ConfigService가 먼저 초기화되기를 기다렸다가
    // 환경 변수 값들을 주입받아 설정을 구성하기 위해서입니다.
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DB_HOST'),
        port: configService.get<number>('DB_PORT'),
        username: configService.get('DB_USERNAME'),
        password: configService.get('DB_PASSWORD'),
        database: configService.get('DB_NAME'),
        
        // 엔티티 파일들의 경로를 지정합니다.
        // 이전 코드에서 발견한 오류를 수정했습니다: 올바른 상대 경로 사용
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        
        // 개발 환경에서만 synchronize를 true로 설정
        // 프로덕션에서는 절대 true로 하면 안 됩니다! (데이터 손실 위험)
        synchronize: configService.get('NODE_ENV') === 'development',
        
        // SQL 쿼리 로깅 - 개발 중 디버깅에 유용
        logging: configService.get('NODE_ENV') === 'development',
        
        // 연결 풀 설정 - 성능 최적화를 위해
        extra: {
          connectionLimit: 10,
          acquireTimeoutMillis: 30000,
          timeout: 30000,
        },
      }),
      inject: [ConfigService],
    }),

    // Redis 설정 - 이전 코드의 오류를 수정했습니다
    // @nestjs-modules/ioredis 대신 @liaoliaots/nestjs-redis 사용
    RedisModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        // Redis 연결 설정을 환경 변수로부터 가져옵니다
        const redisConfig = {
          host: configService.get('REDIS_HOST') || 'localhost',
          port: configService.get<number>('REDIS_PORT') || 6379,
          // 패스워드가 있는 경우에만 설정
          ...(configService.get('REDIS_PASSWORD') && {
            password: configService.get('REDIS_PASSWORD')
          }),
          // 연결 재시도 설정
          retryDelayOnFailover: 100,
          maxRetriesPerRequest: 3,
          lazyConnect: true, // 실제 사용할 때까지 연결을 지연
        };

        return {
          config: redisConfig,
          // 애플리케이션 종료 시 자동으로 Redis 연결 종료
          closeClient: true,
        };
      },
      inject: [ConfigService],
    }),

    // JWT 전역 설정
    // 이렇게 전역으로 설정하면 모든 모듈에서 JWT 서비스를 사용할 수 있습니다.
    JwtModule.registerAsync({
      global: true, // 전역 모듈로 등록
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET'),
        signOptions: { 
          expiresIn: configService.get('JWT_EXPIRES_IN') || '24h',
          // JWT 추가 설정들
          issuer: 'practice-nestjs-api',
          audience: 'practice-nestjs-client',
        },
      }),
      inject: [ConfigService],
    }),

    // 기능별 모듈들을 등록합니다
    // 각 모듈은 독립적인 기능 영역을 담당하며, 필요에 따라 서로 의존할 수 있습니다.
    AuthModule,      // 인증 관련 기능
    UsersModule,     // 사용자 관리 기능
    ProductsModule,  // 상품 관리 기능
  ],
  
  // 루트 레벨의 컨트롤러와 서비스
  // 보통은 헬스체크나 기본 정보 제공 용도로 사용됩니다.
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {
  /**
   * 모듈이 초기화될 때 실행되는 라이프사이클 훅입니다.
   * 데이터베이스 연결 상태나 Redis 연결 상태를 확인하는 등의 
   * 초기화 작업을 수행할 수 있습니다.
   */
  constructor(private configService: ConfigService) {
    console.log('🏗️  AppModule이 초기화되었습니다');
    console.log(`📊 현재 환경: ${this.configService.get('NODE_ENV')}`);
  }
}
