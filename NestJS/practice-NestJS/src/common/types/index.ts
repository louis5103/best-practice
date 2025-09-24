/**
 * 애플리케이션 전체에서 사용되는 공통 타입 정의입니다.
 * 
 * 이 파일은 마치 건축 설계의 표준 규격서와 같은 역할을 합니다.
 * 모든 모듈에서 동일한 타입을 사용할 수 있게 하여 
 * 데이터 일관성과 타입 안전성을 보장합니다.
 */

/**
 * 상품 카테고리 열거형입니다.
 */
export enum ProductCategory {
  ELECTRONICS = 'electronics',   // 전자제품 (스마트폰, 컴퓨터, 가전 등)
  CLOTHING = 'clothing',         // 의류 (상의, 하의, 아우터 등)
  ACCESSORIES = 'accessories',   // 액세서리 (가방, 시계, 보석 등)
  HOME = 'home',                 // 홈&리빙 (가구, 인테리어, 생활용품)
  SPORTS = 'sports',             // 스포츠&레저 (운동용품, 아웃도어 등)
  BOOKS = 'books',               // 도서 (서적, 전자책, 잡지 등)
  BEAUTY = 'beauty',             // 뷰티&화장품 (스킨케어, 메이크업 등)
  FOOD = 'food',                 // 식품&음료 (신선식품, 가공식품 등)
  OTHER = 'other'                // 기타 (분류되지 않은 상품들)
}

/**
 * 상품 상태 열거형입니다.
 */
export enum ProductStatus {
  DRAFT = 'draft',                    // 초안 - 아직 공개되지 않음
  ACTIVE = 'active',                  // 판매중 - 정상적으로 구매 가능
  OUT_OF_STOCK = 'out_of_stock',      // 품절 - 재고 없음, 재입고 예정
  DISCONTINUED = 'discontinued'       // 단종 - 더 이상 판매하지 않음
}

/**
 * 사용자 역할 열거형입니다.
 */
export enum UserRole {
  ADMIN = 'admin',           // 관리자 - 모든 권한
  MODERATOR = 'moderator',   // 운영자 - 일부 관리 권한  
  USER = 'user'              // 일반 사용자 - 기본 권한
}

/**
 * 주문 상태 열거형입니다.
 */
export enum OrderStatus {
  PENDING = 'pending',           // 결제 대기
  PAID = 'paid',                 // 결제 완료
  PROCESSING = 'processing',     // 상품 준비중
  SHIPPED = 'shipped',           // 배송 중
  DELIVERED = 'delivered',       // 배송 완료
  CANCELLED = 'cancelled',       // 주문 취소
  REFUNDED = 'refunded'          // 환불 완료
}

/**
 * API 응답 상태 타입입니다.
 */
export interface ApiResponseStatus {
  success: boolean;              // 요청 성공 여부
  timestamp: string;             // 응답 생성 시각 (ISO 8601 형식)
  path: string;                  // 요청 경로
}

/**
 * 페이지네이션 메타데이터 타입입니다.
 */
export interface PaginationMeta {
  page: number;                  // 현재 페이지 번호 (1부터 시작)
  limit: number;                 // 페이지당 항목 수
  total: number;                 // 전체 항목 수
  totalPages: number;            // 전체 페이지 수
  hasNextPage: boolean;          // 다음 페이지 존재 여부
  hasPreviousPage: boolean;      // 이전 페이지 존재 여부
}

/**
 * 헬스체크 상태 타입들입니다.
 */
export type HealthStatus = 'up' | 'down' | 'unknown';
export type ResourceHealthStatus = 'healthy' | 'warning' | 'critical' | 'unknown';

/**
 * 개별 서비스의 헬스체크 결과 타입입니다.
 */
export interface ServiceHealthCheck {
  status: HealthStatus | ResourceHealthStatus;
  responseTime?: number;         // 응답 시간 (ms)
  message?: string;              // 추가 설명
  details?: Record<string, any>; // 상세 정보
}

/**
 * 전체 시스템 헬스체크 결과 타입입니다.
 */
export interface SystemHealthCheck {
  status: 'ok' | 'error';        // 전체 시스템 상태
  timestamp: string;             // 체크 시각
  uptime: number;                // 가동 시간 (초)
  environment: string;           // 실행 환경
  version: string;               // 애플리케이션 버전
  checks: Record<string, ServiceHealthCheck>; // 개별 서비스 체크 결과
  errors?: Array<{               // 에러 정보 (문제가 있을 때만)
    service: string;
    error: string;
  }>;
}

/**
 * 로그 레벨 열거형입니다.
 */
export enum LogLevel {
  ERROR = 'error',     // 에러 - 시스템 오류
  WARN = 'warn',       // 경고 - 주의가 필요한 상황
  LOG = 'log',         // 일반 - 일반적인 정보
  DEBUG = 'debug',     // 디버그 - 개발 시 디버깅 정보
  VERBOSE = 'verbose'  // 상세 - 매우 상세한 정보
}

/**
 * 환경 타입 정의입니다.
 */
export type Environment = 'development' | 'production' | 'test' | 'staging';

/**
 * 공통 에러 코드 열거형입니다.
 */
export enum ErrorCode {
  // 인증 관련
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  
  // 검증 관련
  VALIDATION_FAILED = 'VALIDATION_FAILED',
  INVALID_INPUT = 'INVALID_INPUT',
  
  // 리소스 관련
  NOT_FOUND = 'NOT_FOUND',
  ALREADY_EXISTS = 'ALREADY_EXISTS',
  
  // 시스템 관련
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR'
}

/**
 * 타입 유틸리티들입니다.
 */

// 엔티티에서 ID와 타임스탬프 필드를 제외한 타입
export type CreateEntityData<T> = Omit<T, 'id' | 'createdAt' | 'updatedAt'>;

// 엔티티에서 ID를 제외한 타입 (업데이트용)
export type UpdateEntityData<T> = Omit<T, 'id' | 'createdAt' | 'updatedAt'>;

// 부분 업데이트를 위한 타입
export type PartialUpdateData<T> = Partial<UpdateEntityData<T>>;

// API 응답에서 민감한 정보를 제외한 타입
export type SafeUser = Omit<any, 'password' | 'refreshToken'>;

/**
 * 상수 정의들입니다.
 */
export const DEFAULT_PAGE_SIZE = 10;     // 기본 페이지 크기
export const MAX_PAGE_SIZE = 100;        // 최대 페이지 크기
export const MIN_PASSWORD_LENGTH = 8;    // 최소 비밀번호 길이
export const MAX_FILE_SIZE = 10485760;   // 최대 파일 크기 (10MB)

// JWT 관련 상수
export const JWT_ACCESS_TOKEN_EXPIRES_IN = '15m';   // 액세스 토큰 만료 시간
export const JWT_REFRESH_TOKEN_EXPIRES_IN = '7d';   // 리프레시 토큰 만료 시간

// 캐시 관련 상수
export const CACHE_TTL = {
  SHORT: 60,      // 1분
  MEDIUM: 300,    // 5분
  LONG: 3600,     // 1시간
  DAILY: 86400    // 24시간
} as const;
