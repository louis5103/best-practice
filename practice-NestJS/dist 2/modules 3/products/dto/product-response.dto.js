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
exports.PaginatedProductResponseDto = exports.ProductResponseDto = void 0;
const openapi = require("@nestjs/swagger");
const swagger_1 = require("@nestjs/swagger");
class ProductResponseDto {
    static fromEntity(product) {
        const dto = new ProductResponseDto();
        dto.id = product.id;
        dto.name = product.name;
        dto.description = product.description;
        dto.price = product.price;
        dto.category = product.category;
        dto.stock = product.stock;
        dto.isActive = product.isActive;
        dto.imageUrl = product.imageUrl;
        dto.createdAt = product.createdAt;
        dto.updatedAt = product.updatedAt;
        return dto;
    }
    static fromEntities(products) {
        return products.map(product => this.fromEntity(product));
    }
    static _OPENAPI_METADATA_FACTORY() {
        return { id: { required: true, type: () => Number }, name: { required: true, type: () => String }, description: { required: false, type: () => String }, price: { required: true, type: () => Number }, category: { required: true, type: () => String }, stock: { required: true, type: () => Number }, isActive: { required: true, type: () => Boolean }, imageUrl: { required: false, type: () => String }, createdAt: { required: true, type: () => Date }, updatedAt: { required: true, type: () => Date } };
    }
}
exports.ProductResponseDto = ProductResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '상품 고유 ID',
        example: 1
    }),
    __metadata("design:type", Number)
], ProductResponseDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '상품명',
        example: '스마트폰 케이스'
    }),
    __metadata("design:type", String)
], ProductResponseDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '상품 설명',
        example: '고품질 실리콘 재질로 제작된 스마트폰 보호 케이스입니다.',
        nullable: true
    }),
    __metadata("design:type", String)
], ProductResponseDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '상품 가격',
        example: 15000
    }),
    __metadata("design:type", Number)
], ProductResponseDto.prototype, "price", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '상품 카테고리',
        example: '액세서리'
    }),
    __metadata("design:type", String)
], ProductResponseDto.prototype, "category", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '재고 수량',
        example: 100
    }),
    __metadata("design:type", Number)
], ProductResponseDto.prototype, "stock", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '상품 활성화 상태',
        example: true
    }),
    __metadata("design:type", Boolean)
], ProductResponseDto.prototype, "isActive", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '상품 이미지 URL',
        example: 'https://example.com/images/product.jpg',
        nullable: true
    }),
    __metadata("design:type", String)
], ProductResponseDto.prototype, "imageUrl", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '상품 등록 시간',
        example: '2024-01-01T00:00:00.000Z'
    }),
    __metadata("design:type", Date)
], ProductResponseDto.prototype, "createdAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '상품 정보 수정 시간',
        example: '2024-01-10T15:30:00.000Z'
    }),
    __metadata("design:type", Date)
], ProductResponseDto.prototype, "updatedAt", void 0);
class PaginatedProductResponseDto {
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
        return { data: { required: true, type: () => [require("./product-response.dto").ProductResponseDto] }, total: { required: true, type: () => Number }, page: { required: true, type: () => Number }, limit: { required: true, type: () => Number }, totalPages: { required: true, type: () => Number }, hasPrevious: { required: true, type: () => Boolean }, hasNext: { required: true, type: () => Boolean } };
    }
}
exports.PaginatedProductResponseDto = PaginatedProductResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '현재 페이지의 상품 목록',
        type: [ProductResponseDto]
    }),
    __metadata("design:type", Array)
], PaginatedProductResponseDto.prototype, "data", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '전체 상품 수',
        example: 250
    }),
    __metadata("design:type", Number)
], PaginatedProductResponseDto.prototype, "total", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '현재 페이지 번호',
        example: 1
    }),
    __metadata("design:type", Number)
], PaginatedProductResponseDto.prototype, "page", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '페이지당 상품 수',
        example: 10
    }),
    __metadata("design:type", Number)
], PaginatedProductResponseDto.prototype, "limit", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '전체 페이지 수',
        example: 25
    }),
    __metadata("design:type", Number)
], PaginatedProductResponseDto.prototype, "totalPages", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '이전 페이지 존재 여부',
        example: false
    }),
    __metadata("design:type", Boolean)
], PaginatedProductResponseDto.prototype, "hasPrevious", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '다음 페이지 존재 여부',
        example: true
    }),
    __metadata("design:type", Boolean)
], PaginatedProductResponseDto.prototype, "hasNext", void 0);
//# sourceMappingURL=product-response.dto.js.map