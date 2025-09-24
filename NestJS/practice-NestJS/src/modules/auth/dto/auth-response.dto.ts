import { ApiProperty } from '@nestjs/swagger';

/**
 * 사용자 기본 정보 DTO입니다.
 * 
 * 이 클래스는 인증 후 클라이언트에게 전달되는 사용자 정보를 정의합니다.
 * 민감한 정보(비밀번호 등)는 제외하고 필요한 정보만 포함합니다.
 * 마치 신분증에서 공개 가능한 정보만 보여주는 것과 같습니다.
 */
export class UserInfoDto {
  @ApiProperty({
    description: '사용자 고유 ID',
    example: 1
  })
  id!: number;

  @ApiProperty({
    description: '사용자 이메일',
    example: 'user@example.com'
  })
  email!: string;

  @ApiProperty({
    description: '사용자 이름',
    example: '김철수'
  })
  name!: string;

  @ApiProperty({
    description: '사용자 역할',
    example: 'user',
    enum: ['user', 'moderator', 'admin']
  })
  role!: string;

  @ApiProperty({
    description: '계정 활성화 상태',
    example: true
  })
  isActive!: boolean;

  @ApiProperty({
    description: '이메일 인증 상태',
    example: true
  })
  isEmailVerified!: boolean;

  @ApiProperty({
    description: '계정 생성일',
    example: '2024-01-01T00:00:00.000Z'
  })
  createdAt!: Date;
}

/**
 * 인증 성공 응답 DTO입니다.
 * 
 * 로그인이나 토큰 갱신 성공 시 반환되는 데이터 구조를 정의합니다.
 * JWT 토큰과 사용자 정보를 함께 제공하여 클라이언트가
 * 한 번의 요청으로 필요한 모든 정보를 받을 수 있게 합니다.
 */
export class AuthResponseDto {
  @ApiProperty({
    description: 'JWT 액세스 토큰',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
  })
  accessToken!: string;

  @ApiProperty({
    description: '토큰 타입',
    example: 'Bearer',
    default: 'Bearer'
  })
  tokenType: string = 'Bearer';

  @ApiProperty({
    description: '토큰 만료 시간 (초)',
    example: 86400
  })
  expiresIn!: number;

  @ApiProperty({
    description: '인증된 사용자 정보',
    type: UserInfoDto
  })
  user!: UserInfoDto;

  @ApiProperty({
    description: '인증 성공 메시지',
    example: '로그인에 성공했습니다.'
  })
  message!: string;

  @ApiProperty({
    description: '응답 시간',
    example: '2024-01-01T12:00:00.000Z'
  })
  timestamp!: string;
}

/**
 * 회원가입 성공 응답 DTO입니다.
 * 
 * 회원가입 완료 후 반환되는 응답 구조입니다.
 * 보안상 즉시 로그인 상태로 만들지 않고,
 * 이메일 인증 등의 추가 단계를 거치도록 유도합니다.
 */
export class RegisterResponseDto {
  @ApiProperty({
    description: '회원가입 성공 메시지',
    example: '회원가입이 완료되었습니다. 이메일 인증을 진행해 주세요.'
  })
  message!: string;

  @ApiProperty({
    description: '생성된 사용자 정보',
    type: UserInfoDto
  })
  user!: UserInfoDto;

  @ApiProperty({
    description: '다음 단계 안내',
    example: '이메일로 전송된 인증 링크를 확인해 주세요.'
  })
  nextStep!: string;

  @ApiProperty({
    description: '응답 시간',
    example: '2024-01-01T12:00:00.000Z'
  })
  timestamp!: string;
}

/**
 * 토큰 갱신 요청 DTO입니다.
 * 
 * 액세스 토큰이 만료되었을 때 리프레시 토큰을 사용해
 * 새로운 액세스 토큰을 발급받기 위한 DTO입니다.
 */
export class RefreshTokenDto {
  @ApiProperty({
    description: '리프레시 토큰',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
  })
  refreshToken!: string;
}

/**
 * 로그아웃 응답 DTO입니다.
 * 
 * 로그아웃 완료 후 클라이언트에게 전달하는 응답 구조입니다.
 * 단순해 보이지만 클라이언트가 적절한 후속 조치를 취할 수 있도록
 * 필요한 정보를 제공합니다.
 */
export class LogoutResponseDto {
  @ApiProperty({
    description: '로그아웃 성공 메시지',
    example: '성공적으로 로그아웃되었습니다.'
  })
  message!: string;

  @ApiProperty({
    description: '응답 시간',
    example: '2024-01-01T12:00:00.000Z'
  })
  timestamp!: string;
}
