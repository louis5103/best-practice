export declare enum ProductCategory {
    ELECTRONICS = "electronics",
    CLOTHING = "clothing",
    ACCESSORIES = "accessories",
    HOME = "home",
    SPORTS = "sports",
    BOOKS = "books",
    BEAUTY = "beauty",
    FOOD = "food",
    OTHER = "other"
}
export declare enum ProductStatus {
    DRAFT = "draft",
    ACTIVE = "active",
    OUT_OF_STOCK = "out_of_stock",
    DISCONTINUED = "discontinued"
}
export declare enum UserRole {
    ADMIN = "admin",
    MODERATOR = "moderator",
    USER = "user"
}
export declare enum OrderStatus {
    PENDING = "pending",
    PAID = "paid",
    PROCESSING = "processing",
    SHIPPED = "shipped",
    DELIVERED = "delivered",
    CANCELLED = "cancelled",
    REFUNDED = "refunded"
}
export interface ApiResponseStatus {
    success: boolean;
    timestamp: string;
    path: string;
}
export interface PaginationMeta {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
}
export type HealthStatus = 'up' | 'down' | 'unknown';
export type ResourceHealthStatus = 'healthy' | 'warning' | 'critical' | 'unknown';
export interface ServiceHealthCheck {
    status: HealthStatus | ResourceHealthStatus;
    responseTime?: number;
    message?: string;
    details?: Record<string, any>;
}
export interface SystemHealthCheck {
    status: 'ok' | 'error';
    timestamp: string;
    uptime: number;
    environment: string;
    version: string;
    checks: Record<string, ServiceHealthCheck>;
    errors?: Array<{
        service: string;
        error: string;
    }>;
}
export declare enum LogLevel {
    ERROR = "error",
    WARN = "warn",
    LOG = "log",
    DEBUG = "debug",
    VERBOSE = "verbose"
}
export type Environment = 'development' | 'production' | 'test' | 'staging';
export declare enum ErrorCode {
    UNAUTHORIZED = "UNAUTHORIZED",
    FORBIDDEN = "FORBIDDEN",
    INVALID_CREDENTIALS = "INVALID_CREDENTIALS",
    TOKEN_EXPIRED = "TOKEN_EXPIRED",
    VALIDATION_FAILED = "VALIDATION_FAILED",
    INVALID_INPUT = "INVALID_INPUT",
    NOT_FOUND = "NOT_FOUND",
    ALREADY_EXISTS = "ALREADY_EXISTS",
    INTERNAL_ERROR = "INTERNAL_ERROR",
    DATABASE_ERROR = "DATABASE_ERROR",
    EXTERNAL_SERVICE_ERROR = "EXTERNAL_SERVICE_ERROR"
}
export type CreateEntityData<T> = Omit<T, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateEntityData<T> = Omit<T, 'id' | 'createdAt' | 'updatedAt'>;
export type PartialUpdateData<T> = Partial<UpdateEntityData<T>>;
export type SafeUser = Omit<any, 'password' | 'refreshToken'>;
export declare const DEFAULT_PAGE_SIZE = 10;
export declare const MAX_PAGE_SIZE = 100;
export declare const MIN_PASSWORD_LENGTH = 8;
export declare const MAX_FILE_SIZE = 10485760;
export declare const JWT_ACCESS_TOKEN_EXPIRES_IN = "15m";
export declare const JWT_REFRESH_TOKEN_EXPIRES_IN = "7d";
export declare const CACHE_TTL: {
    readonly SHORT: 60;
    readonly MEDIUM: 300;
    readonly LONG: 3600;
    readonly DAILY: 86400;
};
