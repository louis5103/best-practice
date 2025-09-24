import { 
  Injectable, 
  ExecutionContext, 
  UnauthorizedException,
  Logger
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';

/**
 * 커스텀 JWT 인증 가드입니다. (보존용)
 * 
 * 이 구현은 학습 목적으로 보관되었습니다. 
 * 
 * ⭐ 커스텀 구현의 장점:
 * - 내부 동작을 완전히 제어할 수 있음
 * - 특별한 비즈니스 로직을 쉽게 추가할 수 있음
 * - 외부 라이브러리 의존성이 적음
 * - 디버깅과 문제 해결이 상대적으로 쉬움
 * 
 * ⚠️ 커스텀 구현의 단점:
 * - 보안 취약점을 놓칠 가능성
 * - 표준화된 패턴을 따르지 않아 팀 협업에 어려움
 * - 커뮤니티의 검증을 받지 못한 코드
 * - 새로운 JWT 기능 추가 시 직접 구현해야 함
 * 
 * 이런 이유로 실제 프로덕션에서는 검증된 라이브러리(Passport)를 
 * 사용하는 것이 일반적입니다.
 */
@Injectable()
export class CustomJwtAuthGuard {
  private readonly logger = new Logger(CustomJwtAuthGuard.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly reflector: Reflector
  ) {}

  /**
   * 요청이 인증된 사용자로부터 온 것인지 확인합니다.
   * 
   * 이 메서드는 마치 도서관 입구에서 도서관 카드를 확인하는 과정과 같습니다.
   * 카드(JWT 토큰)의 유효성을 검사하고, 유효하다면 출입을 허용합니다.
   */
  async canActivate(context: ExecutionContext): Promise<boolean> {
    // 퍼블릭 엔드포인트인지 확인
    const isPublic = this.reflector.getAllAndOverride<boolean>('isPublic', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      this.logger.warn(`인증 토큰이 제공되지 않았습니다. IP: ${request.ip}`);
      throw new UnauthorizedException('인증 토큰이 필요합니다.');
    }

    try {
      // JWT 토큰 검증
      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.configService.get<string>('JWT_SECRET'),
        ignoreExpiration: false,
        audience: this.configService.get<string>('JWT_AUDIENCE'),
        issuer: this.configService.get<string>('JWT_ISSUER'),
      });

      // 토큰이 유효하다면 사용자 정보를 request 객체에 저장
      request.user = {
        userId: payload.sub,
        email: payload.email,
        role: payload.role,
        iat: payload.iat,
        exp: payload.exp,
      };

      this.logger.debug(`사용자 인증 성공: ${payload.email} (ID: ${payload.sub})`);
      return true;

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
      const errorName = error instanceof Error ? (error as any).name : null;
      this.logger.error(`JWT 토큰 검증 실패: ${errorMessage}. IP: ${request.ip}`);

      if (errorName === 'JsonWebTokenError') {
        throw new UnauthorizedException('유효하지 않은 토큰입니다.');
      } else if (errorName === 'TokenExpiredError') {
        throw new UnauthorizedException('토큰이 만료되었습니다. 다시 로그인해 주세요.');
      } else if (errorName === 'NotBeforeError') {
        throw new UnauthorizedException('토큰이 아직 활성화되지 않았습니다.');
      } else {
        throw new UnauthorizedException('토큰 인증에 실패했습니다.');
      }
    }
  }

  /**
   * HTTP 요청 헤더에서 JWT 토큰을 추출합니다.
   */
  private extractTokenFromHeader(request: any): string | undefined {
    const authorization = request.headers.authorization;
    
    if (!authorization) {
      return undefined;
    }

    const [type, token] = authorization.split(' ');
    return type === 'Bearer' && token ? token : undefined;
  }
}
