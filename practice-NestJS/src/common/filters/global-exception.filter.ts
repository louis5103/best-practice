// src/common/filters/global-exception.filter.ts

import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger
} from '@nestjs/common';
import { Response, Request } from 'express';

/**
 * 전역 예외 처리 필터입니다.
 * 
 * 이 필터는 마치 병원의 응급실과 같은 역할을 합니다.
 * 애플리케이션에서 발생하는 모든 예외를 포착하여,
 * 어떤 종류의 오류인지 분류하고 적절한 처리를 합니다.
 * 
 * 왜 이런 필터가 필요한가?
 * 1. 일관된 에러 응답 형식 제공
 * 2. 민감한 정보 노출 방지  
 * 3. 체계적인 에러 로깅
 * 4. 클라이언트 친화적인 메시지 제공
 */
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    // 예외 정보 파싱
    const exceptionInfo = this.parseException(exception);
    
    // 에러 로깅 (민감한 정보는 제외)
    this.logError(request, exceptionInfo, exception);

    // 클라이언트에게 전송할 응답 생성
    const errorResponse = this.buildErrorResponse(request, exceptionInfo);

    response.status(exceptionInfo.status).json(errorResponse);
  }

  /**
   * 예외를 분석하여 상태 코드, 메시지, 세부 정보를 추출합니다.
   * 
   * 이 메서드는 마치 의사가 환자의 증상을 진단하는 것과 같습니다.
   * 다양한 종류의 예외를 분석해서 적절한 처방을 결정합니다.
   */
  private parseException(exception: unknown): {
    status: number;
    message: string;
    details?: any;
    isValidationError: boolean;
  } {
    // NestJS HttpException인 경우
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      
      // Validation 에러인 경우 (class-validator에서 발생)
      if (typeof exceptionResponse === 'object' && exceptionResponse !== null && 'message' in exceptionResponse) {
        const response = exceptionResponse as any;
        return {
          status,
          message: Array.isArray(response.message) 
            ? '입력값 검증에 실패했습니다.' 
            : response.message,
          details: Array.isArray(response.message) ? response.message : undefined,
          isValidationError: status === HttpStatus.BAD_REQUEST && Array.isArray(response.message)
        };
      }
      
      return {
        status,
        message: typeof exceptionResponse === 'string' 
          ? exceptionResponse 
          : exception.message,
        isValidationError: false
      };
    }

    // TypeORM 데이터베이스 에러 처리
    if (typeof exception === 'object' && exception !== null && 'code' in exception) {
      return this.parseDatabaseError(exception);
    }

    // 알려지지 않은 에러 - 500 Internal Server Error
    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      message: '서버 내부 오류가 발생했습니다.',
      isValidationError: false
    };
  }

  /**
   * 데이터베이스 관련 에러를 분석합니다.
   * 
   * PostgreSQL과 같은 데이터베이스에서 발생하는 에러들을
   * 사용자 친화적인 메시지로 변환합니다.
   */
  private parseDatabaseError(exception: Record<string, any>): {
    status: number;
    message: string;
    details?: any;
    isValidationError: boolean;
  } {
    const code = exception.code as string;

    switch (code) {
      case '23505': // unique_violation
        return {
          status: HttpStatus.CONFLICT,
          message: '이미 존재하는 데이터입니다.',
          isValidationError: false
        };
        
      case '23503': // foreign_key_violation  
        return {
          status: HttpStatus.BAD_REQUEST,
          message: '참조하는 데이터가 존재하지 않습니다.',
          isValidationError: false
        };
        
      case '23502': // not_null_violation
        return {
          status: HttpStatus.BAD_REQUEST,
          message: '필수 데이터가 누락되었습니다.',
          isValidationError: false
        };
        
      case '42P01': // undefined_table
        return {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          message: '데이터베이스 설정 오류가 발생했습니다.',
          isValidationError: false
        };
        
      default:
        return {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          message: '데이터베이스 오류가 발생했습니다.',
          isValidationError: false
        };
    }
  }

  /**
   * 에러를 로깅합니다.
   * 
   * 개발환경에서는 상세한 정보를, 프로덕션에서는 최소한의 정보만 로깅합니다.
   * 민감한 정보(비밀번호, 토큰 등)는 절대 로깅하지 않습니다.
   */
  private logError(request: Request, exceptionInfo: {
    status: number;
    message: string;
    details?: any;
    isValidationError: boolean;
  }, originalException: unknown): void {
    const { method, url, ip, headers } = request;
    const userAgent = headers['user-agent'] || 'Unknown';

    // 민감한 헤더 정보 제거
    const safeHeaders = this.sanitizeHeaders(headers);

    const errorContext = {
      method,
      url,
      ip,
      userAgent,
      status: exceptionInfo.status,
      message: exceptionInfo.message,
      timestamp: new Date().toISOString(),
    };

    // 개발 환경에서는 상세한 스택 트레이스 포함
    if (process.env.NODE_ENV === 'development') {
      this.logger.error(`API Error: ${method} ${url}`, {
        ...errorContext,
        headers: safeHeaders,
        stack: originalException instanceof Error ? originalException.stack : undefined
      });
    } else {
      // 프로덕션에서는 최소한의 정보만
      this.logger.error(`API Error: ${method} ${url} - ${exceptionInfo.status}`, errorContext);
    }
  }

  /**
   * 클라이언트에게 전송할 에러 응답을 구성합니다.
   * 
   * 일관된 형태의 에러 응답을 제공하여 프론트엔드에서
   * 예측 가능한 방식으로 에러를 처리할 수 있게 합니다.
   */
  private buildErrorResponse(request: Request, exceptionInfo: {
    status: number;
    message: string;
    details?: any;
    isValidationError: boolean;
  }) {
    const baseResponse = {
      success: false,
      error: {
        status: exceptionInfo.status,
        message: exceptionInfo.message,
        timestamp: new Date().toISOString(),
        path: request.url,
      }
    };

    // Validation 에러인 경우 세부 정보 추가
    if (exceptionInfo.isValidationError && exceptionInfo.details) {
      return {
        ...baseResponse,
        error: {
          ...baseResponse.error,
          validationErrors: exceptionInfo.details
        }
      };
    }

    return baseResponse;
  }

  /**
   * 민감한 헤더 정보를 제거합니다.
   * 
   * 로깅 시 보안에 민감한 정보들이 노출되지 않도록 합니다.
   */
  private sanitizeHeaders(headers: Record<string, any>): Record<string, any> {
    const sensitiveHeaders = [
      'authorization',
      'cookie',
      'set-cookie',
      'x-api-key',
      'x-auth-token'
    ];

    const safeHeaders = { ...headers } as Record<string, any>;
    
    sensitiveHeaders.forEach(header => {
      if (safeHeaders[header]) {
        safeHeaders[header] = '***REDACTED***';
      }
    });

    return safeHeaders;
  }
}