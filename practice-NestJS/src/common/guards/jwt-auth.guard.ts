import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';

/**
 * Passport 기반 JWT 인증 가드입니다.
 * 
 * 이 구현을 커스텀 구현과 비교해보세요. 얼마나 간단해졌나요?
 * 
 * 🚀 Passport 사용의 장점들:
 * 
 * 1. **코드 간소화**: 복잡한 토큰 검증 로직을 Passport에 위임
 * 2. **표준화**: 커뮤니티에서 검증된 패턴 사용
 * 3. **확장성**: 다른 인증 방식(OAuth, SAML 등) 쉽게 추가 가능
 * 4. **보안성**: 수년간 커뮤니티에서 발견하고 수정한 보안 이슈들이 반영됨
 * 5. **유지보수**: 새로운 JWT 기능이나 보안 업데이트 자동 적용
 * 
 * 🎭 Guard vs Strategy의 역할 분담:
 * 
 * Strategy: "이 토큰이 유효한 토큰인가?" (토큰 검증과 사용자 조회)
 * Guard: "이 요청이 인증이 필요한 요청인가?" (Public 여부 확인 등)
 * 
 * 이는 마치 공연장에서:
 * - 티켓 검사원(Strategy): 티켓의 진위 여부 확인
 * - 출입 관리원(Guard): 이 공연이 티켓이 필요한 공연인지 확인
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  /**
   * 요청이 인증을 거쳐야 하는지 결정합니다.
   * 
   * 이 메서드는 Passport의 AuthGuard를 확장하여 Public 엔드포인트 기능을 추가합니다.
   * 
   * 🔍 실행 순서:
   * 1. Public 데코레이터 확인
   * 2. Public이면 즉시 통과
   * 3. Public이 아니면 부모 클래스(AuthGuard)의 canActivate 호출
   * 4. AuthGuard가 Strategy를 실행하여 토큰 검증
   * 5. Strategy의 validate 메서드가 사용자 정보 반환
   * 6. 사용자 정보가 req.user에 저장됨
   * 
   * @param context 실행 컨텍스트
   * @returns Promise<boolean> | boolean | Observable<boolean>
   */
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    /**
     * Public 데코레이터 확인
     * 
     * Reflector는 메타데이터를 읽는 NestJS의 도구입니다.
     * @Public() 데코레이터가 붙은 엔드포인트는 인증 없이 접근 가능해야 합니다.
     * 
     * getAllAndOverride는 다음 순서로 메타데이터를 찾습니다:
     * 1. 메서드 레벨 (@Get, @Post 등이 붙은 메서드)
     * 2. 클래스 레벨 (@Controller가 붙은 클래스)
     * 
     * 이는 메서드별로 세밀한 제어가 가능하게 해줍니다.
     */
    const isPublic = this.reflector.getAllAndOverride<boolean>('isPublic', [
      context.getHandler(), // 메서드 레벨 메타데이터 확인
      context.getClass(),   // 클래스 레벨 메타데이터 확인
    ]);

    /**
     * Public 엔드포인트라면 인증을 건너뜁니다.
     * 
     * 이는 로그인, 회원가입, 상품 목록 조회 같은 
     * 인증이 필요하지 않은 엔드포인트를 위한 기능입니다.
     */
    if (isPublic) {
      return true;
    }

    /**
     * Public이 아니라면 부모 클래스의 canActivate를 호출합니다.
     * 
     * 여기서 마법이 일어납니다! 🪄
     * 
     * AuthGuard('jwt')의 canActivate가 호출되면:
     * 1. 'jwt'라는 이름으로 등록된 Strategy를 찾습니다 (우리가 만든 JwtStrategy)
     * 2. Strategy의 authenticate 메서드를 호출합니다
     * 3. JWT 토큰을 추출하고 검증합니다
     * 4. 토큰이 유효하면 Strategy의 validate 메서드를 호출합니다
     * 5. validate가 반환한 사용자 정보를 req.user에 저장합니다
     * 
     * 이 모든 과정이 단 한 줄의 코드로 처리됩니다!
     * 커스텀 구현에서 수십 줄로 작성했던 로직이 Passport에 의해 자동화됩니다.
     */
    return super.canActivate(context);
  }

  /**
   * 인증 실패 시 예외를 처리합니다.
   * 
   * 이 메서드는 Passport에서 인증이 실패했을 때 호출됩니다.
   * 
   * 🔍 언제 호출되나요?
   * - JWT 토큰이 없을 때
   * - JWT 토큰이 유효하지 않을 때  
   * - JWT 토큰이 만료되었을 때
   * - Strategy의 validate 메서드에서 예외가 발생했을 때
   * 
   * @param err 에러 객체 (있는 경우)
   * @param user 사용자 객체 (validate에서 반환된 값)
   * @param info 추가 정보 (Passport에서 제공)
   * @param context 실행 컨텍스트
   */
  handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
    /**
     * 에러가 있거나 사용자 정보가 없으면 인증 실패로 처리합니다.
     * 
     * 이때 Strategy의 validate 메서드에서 던진 예외가 그대로 전달되므로,
     * 우리가 Strategy에서 작성한 구체적인 에러 메시지들이 클라이언트에게 전달됩니다.
     * 
     * 예를 들어:
     * - "사용자를 찾을 수 없습니다"
     * - "비활성화된 계정입니다"
     * - "토큰이 만료되었습니다"
     */
    if (err || !user) {
      throw err || new Error('인증에 실패했습니다.');
    }

    /**
     * 인증이 성공했다면 사용자 객체를 반환합니다.
     * 
     * 이 반환값이 최종적으로 req.user에 저장되어 
     * 컨트롤러에서 @Req() 데코레이터로 접근할 수 있게 됩니다.
     */
    return user;
  }
}
