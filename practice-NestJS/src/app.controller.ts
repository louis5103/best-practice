import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AppService } from './app.service';

/**
 * 애플리케이션의 기본 컨트롤러입니다.
 * 
 * 이 컨트롤러는 마치 가게의 출입구에 있는 안내판과 같습니다.
 * 방문자들이 가게가 영업 중인지, 어떤 서비스를 제공하는지
 * 기본적인 정보를 확인할 수 있게 도와줍니다.
 */
@ApiTags('기본 정보')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  /**
   * 기본 경로 접근 시 애플리케이션 정보를 반환합니다.
   * 
   * 이 엔드포인트는 API가 정상적으로 동작하는지 확인하는 
   * 간단한 헬스체크 역할을 합니다.
   */
  @Get()
  @ApiOperation({ 
    summary: '애플리케이션 기본 정보 조회',
    description: 'API 서버의 상태와 기본 정보를 확인할 수 있습니다.'
  })
  @ApiResponse({ 
    status: 200, 
    description: '성공적으로 정보를 반환',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
        version: { type: 'string' },
        timestamp: { type: 'string' },
        environment: { type: 'string' }
      }
    }
  })
  getHello(): object {
    return this.appService.getAppInfo();
  }

  /**
   * 애플리케이션 상태 확인용 엔드포인트입니다.
   * 
   * 로드 밸런서나 모니터링 도구에서 서버가 살아있는지 
   * 확인하는 용도로 사용됩니다.
   */
  @Get('health')
  @ApiOperation({ 
    summary: '서버 상태 확인',
    description: '서버가 정상적으로 동작하는지 확인합니다. 데이터베이스와 Redis 연결 상태도 포함됩니다.'
  })
  @ApiResponse({ 
    status: 200, 
    description: '서버 상태 정상',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string' },
        timestamp: { type: 'string' },
        database: { type: 'string' },
        redis: { type: 'string' }
      }
    }
  })
  async checkHealth(): Promise<object> {
    return await this.appService.checkHealth();
  }
}
