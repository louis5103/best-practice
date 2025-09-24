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
exports.Product = void 0;
const openapi = require("@nestjs/swagger");
const typeorm_1 = require("typeorm");
const types_1 = require("../../common/types");
let Product = class Product {
    getDiscountRate() {
        if (!this.discountPrice || this.discountPrice >= this.price) {
            return 0;
        }
        const discount = this.price - this.discountPrice;
        return Math.round((discount / this.price) * 100);
    }
    getSellingPrice() {
        return this.discountPrice && this.discountPrice < this.price
            ? this.discountPrice
            : this.price;
    }
    isAvailableForPurchase() {
        return this.status === types_1.ProductStatus.ACTIVE && this.stock > 0;
    }
    getMainImageUrl() {
        return this.imageUrls && this.imageUrls.length > 0
            ? this.imageUrls[0]
            : null;
    }
    static _OPENAPI_METADATA_FACTORY() {
        return { id: { required: true, type: () => Number }, name: { required: true, type: () => String }, description: { required: false, type: () => String }, price: { required: true, type: () => Number }, discountPrice: { required: false, type: () => Number }, category: { required: true, enum: require("../../common/types/index").ProductCategory }, status: { required: true, enum: require("../../common/types/index").ProductStatus }, stock: { required: true, type: () => Number }, imageUrls: { required: false, type: () => [String] }, tags: { required: false, type: () => [String] }, brand: { required: false, type: () => String }, weight: { required: false, type: () => Number }, dimensions: { required: false, type: () => String }, createdAt: { required: true, type: () => Date }, updatedAt: { required: true, type: () => Date } };
    }
};
exports.Product = Product;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], Product.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({
        length: 200,
        comment: '상품명'
    }),
    __metadata("design:type", String)
], Product.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'text',
        nullable: true,
        comment: '상품 상세 설명'
    }),
    __metadata("design:type", String)
], Product.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'decimal',
        precision: 10,
        scale: 2,
        comment: '상품 정가'
    }),
    __metadata("design:type", Number)
], Product.prototype, "price", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'decimal',
        precision: 10,
        scale: 2,
        nullable: true,
        comment: '할인 가격 (정가보다 낮아야 함)'
    }),
    __metadata("design:type", Number)
], Product.prototype, "discountPrice", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: types_1.ProductCategory,
        comment: '상품 카테고리'
    }),
    __metadata("design:type", String)
], Product.prototype, "category", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: types_1.ProductStatus,
        default: types_1.ProductStatus.DRAFT,
        comment: '상품 상태'
    }),
    __metadata("design:type", String)
], Product.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({
        default: 0,
        comment: '재고 수량'
    }),
    __metadata("design:type", Number)
], Product.prototype, "stock", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'simple-array',
        nullable: true,
        comment: '상품 이미지 URL 배열'
    }),
    __metadata("design:type", Array)
], Product.prototype, "imageUrls", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'simple-array',
        nullable: true,
        comment: '상품 태그 (검색 및 분류용)'
    }),
    __metadata("design:type", Array)
], Product.prototype, "tags", void 0);
__decorate([
    (0, typeorm_1.Column)({
        nullable: true,
        length: 100,
        comment: '상품 브랜드'
    }),
    __metadata("design:type", String)
], Product.prototype, "brand", void 0);
__decorate([
    (0, typeorm_1.Column)({
        nullable: true,
        comment: '상품 무게 (그램 단위)'
    }),
    __metadata("design:type", Number)
], Product.prototype, "weight", void 0);
__decorate([
    (0, typeorm_1.Column)({
        nullable: true,
        length: 50,
        comment: '상품 치수 (가로 x 세로 x 높이, cm 단위)'
    }),
    __metadata("design:type", String)
], Product.prototype, "dimensions", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({
        name: 'created_at',
        comment: '상품 등록 시간'
    }),
    __metadata("design:type", Date)
], Product.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({
        name: 'updated_at',
        comment: '상품 정보 수정 시간'
    }),
    __metadata("design:type", Date)
], Product.prototype, "updatedAt", void 0);
exports.Product = Product = __decorate([
    (0, typeorm_1.Entity)('products'),
    (0, typeorm_1.Index)(['category']),
    (0, typeorm_1.Index)(['status']),
    (0, typeorm_1.Index)(['brand']),
    (0, typeorm_1.Index)(['tags'])
], Product);
//# sourceMappingURL=product.entity.js.map