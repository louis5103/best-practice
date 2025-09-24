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
exports.LogoutResponseDto = exports.RefreshTokenDto = exports.RegisterResponseDto = exports.AuthResponseDto = exports.UserInfoDto = void 0;
const openapi = require("@nestjs/swagger");
const swagger_1 = require("@nestjs/swagger");
class UserInfoDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { id: { required: true, type: () => Number }, email: { required: true, type: () => String }, name: { required: true, type: () => String }, role: { required: true, type: () => String }, isActive: { required: true, type: () => Boolean }, isEmailVerified: { required: true, type: () => Boolean }, createdAt: { required: true, type: () => Date } };
    }
}
exports.UserInfoDto = UserInfoDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '사용자 고유 ID',
        example: 1
    }),
    __metadata("design:type", Number)
], UserInfoDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '사용자 이메일',
        example: 'user@example.com'
    }),
    __metadata("design:type", String)
], UserInfoDto.prototype, "email", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '사용자 이름',
        example: '김철수'
    }),
    __metadata("design:type", String)
], UserInfoDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '사용자 역할',
        example: 'user',
        enum: ['user', 'moderator', 'admin']
    }),
    __metadata("design:type", String)
], UserInfoDto.prototype, "role", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '계정 활성화 상태',
        example: true
    }),
    __metadata("design:type", Boolean)
], UserInfoDto.prototype, "isActive", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '이메일 인증 상태',
        example: true
    }),
    __metadata("design:type", Boolean)
], UserInfoDto.prototype, "isEmailVerified", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '계정 생성일',
        example: '2024-01-01T00:00:00.000Z'
    }),
    __metadata("design:type", Date)
], UserInfoDto.prototype, "createdAt", void 0);
class AuthResponseDto {
    constructor() {
        this.tokenType = 'Bearer';
    }
    static _OPENAPI_METADATA_FACTORY() {
        return { accessToken: { required: true, type: () => String }, tokenType: { required: true, type: () => String, default: "Bearer" }, expiresIn: { required: true, type: () => Number }, user: { required: true, type: () => require("./auth-response.dto").UserInfoDto }, message: { required: true, type: () => String }, timestamp: { required: true, type: () => String } };
    }
}
exports.AuthResponseDto = AuthResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'JWT 액세스 토큰',
        example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
    }),
    __metadata("design:type", String)
], AuthResponseDto.prototype, "accessToken", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '토큰 타입',
        example: 'Bearer',
        default: 'Bearer'
    }),
    __metadata("design:type", String)
], AuthResponseDto.prototype, "tokenType", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '토큰 만료 시간 (초)',
        example: 86400
    }),
    __metadata("design:type", Number)
], AuthResponseDto.prototype, "expiresIn", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '인증된 사용자 정보',
        type: UserInfoDto
    }),
    __metadata("design:type", UserInfoDto)
], AuthResponseDto.prototype, "user", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '인증 성공 메시지',
        example: '로그인에 성공했습니다.'
    }),
    __metadata("design:type", String)
], AuthResponseDto.prototype, "message", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '응답 시간',
        example: '2024-01-01T12:00:00.000Z'
    }),
    __metadata("design:type", String)
], AuthResponseDto.prototype, "timestamp", void 0);
class RegisterResponseDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { message: { required: true, type: () => String }, user: { required: true, type: () => require("./auth-response.dto").UserInfoDto }, nextStep: { required: true, type: () => String }, timestamp: { required: true, type: () => String } };
    }
}
exports.RegisterResponseDto = RegisterResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '회원가입 성공 메시지',
        example: '회원가입이 완료되었습니다. 이메일 인증을 진행해 주세요.'
    }),
    __metadata("design:type", String)
], RegisterResponseDto.prototype, "message", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '생성된 사용자 정보',
        type: UserInfoDto
    }),
    __metadata("design:type", UserInfoDto)
], RegisterResponseDto.prototype, "user", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '다음 단계 안내',
        example: '이메일로 전송된 인증 링크를 확인해 주세요.'
    }),
    __metadata("design:type", String)
], RegisterResponseDto.prototype, "nextStep", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '응답 시간',
        example: '2024-01-01T12:00:00.000Z'
    }),
    __metadata("design:type", String)
], RegisterResponseDto.prototype, "timestamp", void 0);
class RefreshTokenDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { refreshToken: { required: true, type: () => String } };
    }
}
exports.RefreshTokenDto = RefreshTokenDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '리프레시 토큰',
        example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
    }),
    __metadata("design:type", String)
], RefreshTokenDto.prototype, "refreshToken", void 0);
class LogoutResponseDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { message: { required: true, type: () => String }, timestamp: { required: true, type: () => String } };
    }
}
exports.LogoutResponseDto = LogoutResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '로그아웃 성공 메시지',
        example: '성공적으로 로그아웃되었습니다.'
    }),
    __metadata("design:type", String)
], LogoutResponseDto.prototype, "message", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '응답 시간',
        example: '2024-01-01T12:00:00.000Z'
    }),
    __metadata("design:type", String)
], LogoutResponseDto.prototype, "timestamp", void 0);
//# sourceMappingURL=auth-response.dto.js.map