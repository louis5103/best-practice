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
var ProductsController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductsController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const products_service_1 = require("./products.service");
const dto_1 = require("./dto");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const public_decorator_1 = require("../../common/decorators/public.decorator");
let ProductsController = ProductsController_1 = class ProductsController {
    constructor(productsService) {
        this.productsService = productsService;
        this.logger = new common_1.Logger(ProductsController_1.name);
    }
    async create(createProductDto, req) {
        const currentUser = req.user;
        if (currentUser.role !== 'admin') {
            this.logger.warn(`권한 없는 상품 등록 시도: ${currentUser.email}`);
            throw new common_1.ForbiddenException('상품 등록은 관리자만 가능합니다.');
        }
        this.logger.log(`상품 등록 요청: ${createProductDto.name} (관리자: ${currentUser.email})`);
        return await this.productsService.create(createProductDto);
    }
    async findAll(page, limit, category) {
        const validatedPage = Math.max(parseInt(page) || 1, 1);
        const validatedLimit = Math.min(Math.max(parseInt(limit) || 10, 1), 50);
        this.logger.log(`상품 목록 조회: 페이지 ${validatedPage}, 한계 ${validatedLimit}` +
            `${category ? `, 카테고리: "${category}"` : ''}`);
        return await this.productsService.findAll(validatedPage, validatedLimit, category);
    }
    async findOne(id) {
        this.logger.log(`상품 상세 조회: ID ${id}`);
        return await this.productsService.findOne(id);
    }
    async update(id, updateProductDto, req) {
        const currentUser = req.user;
        if (currentUser.role !== 'admin') {
            this.logger.warn(`권한 없는 상품 수정 시도: ${currentUser.email}`);
            throw new common_1.ForbiddenException('상품 수정은 관리자만 가능합니다.');
        }
        this.logger.log(`상품 수정 요청: ID ${id} (관리자: ${currentUser.email})`);
        return await this.productsService.update(id, updateProductDto);
    }
    async remove(id, req) {
        const currentUser = req.user;
        if (currentUser.role !== 'admin') {
            this.logger.warn(`권한 없는 상품 삭제 시도: ${currentUser.email}`);
            throw new common_1.ForbiddenException('상품 삭제는 관리자만 가능합니다.');
        }
        this.logger.log(`상품 삭제 요청: ID ${id} (관리자: ${currentUser.email})`);
        await this.productsService.remove(id);
        return {
            message: '상품이 성공적으로 삭제되었습니다.'
        };
    }
};
exports.ProductsController = ProductsController;
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, swagger_1.ApiOperation)({
        summary: '상품 등록 (관리자 전용)',
        description: '새로운 상품을 시스템에 등록합니다.'
    }),
    (0, swagger_1.ApiBody)({
        type: dto_1.CreateProductDto,
        description: '등록할 상품 정보'
    }),
    (0, swagger_1.ApiResponse)({
        status: 201,
        description: '상품 등록 성공',
        type: dto_1.ProductResponseDto
    }),
    (0, swagger_1.ApiResponse)({
        status: 403,
        description: '권한 없음 - 관리자만 접근 가능'
    }),
    openapi.ApiResponse({ status: common_1.HttpStatus.CREATED, type: require("./dto/product-response.dto").ProductResponseDto }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.CreateProductDto, Object]),
    __metadata("design:returntype", Promise)
], ProductsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, public_decorator_1.Public)(),
    (0, swagger_1.ApiOperation)({
        summary: '상품 목록 조회',
        description: '활성화된 상품 목록을 페이지네이션과 함께 조회합니다.'
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
        name: 'category',
        required: false,
        type: String,
        description: '카테고리 필터',
        example: '액세서리'
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: '상품 목록 조회 성공',
        type: dto_1.PaginatedProductResponseDto
    }),
    openapi.ApiResponse({ status: 200, type: require("./dto/product-response.dto").PaginatedProductResponseDto }),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('limit')),
    __param(2, (0, common_1.Query)('category')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], ProductsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, public_decorator_1.Public)(),
    (0, swagger_1.ApiOperation)({
        summary: '상품 상세 조회',
        description: '특정 상품의 상세 정보를 조회합니다.'
    }),
    (0, swagger_1.ApiParam)({
        name: 'id',
        type: Number,
        description: '상품 ID',
        example: 1
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: '상품 조회 성공',
        type: dto_1.ProductResponseDto
    }),
    (0, swagger_1.ApiResponse)({
        status: 404,
        description: '상품을 찾을 수 없음'
    }),
    openapi.ApiResponse({ status: 200, type: require("./dto/product-response.dto").ProductResponseDto }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], ProductsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({
        summary: '상품 정보 수정 (관리자 전용)',
        description: '기존 상품의 정보를 수정합니다.'
    }),
    (0, swagger_1.ApiParam)({
        name: 'id',
        type: Number,
        description: '수정할 상품 ID',
        example: 1
    }),
    (0, swagger_1.ApiBody)({
        type: dto_1.UpdateProductDto,
        description: '수정할 상품 정보'
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: '상품 수정 성공',
        type: dto_1.ProductResponseDto
    }),
    (0, swagger_1.ApiResponse)({
        status: 403,
        description: '권한 없음 - 관리자만 접근 가능'
    }),
    (0, swagger_1.ApiResponse)({
        status: 404,
        description: '상품을 찾을 수 없음'
    }),
    openapi.ApiResponse({ status: 200, type: require("./dto/product-response.dto").ProductResponseDto }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, dto_1.UpdateProductDto, Object]),
    __metadata("design:returntype", Promise)
], ProductsController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({
        summary: '상품 삭제 (관리자 전용)',
        description: '지정된 상품을 시스템에서 삭제합니다.'
    }),
    (0, swagger_1.ApiParam)({
        name: 'id',
        type: Number,
        description: '삭제할 상품 ID',
        example: 1
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: '상품 삭제 성공',
        schema: {
            type: 'object',
            properties: {
                message: { type: 'string', example: '상품이 성공적으로 삭제되었습니다.' }
            }
        }
    }),
    (0, swagger_1.ApiResponse)({
        status: 403,
        description: '권한 없음 - 관리자만 접근 가능'
    }),
    (0, swagger_1.ApiResponse)({
        status: 404,
        description: '상품을 찾을 수 없음'
    }),
    openapi.ApiResponse({ status: common_1.HttpStatus.OK }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", Promise)
], ProductsController.prototype, "remove", null);
exports.ProductsController = ProductsController = ProductsController_1 = __decorate([
    (0, swagger_1.ApiTags)('상품 관리'),
    (0, common_1.Controller)('products'),
    __metadata("design:paramtypes", [products_service_1.ProductsService])
], ProductsController);
//# sourceMappingURL=products.controller.js.map