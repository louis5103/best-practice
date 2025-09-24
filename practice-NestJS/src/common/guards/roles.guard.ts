import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY, hasAnyRole } from '../decorators/roles.decorator';

/**
 * 역할 기반 접근 제어(RBAC) 가드입니다.
 * 
 * 이 가드는 마치 건물의 보안 요원과 같은 역할을 합니다.
 * 각 방(엔드포인트)에 들어가려는 사람(사용자)의 출입 카드(권한)을 확인하고,
 * 적절한 권한이 있는 경우에만 통과시켜줍니다.
 * 
 * 가드의 동작 원리:
 * 1. 요청이 컨트롤러에 도달하기 전에 가드가 먼저 실행됩니다
 * 2. @Roles() 데코레이터에서 설정한 메타데이터를 읽어옵니다
 * 3. 현재 사용자의 권한을 확인합니다
 * 4. 권한이 일치하면 true를 반환하여 요청을 통과시킵니다
 * 5. 권한이 부족하면 false를 반환하거나 예외를 발생시킵니다
 * 
 * 왜 이런 접근 방식이 좋은가?
 * 
 * 1. **관심사의 분리**: 비즈니스 로직과 보안 로직이 분리됨
 * 2. **재사용성**: 한 번 작성하면 모든 컨트롤러에서 사용 가능
 * 3. **일관성**: 모든 권한 체크가 동일한 방식으로 처리됨
 * 4. **확장성**: 복잡한 권한 로직도 쉽게 추가 가능
 * 5. **테스트 용이성**: 가드만 별도로 테스트할 수 있음
 * 
 * Spring Security의 AccessDecisionManager와 비슷한 개념이지만,
 * NestJS에서는 더 직관적이고 간단하게 구현할 수 있습니다.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  /**
   * Reflector를 주입받습니다.
   * 
   * Reflector는 NestJS에서 제공하는 메타데이터 리더입니다.
   * 데코레이터를 통해 설정된 메타데이터를 런타임에 읽어올 수 있게 해줍니다.
   * 
   * 이는 마치 도서관 사서가 카드 카탈로그를 통해 책의 정보를 찾는 것과 같습니다.
   * @Roles() 데코레이터가 카드에 정보를 기록했다면,
   * Reflector는 그 카드를 찾아서 정보를 읽어주는 역할을 합니다.
   */
  constructor(private reflector: Reflector) {}

  /**
   * 접근 권한을 확인하는 핵심 메서드입니다.
   * 
   * CanActivate 인터페이스의 필수 메서드로,
   * true를 반환하면 요청이 통과되고, false를 반환하면 차단됩니다.
   * 
   * @param context 실행 컨텍스트 - 현재 요청에 대한 모든 정보를 포함
   * @returns 접근 허용 여부
   */
  canActivate(context: ExecutionContext): boolean {
    try {
      // 1단계: 필요한 권한들을 메타데이터에서 읽어옵니다
      const requiredRoles = this.getRequiredRoles(context);
      
      // 2단계: @Roles() 데코레이터가 없으면 모든 사용자에게 허용
      if (!requiredRoles || requiredRoles.length === 0) {
        return true;
      }

      // 3단계: 현재 사용자 정보를 요청에서 추출
      const currentUser = this.getCurrentUser(context);
      
      // 4단계: 사용자가 인증되지 않은 경우 차단
      if (!currentUser) {
        throw new ForbiddenException('인증이 필요합니다.');
      }

      // 5단계: 사용자의 권한을 확인
      const userRole = currentUser.role;
      if (!userRole) {
        throw new ForbiddenException('사용자 권한 정보가 없습니다.');
      }

      // 6단계: 권한 계층을 고려하여 권한 체크
      const hasPermission = hasAnyRole(userRole, requiredRoles);
      
      if (!hasPermission) {
        // 더 구체적인 에러 메시지 제공
        const requiredRoleNames = this.formatRoleNames(requiredRoles);
        throw new ForbiddenException(
          `이 작업을 수행하려면 ${requiredRoleNames} 권한이 필요합니다. ` +
          `현재 권한: ${this.formatRoleName(userRole)}`
        );
      }

      return true;

    } catch (error) {
      // 예상치 못한 에러가 발생한 경우에도 안전하게 처리
      if (error instanceof ForbiddenException) {
        throw error;
      }
      
      // 시스템 에러는 로깅하고 일반적인 에러 메시지 반환
      console.error('RolesGuard에서 예상치 못한 에러 발생:', error);
      throw new ForbiddenException('권한 확인 중 오류가 발생했습니다.');
    }
  }

  /**
   * 메타데이터에서 필요한 권한들을 읽어옵니다.
   * 
   * Reflector를 사용하여 @Roles() 데코레이터에서 설정한 권한 목록을 가져옵니다.
   * 메서드 레벨의 권한이 우선되고, 없으면 클래스 레벨의 권한을 확인합니다.
   * 
   * @param context 실행 컨텍스트
   * @returns 필요한 권한들의 배열
   */
  private getRequiredRoles(context: ExecutionContext): string[] | undefined {
    // getAllAndOverride는 메서드 레벨 -> 클래스 레벨 순으로 메타데이터를 찾습니다
    // 메서드에 @Roles()가 있으면 그것을 사용하고, 없으면 클래스의 @Roles()를 사용합니다
    return this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(), // 메서드 레벨 메타데이터
      context.getClass(),   // 클래스 레벨 메타데이터
    ]);
  }

  /**
   * 현재 요청을 보낸 사용자의 정보를 추출합니다.
   * 
   * JWT 가드가 이미 실행되어 request 객체에 사용자 정보를 설정해두었다고 가정합니다.
   * 이는 가드의 실행 순서가 중요한 이유입니다.
   * 
   * @param context 실행 컨텍스트
   * @returns 현재 사용자 정보
   */
  private getCurrentUser(context: ExecutionContext): any {
    const request = context.switchToHttp().getRequest();
    return request.user;
  }

  /**
   * 권한명들을 사용자 친화적인 형태로 포매팅합니다.
   * 
   * 에러 메시지를 더 읽기 쉽게 만들기 위한 헬퍼 메서드입니다.
   * ['admin', 'moderator'] -> '관리자 또는 모더레이터'
   * 
   * @param roles 권한명 배열
   * @returns 포매팅된 권한명 문자열
   */
  private formatRoleNames(roles: string[]): string {
    const roleNames = roles.map(role => this.formatRoleName(role));
    
    if (roleNames.length === 1) {
      return roleNames[0];
    }
    
    if (roleNames.length === 2) {
      return `${roleNames[0]} 또는 ${roleNames[1]}`;
    }
    
    const lastRole = roleNames.pop();
    return `${roleNames.join(', ')} 또는 ${lastRole}`;
  }

  /**
   * 단일 권한명을 한국어로 변환합니다.
   * 
   * 영어 권한명을 사용자가 이해하기 쉬운 한국어로 변환합니다.
   * 실무에서는 이런 변환 로직을 별도의 국제화(i18n) 시스템으로 처리하기도 합니다.
   * 
   * @param role 영어 권한명
   * @returns 한국어 권한명
   */
  private formatRoleName(role: string): string {
    const roleTranslations: Record<string, string> = {
      'admin': '관리자',
      'moderator': '운영자', 
      'user': '일반 사용자'
    };
    
    return roleTranslations[role] || role;
  }
}

