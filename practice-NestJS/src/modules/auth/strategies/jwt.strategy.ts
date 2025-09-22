import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../../database/entities/user.entity';

/**
 * JWT 토큰 검증 전략입니다.
 * 
 * 이 클래스는 마치 보안 전문가가 신분증의 진위를 확인하는 과정과 같은 일을 합니다.
 * 누군가가 JWT 토큰(디지털 신분증)을 가져오면, 다음과 같은 단계로 검증합니다:
 * 
 * 1. 토큰의 서명이 올바른가? (위조되지 않았는가?)
 * 2. 토큰이 만료되지 않았는가?
 * 3. 토큰에 담긴 사용자 정보가 실제로 존재하는가?
 * 4. 해당 사용자의 계정이 활성화되어 있는가?
 * 
 * Spring Security에서는 이런 과정을 JwtAuthenticationProvider나 
 * UserDetailsService에서 처리하지만, NestJS에서는 Passport의 Strategy 패턴을 사용합니다.
 * 
 * Passport는 Node.js 생태계에서 가장 널리 사용되는 인증 라이브러리로,
 * 300개 이상의 다양한 인증 방식을 표준화된 인터페이스로 제공합니다.
 * 우리가 사용하는 passport-jwt는 그 중에서 JWT 토큰 인증을 담당합니다.
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {
    // 부모 클래스(PassportStrategy)의 생성자를 호출하면서
    // JWT 토큰 검증에 필요한 설정을 전달합니다.
    super({
      // 1. JWT 토큰을 어디서 추출할 것인가?
      // Bearer 토큰 형태로 Authorization 헤더에서 추출합니다.
      // 예: "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      
      // 2. 만료된 토큰을 무시할 것인가?
      // false로 설정하면 만료된 토큰에 대해 자동으로 에러를 발생시킵니다.
      // 이는 보안상 매우 중요한 설정입니다.
      ignoreExpiration: false,
      
      // 3. JWT 서명 검증에 사용할 비밀키는 무엇인가?
      // 이 키는 토큰이 생성될 때 사용된 키와 동일해야 합니다.
      // 키가 다르면 토큰이 위조된 것으로 간주됩니다.
      secretOrKey: configService.get<string>('JWT_SECRET'),
    });
  }

  /**
   * validate 메서드는 JWT 토큰이 유효할 때 호출되는 핵심 메서드입니다.
   * 
   * 이 메서드가 호출되는 시점은 다음과 같습니다:
   * 1. JWT 토큰의 서명이 올바르게 검증됨
   * 2. 토큰이 만료되지 않음
   * 3. 토큰의 구조가 올바름
   * 
   * 이 시점에서 payload에는 JWT 토큰에 담긴 정보가 들어있습니다.
   * 일반적으로 { sub: 사용자ID, email: 이메일, iat: 발급시간, exp: 만료시간 } 등이 포함됩니다.
   * 
   * 하지만 토큰이 유효하다고 해서 끝이 아닙니다.
   * 실제 데이터베이스에서 해당 사용자가 여전히 존재하는지,
   * 계정이 활성화되어 있는지 등을 추가로 확인해야 합니다.
   * 이는 토큰 발급 후 사용자가 삭제되거나 비활성화될 수 있기 때문입니다.
   */
  async validate(payload: any) {
    // payload.sub는 JWT 표준에 따라 subject(주체), 즉 사용자 ID를 의미합니다.
    // 토큰을 생성할 때 사용자 ID를 sub 필드에 저장하는 것이 일반적입니다.
    const userId = payload.sub;
    
    // 데이터베이스에서 해당 사용자를 찾습니다.
    // 이 과정에서 사용자가 존재하지 않거나 삭제된 경우를 걸러낼 수 있습니다.
    const user = await this.userRepository.findOne({
      where: { id: userId }
    });

    // 사용자가 존재하지 않는 경우 인증 실패
    // 이는 토큰이 유효해도 실제 사용자가 더 이상 존재하지 않는 상황입니다.
    if (!user) {
      throw new UnauthorizedException('사용자를 찾을 수 없습니다.');
    }

    // 사용자 계정이 비활성화된 경우 인증 실패
    // 관리자가 특정 사용자의 접근을 차단하고 싶을 때 isActive를 false로 설정할 수 있습니다.
    // 이렇게 하면 기존에 발급된 토큰도 무효화할 수 있습니다.
    if (!user.isActive) {
      throw new UnauthorizedException('비활성화된 계정입니다.');
    }

    // 이메일 인증이 필요한 서비스인 경우 추가 검증
    // 회원가입 후 이메일 인증을 받지 않은 사용자의 접근을 제한할 수 있습니다.
    if (!user.isEmailVerified) {
      throw new UnauthorizedException('이메일 인증이 필요합니다.');
    }

    // 마지막 로그인 시간을 업데이트합니다.
    // 이는 사용자의 활동을 추적하고 보안 모니터링에 도움이 됩니다.
    // 예를 들어, 의심스러운 로그인 패턴을 감지할 수 있습니다.
    user.lastLoginAt = new Date();
    await this.userRepository.save(user);

    // 모든 검증을 통과한 사용자 정보를 반환합니다.
    // 이 정보는 request.user에 저장되어 컨트롤러에서 사용할 수 있게 됩니다.
    // 
    // 주의: 비밀번호는 절대 반환하지 않습니다.
    // 비밀번호가 포함된 user 객체 전체를 반환하지 않고,
    // 필요한 정보만 선별해서 반환하는 것이 보안상 중요합니다.
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      isActive: user.isActive,
      isEmailVerified: user.isEmailVerified,
      lastLoginAt: user.lastLoginAt,
    };
  }
}
