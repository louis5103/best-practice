import { SetMetadata } from '@nestjs/common';

/**
 * Public 데코레이터입니다.
 * 
 * 이 데코레이터는 마치 건물의 공개 구역을 표시하는 표지판과 같은 역할을 합니다.
 * JWT 인증이 필요한 애플리케이션에서도 일부 엔드포인트는 누구나 접근할 수 있어야 합니다.
 * 예를 들어 로그인 페이지, 회원가입 페이지, 상품 목록 조회 같은 기능들이 해당합니다.
 * 
 * Spring Security의 permitAll()과 유사한 개념으로 생각하시면 됩니다.
 * Spring에서는 WebSecurityConfigurerAdapter에서 특정 경로를 허용하지만,
 * NestJS에서는 데코레이터를 사용해 개별 엔드포인트에 직접 표시할 수 있습니다.
 * 
 * 예시 사용법:
 * 
 * @Controller('auth')
 * export class AuthController {
 *   @Public()  // 이 엔드포인트는 인증이 필요하지 않습니다
 *   @Post('login')
 *   login(@Body() loginDto: LoginDto) {
 *     // 로그인 로직
 *   }
 * }
 * 
 * 내부 작동 원리:
 * 1. @Public() 데코레이터가 적용된 메서드에는 'isPublic' 메타데이터가 true로 설정됩니다
 * 2. JWT Guard가 요청을 처리할 때 이 메타데이터를 확인합니다
 * 3. 'isPublic'이 true인 경우 JWT 토큰 검증을 건너뜁니다
 * 4. 그렇지 않은 경우 정상적인 JWT 인증을 수행합니다
 * 
 * 이런 방식의 장점은 각 엔드포인트마다 명시적으로 공개/비공개를 표시할 수 있어서
 * 코드를 읽는 사람이 즉시 해당 엔드포인트의 접근 권한을 이해할 수 있다는 것입니다.
 */

/**
 * IS_PUBLIC_KEY는 메타데이터의 키값입니다.
 * 
 * 이 상수를 별도로 정의하는 이유는 타입 안전성과 유지보수성 때문입니다.
 * 문자열을 여러 곳에서 반복 사용하면 오타로 인한 버그가 발생할 수 있으므로,
 * 상수로 정의해서 한 곳에서 관리하는 것이 베스트 프랙티스입니다.
 */
export const IS_PUBLIC_KEY = 'isPublic';

/**
 * Public 데코레이터 함수입니다.
 * 
 * SetMetadata는 NestJS가 제공하는 메타데이터 설정 함수입니다.
 * 데코레이터가 적용된 메서드에 특정 메타데이터를 첨부하는 역할을 합니다.
 * 
 * 이 경우 IS_PUBLIC_KEY('isPublic')라는 키에 true 값을 설정합니다.
 * 나중에 JWT Guard에서 Reflector를 사용해서 이 메타데이터를 읽을 수 있습니다.
 * 
 * TypeScript 데코레이터 문법에 의해 이 함수는 실행 시점에 호출되어
 * 메서드나 클래스에 메타데이터를 첨부하게 됩니다.
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
