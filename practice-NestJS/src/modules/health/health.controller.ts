import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { HealthService } from './health.service';
import { Public } from '../../common/decorators/public.decorator';

/**
 * 시스템 상태 확인을 위한 헬스체크 컨트롤러입니다.
 * 
 * 이 컨트롤러는 마치 병원의 건강 검진과 같은 역할을 합니다.
 * 애플리케이션의 다양한 구성 요소들이 정상적으로 작동하는지 
 * 체계적으로 확인하여 전체 시스템의 건강 상태를 진단합니다.
 * 
 * 헬스체크가 중요한 이유:
 * 
 * 1. **조기 문제 발견**: 시스템 장애가 사용자에게 영향을 주기 전에 미리 감지
 * 2. **자동화된 모니터링**: 모니터링 도구들이 주기적으로 상태 확인 가능
 * 3. **로드 밸런서 연동**: 비정상 서버를 자동으로 트래픽에서 제외
 * 4. **컨테이너 오케스트레이션**: 쿠버네티스 등에서 자동 재시작 트리거
 * 5. **운영팀 알림**: 문제 발생 시 즉시 알림 시스템 연동
 * 
 * 실무에서 헬스체크는 다음과 같은 상황에서 활용됩니다:
 * - AWS ELB (Elastic Load Balancer)의 헬스체크
 * - 쿠버네티스의 Liveness/Readiness Probe
 * - Prometheus + Grafana 모니터링 시스템
 * - 서비스 메시(Service Mesh) 환경에서의 상태 확인
 * - CI/CD 파이프라인의 배포 검증
 * 
 * Spring Boot의 Actuator와 비슷한 개념이지만, 
 * NestJS에서는 더 유연하고 커스터마이징 가능한 방식으로 구현할 수 있습니다.
 */
