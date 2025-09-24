// NestJS 프로젝트가 아니라면 아래 줄을 주석 처리하고 Error를 사용하세요.
import { BadRequestException } from "@nestjs/common";

// --- 1. 유효성 검사 규칙을 정의하는 파라미터 데코레이터들 ---

/**
 * 문자열의 길이를 검사하는 @MinLength 데코레이터
 */
function MinLength(min: number, max: number) {
    return function (target: any, propertyKey: string, parameterIndex: number) {
        // 클래스의 프로토타입에 validators 객체가 없으면 초기화
        if (!target.validators) {
            target.validators = {};
        }
        // 현재 메서드(propertyKey)에 대한 규칙 배열이 없으면 초기화
        if (!target.validators[propertyKey]) {
            target.validators[propertyKey] = [];
        }
        // 기존 규칙을 덮어쓰지 않고, 배열에 새로운 규칙 함수를 push
        target.validators[propertyKey].push(function (args: any[]) {
            const value = args[parameterIndex];
            // 유효성 검사 로직: value가 문자열이고, 길이를 만족하는지 확인
            return typeof value === 'string' && value.length >= min && value.length <= max;
        });
    }
}

/**
 * 이메일 형식을 검사하는 @IsEmail 데코레이터
 */
function IsEmail() {
    return function (target: any, propertyKey: string, parameterIndex: number) {
        if (!target.validators) {
            target.validators = {};
        }
        if (!target.validators[propertyKey]) {
            target.validators[propertyKey] = [];
        }
        // IsEmail 규칙을 동일한 배열에 push
        target.validators[propertyKey].push(function (args: any[]) {
            const value = args[parameterIndex];
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            // 유효성 검사 로직: value가 문자열이고, 이메일 형식을 만족하는지 확인
            return typeof value === 'string' && emailRegex.test(value);
        });
    }
}

// --- 2. 규칙을 실행하는 메서드 데코레이터 ---

/**
 * 메서드 실행 전에 모든 유효성 검사를 수행하는 @Validate 데코레이터
 */
function Validate(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = function(...args: any[]) {
        // 현재 메서드에 해당하는 유효성 검사 규칙 배열을 가져옴
        const validators = target.validators?.[propertyKey];

        if (validators) {
            // 배열에 담긴 모든 유효성 검사 함수를 순회하며 실행
            for (const validator of validators) {
                if (!validator(args)) {
                    // 유효성 검사 실패 시 에러 발생
                    throw new BadRequestException(`Validation failed for method '${propertyKey}'`);
                    // throw new Error(`Validation failed for method '${propertyKey}'`);
                }
            }
        }
        // 모든 검사를 통과하면 원본 메서드 실행
        return originalMethod.apply(this, args);
    }
}


// --- 3. 실제 사용 예시 ---

class UserService {
    private users = new Map<string, { email: string; age: number }>();

    @Validate
    updateProfile(
        @MinLength(3, 15) name: string, // 0번째 파라미터 규칙
        @IsEmail() email: string,       // 1번째 파라미터 규칙
        age: number                      // 규칙 없음 (검사 안 함)
    ) {
        console.log(`✅ [SUCCESS] Profile updated for ${name} (${email}), age ${age}.`);
        this.users.set(name, { email, age });
    }
}

// --- 4. 테스트 ---
const userService = new UserService();

console.log("1. 정상 호출:");
userService.updateProfile("John Doe", "john.doe@example.com", 35);

console.log("\n2. 이름 길이 위반:");
try {
    userService.updateProfile("Jo", "jo@example.com", 25);
} catch (e) {
    console.error(`❌ [ERROR] ${e.message}`);
}

console.log("\n3. 이메일 형식 위반:");
try {
    userService.updateProfile("Jane Doe", "jane.doe@", 40);
} catch (e) {
    console.error(`❌ [ERROR] ${e.message}`);
}