"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.envValidationSchema = void 0;
exports.validateEnvironmentVariables = validateEnvironmentVariables;
const Joi = require("joi");
exports.envValidationSchema = Joi.object({
    NODE_ENV: Joi.string()
        .valid('development', 'production', 'test', 'staging')
        .default('development')
        .description('애플리케이션 실행 환경'),
    PORT: Joi.number()
        .port()
        .default(3000)
        .description('서버 포트 번호'),
    DB_HOST: Joi.string()
        .hostname()
        .required()
        .description('데이터베이스 호스트'),
    DB_PORT: Joi.number()
        .port()
        .default(5432)
        .description('데이터베이스 포트'),
    DB_USERNAME: Joi.string()
        .alphanum()
        .min(3)
        .max(30)
        .required()
        .description('데이터베이스 사용자명'),
    DB_PASSWORD: Joi.string()
        .min(8)
        .required()
        .description('데이터베이스 비밀번호'),
    DB_NAME: Joi.string()
        .alphanum()
        .min(3)
        .max(50)
        .required()
        .description('데이터베이스 이름'),
    REDIS_HOST: Joi.string()
        .hostname()
        .default('localhost')
        .description('Redis 호스트'),
    REDIS_PORT: Joi.number()
        .port()
        .default(6379)
        .description('Redis 포트'),
    REDIS_PASSWORD: Joi.string()
        .allow('')
        .optional()
        .description('Redis 비밀번호 (선택사항)'),
    JWT_SECRET: Joi.string()
        .min(32)
        .required()
        .description('JWT 서명용 비밀키 (최소 32자)'),
    JWT_EXPIRES_IN: Joi.string()
        .pattern(/^(\d+[smhd]|never)$/)
        .default('24h')
        .description('JWT 만료 시간 (예: 30s, 15m, 12h, 7d)'),
    API_TITLE: Joi.string()
        .min(3)
        .max(100)
        .default('NestJS Practice API')
        .description('API 문서 제목'),
    API_VERSION: Joi.string()
        .pattern(/^\d+\.\d+(\.\d+)?$/)
        .default('1.0.0')
        .description('API 버전 (semantic versioning)'),
    JWT_AUDIENCE: Joi.string()
        .optional()
        .description('JWT audience (대상자)'),
    JWT_ISSUER: Joi.string()
        .optional()
        .description('JWT issuer (발급자)'),
    LOG_LEVEL: Joi.string()
        .valid('error', 'warn', 'info', 'debug', 'verbose')
        .default('info')
        .description('로그 레벨'),
    CORS_ORIGINS: Joi.string()
        .default('http://localhost:3000,http://localhost:3001')
        .description('CORS 허용 도메인 (쉼표로 구분)'),
    RATE_LIMIT_TTL: Joi.number()
        .positive()
        .default(60)
        .description('Rate limiting 시간 창 (초)'),
    RATE_LIMIT_MAX: Joi.number()
        .positive()
        .default(100)
        .description('Rate limiting 최대 요청 수'),
});
function validateEnvironmentVariables(config) {
    const { error, value } = exports.envValidationSchema.validate(config, {
        abortEarly: false,
        allowUnknown: true,
        stripUnknown: false,
    });
    if (error) {
        const errorMessages = error.details.map(detail => {
            return `${detail.path.join('.')}: ${detail.message}`;
        });
        throw new Error(`환경 변수 검증 실패:\n${errorMessages.join('\n')}\n\n` +
            '❗ .env 파일을 확인하고 누락된 환경 변수들을 추가해주세요.\n' +
            '📚 자세한 설정 방법은 README.md를 참고하세요.');
    }
    return value;
}
//# sourceMappingURL=env-validation.schema.js.map