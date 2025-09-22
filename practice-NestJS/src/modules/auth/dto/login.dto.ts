import { IsEmail, IsString, MinLength, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * 로그인 요청 DTO입니다.
 * 
 * 이 클래스는 마치 은행에서 고객이 작성하는 입금표와 같습니다.
 * 필수 정보들이 정확한 형식으로 입력되었는지 자동으로 확인하고,
 * 문제가 있다면 친절한 에러 메시지를 제공합니다.
 * 
 * class-validator의 데코레이터들은 각각 다음과 같은 역할을 합니다:
 * - @IsEmail(): 이메일 형식 검증
 * - @IsString(): 문자열 타입 검증
 * - @MinLength(): 최소 길이 검증
 * - @IsNotEmpty(): 빈 값 방지
 */
export class LoginDto {
  /**
   * 사용자 이메일 주소입니다.
   * 
   * 로그인 시 사용자 식별을 위해 사용됩니다.
   * 반드시 유효한 이메일 형식이어야 합니다.
   */
  @ApiProperty({
    description: '사용자 이메일 주소',
    example: 'user@example.com',
    format: 'email'
  })
  @IsEmail({}, { 
    message: '올바른 이메일 형식을 입력해주세요.' 
  })
  @IsNotEmpty({ 
    message: '이메일은 필수 입력 항목입니다.' 
  })
  email: string;

  /**
   * 사용자 비밀번호입니다.
   * 
   * 보안을 위해 최소 8자 이상이어야 하며,
   * API 문서에서는 실제 값이 노출되지 않도록 처리됩니다.
   */
  @ApiProperty({
    description: '사용자 비밀번호',
    example: 'mySecretPassword123',
    minLength: 8,
    format: 'password'
  })
  @IsString({ 
    message: '비밀번호는 문자열이어야 합니다.' 
  })
  @MinLength(8, { 
    message: '비밀번호는 최소 8자 이상이어야 합니다.' 
  })
  @IsNotEmpty({ 
    message: '비밀번호는 필수 입력 항목입니다.' 
  })
  password: string;
}
