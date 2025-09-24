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
exports.RolesGuard = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const roles_decorator_1 = require("../decorators/roles.decorator");
let RolesGuard = class RolesGuard {
    constructor(reflector) {
        this.reflector = reflector;
    }
    canActivate(context) {
        try {
            const requiredRoles = this.getRequiredRoles(context);
            if (!requiredRoles || requiredRoles.length === 0) {
                return true;
            }
            const currentUser = this.getCurrentUser(context);
            if (!currentUser) {
                throw new common_1.ForbiddenException('인증이 필요합니다.');
            }
            const userRole = currentUser.role;
            if (!userRole) {
                throw new common_1.ForbiddenException('사용자 권한 정보가 없습니다.');
            }
            const hasPermission = (0, roles_decorator_1.hasAnyRole)(userRole, requiredRoles);
            if (!hasPermission) {
                const requiredRoleNames = this.formatRoleNames(requiredRoles);
                throw new common_1.ForbiddenException(`이 작업을 수행하려면 ${requiredRoleNames} 권한이 필요합니다. ` +
                    `현재 권한: ${this.formatRoleName(userRole)}`);
            }
            return true;
        }
        catch (error) {
            if (error instanceof common_1.ForbiddenException) {
                throw error;
            }
            console.error('RolesGuard에서 예상치 못한 에러 발생:', error);
            throw new common_1.ForbiddenException('권한 확인 중 오류가 발생했습니다.');
        }
    }
    getRequiredRoles(context) {
        return this.reflector.getAllAndOverride(roles_decorator_1.ROLES_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);
    }
    getCurrentUser(context) {
        const request = context.switchToHttp().getRequest();
        return request.user;
    }
    formatRoleNames(roles) {
        const roleNames = roles.map(role => this.formatRoleName(role));
        if (roleNames.length === 1) {
            return roleNames[0];
        }
        if (roleNames.length === 2) {
            return `${roleNames[0]} 또는 ${roleNames[1]}`;
        }
        const lastRole = roleNames.pop();
        return `${roleNames.join(', ')} 또는 ${lastRole}`;
    }
    formatRoleName(role) {
        const roleTranslations = {
            'admin': '관리자',
            'moderator': '운영자',
            'user': '일반 사용자'
        };
        return roleTranslations[role] || role;
    }
};
exports.RolesGuard = RolesGuard;
exports.RolesGuard = RolesGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [core_1.Reflector])
], RolesGuard);
//# sourceMappingURL=roles.guard.js.map