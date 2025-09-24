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
exports.UserStatsDto = exports.PaginatedUserResponseDto = exports.UserResponseDto = void 0;
const openapi = require("@nestjs/swagger");
const swagger_1 = require("@nestjs/swagger");
const class_transformer_1 = require("class-transformer");
class UserResponseDto {
    static fromEntity(user) {
        const dto = new UserResponseDto();
        dto.id = user.id;
        dto.email = user.email;
        dto.name = user.name;
        dto.role = user.role;
        dto.isActive = user.isActive;
        dto.isEmailVerified = user.isEmailVerified;
        dto.lastLoginAt = user.lastLoginAt;
        dto.createdAt = user.createdAt;
        dto.updatedAt = user.updatedAt;
        return dto;
    }
    static fromEntities(users) {
        return users.map(user => this.fromEntity(user));
    }
    static _OPENAPI_METADATA_FACTORY() {
        return { id: { required: true, type: () => Number }, email: { required: true, type: () => String }, name: { required: true, type: () => String }, role: { required: true, type: () => Object }, isActive: { required: true, type: () => Boolean }, isEmailVerified: { required: true, type: () => Boolean }, lastLoginAt: { required: false, type: () => Date }, createdAt: { required: true, type: () => Date }, updatedAt: { required: true, type: () => Date }, password: { required: false, type: () => String } };
    }
}
exports.UserResponseDto = UserResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '사용자 고유 ID',
        example: 1
    }),
    __metadata("design:type", Number)
], UserResponseDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '사용자 이메일 주소',
        example: 'user@example.com'
    }),
    __metadata("design:type", String)
], UserResponseDto.prototype, "email", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '사용자 이름',
        example: '김철수'
    }),
    __metadata("design:type", String)
], UserResponseDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '사용자 역할',
        example: 'user',
        enum: ['user', 'moderator', 'admin']
    }),
    __metadata("design:type", String)
], UserResponseDto.prototype, "role", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '계정 활성화 여부',
        example: true
    }),
    __metadata("design:type", Boolean)
], UserResponseDto.prototype, "isActive", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '이메일 인증 완료 여부',
        example: true
    }),
    __metadata("design:type", Boolean)
], UserResponseDto.prototype, "isEmailVerified", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '마지막 로그인 시간',
        example: '2024-01-15T10:30:00.000Z',
        type: 'string',
        format: 'date-time'
    }),
    __metadata("design:type", Date)
], UserResponseDto.prototype, "lastLoginAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '계정 생성 시간',
        example: '2024-01-01T00:00:00.000Z',
        type: 'string',
        format: 'date-time'
    }),
    __metadata("design:type", Date)
], UserResponseDto.prototype, "createdAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '정보 마지막 수정 시간',
        example: '2024-01-10T15:45:00.000Z',
        type: 'string',
        format: 'date-time'
    }),
    __metadata("design:type", Date)
], UserResponseDto.prototype, "updatedAt", void 0);
__decorate([
    (0, class_transformer_1.Exclude)(),
    __metadata("design:type", String)
], UserResponseDto.prototype, "password", void 0);
class PaginatedUserResponseDto {
    static create(data, total, page, limit) {
        const totalPages = Math.ceil(total / limit);
        return {
            data,
            total,
            page,
            limit,
            totalPages,
            hasPrevious: page > 1,
            hasNext: page < totalPages
        };
    }
    static _OPENAPI_METADATA_FACTORY() {
        return { data: { required: true, type: () => [require("./user-response.dto").UserResponseDto] }, total: { required: true, type: () => Number }, page: { required: true, type: () => Number }, limit: { required: true, type: () => Number }, totalPages: { required: true, type: () => Number }, hasPrevious: { required: true, type: () => Boolean }, hasNext: { required: true, type: () => Boolean } };
    }
}
exports.PaginatedUserResponseDto = PaginatedUserResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '현재 페이지의 사용자 목록',
        type: [UserResponseDto]
    }),
    __metadata("design:type", Array)
], PaginatedUserResponseDto.prototype, "data", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '전체 사용자 수',
        example: 150
    }),
    __metadata("design:type", Number)
], PaginatedUserResponseDto.prototype, "total", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '현재 페이지 번호',
        example: 1
    }),
    __metadata("design:type", Number)
], PaginatedUserResponseDto.prototype, "page", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '페이지당 사용자 수',
        example: 10
    }),
    __metadata("design:type", Number)
], PaginatedUserResponseDto.prototype, "limit", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '전체 페이지 수',
        example: 15
    }),
    __metadata("design:type", Number)
], PaginatedUserResponseDto.prototype, "totalPages", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '이전 페이지 존재 여부',
        example: false
    }),
    __metadata("design:type", Boolean)
], PaginatedUserResponseDto.prototype, "hasPrevious", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '다음 페이지 존재 여부',
        example: true
    }),
    __metadata("design:type", Boolean)
], PaginatedUserResponseDto.prototype, "hasNext", void 0);
class UserStatsDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { totalUsers: { required: true, type: () => Number }, activeUsers: { required: true, type: () => Number }, inactiveUsers: { required: true, type: () => Number }, verifiedUsers: { required: true, type: () => Number }, usersByRole: { required: true, type: () => ({ user: { required: true, type: () => Number }, moderator: { required: true, type: () => Number }, admin: { required: true, type: () => Number } }) }, newUsersLastWeek: { required: true, type: () => Number } };
    }
}
exports.UserStatsDto = UserStatsDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '전체 사용자 수',
        example: 1250
    }),
    __metadata("design:type", Number)
], UserStatsDto.prototype, "totalUsers", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '활성화된 사용자 수',
        example: 1180
    }),
    __metadata("design:type", Number)
], UserStatsDto.prototype, "activeUsers", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '비활성화된 사용자 수',
        example: 70
    }),
    __metadata("design:type", Number)
], UserStatsDto.prototype, "inactiveUsers", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '이메일 인증 완료 사용자 수',
        example: 1100
    }),
    __metadata("design:type", Number)
], UserStatsDto.prototype, "verifiedUsers", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '역할별 사용자 수',
        example: {
            user: 1200,
            moderator: 40,
            admin: 10
        }
    }),
    __metadata("design:type", Object)
], UserStatsDto.prototype, "usersByRole", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '최근 7일간 신규 사용자 수',
        example: 45
    }),
    __metadata("design:type", Number)
], UserStatsDto.prototype, "newUsersLastWeek", void 0);
//# sourceMappingURL=user-response.dto.js.map