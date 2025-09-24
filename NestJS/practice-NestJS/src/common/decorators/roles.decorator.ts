import { SetMetadata } from '@nestjs/common';

/**
 * 역할 기반 접근 제어(RBAC)를 위한 Roles 데코레이터입니다.
 * 
 * 이 데코레이터는 마치 건물의 출입 통제 카드와 같은 역할을 합니다.
 * 특정 권한을 가진 사용자만 접근할 수 있는 엔드포인트에 부착하여
 * 자동으로 권한을 체크할 수 있게 해줍니다.
 * 
 * 왜 이런 방식이 좋은가?
 * 
 * 1. **코드 중복 제거**: 각 컨트롤러에서 반복되던 권한 체크 로직 제거
 * 2. **선언적 보안**: 메서드 위에 데코레이터만 추가하면 보안 적용
 * 3. **가독성 향상**: 코드를 보는 사람이 즉시 필요 권한을 파악 가능
 * 4. **일관성 보장**: 모든 권한 체크가 동일한 방식으로 처리됨
 * 5. **유지보수 용이**: 권한 체크 로직 변경 시 한 곳만 수정하면 됨
 * 
 * Spring Security의 @PreAuthorize("hasRole('ADMIN')")와 유사한 개념입니다.
 * 하지만 NestJS에서는 가드(Guard)와 데코레이터를 조합하여 더 유연하게 구현할 수 있습니다.
 * 
 * 사용 예시:
 * 
 * @Controller('admin')
 * export class AdminController {
 *   @Roles('admin')  // 관리자만 접근 가능
 *   @Post('products')
 *   createProduct() { ... }
 * 
 *   @Roles('admin', 'moderator')  // 관리자 또는 모더레이터만 접근 가능
 *   @Put('products/:id') 
 *   updateProduct() { ... }
 * 
 *   @Roles('user')  // 일반 사용자도 접근 가능
 *   @Get('profile')
 *   getProfile() { ... }
 * }
 * 
 * 내부 동작 원리:
 * 1. @Roles() 데코레이터가 메타데이터에 필요 권한들을 저장
 * 2. RolesGuard가 실행되면서 메타데이터에서 필요 권한 확인
 * 3. 현재 사용자의 권한과 비교하여 접근 허용/차단 결정
 * 4. 권한이 부족하면 403 Forbidden 에러 반환
 */

/**
 * ROLES_KEY는 메타데이터의 키값입니다.
 * 
 * 이 상수를 별도로 정의하는 이유는 타입 안전성과 일관성을 보장하기 위해서입니다.
 * 데코레이터와 가드에서 동일한 키를 사용해야 하므로, 
 * 문자열을 하드코딩하는 대신 상수를 사용합니다.
 * 
 * 이렇게 하면:
 * - 오타로 인한 버그 방지
 * - IDE의 자동 완성 및 리팩토링 지원
 * - 키 이름 변경 시 한 곳만 수정하면 됨
 */
export const ROLES_KEY = 'roles';

/**
 * Roles 데코레이터 함수입니다.
 * 
 * 이 함수는 가변 인수(rest parameters)를 받아서 
 * 여러 역할을 동시에 허용할 수 있게 해줍니다.
 * 
 * @param roles 접근을 허용할 사용자 역할들
 * @returns 메타데이터 데코레이터
 * 
 * 예시:
 * - @Roles('admin')                    // 관리자만
 * - @Roles('admin', 'moderator')       // 관리자 또는 모더레이터
 * - @Roles('user', 'admin')            // 일반 사용자 또는 관리자
 * 
 * 내부적으로는 SetMetadata를 사용하여 메타데이터를 설정합니다.
 * 이 메타데이터는 나중에 RolesGuard에서 Reflector를 통해 읽혀집니다.
 * 
 * TypeScript의 rest parameters 문법(...roles)을 사용하여
 * 유연하게 여러 역할을 받을 수 있도록 구현했습니다.
 */
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);

/**
 * 역할별 권한 상수들입니다.
 * 
 * 하드코딩된 문자열 대신 상수를 사용하여 타입 안전성을 높입니다.
 * 이렇게 하면 오타나 대소문자 실수를 방지할 수 있고,
 * 권한명이 변경될 때도 한 곳만 수정하면 됩니다.
 * 
 * 실무에서는 이런 권한 상수들을 별도의 constants 파일이나
 * enum으로 관리하기도 합니다.
 */
export const USER_ROLES = {
  ADMIN: 'admin',
  MODERATOR: 'moderator', 
  USER: 'user'
} as const;

/**
 * 권한 계층 구조를 정의합니다.
 * 
 * 일반적으로 권한에는 계층이 있습니다:
 * - admin: 모든 권한
 * - moderator: 일반 사용자보다 많은 권한
 * - user: 기본 권한
 * 
 * 이 정보는 나중에 더 복잡한 권한 체크가 필요할 때 사용할 수 있습니다.
 * 예를 들어, admin은 자동으로 moderator와 user 권한도 가진다고 
 * 설정할 수 있습니다.
 */
export const ROLE_HIERARCHY: Record<string, string[]> = {
  [USER_ROLES.ADMIN]: [USER_ROLES.ADMIN, USER_ROLES.MODERATOR, USER_ROLES.USER],
  [USER_ROLES.MODERATOR]: [USER_ROLES.MODERATOR, USER_ROLES.USER],
  [USER_ROLES.USER]: [USER_ROLES.USER]
};

/**
 * 사용자가 특정 권한을 가지고 있는지 확인하는 헬퍼 함수입니다.
 * 
 * 권한 계층을 고려하여 체크합니다.
 * 예를 들어, admin 사용자는 user 권한도 자동으로 가지게 됩니다.
 * 
 * @param userRole 사용자의 현재 역할
 * @param requiredRole 필요한 역할
 * @returns 권한 보유 여부
 */
export function hasRole(userRole: string, requiredRole: string): boolean {
  const userPermissions = ROLE_HIERARCHY[userRole] || [userRole];
  return userPermissions.includes(requiredRole);
}

/**
 * 사용자가 여러 권한 중 하나라도 가지고 있는지 확인하는 헬퍼 함수입니다.
 * 
 * @Roles('admin', 'moderator') 같이 여러 권한이 허용된 경우,
 * 그 중 하나라도 만족하면 접근을 허용합니다.
 * 
 * @param userRole 사용자의 현재 역할
 * @param requiredRoles 필요한 역할들
 * @returns 권한 보유 여부
 */
export function hasAnyRole(userRole: string, requiredRoles: string[]): boolean {
  return requiredRoles.some(requiredRole => hasRole(userRole, requiredRole));
}
