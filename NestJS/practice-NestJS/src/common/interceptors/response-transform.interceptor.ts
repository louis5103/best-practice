// src/common/interceptors/response-transform.interceptor.ts

import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

/**
 * 응답 변환 인터셉터입니다.
 * 
 * 이 인터셉터는 마치 포장지와 같은 역할을 합니다.
 * 모든 성공 응답을 동일한 형태로 포장하여,
 * 프론트엔드에서 예측 가능한 방식으로 처리할 수 있게 합니다.
 * 
 * 왜 이런 표준화가 필요한가?
 * 1. 프론트엔드의 일관된 응답 처리
 * 2. API 응답 형식의 표준화
 * 3. 메타데이터 자동 추가 (타임스탬프, 경로 등)
 * 4. 성공/실패 상태 명확화
 * 
 * 실무에서의 중요성:
 * - 대형 프로젝트에서 여러 개발자가 작업할 때 응답 형식 통일
 * - API 문서화 시 일관된 응답 구조 제공
 * - 프론트엔드 개발자의 예측 가능한 응답 처리
 */
@Injectable()
export class ResponseTransformInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    
    return next.handle().pipe(
      map(data => {
        // 이미 표준화된 응답인지 확인 (에러 응답 등)
        if (data && typeof data === 'object' && ('success' in data || 'error' in data)) {
          return data;
        }

        // Health Check 엔드포인트의 경우 특별 처리
        if (request.url.includes('/health')) {
          return this.transformHealthResponse(data, request);
        }

        // 페이지네이션 응답인지 확인
        if (data && typeof data === 'object' && 'items' in data && 'meta' in data) {
          return this.transformPaginatedResponse(data, request);
        }

        // 표준 성공 응답으로 변환
        return this.transformStandardResponse(data, request);
      })
    );
  }

  /**
   * 표준 성공 응답 형태로 변환합니다.
   * 
   * 모든 성공 응답은 동일한 구조를 가집니다:
   * - success: 항상 true
   * - data: 실제 응답 데이터
   * - timestamp: 응답 생성 시각
   * - path: 요청 경로
   */
  private transformStandardResponse(data: any, request: any) {
    return {
      success: true,
      data: data,
      timestamp: new Date().toISOString(),
      path: request.url
    };
  }

  /**
   * 페이지네이션 응답을 변환합니다.
   * 
   * 페이지네이션이 적용된 응답의 경우,
   * 메타데이터를 포함한 특별한 구조를 사용합니다.
   * 
   * 예: GET /api/products?page=1&limit=10
   */
  private transformPaginatedResponse(data: any, request: any) {
    return {
      success: true,
      data: data.items,
      meta: {
        pagination: data.meta,
        timestamp: new Date().toISOString(),
        path: request.url
      }
    };
  }

  /**
   * Health Check 응답을 변환합니다.
   * 
   * Health Check는 시스템 상태 확인용이므로,
   * 간결하면서도 필요한 정보를 모두 포함하도록 합니다.
   * 
   * 예: GET /api/health
   */
  private transformHealthResponse(data: any, request: any) {
    // Health Check 응답이 이미 올바른 형태인 경우
    if (data && data.status && data.timestamp) {
      return {
        success: true,
        data: data,
        path: request.url
      };
    }

    // 단순한 health check 응답인 경우
    return {
      success: true,
      data: {
        status: 'ok',
        message: data?.message || 'Service is healthy',
        timestamp: new Date().toISOString()
      },
      path: request.url
    };
  }
}

/**
 * 응답 형태 예시:
 * 
 * 1. 일반 응답:
 * {
 *   "success": true,
 *   "data": { "id": 1, "name": "상품명" },
 *   "timestamp": "2024-01-15T10:30:00.000Z",
 *   "path": "/api/products/1"
 * }
 * 
 * 2. 페이지네이션 응답:
 * {
 *   "success": true,
 *   "data": [{ "id": 1, "name": "상품1" }],
 *   "meta": {
 *     "pagination": { "page": 1, "limit": 10, "total": 50 },
 *     "timestamp": "2024-01-15T10:30:00.000Z",
 *     "path": "/api/products"
 *   }
 * }
 * 
 * 3. Health Check 응답:
 * {
 *   "success": true,
 *   "data": {
 *     "status": "ok",
 *     "message": "All systems operational",
 *     "timestamp": "2024-01-15T10:30:00.000Z"
 *   },
 *   "path": "/api/health"
 * }
 */