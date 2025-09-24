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
exports.ChangePasswordDto = exports.UpdateUserDto = void 0;
const openapi = require("@nestjs/swagger");
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const swagger_2 = require("@nestjs/swagger");
const create_user_dto_1 = require("./create-user.dto");
class UpdateUserDto extends (0, swagger_1.PartialType)((0, swagger_1.OmitType)(create_user_dto_1.CreateUserDto, ['password'])) {
    static _OPENAPI_METADATA_FACTORY() {
        return { email: { required: false, type: () => String }, name: { required: false, type: () => String, minLength: 2, maxLength: 50, pattern: "/^[\uAC00-\uD7A3a-zA-Z\\s]+$/" }, role: { required: false, type: () => Object, pattern: "/^(user|moderator|admin)$/" }, isActive: { required: false, type: () => Boolean }, isEmailVerified: { required: false, type: () => Boolean } };
    }
}
exports.UpdateUserDto = UpdateUserDto;
__decorate([
    (0, swagger_2.ApiPropertyOptional)({
        description: '변경할 이메일 주소',
        example: 'newemail@example.com',
        format: 'email'
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEmail)({}, {
        message: '올바른 이메일 형식을 입력해주세요.'
    }),
    __metadata("design:type", String)
], UpdateUserDto.prototype, "email", void 0);
__decorate([
    (0, swagger_2.ApiPropertyOptional)({
        description: '변경할 사용자 이름',
        example: '변경된이름',
        minLength: 2,
        maxLength: 50
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({
        message: '이름은 문자열이어야 합니다.'
    }),
    (0, class_validator_1.MinLength)(2, {
        message: '이름은 최소 2자 이상이어야 합니다.'
    }),
    (0, class_validator_1.MaxLength)(50, {
        message: '이름은 최대 50자까지 가능합니다.'
    }),
    (0, class_validator_1.Matches)(/^[가-힣a-zA-Z\s]+$/, {
        message: '이름은 한글, 영문, 공백만 사용 가능합니다.'
    }),
    __metadata("design:type", String)
], UpdateUserDto.prototype, "name", void 0);
__decorate([
    (0, swagger_2.ApiPropertyOptional)({
        description: '변경할 사용자 역할 (관리자만 수정 가능)',
        example: 'moderator',
        enum: ['user', 'moderator', 'admin']
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.Matches)(/^(user|moderator|admin)$/, {
        message: '역할은 user, moderator, admin 중 하나여야 합니다.'
    }),
    __metadata("design:type", String)
], UpdateUserDto.prototype, "role", void 0);
__decorate([
    (0, swagger_2.ApiPropertyOptional)({
        description: '계정 활성화 상태 (관리자만 수정 가능)',
        example: true
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)({
        message: '활성화 상태는 true 또는 false여야 합니다.'
    }),
    __metadata("design:type", Boolean)
], UpdateUserDto.prototype, "isActive", void 0);
__decorate([
    (0, swagger_2.ApiPropertyOptional)({
        description: '이메일 인증 완료 여부 (관리자만 수정 가능)',
        example: true
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)({
        message: '이메일 인증 상태는 true 또는 false여야 합니다.'
    }),
    __metadata("design:type", Boolean)
], UpdateUserDto.prototype, "isEmailVerified", void 0);
class ChangePasswordDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { currentPassword: { required: true, type: () => String }, newPassword: { required: true, type: () => String, minLength: 8, maxLength: 128, pattern: "/^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]/" }, newPasswordConfirm: { required: true, type: () => String } };
    }
}
exports.ChangePasswordDto = ChangePasswordDto;
__decorate([
    (0, swagger_2.ApiPropertyOptional)({
        description: '현재 비밀번호 (본인 확인용)',
        example: 'currentPassword123!',
        format: 'password'
    }),
    (0, class_validator_1.IsString)({
        message: '현재 비밀번호는 문자열이어야 합니다.'
    }),
    __metadata("design:type", String)
], ChangePasswordDto.prototype, "currentPassword", void 0);
__decorate([
    (0, swagger_2.ApiPropertyOptional)({
        description: '새로운 비밀번호',
        example: 'newPassword123!',
        minLength: 8,
        maxLength: 128,
        format: 'password'
    }),
    (0, class_validator_1.IsString)({
        message: '새 비밀번호는 문자열이어야 합니다.'
    }),
    (0, class_validator_1.MinLength)(8, {
        message: '새 비밀번호는 최소 8자 이상이어야 합니다.'
    }),
    (0, class_validator_1.MaxLength)(128, {
        message: '새 비밀번호는 최대 128자까지 가능합니다.'
    }),
    (0, class_validator_1.Matches)(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
        message: '새 비밀번호는 영문 대소문자, 숫자, 특수문자를 각각 1개 이상 포함해야 합니다.'
    }),
    __metadata("design:type", String)
], ChangePasswordDto.prototype, "newPassword", void 0);
__decorate([
    (0, swagger_2.ApiPropertyOptional)({
        description: '새로운 비밀번호 확인',
        example: 'newPassword123!',
        format: 'password'
    }),
    (0, class_validator_1.IsString)({
        message: '새 비밀번호 확인은 문자열이어야 합니다.'
    }),
    __metadata("design:type", String)
], ChangePasswordDto.prototype, "newPasswordConfirm", void 0);
//# sourceMappingURL=update-user.dto.js.map