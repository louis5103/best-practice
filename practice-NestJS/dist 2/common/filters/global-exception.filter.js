"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var GlobalExceptionFilter_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.GlobalExceptionFilter = void 0;
const common_1 = require("@nestjs/common");
let GlobalExceptionFilter = GlobalExceptionFilter_1 = class GlobalExceptionFilter {
    constructor() {
        this.logger = new common_1.Logger(GlobalExceptionFilter_1.name);
    }
    catch(exception, host) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse();
        const request = ctx.getRequest();
        const exceptionInfo = this.parseException(exception);
        this.logError(request, exceptionInfo, exception);
        const errorResponse = this.buildErrorResponse(request, exceptionInfo);
        response.status(exceptionInfo.status).json(errorResponse);
    }
    parseException(exception) {
        if (exception instanceof common_1.HttpException) {
            const status = exception.getStatus();
            const exceptionResponse = exception.getResponse();
            if (typeof exceptionResponse === 'object' && exceptionResponse !== null && 'message' in exceptionResponse) {
                const response = exceptionResponse;
                return {
                    status,
                    message: Array.isArray(response.message)
                        ? '입력값 검증에 실패했습니다.'
                        : response.message,
                    details: Array.isArray(response.message) ? response.message : undefined,
                    isValidationError: status === common_1.HttpStatus.BAD_REQUEST && Array.isArray(response.message)
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
        if (typeof exception === 'object' && exception !== null && 'code' in exception) {
            return this.parseDatabaseError(exception);
        }
        return {
            status: common_1.HttpStatus.INTERNAL_SERVER_ERROR,
            message: '서버 내부 오류가 발생했습니다.',
            isValidationError: false
        };
    }
    parseDatabaseError(exception) {
        const code = exception.code;
        switch (code) {
            case '23505':
                return {
                    status: common_1.HttpStatus.CONFLICT,
                    message: '이미 존재하는 데이터입니다.',
                    isValidationError: false
                };
            case '23503':
                return {
                    status: common_1.HttpStatus.BAD_REQUEST,
                    message: '참조하는 데이터가 존재하지 않습니다.',
                    isValidationError: false
                };
            case '23502':
                return {
                    status: common_1.HttpStatus.BAD_REQUEST,
                    message: '필수 데이터가 누락되었습니다.',
                    isValidationError: false
                };
            case '42P01':
                return {
                    status: common_1.HttpStatus.INTERNAL_SERVER_ERROR,
                    message: '데이터베이스 설정 오류가 발생했습니다.',
                    isValidationError: false
                };
            default:
                return {
                    status: common_1.HttpStatus.INTERNAL_SERVER_ERROR,
                    message: '데이터베이스 오류가 발생했습니다.',
                    isValidationError: false
                };
        }
    }
    logError(request, exceptionInfo, originalException) {
        const { method, url, ip, headers } = request;
        const userAgent = headers['user-agent'] || 'Unknown';
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
        if (process.env.NODE_ENV === 'development') {
            this.logger.error(`API Error: ${method} ${url}`, {
                ...errorContext,
                headers: safeHeaders,
                stack: originalException instanceof Error ? originalException.stack : undefined
            });
        }
        else {
            this.logger.error(`API Error: ${method} ${url} - ${exceptionInfo.status}`, errorContext);
        }
    }
    buildErrorResponse(request, exceptionInfo) {
        const baseResponse = {
            success: false,
            error: {
                status: exceptionInfo.status,
                message: exceptionInfo.message,
                timestamp: new Date().toISOString(),
                path: request.url,
            }
        };
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
    sanitizeHeaders(headers) {
        const sensitiveHeaders = [
            'authorization',
            'cookie',
            'set-cookie',
            'x-api-key',
            'x-auth-token'
        ];
        const safeHeaders = { ...headers };
        sensitiveHeaders.forEach(header => {
            if (safeHeaders[header]) {
                safeHeaders[header] = '***REDACTED***';
            }
        });
        return safeHeaders;
    }
};
exports.GlobalExceptionFilter = GlobalExceptionFilter;
exports.GlobalExceptionFilter = GlobalExceptionFilter = GlobalExceptionFilter_1 = __decorate([
    (0, common_1.Catch)()
], GlobalExceptionFilter);
//# sourceMappingURL=global-exception.filter.js.map