/**
 * 사용 예시 및 가드 적용 방법:
 * 
 * 1. 전역 가드로 적용 (모든 엔드포인트에 자동 적용):
 * 
 * // main.ts에서
 * app.useGlobalGuards(new RolesGuard(app.get(Reflector)));
 * 
 * 
 * 2. 특정 컨트롤러에만 적용:
 * 
 * @Controller('products')
 * @UseGuards(JwtAuthGuard, RolesGuard)  // 순서가 중요함!
 * export class ProductsController {
 *   @Roles('admin')
 *   @Post()
 *   create() { ... }
 * }
 * 
 * 
 * 3. 메서드별로 다른 권한 적용:
 * 
 * @Controller('products')
 * export class ProductsController {
 *   @Roles('admin')
 *   @UseGuards(JwtAuthGuard, RolesGuard)
 *   @Post()
 *   create() { ... }
 * 
 *   @Roles('admin', 'moderator') 
 *   @UseGuards(JwtAuthGuard, RolesGuard)
 *   @Put(':id')
 *   update() { ... }
 * }
 * 
 * 
 * 중요한 주의사항:
 * 
 * 1. **가드 순서**: JWT 가드가 먼저 실행되어야 사용자 정보가 설정됩니다
 * 2. **메타데이터**: @Roles() 데코레이터 없으면 모든 사용자 허용
 * 3. **에러 처리**: 명확한 에러 메시지로 사용자 경험 향상
 * 4. **확장성**: 권한 계층이나 복잡한 권한 로직도 쉽게 추가 가능
 */
