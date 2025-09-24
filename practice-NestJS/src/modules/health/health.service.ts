import { Injectable, Logger, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

/**
 * 시스템 건강 상태를 체크하는 핵심 서비스입니다.
 * 
 * ✨ 개선사항: Redis 캐싱 시스템 상태 확인 추가
 */
@Injectable()
export class HealthService {
  private readonly logger = new Logger(HealthService.name);
  private readonly startTime = Date.now();

  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly configService: ConfigService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache
  ) {}

  /**
   * 전체 시스템의 건강 상태를 종합적으로 확인합니다.
   */
  async getHealthStatus() {
    const timestamp = new Date().toISOString();
    const checks: Record<string, any> = {};
    const errors: Array<{ service: string; error: string }> = [];

    try {
      // 모든 헬스체크를 병렬로 실행합니다.
      const [
        databaseResult,
        memoryResult,
        diskResult,
        cacheResult,
      ] = await Promise.allSettled([
        this.checkDatabaseHealth(),
        this.checkMemoryHealth(),
        this.checkDiskHealth(),
        this.checkCacheHealth(), // Redis 캐시 상태 확인 추가
      ]);

      // 각 검사 결과를 처리합니다.
      if (databaseResult.status === 'fulfilled') {
        checks['database'] = databaseResult.value;
      } else {
        const error = databaseResult.reason;
        const errorMessage = error instanceof Error ? error.message : '데이터베이스 연결 실패';
        checks['database'] = { status: 'down', error: errorMessage };
        errors.push({
          service: 'database',
          error: errorMessage
        });
      }

      if (memoryResult.status === 'fulfilled') {
        checks['memory'] = memoryResult.value;
      } else {
        const error = memoryResult.reason;
        const errorMessage = error instanceof Error ? error.message : '메모리 상태 확인 실패';
        checks['memory'] = { status: 'unhealthy', error: errorMessage };
        errors.push({
          service: 'memory',
          error: errorMessage
        });
      }

      if (diskResult.status === 'fulfilled') {
        checks['disk'] = diskResult.value;
      } else {
        const error = diskResult.reason;
        const errorMessage = error instanceof Error ? error.message : '디스크 상태 확인 실패';
        checks['disk'] = { status: 'unhealthy', error: errorMessage };
        errors.push({
          service: 'disk', 
          error: errorMessage
        });
      }

      // Redis/캐시 상태 확인 결과 처리
      if (cacheResult.status === 'fulfilled') {
        checks['cache'] = cacheResult.value;
      } else {
        const error = cacheResult.reason;
        const errorMessage = error instanceof Error ? error.message : '캐시 시스템 확인 실패';
        checks['cache'] = { status: 'warning', error: errorMessage };
        // 캐시는 선택적 의존성이므로 경고 수준으로 처리
        this.logger.warn(`캐시 상태 확인 실패: ${errorMessage}`);
      }

      // 전체 시스템 상태를 결정합니다.
      // 캐시 실패는 에러로 계산하지 않음 (선택적 의존성)
      const criticalErrors = errors.filter(e => e.service !== 'cache');
      const overallStatus = criticalErrors.length > 0 ? 'error' : 'ok';

      const result: any = {
        status: overallStatus,
        timestamp,
        uptime: this.getUptimeInSeconds(),
        environment: this.configService.get('NODE_ENV', 'development'),
        version: this.configService.get('API_VERSION', '1.0.0'),
        checks,
      };

      // 에러가 있는 경우에만 에러 정보를 포함합니다.
      if (errors.length > 0) {
        result.errors = errors;
      }

      return result;

    } catch (error: unknown) {
      // 예상치 못한 에러가 발생한 경우의 처리
      const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
      this.logger.error('헬스체크 실행 중 예상치 못한 에러 발생:', error);
      
      return {
        status: 'error',
        timestamp,
        uptime: this.getUptimeInSeconds(),
        environment: this.configService.get('NODE_ENV', 'development'),
        version: this.configService.get('API_VERSION', '1.0.0'),
        errors: [{
          service: 'system',
          error: errorMessage
        }],
        checks: {}
      };
    }
  }

  /**
   * 간단한 Ping 응답을 제공합니다.
   */
  async ping() {
    return {
      message: 'pong',
      timestamp: new Date().toISOString(),
      uptime: this.getUptimeInSeconds(),
    };
  }

  /**
   * 상세한 시스템 정보를 제공합니다.
   */
  async getDetailedHealthStatus() {
    const basicHealth = await this.getHealthStatus();
    
    // 추가적인 상세 정보를 수집합니다.
    const systemInfo = this.getSystemInfo();
    const applicationInfo = this.getApplicationInfo();

    return {
      ...basicHealth,
      application: applicationInfo,
      system: systemInfo,
      performance: await this.getPerformanceMetrics(),
    };
  }

  /**
   * 데이터베이스 연결 상태를 확인합니다.
   */
  private async checkDatabaseHealth() {
    const startTime = Date.now();
    
    try {
      // 실제로 간단한 쿼리를 실행해서 데이터베이스가 정상적으로 작동하는지 확인
      await this.dataSource.query('SELECT 1');
      
      const responseTime = Date.now() - startTime;
      
      return {
        status: 'up',
        responseTime: responseTime,
        connection: 'active',
        database: this.dataSource.options.database,
        driver: this.dataSource.options.type,
      };
    } catch (error: unknown) {
      const responseTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : '알 수 없는 데이터베이스 오류';
      
      // 데이터베이스 연결 실패는 심각한 문제이므로 에러를 던집니다.
      throw new Error(`데이터베이스 연결 실패 (응답시간: ${responseTime}ms): ${errorMessage}`);
    }
  }

  /**
   * 캐시 시스템 (Redis) 상태를 확인합니다.
   * 
   * ✨ 새로 추가된 기능: Redis 캐싱 시스템 상태 확인
   */
  private async checkCacheHealth() {
    const startTime = Date.now();
    const testKey = 'health-check-test';
    const testValue = { timestamp: Date.now(), test: true };

    try {
      // 캐시 쓰기 테스트
      await this.cacheManager.set(testKey, testValue, 10); // 10초 TTL

      // 캐시 읽기 테스트
      const retrievedValue = await this.cacheManager.get(testKey);

      // 캐시 삭제 테스트 (정리)
      await this.cacheManager.del(testKey);

      const responseTime = Date.now() - startTime;

      // 읽기/쓰기가 성공했는지 확인
      if (retrievedValue) {
        return {
          status: 'up',
          responseTime,
          type: 'cache-manager',
          operations: {
            write: 'success',
            read: 'success',
            delete: 'success'
          },
          message: '캐시 시스템 정상 작동'
        };
      } else {
        return {
          status: 'warning',
          responseTime,
          type: 'cache-manager',
          operations: {
            write: 'success',
            read: 'failed',
            delete: 'success'
          },
          message: '캐시 읽기 실패, 하지만 연결은 정상'
        };
      }

    } catch (error: unknown) {
      const responseTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : '알 수 없는 캐시 오류';
      
      // 캐시 실패는 심각하지 않으므로 경고 수준으로 처리
      return {
        status: 'down',
        responseTime,
        type: 'cache-manager',
        error: errorMessage,
        message: '캐시 시스템 연결 실패 (메모리 캐시로 fallback 가능)'
      };
    }
  }

  /**
   * 메모리 사용량을 확인합니다.
   */
  private async checkMemoryHealth() {
    const memoryUsage = process.memoryUsage();
    const os = require('os');
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const usedMemory = totalMemory - freeMemory;
    const memoryUsagePercent = (usedMemory / totalMemory) * 100;

    // 메모리 사용률에 따른 상태 결정
    let status = 'healthy';
    if (memoryUsagePercent > 90) {
      status = 'critical';
    } else if (memoryUsagePercent > 80) {
      status = 'warning';
    }

    return {
      status,
      usage: {
        percent: Math.round(memoryUsagePercent * 100) / 100,
        used: usedMemory,
        free: freeMemory,
        total: totalMemory,
      },
      process: {
        heapUsed: memoryUsage.heapUsed,
        heapTotal: memoryUsage.heapTotal,
        external: memoryUsage.external,
        rss: memoryUsage.rss,
      }
    };
  }

  /**
   * 디스크 공간을 확인합니다.
   */
  private async checkDiskHealth() {
    try {
      const fs = require('fs');
      
      // 실제 파일을 생성하여 디스크 쓰기 가능 여부 확인
      try {
        const testPath = require('path').join(process.cwd(), '.health-check-temp');
        fs.writeFileSync(testPath, 'test');
        fs.unlinkSync(testPath);
      } catch (writeError: unknown) {
        const errorMessage = writeError instanceof Error ? writeError.message : '디스크 쓰기 실패';
        return {
          status: 'error',
          error: `디스크 쓰기 실패: ${errorMessage}`
        };
      }

      return {
        status: 'healthy',
        message: '디스크 쓰기 테스트 성공'
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : '알 수 없는 디스크 오류';
      return {
        status: 'error',
        error: errorMessage
      };
    }
  }

  /**
   * 서버가 시작된 이후 경과된 시간을 초 단위로 계산합니다.
   */
  private getUptimeInSeconds(): number {
    return Math.round((Date.now() - this.startTime) / 1000);
  }

  /**
   * 시스템 정보를 수집합니다.
   */
  private getSystemInfo() {
    const os = require('os');
    
    return {
      platform: os.platform(),
      architecture: os.arch(),
      nodeVersion: process.version,
      cpuCount: os.cpus().length,
      hostname: os.hostname(),
      loadAverage: os.loadavg(),
      uptime: os.uptime(),
      memory: {
        total: os.totalmem(),
        free: os.freemem(),
      }
    };
  }

  /**
   * 애플리케이션 관련 정보를 수집합니다.
   */
  private getApplicationInfo() {
    return {
      name: 'practice-nestjs',
      version: this.configService.get('API_VERSION', '1.0.0'),
      environment: this.configService.get('NODE_ENV', 'development'),
      uptime: this.getUptimeInSeconds(),
      pid: process.pid,
      title: this.configService.get('API_TITLE', 'NestJS Practice API'),
    };
  }

  /**
   * 성능 관련 메트릭을 수집합니다.
   */
  private async getPerformanceMetrics() {
    const perfHooks = require('perf_hooks');
    
    return {
      memoryUsage: process.memoryUsage(),
      cpuUsage: process.cpuUsage(),
      eventLoopUtilization: perfHooks.performance.eventLoopUtilization?.() || null,
    };
  }
}
