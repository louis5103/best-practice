import { 
  IsEmail, 
  IsString, 
  MinLength, 
  MaxLength, 
  IsNotEmpty,
  Matches,
  IsOptional,
  IsBoolean
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * 사용자 생성 DTO입니다.
 * 
 * 이 DTO는 관리자가 새로운 사용자를 생성할 때 사용됩니다.
 * 일반적인 회원가입과는 달리, 관리자 권한으로 사용자를 직접 생성하는 경우에 활용됩니다.
 * 
 * RegisterDto와 비슷하지만, 관리 목적에 맞게 일부 필드가 추가되거나 변경되었습니다.
 */
export class CreateUserDto {
  /**
   * 사용자 이메일 주소입니다.
   * 로그인 ID로 사용되며 중복될 수 없습니다.
   */
  @ApiProperty({
    description: '사용자 이메일 주소',
    example: 'admin-created-user@example.com',
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
   * 사용자의 실제 이름입니다.
   */
  @ApiProperty({
    description: '사용자 실명',
    example: '관리자생성사용자',
    minLength: 2,
    maxLength: 50
  })
  @IsString({ 
    message: '이름은 문자열이어야 합니다.' 
  })
  @MinLength(2, { 
    message: '이름은 최소 2자 이상이어야 합니다.' 
  })
  @MaxLength(50, { 
    message: '이름은 최대 50자까지 가능합니다.' 
  })
  @Matches(/^[가-힣a-zA-Z\s]+$/, {
    message: '이름은 한글, 영문, 공백만 사용 가능합니다.'
  })
  @IsNotEmpty({ 
    message: '이름은 필수 입력 항목입니다.' 
  })
  name: string;

  /**
   * 사용자 비밀번호입니다.
   * 관리자가 생성하는 경우 임시 비밀번호를 설정할 수 있습니다.
   */
  @ApiProperty({
    description: '사용자 비밀번호',
    example: 'TempPassword123!',
    minLength: 8,
    maxLength: 128,
    format: 'password'
  })
  @IsString({ 
    message: '비밀번호는 문자열이어야 합니다.' 
  })
  @MinLength(8, { 
    message: '비밀번호는 최소 8자 이상이어야 합니다.' 
  })
  @MaxLength(128, { 
    message: '비밀번호는 최대 128자까지 가능합니다.' 
  })
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
    {
      message: '비밀번호는 영문 대소문자, 숫자, 특수문자를 각각 1개 이상 포함해야 합니다.'
    }
  )
  @IsNotEmpty({ 
    message: '비밀번호는 필수 입력 항목입니다.' 
  })
  password: string;

  /**
   * 사용자 역할입니다.
   * 관리자는 다른 사용자의 역할을 자유롭게 설정할 수 있습니다.
   */
  @ApiPropertyOptional({
    description: '사용자 역할',
    example: 'user',
    enum: ['user', 'moderator', 'admin'],
    default: 'user'
  })
  @IsOptional()
  @Matches(/^(user|moderator|admin)$/, {
    message: '역할은 user, moderator, admin 중 하나여야 합니다.'
  })
  role?: 'user' | 'moderator' | 'admin' = 'user';

  /**
   * 계정 활성화 상태입니다.
   * 관리자가 처음부터 비활성화된 계정을 생성할 수도 있습니다.
   */
  @ApiPropertyOptional({
    description: '계정 활성화 상태',
    example: true,
    default: true
  })
  @IsOptional()
  @IsBoolean({
    message: '활성화 상태는 true 또는 false여야 합니다.'
  })
  isActive?: boolean = true;

  /**
   * 이메일 인증 상태입니다.
   * 관리자가 생성하는 경우 인증을 건너뛸 수 있습니다.
   */
  @ApiPropertyOptional({
    description: '이메일 인증 완료 여부',
    example: false,
    default: false
  })
  @IsOptional()
  @IsBoolean({
    message: '이메일 인증 상태는 true 또는 false여야 합니다.'
  })
  isEmailVerified?: boolean = false;
}
