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
exports.CreateUserDto = void 0;
const openapi = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
class CreateUserDto {
    constructor() {
        this.role = 'user';
        this.isActive = true;
        this.isEmailVerified = false;
    }
    static _OPENAPI_METADATA_FACTORY() {
        return { email: { required: true, type: () => String }, name: { required: true, type: () => String, minLength: 2, maxLength: 50, pattern: "/^[\uAC00-\uD7A3a-zA-Z\\s]+$/" }, password: { required: true, type: () => String, minLength: 8, maxLength: 128, pattern: "/^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]/" }, role: { required: false, type: () => Object, default: "user", pattern: "/^(user|moderator|admin)$/" }, isActive: { required: false, type: () => Boolean, default: true }, isEmailVerified: { required: false, type: () => Boolean, default: false } };
    }
}
exports.CreateUserDto = CreateUserDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '사용자 이메일 주소',
        example: 'admin-created-user@example.com',
        format: 'email'
    }),
    (0, class_validator_1.IsEmail)({}, {
        message: '올바른 이메일 형식을 입력해주세요.'
    }),
    (0, class_validator_1.IsNotEmpty)({
        message: '이메일은 필수 입력 항목입니다.'
    }),
    __metadata("design:type", String)
], CreateUserDto.prototype, "email", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '사용자 실명',
        example: '관리자생성사용자',
        minLength: 2,
        maxLength: 50
    }),
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
    (0, class_validator_1.IsNotEmpty)({
        message: '이름은 필수 입력 항목입니다.'
    }),
    __metadata("design:type", String)
], CreateUserDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '사용자 비밀번호',
        example: 'TempPassword123!',
        minLength: 8,
        maxLength: 128,
        format: 'password'
    }),
    (0, class_validator_1.IsString)({
        message: '비밀번호는 문자열이어야 합니다.'
    }),
    (0, class_validator_1.MinLength)(8, {
        message: '비밀번호는 최소 8자 이상이어야 합니다.'
    }),
    (0, class_validator_1.MaxLength)(128, {
        message: '비밀번호는 최대 128자까지 가능합니다.'
    }),
    (0, class_validator_1.Matches)(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
        message: '비밀번호는 영문 대소문자, 숫자, 특수문자를 각각 1개 이상 포함해야 합니다.'
    }),
    (0, class_validator_1.IsNotEmpty)({
        message: '비밀번호는 필수 입력 항목입니다.'
    }),
    __metadata("design:type", String)
], CreateUserDto.prototype, "password", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '사용자 역할',
        example: 'user',
        enum: ['user', 'moderator', 'admin'],
        default: 'user'
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.Matches)(/^(user|moderator|admin)$/, {
        message: '역할은 user, moderator, admin 중 하나여야 합니다.'
    }),
    __metadata("design:type", String)
], CreateUserDto.prototype, "role", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '계정 활성화 상태',
        example: true,
        default: true
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)({
        message: '활성화 상태는 true 또는 false여야 합니다.'
    }),
    __metadata("design:type", Boolean)
], CreateUserDto.prototype, "isActive", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '이메일 인증 완료 여부',
        example: false,
        default: false
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)({
        message: '이메일 인증 상태는 true 또는 false여야 합니다.'
    }),
    __metadata("design:type", Boolean)
], CreateUserDto.prototype, "isEmailVerified", void 0);
//# sourceMappingURL=create-user.dto.js.map