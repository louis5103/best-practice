import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { Observable } from 'rxjs';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

/**
 * JWT 인증 가드입니다.
 * 
 * 이 클래스는 마치 고급 호텔의 보안 시스템과 같은 역할을 합니다. 
 * 모든 손님(API 요청)이 호텔(애플리케이션)에 들어오려고 할 때,
 * 보안 요원(이 가드)이 다음과 같은 과정을 거칩니다:
 * 
 * 1. "이곳은 누구나 들어올 수 있는 공개 구역인가?" (@Public() 확인)
 * 2. 공개 구역이면 → 그냥 통과시킴
 * 3. 비공개 구역이면 → 출입증(JWT 토큰) 확인
 * 4. 출입증이 유효하면 → 통과
 * 5. 출입증이 없거나 유효하지 않으면 → 입장 거부
 * 
 * Spring Security의 Filter Chain과 매우 유사한 개념이지만,
 * NestJS에서는 Guard라는 더 직관적인 이름을 사용합니다.
 * 
 * 이 클래스가 AuthGuard('jwt')를 상속받는 이유는 Passport의 JWT 전략을
 * 활용하기 위해서입니다. Passport는 Node.js 생태계에서 가장 널리 사용되는
 * 인증 라이브러리로, 수많은 인증 방식을 표준화된 방법으로 처리할 수 있게 해줍니다.
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
    // Reflector는 NestJS가 제공하는 메타데이터 읽기 도구입니다.
    // @Public() 데코레이터로 설정한 메타데이터를 읽기 위해 필요합니다.
  }

  /**
   * canActivate 메서드는 가드의 핵심 로직입니다.
   * 
   * 이 메서드는 "이 요청이 통과해도 되는가?"를 결정하는 함수입니다.
   * true를 반환하면 요청이 계속 진행되고, false나 예외를 던지면 요청이 차단됩니다.
   * 
   * ExecutionContext는 현재 실행 중인 요청에 대한 모든 정보를 담고 있는 객체입니다.
   * HTTP 요청의 경우 request, response 객체뿐만 아니라
   * 현재 처리 중인 컨트롤러, 메서드에 대한 정보도 포함하고 있습니다.
   */
  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    // 1단계: 공개 엔드포인트 확인
    // 현재 처리 중인 메서드나 클래스에 @Public() 데코레이터가 있는지 확인합니다.
    // 이는 마치 "VIP 전용" 표시가 없는 공개 구역을 찾는 것과 같습니다.
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(), // 현재 실행 중인 메서드
      context.getClass(),   // 현재 실행 중인 컨트롤러 클래스
    ]);

    // 2단계: 공개 엔드포인트라면 인증 없이 통과
    // @Public() 데코레이터가 있다면, 이 엔드포인트는 누구나 접근할 수 있으므로
    // JWT 토큰 검증을 건너뛰고 바로 true를 반환합니다.
    if (isPublic) {
      return true;
    }

    // 3단계: 비공개 엔드포인트라면 JWT 인증 수행
    // 부모 클래스(AuthGuard)의 canActivate를 호출해서 JWT 토큰을 검증합니다.
    // 이 과정에서 다음과 같은 일들이 일어납니다:
    // - Authorization 헤더에서 Bearer 토큰 추출
    // - JWT 토큰의 유효성 검증 (서명, 만료시간 등)
    // - JWT Strategy의 validate 메서드 호출
    // - 검증이 성공하면 사용자 정보를 request.user에 저장
    return super.canActivate(context);
  }

  /**
   * handleRequest 메서드는 인증 과정에서 발생하는 에러나 결과를 처리합니다.
   * 
   * 이 메서드는 Passport 인증이 완료된 후에 호출됩니다.
   * 인증 성공 시에는 사용자 정보가 user 파라미터로 전달되고,
   * 실패 시에는 err 파라미터나 info 파라미터에 에러 정보가 전달됩니다.
   * 
   * 이 메서드를 오버라이드하는 이유는 기본 에러 처리 방식을 
   * 우리 애플리케이션의 요구사항에 맞게 커스터마이징하기 위해서입니다.
   */
  handleRequest(err: any, user: any, info: any) {
    // JWT 토큰 검증 과정에서 에러가 발생했거나, 사용자 정보가 없는 경우
    // UnauthorizedException을 던져서 401 Unauthorized 응답을 보냅니다.
    // 
    // 이는 Spring Security에서 AuthenticationEntryPoint가 하는 역할과 유사합니다.
    // 인증되지 않은 요청에 대해 일관된 에러 응답을 제공하는 것입니다.
    if (err || !user) {
      // info 파라미터에는 JWT 검증 과정에서의 추가 정보가 들어있습니다.
      // 개발 환경에서 디버깅을 위해 로그를 남깁니다.
      if (info && process.env.NODE_ENV === 'development') {
        console.log('JWT 인증 정보:', info);
      }
      throw err || new UnauthorizedException('인증이 필요합니다.');
    }
    
    // 인증이 성공한 경우 사용자 정보를 반환합니다.
    // 이 사용자 정보는 나중에 컨트롤러에서 @Req() 데코레이터나
    // 커스텀 데코레이터를 통해 접근할 수 있게 됩니다.
    return user;
  }
}
