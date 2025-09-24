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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var UsersController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const users_service_1 = require("./users.service");
const create_user_dto_1 = require("./dto/create-user.dto");
const update_user_dto_1 = require("./dto/update-user.dto");
const user_response_dto_1 = require("./dto/user-response.dto");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
let UsersController = UsersController_1 = class UsersController {
    constructor(usersService) {
        this.usersService = usersService;
        this.logger = new common_1.Logger(UsersController_1.name);
    }
    async create(createUserDto, req) {
        const currentUser = req.user;
        if (currentUser.role !== 'admin') {
            this.logger.warn(`권한 없는 사용자 생성 시도: ${currentUser.email} (역할: ${currentUser.role})`);
            throw new common_1.ForbiddenException('사용자 생성은 관리자만 가능합니다.');
        }
        this.logger.log(`사용자 생성 요청: ${createUserDto.email} (관리자: ${currentUser.email})`);
        const result = await this.usersService.create(createUserDto);
        this.logger.log(`사용자 생성 완료: ${result.email} (ID: ${result.id})`);
        return result;
    }
    async findAll(req, page, limit, search) {
        const currentUser = req.user;
        const validatedPage = Math.max(parseInt(page) || 1, 1);
        const validatedLimit = Math.min(Math.max(parseInt(limit) || 10, 1), 50);
        const searchTerm = search || undefined;
        this.logger.log(`사용자 목록 조회: 페이지 ${validatedPage}, 한계 ${validatedLimit}` +
            `${searchTerm ? `, 검색: "${searchTerm}"` : ''} (요청자: ${currentUser.email})`);
        return await this.usersService.findAll(validatedPage, validatedLimit, searchTerm);
    }
    async findOne(id, req) {
        const currentUser = req.user;
        if (currentUser.userId !== id && currentUser.role !== 'admin') {
            this.logger.warn(`권한 없는 사용자 정보 조회 시도: ${currentUser.email}이 사용자 ID ${id} 정보 요청`);
            throw new common_1.ForbiddenException('자신의 정보만 조회할 수 있습니다.');
        }
        this.logger.log(`사용자 상세 조회: ID ${id} (요청자: ${currentUser.email})`);
        return await this.usersService.findOne(id);
    }
    async update(id, updateUserDto, req) {
        const currentUser = req.user;
        if (currentUser.userId !== id && currentUser.role !== 'admin') {
            throw new common_1.ForbiddenException('자신의 정보만 수정할 수 있습니다.');
        }
        if (currentUser.role !== 'admin') {
            const restrictedFields = ['role', 'isActive', 'isEmailVerified'];
            const hasRestrictedField = restrictedFields.some(field => field in updateUserDto && updateUserDto[field] !== undefined);
            if (hasRestrictedField) {
                this.logger.warn(`일반 사용자의 제한된 필드 수정 시도: ${currentUser.email} (대상: ID ${id})`);
                throw new common_1.ForbiddenException('해당 필드는 관리자만 수정할 수 있습니다.');
            }
        }
        this.logger.log(`사용자 정보 수정 요청: ID ${id} (수정자: ${currentUser.email}, 역할: ${currentUser.role})`);
        const result = await this.usersService.update(id, updateUserDto);
        this.logger.log(`사용자 정보 수정 완료: ID ${id}`);
        return result;
    }
    async changePassword(id, changePasswordDto, req) {
        const currentUser = req.user;
        if (currentUser.userId !== id) {
            this.logger.warn(`다른 사용자 비밀번호 변경 시도: ${currentUser.email}이 사용자 ID ${id} 비밀번호 변경 요청`);
            throw new common_1.ForbiddenException('자신의 비밀번호만 변경할 수 있습니다.');
        }
        this.logger.log(`비밀번호 변경 요청: 사용자 ID ${id}`);
        await this.usersService.changePassword(id, changePasswordDto);
        this.logger.log(`비밀번호 변경 완료: 사용자 ID ${id}`);
        return {
            message: '비밀번호가 성공적으로 변경되었습니다.'
        };
    }
    async remove(id, req) {
        const currentUser = req.user;
        if (currentUser.role !== 'admin') {
            this.logger.warn(`권한 없는 사용자 삭제 시도: ${currentUser.email}`);
            throw new common_1.ForbiddenException('사용자 삭제는 관리자만 가능합니다.');
        }
        if (currentUser.userId === id) {
            this.logger.warn(`관리자 자기 자신 삭제 시도: ${currentUser.email} (ID: ${id})`);
            throw new common_1.ForbiddenException('자기 자신을 삭제할 수 없습니다.');
        }
        this.logger.log(`사용자 삭제 요청: ID ${id} (관리자: ${currentUser.email})`);
        await this.usersService.remove(id);
        this.logger.log(`사용자 삭제 완료: ID ${id}`);
        return {
            message: '사용자가 성공적으로 삭제되었습니다.'
        };
    }
    async getStats(req) {
        const currentUser = req.user;
        if (currentUser.role !== 'admin') {
            this.logger.warn(`권한 없는 통계 조회 시도: ${currentUser.email}`);
            throw new common_1.ForbiddenException('사용자 통계는 관리자만 조회할 수 있습니다.');
        }
        this.logger.log(`사용자 통계 조회: ${currentUser.email}`);
        return await this.usersService.getStats();
    }
};
exports.UsersController = UsersController;
__decorate([
    (0, common_1.Post)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, swagger_1.ApiOperation)({
        summary: '사용자 생성 (관리자 전용)',
        description: '관리자가 새로운 사용자를 직접 생성합니다.'
    }),
    (0, swagger_1.ApiBody)({
        type: create_user_dto_1.CreateUserDto,
        description: '생성할 사용자 정보',
        examples: {
            example1: {
                summary: '일반 사용자 생성',
                value: {
                    email: 'newuser@example.com',
                    name: '새로운사용자',
                    password: 'TempPassword123!',
                    role: 'user',
                    isActive: true,
                    isEmailVerified: false
                }
            }
        }
    }),
    (0, swagger_1.ApiResponse)({
        status: 201,
        description: '사용자 생성 성공',
        type: user_response_dto_1.UserResponseDto
    }),
    (0, swagger_1.ApiResponse)({
        status: 403,
        description: '권한 없음 - 관리자만 접근 가능'
    }),
    (0, swagger_1.ApiResponse)({
        status: 409,
        description: '이메일 중복'
    }),
    openapi.ApiResponse({ status: common_1.HttpStatus.CREATED, type: require("./dto/user-response.dto").UserResponseDto }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_user_dto_1.CreateUserDto, Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({
        summary: '사용자 목록 조회',
        description: '페이지네이션과 검색 기능을 지원하는 사용자 목록을 조회합니다.'
    }),
    (0, swagger_1.ApiQuery)({
        name: 'page',
        required: false,
        type: Number,
        description: '페이지 번호 (기본값: 1)',
        example: 1
    }),
    (0, swagger_1.ApiQuery)({
        name: 'limit',
        required: false,
        type: Number,
        description: '페이지당 항목 수 (기본값: 10, 최대: 50)',
        example: 10
    }),
    (0, swagger_1.ApiQuery)({
        name: 'search',
        required: false,
        type: String,
        description: '검색 키워드 (이름 또는 이메일)',
        example: '김철수'
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: '사용자 목록 조회 성공',
        type: user_response_dto_1.PaginatedUserResponseDto
    }),
    (0, swagger_1.ApiResponse)({
        status: 401,
        description: '인증 실패'
    }),
    openapi.ApiResponse({ status: 200, type: require("./dto/user-response.dto").PaginatedUserResponseDto }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('limit')),
    __param(3, (0, common_1.Query)('search')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({
        summary: '사용자 상세 조회',
        description: '특정 사용자의 상세 정보를 조회합니다.'
    }),
    (0, swagger_1.ApiParam)({
        name: 'id',
        type: Number,
        description: '사용자 ID',
        example: 1
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: '사용자 조회 성공',
        type: user_response_dto_1.UserResponseDto
    }),
    (0, swagger_1.ApiResponse)({
        status: 404,
        description: '사용자를 찾을 수 없음'
    }),
    (0, swagger_1.ApiResponse)({
        status: 403,
        description: '권한 없음 - 자신의 정보 또는 관리자만 접근 가능'
    }),
    openapi.ApiResponse({ status: 200, type: require("./dto/user-response.dto").UserResponseDto }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "findOne", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, swagger_1.ApiOperation)({
        summary: '사용자 정보 수정',
        description: '사용자의 정보를 수정합니다. 권한에 따라 수정 가능한 필드가 달라집니다.'
    }),
    (0, swagger_1.ApiParam)({
        name: 'id',
        type: Number,
        description: '수정할 사용자 ID',
        example: 1
    }),
    (0, swagger_1.ApiBody)({
        type: update_user_dto_1.UpdateUserDto,
        description: '수정할 사용자 정보',
        examples: {
            userUpdate: {
                summary: '일반 사용자 정보 수정',
                value: {
                    name: '변경된이름',
                    email: 'newemail@example.com'
                }
            },
            adminUpdate: {
                summary: '관리자가 수정하는 경우',
                value: {
                    name: '변경된이름',
                    role: 'moderator',
                    isActive: false
                }
            }
        }
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: '사용자 정보 수정 성공',
        type: user_response_dto_1.UserResponseDto
    }),
    (0, swagger_1.ApiResponse)({
        status: 404,
        description: '사용자를 찾을 수 없음'
    }),
    (0, swagger_1.ApiResponse)({
        status: 403,
        description: '권한 없음'
    }),
    (0, swagger_1.ApiResponse)({
        status: 409,
        description: '이메일 중복'
    }),
    openapi.ApiResponse({ status: 200, type: require("./dto/user-response.dto").UserResponseDto }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, update_user_dto_1.UpdateUserDto, Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "update", null);
__decorate([
    (0, common_1.Put)(':id/password'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({
        summary: '비밀번호 변경',
        description: '현재 비밀번호를 확인한 후 새로운 비밀번호로 변경합니다.'
    }),
    (0, swagger_1.ApiParam)({
        name: 'id',
        type: Number,
        description: '사용자 ID',
        example: 1
    }),
    (0, swagger_1.ApiBody)({
        type: update_user_dto_1.ChangePasswordDto,
        description: '비밀번호 변경 정보',
        examples: {
            example1: {
                summary: '비밀번호 변경',
                value: {
                    currentPassword: 'currentPassword123!',
                    newPassword: 'newPassword456!',
                    newPasswordConfirm: 'newPassword456!'
                }
            }
        }
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: '비밀번호 변경 성공',
        schema: {
            type: 'object',
            properties: {
                message: { type: 'string', example: '비밀번호가 성공적으로 변경되었습니다.' }
            }
        }
    }),
    (0, swagger_1.ApiResponse)({
        status: 400,
        description: '잘못된 요청 - 현재 비밀번호 불일치 또는 새 비밀번호 형식 오류'
    }),
    (0, swagger_1.ApiResponse)({
        status: 403,
        description: '권한 없음 - 자신의 비밀번호만 변경 가능'
    }),
    openapi.ApiResponse({ status: common_1.HttpStatus.OK }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, update_user_dto_1.ChangePasswordDto, Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "changePassword", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({
        summary: '사용자 삭제 (관리자 전용)',
        description: '지정된 사용자를 시스템에서 삭제합니다.'
    }),
    (0, swagger_1.ApiParam)({
        name: 'id',
        type: Number,
        description: '삭제할 사용자 ID',
        example: 1
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: '사용자 삭제 성공',
        schema: {
            type: 'object',
            properties: {
                message: { type: 'string', example: '사용자가 성공적으로 삭제되었습니다.' }
            }
        }
    }),
    (0, swagger_1.ApiResponse)({
        status: 403,
        description: '권한 없음 - 관리자만 접근 가능 또는 자기 자신 삭제 시도'
    }),
    (0, swagger_1.ApiResponse)({
        status: 404,
        description: '사용자를 찾을 수 없음'
    }),
    openapi.ApiResponse({ status: common_1.HttpStatus.OK }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "remove", null);
__decorate([
    (0, common_1.Get)('admin/stats'),
    (0, swagger_1.ApiOperation)({
        summary: '사용자 통계 조회 (관리자 전용)',
        description: '전체 사용자 수, 활성 사용자 수, 역할별 분포 등의 통계 정보를 조회합니다.'
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: '사용자 통계 조회 성공',
        type: user_response_dto_1.UserStatsDto
    }),
    (0, swagger_1.ApiResponse)({
        status: 403,
        description: '권한 없음 - 관리자만 접근 가능'
    }),
    openapi.ApiResponse({ status: 200, type: require("./dto/user-response.dto").UserStatsDto }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "getStats", null);
exports.UsersController = UsersController = UsersController_1 = __decorate([
    (0, swagger_1.ApiTags)('사용자 관리'),
    (0, common_1.Controller)('users'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [users_service_1.UsersService])
], UsersController);
//# sourceMappingURL=users.controller.js.map