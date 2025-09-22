package com.company.javafxdemo.config;

import com.company.javafxdemo.model.User;
import com.company.javafxdemo.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

/**
 * 샘플 데이터 초기화 클래스
 * 
 * 실무에서 이런 클래스가 필요한 이유:
 * 1. 데모 목적: 사용자가 애플리케이션을 처음 실행했을 때 빈 화면이 아닌 샘플 데이터가 있어야 기능을 바로 확인할 수 있습니다
 * 2. 개발 편의성: 개발자가 매번 테스트 데이터를 수동으로 입력할 필요가 없습니다
 * 3. QA 테스트: 품질 보증팀이 다양한 시나리오를 테스트할 수 있는 기본 데이터를 제공합니다
 * 
 * 기존 코드와의 차이점:
 * 원래 코드에서는 이런 초기화 로직이 없어서 사용자가 직접 데이터를 입력해야 했습니다.
 * 실무에서는 사용자 경험을 고려하여 이런 세심한 부분까지 신경써야 합니다.
 * 
 * 이는 마치 새로운 스마트폰을 샀을 때 기본 앱들과 샘플 사진들이 
 * 미리 설치되어 있어서 바로 사용해볼 수 있는 것과 같은 원리입니다.
 * 
 * @author JavaFX Demo Team
 * @version 1.0
 */
@Component
@RequiredArgsConstructor
@Slf4j
@ConditionalOnProperty(
    name = "app.data.load-sample-data", 
    havingValue = "true", 
    matchIfMissing = false
)
public class SampleDataInitializer implements ApplicationRunner {

    private final UserRepository userRepository;

    /**
     * 애플리케이션 시작 후 실행되는 메서드
     * 
     * ApplicationRunner 인터페이스를 구현하면 Spring Boot가 
     * 애플리케이션 시작 완료 후 이 메서드를 자동으로 호출합니다.
     * 
     * @param args 애플리케이션 실행 인수
     * @throws Exception 초기화 중 발생할 수 있는 예외
     */
    @Override
    public void run(ApplicationArguments args) throws Exception {
        log.info("샘플 데이터 초기화를 시작합니다...");
        
        try {
            // 이미 데이터가 있는지 확인
            long existingUserCount = userRepository.count();
            if (existingUserCount > 0) {
                log.info("이미 {}명의 사용자가 존재합니다. 샘플 데이터 초기화를 건너뜁니다.", existingUserCount);
                return;
            }
            
            // 샘플 사용자 데이터 생성
            createSampleUsers();
            
            log.info("샘플 데이터 초기화가 완료되었습니다.");
            
        } catch (Exception e) {
            log.error("샘플 데이터 초기화 중 오류가 발생했습니다", e);
            // 샘플 데이터 초기화 실패가 애플리케이션 시작을 막지 않도록 예외를 다시 던지지 않습니다
        }
    }

    /**
     * 샘플 사용자 데이터 생성
     * 
     * 다양한 시나리오를 테스트할 수 있도록 여러 유형의 사용자를 생성합니다:
     * - 다양한 부서의 사용자들
     * - 전화번호가 있는 사용자와 없는 사용자
     * - 다양한 이메일 도메인
     */
    private void createSampleUsers() {
        log.debug("샘플 사용자 데이터를 생성합니다...");
        
        // 개발팀 사용자들
        User developer1 = User.builder()
                .name("김개발")
                .email("kim.dev@company.com")
                .phone("010-1234-5678")
                .department("개발팀")
                .build();
        
        User developer2 = User.builder()
                .name("이코드")
                .email("lee.code@company.com")
                .phone("010-2345-6789")
                .department("개발팀")
                .build();
        
        User developer3 = User.builder()
                .name("박프로그래머")
                .email("park.programmer@company.com")
                .department("개발팀") // 전화번호 없는 케이스
                .build();
        
        // 디자인팀 사용자들
        User designer1 = User.builder()
                .name("최디자인")
                .email("choi.design@company.com")
                .phone("010-3456-7890")
                .department("디자인팀")
                .build();
        
        User designer2 = User.builder()
                .name("정크리에이티브")
                .email("jung.creative@company.com")
                .phone("010-4567-8901")
                .department("디자인팀")
                .build();
        
        // 기획팀 사용자들
        User planner1 = User.builder()
                .name("홍기획")
                .email("hong.plan@company.com")
                .phone("010-5678-9012")
                .department("기획팀")
                .build();
        
        User planner2 = User.builder()
                .name("강전략")
                .email("kang.strategy@company.com")
                .department("기획팀") // 전화번호 없는 케이스
                .build();
        
        // 마케팅팀 사용자
        User marketer = User.builder()
                .name("윤마케팅")
                .email("yoon.marketing@company.com")
                .phone("010-6789-0123")
                .department("마케팅팀")
                .build();
        
        // 인사팀 사용자
        User hr = User.builder()
                .name("송인사")
                .email("song.hr@company.com")
                .phone("010-7890-1234")
                .department("인사팀")
                .build();
        
        // 외부 이메일을 사용하는 사용자 (프리랜서나 외부 협력사)
        User external = User.builder()
                .name("외부협력자")
                .email("external@freelancer.com")
                .phone("010-8901-2345")
                .department("외부협력")
                .build();
        
        // 모든 사용자를 데이터베이스에 저장
        User[] sampleUsers = {
            developer1, developer2, developer3,
            designer1, designer2,
            planner1, planner2,
            marketer, hr, external
        };
        
        for (User user : sampleUsers) {
            try {
                User savedUser = userRepository.save(user);
                log.debug("샘플 사용자 생성됨: {} ({})", savedUser.getName(), savedUser.getEmail());
            } catch (Exception e) {
                log.warn("사용자 생성 실패: {} - {}", user.getEmail(), e.getMessage());
            }
        }
        
        log.info("총 {}명의 샘플 사용자가 생성되었습니다.", sampleUsers.length);
    }
}

/*
============================================================================
실무에서 데이터 초기화 클래스 작성 시 고려사항들
============================================================================

1. 조건부 실행:
   @ConditionalOnProperty를 사용하여 설정으로 켜고 끌 수 있도록 합니다.
   프로덕션 환경에서는 샘플 데이터가 필요하지 않기 때문입니다.

2. 중복 방지:
   이미 데이터가 있는지 확인하고, 있다면 초기화를 건너뜁니다.
   여러 번 실행해도 안전하도록 설계합니다.

3. 예외 처리:
   샘플 데이터 초기화 실패가 애플리케이션 시작을 막지 않도록 합니다.
   로그만 남기고 계속 진행하는 것이 좋습니다.

4. 다양성 고려:
   다양한 테스트 시나리오를 커버할 수 있도록 여러 유형의 데이터를 생성합니다.
   - 필수 필드만 있는 데이터
   - 모든 필드가 있는 데이터
   - 경계값 테스트용 데이터

5. 실제 운영 데이터와 구분:
   샘플 데이터임을 명확히 알 수 있도록 이름이나 이메일에 표시합니다.
   실제 사용자와 혼동되지 않도록 주의합니다.

6. 성능 고려:
   대량의 데이터를 생성할 때는 배치 처리를 고려합니다.
   애플리케이션 시작 시간이 너무 길어지지 않도록 주의합니다.

이런 세심한 배려가 사용자 경험과 개발 효율성을 크게 향상시킵니다.
마치 새로운 소프트웨어를 설치했을 때 튜토리얼이나 샘플이 준비되어 있어서
바로 사용법을 익힐 수 있는 것과 같은 효과를 제공합니다.
*/
