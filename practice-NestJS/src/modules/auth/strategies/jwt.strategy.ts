import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../../database/entities/user.entity';

/**
 * JWT 인증 전략입니다.
 * 
 * 이 클래스는 Passport의 Strategy 패턴을 구현합니다. 
 * Strategy 패턴이란 무엇일까요?
 * 
 * 마치 다양한 종류의 열쇠(JWT, OAuth, 비밀번호 등)로 
 * 같은 문(인증 시스템)을 열 수 있게 하는 설계 패턴입니다.
 * 
 * 🔍 Passport Strategy의 동작 원리:
 * 
 * 1. 요청이 들어오면 Passport가 적절한 Strategy를 선택
 * 2. Strategy가 인증 정보를 추출하고 검증
 * 3. 검증이 성공하면 validate() 메서드 호출
 * 4. validate()의 반환값이 req.user에 저장됨
 * 
 * 이는 마치 공항 보안 검색대에서 여권을 확인하는 과정과 같습니다.
 * 여권(JWT)이 유효하다면, 승객 정보(user)를 시스템에 등록하는 것이죠.
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(JwtStrategy.name);

  constructor(
    private configService: ConfigService,
    @InjectRepository(User)
    private userRepository: Repository<User>
  ) {
    /**
     * 부모 클래스(PassportStrategy)의 생성자를 호출합니다.
     * 
     * 여기서 전달하는 설정들은 Passport에게 "JWT 토큰을 어떻게 처리할지"를 알려줍니다.
     * 마치 우편 배달부에게 "어떤 주소 형식으로 편지를 찾을지" 알려주는 것과 같습니다.
     */
    super({
      /**
       * jwtFromRequest: JWT 토큰을 요청에서 어떻게 추출할지 정의
       * 
       * ExtractJwt.fromAuthHeaderAsBearerToken()는 
       * "Authorization: Bearer <token>" 헤더에서 토큰을 추출합니다.
       * 
       * 다른 옵션들도 있습니다:
       * - ExtractJwt.fromBodyField('token'): 요청 본문에서 추출
       * - ExtractJwt.fromUrlQueryParameter('token'): URL 파라미터에서 추출
       * - ExtractJwt.fromCookies('jwt'): 쿠키에서 추출
       */
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      
      /**
       * ignoreExpiration: 만료된 토큰을 무시할지 여부
       * 
       * false로 설정하면 만료된 토큰은 자동으로 거부됩니다.
       * 이는 보안상 매우 중요한 설정입니다.
       */
      ignoreExpiration: false,
      
      /**
       * secretOrKey: JWT 토큰의 서명을 검증할 때 사용할 비밀키
       * 
       * 이 키는 토큰 생성 시 사용한 키와 동일해야 합니다.
       * 마치 자물쇠와 열쇠가 짝을 이뤄야 하는 것과 같습니다.
       */
      secretOrKey: configService.get<string>('JWT_SECRET'),
      
      /**
       * 추가 보안 옵션들 (선택사항)
       * 
       * 이런 옵션들은 토큰의 신뢰성을 더욱 강화합니다.
       * 마치 신분증에 여러 보안 요소가 있는 것과 같습니다.
       */
      audience: configService.get<string>('JWT_AUDIENCE'),
      issuer: configService.get<string>('JWT_ISSUER'),
    });
  }

  /**
   * JWT 토큰이 유효할 때 호출되는 메서드입니다.
   * 
   * 이 메서드는 Passport의 핵심입니다. 
   * 
   * 🔄 호출 과정:
   * 1. 사용자가 Authorization 헤더와 함께 요청 전송
   * 2. Passport가 JWT 토큰을 추출하고 서명 검증
   * 3. 토큰이 유효하다면 payload를 이 메서드에 전달
   * 4. 이 메서드의 반환값이 req.user에 저장됨
   * 
   * payload는 JWT 토큰에 담긴 정보입니다. 예를 들어:
   * {
   *   sub: 123,           // 사용자 ID
   *   email: "user@example.com",
   *   role: "user",
   *   iat: 1640995200,    // 발급 시간
   *   exp: 1641081600     // 만료 시간
   * }
   * 
   * @param payload JWT 토큰에서 추출된 페이로드
   * @returns 사용자 객체 또는 false (인증 실패 시)
   */
  async validate(payload: any): Promise<any> {
    this.logger.debug(`JWT 토큰 검증 시작: 사용자 ID ${payload.sub}`);
    
    try {
      /**
       * 데이터베이스에서 사용자 정보를 조회합니다.
       * 
       * 왜 토큰에 모든 정보가 있는데 굳이 DB를 조회할까요?
       * 
       * 1. 보안상 이유: 사용자가 비활성화되었을 수 있음
       * 2. 최신 정보: 토큰 발급 후 사용자 정보가 변경되었을 수 있음
       * 3. 권한 변경: 사용자의 역할이 변경되었을 수 있음
       * 
       * 이는 마치 출입증을 가지고 있어도 실제 출입 가능 여부를
       * 보안실에서 다시 한 번 확인하는 것과 같습니다.
       */
      const user = await this.userRepository.findOne({
        where: { id: payload.sub },
        select: [
          'id', 'email', 'name', 'role', 'isActive', 
          'isEmailVerified', 'lastLoginAt'
        ]
      });

      /**
       * 사용자가 존재하지 않는 경우 처리
       * 
       * 이는 다음과 같은 상황에서 발생할 수 있습니다:
       * - 사용자 계정이 삭제됨
       * - 잘못된 토큰 (위조된 토큰)
       * - 데이터베이스 동기화 문제
       */
      if (!user) {
        this.logger.warn(`존재하지 않는 사용자 ID: ${payload.sub}`);
        throw new UnauthorizedException('사용자를 찾을 수 없습니다.');
      }

      /**
       * 계정 활성화 상태 확인
       * 
       * 관리자가 사용자 계정을 비활성화했을 수 있으므로
       * 토큰이 유효하더라도 접근을 차단해야 합니다.
       */
      if (!user.isActive) {
        this.logger.warn(`비활성화된 계정 접근 시도: ${user.email}`);
        throw new UnauthorizedException('비활성화된 계정입니다.');
      }

      /**
       * 인증 성공 로깅
       * 
       * 보안 감사를 위해 성공한 인증도 기록합니다.
       * 이는 나중에 사용자 활동 패턴을 분석할 때 유용합니다.
       */
      this.logger.debug(`사용자 인증 성공: ${user.email} (ID: ${user.id})`);

      /**
       * 사용자 정보 반환
       * 
       * 여기서 반환하는 객체가 컨트롤러에서 @Req() req.user로 접근할 수 있게 됩니다.
       * 
       * 💡 중요: 비밀번호 같은 민감한 정보는 절대 포함하지 마세요!
       * 
       * 반환되는 정보는 다음과 같은 원칙을 따릅니다:
       * - 컨트롤러에서 필요한 최소한의 정보만
       * - 민감한 정보는 제외
       * - 토큰 정보(발급시간, 만료시간)도 포함하여 디버깅에 활용
       */
      return {
        // 기본 사용자 정보
        userId: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        isActive: user.isActive,
        isEmailVerified: user.isEmailVerified,
        lastLoginAt: user.lastLoginAt,
        
        // 토큰 관련 정보 (디버깅 및 로깅용)
        tokenIssuedAt: payload.iat,
        tokenExpiresAt: payload.exp,
      };

    } catch (error) {
      /**
       * 에러 처리
       * 
       * validate 메서드에서 예외가 발생하면 Passport가 이를 인증 실패로 처리합니다.
       * 
       * 🔐 보안 고려사항:
       * - 구체적인 에러 메시지는 로그에만 기록
       * - 클라이언트에게는 일반적인 메시지만 전달
       * - 이는 공격자가 시스템 내부 정보를 얻는 것을 방지합니다
       */
      if (error instanceof UnauthorizedException) {
        // 이미 처리된 인증 에러는 그대로 throw
        throw error;
      }

      // 예상치 못한 에러는 로그에 기록하고 일반적인 메시지로 변환
      this.logger.error(`JWT 검증 중 예상치 못한 오류: ${error.message}`, error.stack);
      throw new UnauthorizedException('인증 처리 중 오류가 발생했습니다.');
    }
  }
}
