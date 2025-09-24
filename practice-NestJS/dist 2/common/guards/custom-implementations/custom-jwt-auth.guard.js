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
var CustomJwtAuthGuard_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomJwtAuthGuard = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const config_1 = require("@nestjs/config");
const core_1 = require("@nestjs/core");
let CustomJwtAuthGuard = CustomJwtAuthGuard_1 = class CustomJwtAuthGuard {
    constructor(jwtService, configService, reflector) {
        this.jwtService = jwtService;
        this.configService = configService;
        this.reflector = reflector;
        this.logger = new common_1.Logger(CustomJwtAuthGuard_1.name);
    }
    async canActivate(context) {
        const isPublic = this.reflector.getAllAndOverride('isPublic', [
            context.getHandler(),
            context.getClass(),
        ]);
        if (isPublic) {
            return true;
        }
        const request = context.switchToHttp().getRequest();
        const token = this.extractTokenFromHeader(request);
        if (!token) {
            this.logger.warn(`인증 토큰이 제공되지 않았습니다. IP: ${request.ip}`);
            throw new common_1.UnauthorizedException('인증 토큰이 필요합니다.');
        }
        try {
            const payload = await this.jwtService.verifyAsync(token, {
                secret: this.configService.get('JWT_SECRET'),
                ignoreExpiration: false,
                audience: this.configService.get('JWT_AUDIENCE'),
                issuer: this.configService.get('JWT_ISSUER'),
            });
            request.user = {
                userId: payload.sub,
                email: payload.email,
                role: payload.role,
                iat: payload.iat,
                exp: payload.exp,
            };
            this.logger.debug(`사용자 인증 성공: ${payload.email} (ID: ${payload.sub})`);
            return true;
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
            const errorName = error instanceof Error ? error.name : null;
            this.logger.error(`JWT 토큰 검증 실패: ${errorMessage}. IP: ${request.ip}`);
            if (errorName === 'JsonWebTokenError') {
                throw new common_1.UnauthorizedException('유효하지 않은 토큰입니다.');
            }
            else if (errorName === 'TokenExpiredError') {
                throw new common_1.UnauthorizedException('토큰이 만료되었습니다. 다시 로그인해 주세요.');
            }
            else if (errorName === 'NotBeforeError') {
                throw new common_1.UnauthorizedException('토큰이 아직 활성화되지 않았습니다.');
            }
            else {
                throw new common_1.UnauthorizedException('토큰 인증에 실패했습니다.');
            }
        }
    }
    extractTokenFromHeader(request) {
        const authorization = request.headers.authorization;
        if (!authorization) {
            return undefined;
        }
        const [type, token] = authorization.split(' ');
        return type === 'Bearer' && token ? token : undefined;
    }
};
exports.CustomJwtAuthGuard = CustomJwtAuthGuard;
exports.CustomJwtAuthGuard = CustomJwtAuthGuard = CustomJwtAuthGuard_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [jwt_1.JwtService,
        config_1.ConfigService,
        core_1.Reflector])
], CustomJwtAuthGuard);
//# sourceMappingURL=custom-jwt-auth.guard.js.map