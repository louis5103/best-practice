"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const app_service_1 = require("./app.service");
let AppController = class AppController {
    constructor(appService) {
        this.appService = appService;
    }
    getHello() {
        return this.appService.getAppInfo();
    }
    async checkHealth() {
        return await this.appService.checkHealth();
    }
};
exports.AppController = AppController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({
        summary: '애플리케이션 기본 정보 조회',
        description: 'API 서버의 상태와 기본 정보를 확인할 수 있습니다.'
    }),
    (0, swagger_1.ApiResponse)({
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
    }),
    openapi.ApiResponse({ status: 200, type: Object }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Object)
], AppController.prototype, "getHello", null);
__decorate([
    (0, common_1.Get)('health'),
    (0, swagger_1.ApiOperation)({
        summary: '서버 상태 확인',
        description: '서버가 정상적으로 동작하는지 확인합니다. 데이터베이스와 Redis 연결 상태도 포함됩니다.'
    }),
    (0, swagger_1.ApiResponse)({
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
    }),
    openapi.ApiResponse({ status: 200, type: Object }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AppController.prototype, "checkHealth", null);
exports.AppController = AppController = __decorate([
    (0, swagger_1.ApiTags)('기본 정보'),
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [app_service_1.AppService])
], AppController);
//# sourceMappingURL=app.controller.js.map