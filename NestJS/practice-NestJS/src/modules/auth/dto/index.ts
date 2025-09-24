/**
 * Auth 모듈의 모든 DTO를 한 곳에서 export하는 배럴 파일입니다.
 * 
 * 이 파일은 마치 쇼핑몰의 종합 안내소와 같은 역할을 합니다.
 * 다른 파일에서 DTO를 import할 때 각각의 파일 경로를 기억할 필요 없이
 * 이 한 곳에서 모든 DTO를 가져올 수 있게 해줍니다.
 * 
 * 사용 예시:
 * import { LoginDto, RegisterDto, AuthResponseDto } from './dto';
 * 
 * 이렇게 하면 코드가 더 깔끔해지고 관리하기 쉬워집니다.
 */

// 요청 DTO들
export { LoginDto } from './login.dto';
export { RegisterDto } from './register.dto';
export { RefreshTokenDto } from './auth-response.dto';

// 응답 DTO들
export { 
  AuthResponseDto, 
  RegisterResponseDto, 
  LogoutResponseDto,
  UserInfoDto 
} from './auth-response.dto';
