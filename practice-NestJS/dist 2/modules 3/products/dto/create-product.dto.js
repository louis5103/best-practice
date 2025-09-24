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
exports.CreateProductDto = exports.ProductStatus = exports.ProductCategory = void 0;
const openapi = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
const class_transformer_1 = require("class-transformer");
var ProductCategory;
(function (ProductCategory) {
    ProductCategory["ELECTRONICS"] = "electronics";
    ProductCategory["CLOTHING"] = "clothing";
    ProductCategory["ACCESSORIES"] = "accessories";
    ProductCategory["HOME"] = "home";
    ProductCategory["SPORTS"] = "sports";
    ProductCategory["BOOKS"] = "books";
    ProductCategory["BEAUTY"] = "beauty";
    ProductCategory["FOOD"] = "food";
    ProductCategory["OTHER"] = "other";
})(ProductCategory || (exports.ProductCategory = ProductCategory = {}));
var ProductStatus;
(function (ProductStatus) {
    ProductStatus["DRAFT"] = "draft";
    ProductStatus["ACTIVE"] = "active";
    ProductStatus["OUT_OF_STOCK"] = "out_of_stock";
    ProductStatus["DISCONTINUED"] = "discontinued";
})(ProductStatus || (exports.ProductStatus = ProductStatus = {}));
class CreateProductDto {
    constructor() {
        this.status = ProductStatus.DRAFT;
        this.stock = 0;
    }
    static _OPENAPI_METADATA_FACTORY() {
        return { name: { required: true, type: () => String, minLength: 2, maxLength: 200, pattern: "/^[\uAC00-\uD7A3a-zA-Z0-9\\s\\-_.()&+]+$/" }, description: { required: false, type: () => String, maxLength: 2000 }, price: { required: true, type: () => Number, minimum: 1, maximum: 10000000 }, discountPrice: { required: false, type: () => Number, minimum: 1 }, category: { required: true, enum: require("./create-product.dto").ProductCategory }, status: { required: false, default: ProductStatus.DRAFT, enum: require("./create-product.dto").ProductStatus }, stock: { required: false, type: () => Number, default: 0, minimum: 0, maximum: 999999 }, imageUrls: { required: false, type: () => [String] }, tags: { required: false, type: () => [String], maxLength: 50 }, brand: { required: false, type: () => String, maxLength: 100, pattern: "/^[\uAC00-\uD7A3a-zA-Z0-9\\s\\-_.&]+$/" }, weight: { required: false, type: () => Number, minimum: 1, maximum: 50000 }, dimensions: { required: false, type: () => String, pattern: "/^\\d+(\\.\\d+)?\\s*x\\s*\\d+(\\.\\d+)?\\s*x\\s*\\d+(\\.\\d+)?$/" } };
    }
}
exports.CreateProductDto = CreateProductDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '상품명',
        example: '프리미엄 스마트폰 보호 케이스 (iPhone 15 Pro)',
        minLength: 2,
        maxLength: 200
    }),
    (0, class_validator_1.IsString)({ message: '상품명은 문자열이어야 합니다.' }),
    (0, class_validator_1.IsNotEmpty)({ message: '상품명은 필수 입력 항목입니다.' }),
    (0, class_validator_1.MinLength)(2, { message: '상품명은 최소 2자 이상이어야 합니다.' }),
    (0, class_validator_1.MaxLength)(200, { message: '상품명은 최대 200자까지 가능합니다.' }),
    (0, class_validator_1.Matches)(/^[가-힣a-zA-Z0-9\s\-_.()&+]+$/, {
        message: '상품명에 허용되지 않은 특수문자가 포함되어 있습니다.'
    }),
    __metadata("design:type", String)
], CreateProductDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '상품 상세 설명',
        example: '프리미엄 실리콘 소재로 제작된 고급 스마트폰 보호 케이스입니다. 충격 흡수 기능과 함께 우아한 디자인을 제공하며, 모든 포트와 버튼에 정확하게 접근할 수 있도록 설계되었습니다.'
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: '상품 설명은 문자열이어야 합니다.' }),
    (0, class_validator_1.MaxLength)(2000, { message: '상품 설명은 최대 2000자까지 가능합니다.' }),
    __metadata("design:type", String)
], CreateProductDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '상품 정가 (원 단위)',
        example: 25000,
        minimum: 1,
        maximum: 10000000
    }),
    (0, class_validator_1.IsNumber)({ maxDecimalPlaces: 0 }, {
        message: '가격은 소수점이 없는 정수여야 합니다.'
    }),
    (0, class_validator_1.Min)(1, { message: '가격은 최소 1원 이상이어야 합니다.' }),
    (0, class_validator_1.Max)(10000000, { message: '가격은 최대 1,000만원 이하여야 합니다.' }),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], CreateProductDto.prototype, "price", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '할인 가격 (정가보다 낮아야 함)',
        example: 20000,
        minimum: 1
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)({ maxDecimalPlaces: 0 }, {
        message: '할인 가격은 소수점이 없는 정수여야 합니다.'
    }),
    (0, class_validator_1.Min)(1, { message: '할인 가격은 최소 1원 이상이어야 합니다.' }),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], CreateProductDto.prototype, "discountPrice", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '상품 카테고리',
        example: ProductCategory.ACCESSORIES,
        enum: ProductCategory
    }),
    (0, class_validator_1.IsEnum)(ProductCategory, {
        message: `카테고리는 다음 중 하나여야 합니다: ${Object.values(ProductCategory).join(', ')}`
    }),
    __metadata("design:type", String)
], CreateProductDto.prototype, "category", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '상품 상태',
        example: ProductStatus.DRAFT,
        enum: ProductStatus,
        default: ProductStatus.DRAFT
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(ProductStatus, {
        message: `상품 상태는 다음 중 하나여야 합니다: ${Object.values(ProductStatus).join(', ')}`
    }),
    __metadata("design:type", String)
], CreateProductDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '초기 재고 수량',
        example: 50,
        default: 0,
        minimum: 0,
        maximum: 999999
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)({ maxDecimalPlaces: 0 }, {
        message: '재고 수량은 정수여야 합니다.'
    }),
    (0, class_validator_1.Min)(0, { message: '재고 수량은 0 이상이어야 합니다.' }),
    (0, class_validator_1.Max)(999999, { message: '재고 수량은 999,999개 이하여야 합니다.' }),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], CreateProductDto.prototype, "stock", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '상품 이미지 URL 배열 (최소 1개, 최대 10개)',
        example: [
            'https://example.com/images/product-main.jpg',
            'https://example.com/images/product-detail1.jpg',
            'https://example.com/images/product-detail2.jpg'
        ],
        type: [String],
        minItems: 1,
        maxItems: 10
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)({ message: '이미지 목록은 배열이어야 합니다.' }),
    (0, class_validator_1.ArrayMinSize)(1, { message: '최소 1개의 이미지는 필요합니다.' }),
    (0, class_validator_1.ArrayMaxSize)(10, { message: '최대 10개의 이미지까지만 가능합니다.' }),
    (0, class_validator_1.IsUrl)({}, { each: true, message: '모든 이미지 URL은 올바른 형식이어야 합니다.' }),
    __metadata("design:type", Array)
], CreateProductDto.prototype, "imageUrls", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '상품 태그 (검색 및 분류용)',
        example: ['스마트폰', '케이스', '보호', '실리콘', '아이폰'],
        type: [String],
        maxItems: 20
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)({ message: '태그 목록은 배열이어야 합니다.' }),
    (0, class_validator_1.ArrayMaxSize)(20, { message: '최대 20개의 태그까지만 가능합니다.' }),
    (0, class_validator_1.IsString)({ each: true, message: '각 태그는 문자열이어야 합니다.' }),
    (0, class_validator_1.MaxLength)(50, { each: true, message: '각 태그는 최대 50자까지 가능합니다.' }),
    (0, class_transformer_1.Transform)(({ value }) => value?.map((tag) => tag.trim().toLowerCase())),
    __metadata("design:type", Array)
], CreateProductDto.prototype, "tags", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '상품 브랜드',
        example: 'Apple',
        maxLength: 100
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: '브랜드는 문자열이어야 합니다.' }),
    (0, class_validator_1.MaxLength)(100, { message: '브랜드명은 최대 100자까지 가능합니다.' }),
    (0, class_validator_1.Matches)(/^[가-힣a-zA-Z0-9\s\-_.&]+$/, {
        message: '브랜드명에 허용되지 않은 특수문자가 포함되어 있습니다.'
    }),
    __metadata("design:type", String)
], CreateProductDto.prototype, "brand", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '상품 무게 (그램 단위)',
        example: 150,
        minimum: 1,
        maximum: 50000
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)({ maxDecimalPlaces: 0 }, {
        message: '무게는 정수여야 합니다.'
    }),
    (0, class_validator_1.Min)(1, { message: '무게는 최소 1그램 이상이어야 합니다.' }),
    (0, class_validator_1.Max)(50000, { message: '무게는 최대 50kg(50,000g) 이하여야 합니다.' }),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], CreateProductDto.prototype, "weight", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '상품 치수 (가로 x 세로 x 높이, cm 단위)',
        example: '14.7 x 7.1 x 0.8',
        pattern: '^\\d+(\\.\\d+)?\\s*x\\s*\\d+(\\.\\d+)?\\s*x\\s*\\d+(\\.\\d+)?$'
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: '치수는 문자열이어야 합니다.' }),
    (0, class_validator_1.Matches)(/^\d+(\.\d+)?\s*x\s*\d+(\.\d+)?\s*x\s*\d+(\.\d+)?$/, {
        message: '치수는 "가로 x 세로 x 높이" 형태로 입력해주세요. (예: 14.7 x 7.1 x 0.8)'
    }),
    __metadata("design:type", String)
], CreateProductDto.prototype, "dimensions", void 0);
//# sourceMappingURL=create-product.dto.js.map