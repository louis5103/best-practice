"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var LoggingInterceptor_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoggingInterceptor = void 0;
const common_1 = require("@nestjs/common");
const operators_1 = require("rxjs/operators");
const rxjs_1 = require("rxjs");
let LoggingInterceptor = LoggingInterceptor_1 = class LoggingInterceptor {
    constructor() {
        this.logger = new common_1.Logger(LoggingInterceptor_1.name);
    }
    intercept(context, next) {
        const request = context.switchToHttp().getRequest();
        const response = context.switchToHttp().getResponse();
        const { method, url, ip, headers, body, query, params } = request;
        const userAgent = headers['user-agent'] || 'Unknown';
        const startTime = Date.now();
        const requestId = this.generateRequestId();
        request.requestId = requestId;
        this.logRequest(requestId, method, url, ip, userAgent, body, query, params);
        return next.handle().pipe((0, operators_1.tap)((responseData) => {
            const responseTime = Date.now() - startTime;
            this.logSuccessResponse(requestId, method, url, response.statusCode, responseTime, responseData);
        }), (0, operators_1.catchError)((error) => {
            const responseTime = Date.now() - startTime;
            this.logErrorResponse(requestId, method, url, error.status || 500, responseTime, error);
            return (0, rxjs_1.throwError)(() => error);
        }));
    }
    logRequest(requestId, method, url, ip, userAgent, body, query, params) {
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
        if (this.isLowPriorityRequest(url)) {
            this.logger.log(`${method} ${url}`, { requestId, ip });
        }
        else {
            this.logger.log(`📥 Incoming Request: ${method} ${url}`, logData);
        }
    }
    logSuccessResponse(requestId, method, url, statusCode, responseTime, responseData) {
        const logData = {
            requestId,
            method,
            url,
            statusCode,
            responseTime: `${responseTime}ms`,
            timestamp: new Date().toISOString()
        };
        const responseSize = this.calculateResponseSize(responseData);
        const logDataWithSize = { ...logData };
        if (responseSize > 0) {
            logDataWithSize['responseSize'] = `${responseSize} bytes`;
        }
        if (responseTime > 1000) {
            this.logger.warn(`🐌 Slow Response: ${method} ${url} - ${responseTime}ms`, logDataWithSize);
        }
        else if (this.isLowPriorityRequest(url)) {
            this.logger.log(`${method} ${url} - ${responseTime}ms`);
        }
        else {
            this.logger.log(`📤 Outgoing Response: ${method} ${url} - ${responseTime}ms`, logDataWithSize);
        }
    }
    logErrorResponse(requestId, method, url, statusCode, responseTime, error) {
        const logData = {
            requestId,
            method,
            url,
            statusCode,
            responseTime: `${responseTime}ms`,
            error: error.message || 'Unknown error',
            timestamp: new Date().toISOString()
        };
        if (statusCode >= 500) {
            this.logger.error(`💥 Server Error: ${method} ${url}`, logData);
        }
        else if (statusCode >= 400) {
            this.logger.warn(`⚠️ Client Error: ${method} ${url}`, logData);
        }
        else {
            this.logger.log(`❌ Error Response: ${method} ${url}`, logData);
        }
    }
    generateRequestId() {
        return Math.random().toString(36).substring(2, 15) +
            Math.random().toString(36).substring(2, 15);
    }
    sanitizeData(data) {
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
        const sanitized = { ...data };
        sensitiveFields.forEach(field => {
            if (sanitized[field]) {
                sanitized[field] = '***MASKED***';
            }
        });
        Object.keys(sanitized).forEach(key => {
            if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
                sanitized[key] = this.sanitizeData(sanitized[key]);
            }
        });
        return sanitized;
    }
    isLowPriorityRequest(url) {
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
    calculateResponseSize(data) {
        try {
            if (!data)
                return 0;
            return JSON.stringify(data).length;
        }
        catch {
            return 0;
        }
    }
};
exports.LoggingInterceptor = LoggingInterceptor;
exports.LoggingInterceptor = LoggingInterceptor = LoggingInterceptor_1 = __decorate([
    (0, common_1.Injectable)()
], LoggingInterceptor);
//# sourceMappingURL=logging.interceptor.js.map