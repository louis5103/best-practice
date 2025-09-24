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
exports.LoginDto = void 0;
const openapi = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
class LoginDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { email: { required: true, type: () => String }, password: { required: true, type: () => String, minLength: 8 } };
    }
}
exports.LoginDto = LoginDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '사용자 이메일 주소',
        example: 'user@example.com',
        format: 'email'
    }),
    (0, class_validator_1.IsEmail)({}, {
        message: '올바른 이메일 형식을 입력해주세요.'
    }),
    (0, class_validator_1.IsNotEmpty)({
        message: '이메일은 필수 입력 항목입니다.'
    }),
    __metadata("design:type", String)
], LoginDto.prototype, "email", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '사용자 비밀번호',
        example: 'mySecretPassword123',
        minLength: 8,
        format: 'password'
    }),
    (0, class_validator_1.IsString)({
        message: '비밀번호는 문자열이어야 합니다.'
    }),
    (0, class_validator_1.MinLength)(8, {
        message: '비밀번호는 최소 8자 이상이어야 합니다.'
    }),
    (0, class_validator_1.IsNotEmpty)({
        message: '비밀번호는 필수 입력 항목입니다.'
    }),
    __metadata("design:type", String)
], LoginDto.prototype, "password", void 0);
//# sourceMappingURL=login.dto.js.map