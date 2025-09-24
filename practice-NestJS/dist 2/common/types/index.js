"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CACHE_TTL = exports.JWT_REFRESH_TOKEN_EXPIRES_IN = exports.JWT_ACCESS_TOKEN_EXPIRES_IN = exports.MAX_FILE_SIZE = exports.MIN_PASSWORD_LENGTH = exports.MAX_PAGE_SIZE = exports.DEFAULT_PAGE_SIZE = exports.ErrorCode = exports.LogLevel = exports.OrderStatus = exports.UserRole = exports.ProductStatus = exports.ProductCategory = void 0;
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
var UserRole;
(function (UserRole) {
    UserRole["ADMIN"] = "admin";
    UserRole["MODERATOR"] = "moderator";
    UserRole["USER"] = "user";
})(UserRole || (exports.UserRole = UserRole = {}));
var OrderStatus;
(function (OrderStatus) {
    OrderStatus["PENDING"] = "pending";
    OrderStatus["PAID"] = "paid";
    OrderStatus["PROCESSING"] = "processing";
    OrderStatus["SHIPPED"] = "shipped";
    OrderStatus["DELIVERED"] = "delivered";
    OrderStatus["CANCELLED"] = "cancelled";
    OrderStatus["REFUNDED"] = "refunded";
})(OrderStatus || (exports.OrderStatus = OrderStatus = {}));
var LogLevel;
(function (LogLevel) {
    LogLevel["ERROR"] = "error";
    LogLevel["WARN"] = "warn";
    LogLevel["LOG"] = "log";
    LogLevel["DEBUG"] = "debug";
    LogLevel["VERBOSE"] = "verbose";
})(LogLevel || (exports.LogLevel = LogLevel = {}));
var ErrorCode;
(function (ErrorCode) {
    ErrorCode["UNAUTHORIZED"] = "UNAUTHORIZED";
    ErrorCode["FORBIDDEN"] = "FORBIDDEN";
    ErrorCode["INVALID_CREDENTIALS"] = "INVALID_CREDENTIALS";
    ErrorCode["TOKEN_EXPIRED"] = "TOKEN_EXPIRED";
    ErrorCode["VALIDATION_FAILED"] = "VALIDATION_FAILED";
    ErrorCode["INVALID_INPUT"] = "INVALID_INPUT";
    ErrorCode["NOT_FOUND"] = "NOT_FOUND";
    ErrorCode["ALREADY_EXISTS"] = "ALREADY_EXISTS";
    ErrorCode["INTERNAL_ERROR"] = "INTERNAL_ERROR";
    ErrorCode["DATABASE_ERROR"] = "DATABASE_ERROR";
    ErrorCode["EXTERNAL_SERVICE_ERROR"] = "EXTERNAL_SERVICE_ERROR";
})(ErrorCode || (exports.ErrorCode = ErrorCode = {}));
exports.DEFAULT_PAGE_SIZE = 10;
exports.MAX_PAGE_SIZE = 100;
exports.MIN_PASSWORD_LENGTH = 8;
exports.MAX_FILE_SIZE = 10485760;
exports.JWT_ACCESS_TOKEN_EXPIRES_IN = '15m';
exports.JWT_REFRESH_TOKEN_EXPIRES_IN = '7d';
exports.CACHE_TTL = {
    SHORT: 60,
    MEDIUM: 300,
    LONG: 3600,
    DAILY: 86400
};
//# sourceMappingURL=index.js.map