import { 
  IsEmail, 
  IsString, 
  MinLength, 
  MaxLength, 
  IsNotEmpty,
  Matches,
  IsOptional
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * 회원가입 요청 DTO입니다.
 * 
 * 이 클래스는 마치 회원가입 신청서와 같습니다.
 * 새로운 사용자가 계정을 만들 때 필요한 모든 정보를 체계적으로 관리하고,
 * 각 정보가 올바른 형식인지 꼼꼼히 검증합니다.
 * 
 * 회원가입은 로그인보다 더 엄격한 검증이 필요하므로
 * 더 다양한 유효성 검사 규칙들이 적용됩니다.
 */
export class RegisterDto {
  /**
   * 사용자 이메일 주소입니다.
   * 
   * 중복 체크는 서비스 레이어에서 수행하며,
   * 여기서는 형식 검증만 담당합니다.
   */
  @ApiProperty({
    description: '사용자 이메일 주소 (중복 불가)',
    example: 'newuser@example.com',
    format: 'email',
    uniqueItems: true
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
   * 
   * 한글, 영문, 공백을 허용하며 적절한 길이 제한을 둡니다.
   * 특수문자나 숫자는 일반적으로 이름에 사용되지 않으므로 제외합니다.
   */
  @ApiProperty({
    description: '사용자 실명',
    example: '김철수',
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
   * 
   * 보안을 위해 복잡성 요구사항을 적용합니다:
   * - 최소 8자 이상
   * - 영문 대소문자, 숫자, 특수문자 조합
   * 이는 일반적인 보안 정책에 따른 것입니다.
   */
  @ApiProperty({
    description: '비밀번호 (영문 대소문자, 숫자, 특수문자 조합 8자 이상)',
    example: 'MySecure123!',
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
   * 비밀번호 확인 필드입니다.
   * 
   * 사용자가 비밀번호를 정확히 입력했는지 확인하기 위한 필드입니다.
   * 실제 비밀번호와 일치하는지는 커스텀 검증 로직에서 확인합니다.
   */
  @ApiProperty({
    description: '비밀번호 확인',
    example: 'MySecure123!',
    format: 'password'
  })
  @IsString({ 
    message: '비밀번호 확인은 문자열이어야 합니다.' 
  })
  @IsNotEmpty({ 
    message: '비밀번호 확인은 필수 입력 항목입니다.' 
  })
  passwordConfirm: string;

  /**
   * 사용자 역할입니다.
   * 
   * 선택사항이며, 지정하지 않으면 기본값인 'user'가 적용됩니다.
   * 보안상 'admin' 역할은 일반 회원가입으로는 설정할 수 없고,
   * 별도의 관리자 권한이 필요합니다.
   */
  @ApiPropertyOptional({
    description: '사용자 역할 (기본값: user)',
    example: 'user',
    enum: ['user', 'moderator'],
    default: 'user'
  })
  @IsOptional()
  @Matches(/^(user|moderator)$/, {
    message: '역할은 user 또는 moderator만 선택 가능합니다.'
  })
  role?: 'user' | 'moderator' = 'user';
}