@ApiTags('💗 health')
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  /**
   * 시스템 전체의 건강 상태를 확인합니다.
   * 
   * 이 엔드포인트는 다양한 시스템 구성 요소들을 종합적으로 검사하여
   * 전체 시스템이 정상적으로 작동하는지 판단합니다.
   * 
   * 검사 항목들:
   * 1. **애플리케이션 자체 상태**: 서버가 요청을 처리할 수 있는 상태인지
   * 2. **데이터베이스 연결**: PostgreSQL 연결이 활성화되어 있는지
   * 3. **Redis 연결**: 캐시 서비스가 정상적으로 작동하는지
   * 4. **메모리 사용량**: 시스템 리소스가 충분한지
   * 5. **디스크 공간**: 저장 공간이 부족하지 않은지
   * 
   * HTTP 상태 코드:
   * - 200 OK: 모든 시스템이 정상
   * - 503 Service Unavailable: 일부 또는 전체 시스템에 문제 발생
   * 
   * 이 엔드포인트는 @Public() 데코레이터를 사용하여 
   * 인증 없이도 접근할 수 있게 합니다. 
   * 왜냐하면 모니터링 시스템이나 로드 밸런서는 
   * 일반적으로 인증 정보를 가지지 않기 때문입니다.
   */
  @Get()
  @Public() // 🌍 모니터링 도구들이 인증 없이 접근할 수 있도록 공개
  @ApiOperation({
    summary: '시스템 건강 상태 확인',
    description: `
      애플리케이션과 연결된 모든 서비스들의 상태를 종합적으로 점검합니다.
      
      **검사 항목:**
      - 애플리케이션 서버 상태
      - PostgreSQL 데이터베이스 연결
      - Redis 캐시 서버 연결 (설정된 경우)
      - 시스템 리소스 (메모리, 디스크)
      - 외부 서비스 의존성
      
      **사용 예시:**
      - 로드 밸런서의 헬스체크 대상
      - 쿠버네티스 Liveness/Readiness Probe
      - 모니터링 시스템의 정기 상태 확인
      - CI/CD 배포 후 서비스 검증
      
      모든 서비스가 정상이면 200 OK를, 문제가 있으면 503을 반환합니다.
    `
  })
  @ApiResponse({
    status: 200,
    description: '모든 시스템 구성 요소가 정상 상태',
    schema: {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          example: 'ok',
          description: '전체 시스템 상태'
        },
        timestamp: {
          type: 'string',
          format: 'date-time',
          example: '2024-01-15T10:30:00.000Z',
          description: '상태 확인 시점'
        },
        uptime: {
          type: 'number',
          example: 3661.245,
          description: '서버 가동 시간 (초)'
        },
        environment: {
          type: 'string',
          example: 'production',
          description: '현재 실행 환경'
        },
        version: {
          type: 'string',
          example: '1.0.0',
          description: '애플리케이션 버전'
        },
        checks: {
          type: 'object',
          properties: {
            database: {
              type: 'object',
              properties: {
                status: { type: 'string', example: 'up' },
                responseTime: { type: 'number', example: 12.5 }
              }
            },
            redis: {
              type: 'object',
              properties: {
                status: { type: 'string', example: 'up' },
                responseTime: { type: 'number', example: 3.2 }
              }
            },
            memory: {
              type: 'object',
              properties: {
                status: { type: 'string', example: 'healthy' },
                usage: { type: 'number', example: 65.4 }
              }
            }
          }
        }
      }
    }
  })
  @ApiResponse({
    status: 503,
    description: '일부 또는 전체 시스템에 문제가 있음',
    schema: {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          example: 'error',
          description: '전체 시스템 상태'
        },
        timestamp: {
          type: 'string',
          format: 'date-time',
          example: '2024-01-15T10:30:00.000Z'
        },
        errors: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              service: { type: 'string', example: 'database' },
              error: { type: 'string', example: 'Connection timeout' }
            }
          }
        },
        checks: {
          type: 'object',
          description: '각 서비스별 상세 상태'
        }
      }
    }
  })
  async checkHealth() {
    return await this.healthService.getHealthStatus();
  }

  /**
   * 간단한 서버 생존 확인용 엔드포인트입니다.
   * 
   * 이 엔드포인트는 매우 가벼운 헬스체크로, 
   * 서버가 기본적으로 HTTP 요청을 처리할 수 있는지만 확인합니다.
   * 데이터베이스나 외부 서비스 연결은 체크하지 않으므로
   * 응답 속도가 매우 빠릅니다.
   * 
   * 용도:
   * - 간단한 로드 밸런서 헬스체크
   * - 기본적인 서버 생존 확인
   * - 네트워크 연결 테스트
   * - 응답 속도가 중요한 모니터링
   * 
   * 복잡한 헬스체크가 필요 없고 
   * 단순히 서버가 살아있는지만 확인하면 되는 경우 사용합니다.
   */
  @Get('ping')
  @Public() // 🏓 가장 간단한 생존 신호
  @ApiOperation({
    summary: '서버 생존 확인 (Ping)',
    description: `
      가장 간단한 형태의 서버 생존 확인입니다.
      
      **특징:**
      - 매우 빠른 응답 (< 10ms)
      - 외부 의존성 없음
      - 기본적인 HTTP 처리 능력만 확인
      - 네트워크 연결 테스트용
      
      **사용 예시:**
      - 간단한 로드 밸런서 체크
      - CDN 헬스체크 대상
      - 기본적인 모니터링
      - 네트워크 연결 확인
      
      항상 200 OK와 함께 'pong' 응답을 반환합니다.
    `
  })
  @ApiResponse({
    status: 200,
    description: '서버가 정상적으로 응답함',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'pong',
          description: 'Ping에 대한 응답'
        },
        timestamp: {
          type: 'string',
          format: 'date-time',
          example: '2024-01-15T10:30:00.000Z',
          description: '응답 시점'
        }
      }
    }
  })
  async ping() {
    return await this.healthService.ping();
  }

  /**
   * 상세한 시스템 정보를 제공하는 엔드포인트입니다.
   * 
   * 이 엔드포인트는 운영팀이나 개발팀이 시스템 상태를 
   * 더 자세히 파악하고 싶을 때 사용합니다.
   * 
   * 제공 정보:
   * - 서버 사양 및 리소스 사용량
   * - 애플리케이션 버전 및 설정
   * - 연결된 데이터베이스 정보
   * - 캐시 서버 통계
   * - 최근 에러 발생 현황
   * - 처리 중인 요청 수
   * 
   * 보안상 민감한 정보는 제외하고, 
   * 시스템 진단에 도움이 되는 정보만 포함합니다.
   */
  @Get('detailed')
  @Public() // 📊 상세 정보 제공
  @ApiOperation({
    summary: '상세한 시스템 정보',
    description: `
      시스템의 상세한 상태 정보를 제공합니다.
      
      **포함 정보:**
      - 서버 리소스 사용량 (CPU, 메모리, 디스크)
      - 애플리케이션 메트릭스
      - 데이터베이스 연결 풀 상태
      - 캐시 서버 통계
      - 최근 처리된 요청 통계
      
      **주의사항:**
      - 민감한 설정 정보는 포함되지 않음
      - 운영팀의 시스템 진단용
      - 정기적인 시스템 모니터링용
      
      일반적인 헬스체크보다 더 많은 정보를 제공하지만
      여전히 빠른 응답을 보장합니다.
    `
  })
  @ApiResponse({
    status: 200,
    description: '상세한 시스템 정보 제공',
    schema: {
      type: 'object',
      properties: {
        application: {
          type: 'object',
          properties: {
            name: { type: 'string', example: 'practice-nestjs' },
            version: { type: 'string', example: '1.0.0' },
            uptime: { type: 'number', example: 3661.245 },
            environment: { type: 'string', example: 'production' }
          }
        },
        system: {
          type: 'object',
          properties: {
            platform: { type: 'string', example: 'linux' },
            nodeVersion: { type: 'string', example: '18.17.0' },
            memory: {
              type: 'object',
              properties: {
                total: { type: 'number', example: 8589934592 },
                used: { type: 'number', example: 5623242752 },
                free: { type: 'number', example: 2966691840 }
              }
            }
          }
        },
        services: {
          type: 'object',
          properties: {
            database: {
              type: 'object',
              properties: {
                status: { type: 'string', example: 'connected' },
                activeConnections: { type: 'number', example: 5 },
                totalConnections: { type: 'number', example: 1247 }
              }
            },
            cache: {
              type: 'object',
              properties: {
                status: { type: 'string', example: 'connected' },
                hitRate: { type: 'number', example: 89.3 },
                keyCount: { type: 'number', example: 15420 }
              }
            }
          }
        }
      }
    }
  })
  async getDetailedHealth() {
    return await this.healthService.getDetailedHealthStatus();
  }
}

/**
 * 헬스체크 엔드포인트 사용 가이드:
 * 
 * 1. **기본 헬스체크**: GET /health
 *    - 로드 밸런서나 오케스트레이션 도구용
 *    - 모든 핵심 서비스 상태 확인
 *    - 문제 발생 시 503 반환으로 트래픽 차단
 * 
 * 2. **Ping 체크**: GET /health/ping  
 *    - 가장 가벼운 생존 확인
 *    - 네트워크 연결 테스트
 *    - CDN이나 간단한 모니터링용
 * 
 * 3. **상세 정보**: GET /health/detailed
 *    - 운영팀의 상세 진단용
 *    - 시스템 리소스 모니터링
 *    - 성능 지표 확인
 * 
 * 각각의 목적에 맞게 적절한 엔드포인트를 선택하여 사용하면
 * 효율적인 시스템 모니터링이 가능합니다.
 */
