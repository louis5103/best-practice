import { SetMetadata } from '@nestjs/common';

/**
 * Public 데코레이터 - 인증이 필요하지 않은 엔드포인트를 표시합니다.
 * 
 * 이 데코레이터는 마치 공원의 "자유출입" 표지판과 같은 역할을 합니다.
 * 일반적으로 모든 엔드포인트에 JWT 가드가 적용되어 인증이 필요하지만,
 * 이 데코레이터가 붙은 엔드포인트는 누구나 자유롭게 접근할 수 있습니다.
 * 
 * 주로 다음과 같은 경우에 사용됩니다:
 * - 로그인/회원가입 엔드포인트
 * - 공개 정보 조회 API
 * - 헬스체크 엔드포인트
 * - 비회원도 볼 수 있는 콘텐츠
 * 
 * 사용 예시:
 * @Public()
 * @Post('login')
 * async login(@Body() loginDto: LoginDto) {
 *   return this.authService.login(loginDto);
 * }
 */
export const IS_PUBLIC_KEY = 'isPublic';

/**
 * 메타데이터를 설정하여 해당 엔드포인트가 공개임을 표시합니다.
 * 
 * SetMetadata는 NestJS의 리플렉션 시스템을 활용하여 
 * 런타임에 메타데이터를 저장하고 읽을 수 있게 해줍니다.
 * 이는 마치 책갈피에 특별한 표시를 해두는 것과 같아서,
 * 나중에 JWT 가드에서 이 표시를 확인해서 인증을 건너뛸 수 있습니다.
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
