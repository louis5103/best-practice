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
exports.AppService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const typeorm_1 = require("typeorm");
const nestjs_redis_1 = require("@liaoliaots/nestjs-redis");
let AppService = class AppService {
    constructor(configService, dataSource, redisService) {
        this.configService = configService;
        this.dataSource = dataSource;
        this.redisService = redisService;
    }
    getAppInfo() {
        return {
            message: 'NestJS 백엔드 API에 오신 것을 환영합니다! 🚀',
            version: this.configService.get('API_VERSION', '1.0.0'),
            environment: this.configService.get('NODE_ENV', 'development'),
            timestamp: new Date().toISOString(),
            documentation: '/api-docs',
            features: [
                'JWT 인증',
                'TypeORM + PostgreSQL',
                'Redis 캐싱',
                'Swagger API 문서',
                '자동 유효성 검사'
            ]
        };
    }
    async checkHealth() {
        const healthStatus = {
            status: 'ok',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            memory: {
                used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024 * 100) / 100,
                total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024 * 100) / 100,
                unit: 'MB'
            },
            database: 'disconnected',
            redis: 'disconnected'
        };
        try {
            if (this.dataSource.isInitialized) {
                await this.dataSource.query('SELECT 1');
                healthStatus.database = 'connected';
            }
        }
        catch (error) {
            console.error('데이터베이스 상태 확인 중 오류:', error instanceof Error ? error.message : String(error));
            healthStatus.database = 'error';
        }
        try {
            const redis = this.redisService.getOrThrow();
            await redis.set('health-check', 'ok', 'EX', 1);
            const result = await redis.get('health-check');
            if (result === 'ok') {
                healthStatus.redis = 'connected';
                await redis.del('health-check');
            }
        }
        catch (error) {
            console.error('Redis 상태 확인 중 오류:', error instanceof Error ? error.message : String(error));
            healthStatus.redis = 'error';
        }
        if (healthStatus.database !== 'connected' || healthStatus.redis !== 'connected') {
            healthStatus.status = 'degraded';
        }
        return healthStatus;
    }
    async onApplicationBootstrap() {
        console.log('🔧 애플리케이션 초기화 시작...');
        try {
            if (this.dataSource.isInitialized) {
                console.log('✅ 데이터베이스 연결 성공');
            }
            const redis = this.redisService.getOrThrow();
            await redis.ping();
            console.log('✅ Redis 연결 성공');
            console.log('🎉 애플리케이션 초기화 완료');
        }
        catch (error) {
            console.error('❌ 초기화 중 오류 발생:', error instanceof Error ? error.message : String(error));
        }
    }
};
exports.AppService = AppService;
exports.AppService = AppService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        typeorm_1.DataSource,
        nestjs_redis_1.RedisService])
], AppService);
//# sourceMappingURL=app.service.js.map