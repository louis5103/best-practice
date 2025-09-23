import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';
import { RedisService } from '@liaoliaots/nestjs-redis';

/**
 * 애플리케이션의 기본 서비스입니다.
 * 
 * 서비스는 컨트롤러와 달리 HTTP와 무관한 순수한 비즈니스 로직을 담당합니다.
 * 마치 레스토랑에서 주방장이 요리를 만드는 것과 같습니다.
 * 웨이터(컨트롤러)가 주문을 받아서 주방장에게 전달하면,
 * 주방장(서비스)이 실제로 요리(비즈니스 로직)를 처리합니다.
 */
@Injectable()
export class AppService {
  constructor(
    private configService: ConfigService,
    private dataSource: DataSource,
    private redisService: RedisService,
  ) {}

  /**
   * 애플리케이션 기본 정보를 반환합니다.
   * 
   * 이 메서드는 API 버전, 환경 정보 등 클라이언트에게
   * 유용한 기본 정보를 제공합니다.
   */
  getAppInfo(): object {
    return {
      message: 'NestJS 백엔드 API에 오신 것을 환영합니다! 🚀',
      version: this.configService.get('API_VERSION', '1.0.0'),
      environment: this.configService.get('NODE_ENV', 'development'),
      timestamp: new Date().toISOString(),
      documentation: '/api-docs',
      features: [
        'JWT 인증',
        'TypeORM + PostgreSQL',
        'Redis 캐싱',
        'Swagger API 문서',
        '자동 유효성 검사'
      ]
    };
  }

  /**
   * 애플리케이션과 연결된 서비스들의 상태를 확인합니다.
   * 
   * 이는 마치 자동차의 계기판과 같습니다. 엔진(데이터베이스),
   * 연료(Redis), 각종 시스템들이 정상적으로 동작하는지
   * 한눈에 확인할 수 있게 해줍니다.
   */
  async checkHealth(): Promise<object> {
    const healthStatus = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024 * 100) / 100,
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024 * 100) / 100,
        unit: 'MB'
      },
      database: 'disconnected',
      redis: 'disconnected'
    };

    try {
      // 데이터베이스 연결 상태 확인
      // 간단한 쿼리를 실행해서 실제로 연결이 작동하는지 테스트합니다
      if (this.dataSource.isInitialized) {
        await this.dataSource.query('SELECT 1');
        healthStatus.database = 'connected';
      }
    } catch (error) {
      console.error('데이터베이스 상태 확인 중 오류:', error instanceof Error ? error.message : String(error));
      healthStatus.database = 'error';
    }

    try {
      // Redis 연결 상태 확인
      // Redis에 테스트 키를 설정하고 즉시 삭제해서 연결을 확인합니다
      const redis = this.redisService.getOrThrow();
      await redis.set('health-check', 'ok', 'EX', 1);
      const result = await redis.get('health-check');
      
      if (result === 'ok') {
        healthStatus.redis = 'connected';
        // 테스트 키 삭제
        await redis.del('health-check');
      }
    } catch (error) {
      console.error('Redis 상태 확인 중 오류:', error instanceof Error ? error.message : String(error));
      healthStatus.redis = 'error';
    }

    // 전체 상태 결정
    // 데이터베이스나 Redis 중 하나라도 문제가 있으면 전체 상태를 degraded로 설정
    if (healthStatus.database !== 'connected' || healthStatus.redis !== 'connected') {
      healthStatus.status = 'degraded';
    }

    return healthStatus;
  }

  /**
   * 애플리케이션 시작 시 필요한 초기화 작업을 수행합니다.
   * 
   * 이는 마치 가게를 열기 전에 하는 준비 작업과 같습니다.
   * 재료 확인, 기계 점검, 청소 등을 통해 
   * 손님을 맞을 준비를 완료하는 것입니다.
   */
  async onApplicationBootstrap(): Promise<void> {
    console.log('🔧 애플리케이션 초기화 시작...');
    
    try {
      // 데이터베이스 연결 확인
      if (this.dataSource.isInitialized) {
        console.log('✅ 데이터베이스 연결 성공');
      }

      // Redis 연결 확인
      const redis = this.redisService.getOrThrow();
      await redis.ping();
      console.log('✅ Redis 연결 성공');

      console.log('🎉 애플리케이션 초기화 완료');
    } catch (error) {
      console.error('❌ 초기화 중 오류 발생:', error instanceof Error ? error.message : String(error));
    }
  }
}
