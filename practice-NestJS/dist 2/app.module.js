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
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const config_1 = require("@nestjs/config");
const jwt_1 = require("@nestjs/jwt");
const nestjs_redis_1 = require("@liaoliaots/nestjs-redis");
const app_controller_1 = require("./app.controller");
const app_service_1 = require("./app.service");
const auth_module_1 = require("./modules/auth/auth.module");
const users_module_1 = require("./modules/users/users.module");
const products_module_1 = require("./modules/products/products.module");
const health_module_1 = require("./modules/health/health.module");
const env_validation_schema_1 = require("./config/env-validation.schema");
let AppModule = class AppModule {
    constructor(configService) {
        this.configService = configService;
        console.log('🏗️  AppModule이 초기화되었습니다');
        console.log(`📊 현재 환경: ${this.configService.get('NODE_ENV', 'development')}`);
    }
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                envFilePath: '.env',
                validate: env_validation_schema_1.validateEnvironmentVariables,
                cache: process.env.NODE_ENV === 'production',
            }),
            typeorm_1.TypeOrmModule.forRootAsync({
                imports: [config_1.ConfigModule],
                useFactory: (configService) => ({
                    type: 'postgres',
                    host: configService.get('DB_HOST', 'localhost'),
                    port: configService.get('DB_PORT', 5432),
                    username: configService.get('DB_USERNAME', 'postgres'),
                    password: configService.get('DB_PASSWORD', ''),
                    database: configService.get('DB_NAME', 'practice_nestjs'),
                    entities: [__dirname + '/**/*.entity{.ts,.js}'],
                    synchronize: configService.get('NODE_ENV', 'development') === 'development',
                    logging: configService.get('NODE_ENV', 'development') === 'development',
                    extra: {
                        connectionLimit: 10,
                        acquireTimeoutMillis: 30000,
                        timeout: 30000,
                    },
                }),
                inject: [config_1.ConfigService],
            }),
            nestjs_redis_1.RedisModule.forRootAsync({
                imports: [config_1.ConfigModule],
                useFactory: (configService) => {
                    return {
                        readyLog: true,
                        config: {
                            host: configService.get('REDIS_HOST', 'localhost'),
                            port: configService.get('REDIS_PORT', 6379),
                            password: configService.get('REDIS_PASSWORD'),
                            retryDelayOnFailover: 100,
                            maxRetriesPerRequest: 3,
                            lazyConnect: true,
                            connectTimeout: 10000,
                            lazyConnectTimeout: 5000,
                            enableReadyCheck: true,
                            maxLoadingTimeout: 5000,
                        },
                    };
                },
                inject: [config_1.ConfigService],
            }),
            jwt_1.JwtModule.registerAsync({
                global: true,
                imports: [config_1.ConfigModule],
                useFactory: (configService) => ({
                    secret: configService.get('JWT_SECRET', 'default-secret-key'),
                    signOptions: {
                        expiresIn: configService.get('JWT_EXPIRES_IN', '24h'),
                        issuer: 'practice-nestjs-api',
                        audience: 'practice-nestjs-client',
                    },
                }),
                inject: [config_1.ConfigService],
            }),
            auth_module_1.AuthModule,
            users_module_1.UsersModule,
            products_module_1.ProductsModule,
            health_module_1.HealthModule,
        ],
        controllers: [app_controller_1.AppController],
        providers: [app_service_1.AppService],
    }),
    __metadata("design:paramtypes", [config_1.ConfigService])
], AppModule);
//# sourceMappingURL=app.module.js.map