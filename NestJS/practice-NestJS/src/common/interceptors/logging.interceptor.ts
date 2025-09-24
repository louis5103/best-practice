// src/common/interceptors/logging.interceptor.ts

import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';

/**
 * 로깅 인터셉터입니다.
 * 
 * 이 인터셉터는 마치 보안 카메라와 같은 역할을 합니다.
 * 모든 요청과 응답을 체계적으로 기록하여,
 * 디버깅, 모니터링, 성능 분석에 활용할 수 있게 합니다.
 * 
 * 왜 이런 로깅이 필요한가?
 * 1. 디버깅: 문제 발생 시 원인 추적
 * 2. 모니터링: 시스템 성능 및 사용 패턴 파악
 * 3. 보안: 비정상적인 접근 패턴 감지
 * 4. 비즈니스 인사이트: API 사용 통계 분석
 * 
 * 실무에서의 중요성:
 * - 프로덕션 환경에서 발생하는 문제의 90%는 로그를 통해 해결
 * - 성능 병목 지점 파악을 위한 응답 시간 측정
 * - 사용자 행동 패턴 분석을 통한 서비스 개선
 */
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    
    // 요청 정보 추출
    const { method, url, ip, headers, body, query, params } = request;
    const userAgent = headers['user-agent'] || 'Unknown';
    const startTime = Date.now();
    
    // 요청 ID 생성 (추적을 위한 고유 식별자)
    const requestId = this.generateRequestId();
    request.requestId = requestId;

    // 요청 로깅
    this.logRequest(requestId, method, url, ip, userAgent, body, query, params);

    return next.handle().pipe(
      tap((responseData) => {
        // 성공 응답 로깅
        const responseTime = Date.now() - startTime;
        this.logSuccessResponse(
          requestId,
          method,
          url,
          response.statusCode,
          responseTime,
          responseData
        );
      }),
      catchError((error) => {
        // 에러 응답 로깅
        const responseTime = Date.now() - startTime;
        this.logErrorResponse(
          requestId,
          method,
          url,
          error.status || 500,
          responseTime,
          error
        );
        
        // 에러를 다시 throw하여 GlobalExceptionFilter에서 처리하도록 함
        return throwError(() => error);
      })
    );
  }

  /**
   * 요청을 로깅합니다.
   * 
   * 보안을 위해 민감한 정보(비밀번호, 토큰 등)는 마스킹 처리합니다.
   */
  private logRequest(
    requestId: string,
    method: string,
    url: string,
    ip: string,
    userAgent: string,
    body: unknown,
    query: unknown,
    params: unknown
  ): void {
    const logData = {
      requestId,
      method,
      url,
      ip,
      userAgent,
      query: this.sanitizeData(query),
      params: this.sanitizeData(params),
      body: this.sanitizeData(body),
      timestamp: new Date().toISOString()
    };

    // Health check나 정적 파일 요청은 간소하게 로깅
    if (this.isLowPriorityRequest(url)) {
      this.logger.log(`${method} ${url}`, { requestId, ip });
    } else {
      this.logger.log(`📥 Incoming Request: ${method} ${url}`, logData);
    }
  }

  /**
   * 성공 응답을 로깅합니다.
   */
  private logSuccessResponse(
    requestId: string,
    method: string,
    url: string,
    statusCode: number,
    responseTime: number,
    responseData: unknown
  ): void {
    const logData = {
      requestId,
      method,
      url,
      statusCode,
      responseTime: `${responseTime}ms`,
      timestamp: new Date().toISOString()
    };

    // 응답 크기 계산 (대략적)
    const responseSize = this.calculateResponseSize(responseData);
    const logDataWithSize = { ...logData } as Record<string, any>;
    if (responseSize > 0) {
      logDataWithSize['responseSize'] = `${responseSize} bytes`;
    }

    // 성능 임계값 체크
    if (responseTime > 1000) {
      this.logger.warn(`🐌 Slow Response: ${method} ${url} - ${responseTime}ms`, logDataWithSize);
    } else if (this.isLowPriorityRequest(url)) {
      this.logger.log(`${method} ${url} - ${responseTime}ms`);
    } else {
      this.logger.log(`📤 Outgoing Response: ${method} ${url} - ${responseTime}ms`, logDataWithSize);
    }
  }

  /**
   * 에러 응답을 로깅합니다.
   */
  private logErrorResponse(
    requestId: string,
    method: string,
    url: string,
    statusCode: number,
    responseTime: number,
    error: { message?: string; status?: number }
  ): void {
    const logData = {
      requestId,
      method,
      url,
      statusCode,
      responseTime: `${responseTime}ms`,
      error: error.message || 'Unknown error',
      timestamp: new Date().toISOString()
    };

    // 에러 레벨에 따른 로깅
    if (statusCode >= 500) {
      this.logger.error(`💥 Server Error: ${method} ${url}`, logData);
    } else if (statusCode >= 400) {
      this.logger.warn(`⚠️ Client Error: ${method} ${url}`, logData);
    } else {
      this.logger.log(`❌ Error Response: ${method} ${url}`, logData);
    }
  }

  /**
   * 요청 ID를 생성합니다.
   * 
   * 동일한 요청의 로그들을 추적할 수 있게 해주는 고유 식별자입니다.
   */
  private generateRequestId(): string {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
  }

  /**
   * 민감한 데이터를 마스킹 처리합니다.
   * 
   * 로그에 비밀번호, 토큰 등 민감한 정보가 노출되지 않도록 합니다.
   */
  private sanitizeData(data: unknown): unknown {
    if (!data || typeof data !== 'object') {
      return data;
    }

    const sensitiveFields = [
      'password',
      'passwordConfirm', 
      'token',
      'accessToken',
      'refreshToken',
      'authorization',
      'secret',
      'key',
      'apiKey'
    ];

    const sanitized = { ...data } as Record<string, any>;
    
    sensitiveFields.forEach(field => {
      if (sanitized[field]) {
        sanitized[field] = '***MASKED***';
      }
    });

    // 중첩된 객체도 처리
    Object.keys(sanitized).forEach(key => {
      if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
        sanitized[key] = this.sanitizeData(sanitized[key]);
      }
    });

    return sanitized;
  }

  /**
   * 우선순위가 낮은 요청인지 판단합니다.
   * 
   * Health check, 정적 파일 등은 간소하게 로깅합니다.
   */
  private isLowPriorityRequest(url: string): boolean {
    const lowPriorityPatterns = [
      '/health',
      '/favicon.ico',
      '/robots.txt',
      '/api-docs',
      '.css',
      '.js',
      '.png',
      '.jpg',
      '.svg'
    ];

    return lowPriorityPatterns.some(pattern => url.includes(pattern));
  }

  /**
   * 응답 크기를 대략적으로 계산합니다.
   */
  private calculateResponseSize(data: unknown): number {
    try {
      if (!data) return 0;
      return JSON.stringify(data).length;
    } catch {
      return 0;
    }
  }
}

/**
 * 로그 출력 예시:
 * 
 * 1. 일반 요청:
 * [LoggingInterceptor] 📥 Incoming Request: POST /api/auth/login
 * {
 *   "requestId": "abc123def456",
 *   "method": "POST",
 *   "url": "/api/auth/login",
 *   "ip": "127.0.0.1",
 *   "body": { "email": "user@example.com", "password": "***MASKED***" }
 * }
 * 
 * 2. 성공 응답:
 * [LoggingInterceptor] 📤 Outgoing Response: POST /api/auth/login - 245ms
 * {
 *   "requestId": "abc123def456",
 *   "statusCode": 200,
 *   "responseTime": "245ms"
 * }
 * 
 * 3. 느린 응답:
 * [LoggingInterceptor] 🐌 Slow Response: GET /api/products - 1250ms
 * 
 * 4. 에러 응답:
 * [LoggingInterceptor] ⚠️ Client Error: POST /api/auth/login
 * {
 *   "statusCode": 401,
 *   "error": "Invalid credentials"
 * }
 */