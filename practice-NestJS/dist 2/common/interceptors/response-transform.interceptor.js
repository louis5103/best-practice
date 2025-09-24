"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResponseTransformInterceptor = void 0;
const common_1 = require("@nestjs/common");
const operators_1 = require("rxjs/operators");
let ResponseTransformInterceptor = class ResponseTransformInterceptor {
    intercept(context, next) {
        const request = context.switchToHttp().getRequest();
        return next.handle().pipe((0, operators_1.map)(data => {
            if (data && typeof data === 'object' && ('success' in data || 'error' in data)) {
                return data;
            }
            if (request.url.includes('/health')) {
                return this.transformHealthResponse(data, request);
            }
            if (data && typeof data === 'object' && 'items' in data && 'meta' in data) {
                return this.transformPaginatedResponse(data, request);
            }
            return this.transformStandardResponse(data, request);
        }));
    }
    transformStandardResponse(data, request) {
        return {
            success: true,
            data: data,
            timestamp: new Date().toISOString(),
            path: request.url
        };
    }
    transformPaginatedResponse(data, request) {
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
    transformHealthResponse(data, request) {
        if (data && data.status && data.timestamp) {
            return {
                success: true,
                data: data,
                path: request.url
            };
        }
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
};
exports.ResponseTransformInterceptor = ResponseTransformInterceptor;
exports.ResponseTransformInterceptor = ResponseTransformInterceptor = __decorate([
    (0, common_1.Injectable)()
], ResponseTransformInterceptor);
//# sourceMappingURL=response-transform.interceptor.js.map