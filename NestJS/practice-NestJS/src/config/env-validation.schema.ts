import * as Joi from 'joi';

/**
 * 환경 변수 검증 스키마입니다.
 * 
 * 이 스키마는 마치 건축 설계도의 안전 기준과 같은 역할을 합니다.
 * 애플리케이션이 시작되기 전에 모든 필수 환경 변수가 올바른 형태로
 * 제공되었는지 검증하여, 런타임 오류를 사전에 방지합니다.
 * 
 * 🎯 검증의 이점:
 * 1. **조기 오류 발견**: 서버 시작 시점에 설정 문제를 발견
 * 2. **명확한 오류 메시지**: 어떤 설정이 잘못되었는지 정확히 알 수 있음
 * 3. **개발 경험 향상**: 팀원들이 프로젝트를 쉽게 설정할 수 있음
 * 4. **배포 안정성**: 프로덕션 배포 전 설정 오류 방지
 */
export const envValidationSchema = Joi.object({
  /**
   * 애플리케이션 실행 환경
   * 
   * 왜 이것을 검증해야 할까요?
   * 환경에 따라 다른 동작이 필요하기 때문입니다.
   * 개발 환경에서는 디버깅이 활성화되지만, 프로덕션에서는 보안을 위해 비활성화됩니다.
   */
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test', 'staging')
    .default('development')
    .description('애플리케이션 실행 환경'),

  /**
   * 서버 포트 번호
   * 
   * 포트 번호의 유효 범위를 제한하는 이유:
   * - 1024 미만: 시스템 포트 (관리자 권한 필요)
   * - 65535 초과: 유효하지 않은 포트 번호
   */
  PORT: Joi.number()
    .port()
    .default(3000)
    .description('서버 포트 번호'),

  /**
   * 데이터베이스 연결 설정
   * 
   * 각 필드를 개별적으로 검증하는 이유:
   * 데이터베이스 연결 실패는 전체 애플리케이션 중단으로 이어지므로
   * 각 매개변수가 올바른지 철저히 확인해야 합니다.
   */
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

  /**
   * Redis 캐시 설정
   * 
   * Redis는 선택적 의존성으로 설정했습니다.
   * 개발 환경에서는 Redis 없이도 동작할 수 있도록 하여
   * 개발자들의 진입 장벽을 낮춥니다.
   */
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

  /**
   * JWT 보안 설정
   * 
   * JWT 보안의 핵심인 SECRET 키를 엄격하게 검증합니다.
   * 짧은 키는 보안상 매우 위험하므로 최소 길이를 강제합니다.
   */
  JWT_SECRET: Joi.string()
    .min(32)
    .required()
    .description('JWT 서명용 비밀키 (최소 32자)'),

  JWT_EXPIRES_IN: Joi.string()
    .pattern(/^(\d+[smhd]|never)$/)
    .default('24h')
    .description('JWT 만료 시간 (예: 30s, 15m, 12h, 7d)'),

  /**
   * API 문서화 설정
   * 
   * 이런 메타데이터들도 검증하는 이유:
   * Swagger 문서나 API 응답에서 사용되므로
   * 일관된 형태를 유지하는 것이 중요합니다.
   */
  API_TITLE: Joi.string()
    .min(3)
    .max(100)
    .default('NestJS Practice API')
    .description('API 문서 제목'),

  API_VERSION: Joi.string()
    .pattern(/^\d+\.\d+(\.\d+)?$/)
    .default('1.0.0')
    .description('API 버전 (semantic versioning)'),

  /**
   * 추가 보안 설정들
   * 
   * 프로덕션 환경에서 필요한 추가 보안 설정들입니다.
   * 이들은 선택사항으로 두되, 프로덕션에서는 권장됩니다.
   */
  JWT_AUDIENCE: Joi.string()
    .optional()
    .description('JWT audience (대상자)'),

  JWT_ISSUER: Joi.string()
    .optional()
    .description('JWT issuer (발급자)'),

  /**
   * 로깅 설정
   */
  LOG_LEVEL: Joi.string()
    .valid('error', 'warn', 'info', 'debug', 'verbose')
    .default('info')
    .description('로그 레벨'),

  /**
   * CORS 설정
   */
  CORS_ORIGINS: Joi.string()
    .default('http://localhost:3000,http://localhost:3001')
    .description('CORS 허용 도메인 (쉼표로 구분)'),

  /**
   * Rate Limiting 설정
   */
  RATE_LIMIT_TTL: Joi.number()
    .positive()
    .default(60)
    .description('Rate limiting 시간 창 (초)'),

  RATE_LIMIT_MAX: Joi.number()
    .positive()
    .default(100)
    .description('Rate limiting 최대 요청 수'),
});

/**
 * 환경 변수 검증 함수입니다.
 * 
 * 이 함수는 ConfigModule에서 호출되어 애플리케이션 시작 시
 * 환경 변수들을 검증합니다.
 * 
 * @param config 환경 변수 객체
 * @returns 검증되고 기본값이 적용된 환경 변수 객체
 */
export function validateEnvironmentVariables(config: Record<string, unknown>) {
  const { error, value } = envValidationSchema.validate(config, {
    /**
     * abortEarly: false
     * 모든 유효성 검사 오류를 한 번에 보여줍니다.
     * 이는 개발자가 모든 문제를 한 번에 파악하고 수정할 수 있게 해줍니다.
     */
    abortEarly: false,
    
    /**
     * allowUnknown: true
     * 스키마에 정의되지 않은 환경 변수도 허용합니다.
     * 이는 시스템 환경 변수나 다른 도구들이 설정한 변수들과의 호환성을 보장합니다.
     */
    allowUnknown: true,
    
    /**
     * stripUnknown: false
     * 알 수 없는 환경 변수도 유지합니다.
     * 나중에 다른 모듈에서 사용할 수 있기 때문입니다.
     */
    stripUnknown: false,
  });

  if (error) {
    // 검증 오류가 발생했을 때의 친화적인 메시지 생성
    const errorMessages = error.details.map(detail => {
      return `${detail.path.join('.')}: ${detail.message}`;
    });

    throw new Error(
      `환경 변수 검증 실패:\n${errorMessages.join('\n')}\n\n` +
      '❗ .env 파일을 확인하고 누락된 환경 변수들을 추가해주세요.\n' +
      '📚 자세한 설정 방법은 README.md를 참고하세요.'
    );
  }

  return value;
}
