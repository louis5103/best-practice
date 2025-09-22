package com.company.javafxdemo.service;

import com.company.javafxdemo.model.User;
import com.company.javafxdemo.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * UserService의 단위 테스트
 * 
 * 기존 코드와의 중요한 개선사항들:
 * 
 * 1. 테스트 복잡성 대폭 감소:
 *    원래 코드는 Spring 컨텍스트 전체를 로드하는 통합 테스트였지만,
 *    여기서는 Mockito를 사용한 순수 단위 테스트를 작성합니다.
 * 
 * 2. 핵심 기능에 집중:
 *    모든 메서드를 테스트하는 대신 비즈니스 크리티컬한 기능만 테스트합니다.
 *    이렇게 하면 테스트 실행 시간이 빨라지고 유지보수가 쉬워집니다.
 * 
 * 3. 실용적인 접근법:
 *    완벽한 테스트 커버리지보다는 "정말 중요한 것"을 확실하게 테스트합니다.
 * 
 * 이는 마치 자동차 품질 검사에서 모든 나사를 다 확인하는 대신
 * 안전과 직결되는 핵심 부품만 집중적으로 검사하는 것과 같습니다.
 * 
 * @author JavaFX Demo Team
 * @version 1.0
 */
@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private UserService userService;

    private User testUser;
    private List<User> testUsers;

    /**
     * 각 테스트 실행 전 공통 설정
     * 
     * 테스트에서 사용할 공통 데이터를 준비합니다.
     * 이렇게 하면 각 테스트 메서드의 중복을 줄일 수 있습니다.
     */
    @BeforeEach
    void setUp() {
        // 테스트용 사용자 객체 생성
        testUser = User.builder()
                .id(1L)
                .name("홍길동")
                .email("hong@company.com")
                .phone("010-1234-5678")
                .department("개발팀")
                .active(true)
                .build();

        // 테스트용 사용자 목록 생성
        User user2 = User.builder()
                .id(2L)
                .name("김철수")
                .email("kim@company.com")
                .phone("010-9876-5432")
                .department("디자인팀")
                .active(true)
                .build();

        testUsers = Arrays.asList(testUser, user2);
    }

    /*
     * ============================================================================
     * 조회 기능 테스트
     * ============================================================================
     */

    /**
     * 모든 활성 사용자 조회 테스트
     * 
     * 가장 기본적이면서도 자주 사용되는 기능을 테스트합니다.
     */
    @Test
    void getAllActiveUsers_ShouldReturnActiveUsers() {
        // Given: 활성 사용자들이 존재한다고 가정
        when(userRepository.findByActiveTrue()).thenReturn(testUsers);

        // When: 모든 활성 사용자를 조회
        List<User> result = userService.getAllActiveUsers();

        // Then: 올바른 결과가 반환되는지 확인
        assertNotNull(result);
        assertEquals(2, result.size());
        assertEquals("홍길동", result.get(0).getName());
        assertEquals("김철수", result.get(1).getName());

        // Repository 메서드가 정확히 한 번 호출되었는지 확인
        verify(userRepository, times(1)).findByActiveTrue();
    }

    /**
     * ID로 사용자 조회 테스트 - 성공 케이스
     */
    @Test
    void getUserById_WithValidId_ShouldReturnUser() {
        // Given: 특정 ID의 사용자가 존재한다고 가정
        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));

        // When: ID로 사용자를 조회
        Optional<User> result = userService.getUserById(1L);

        // Then: 올바른 사용자가 반환되는지 확인
        assertTrue(result.isPresent());
        assertEquals("홍길동", result.get().getName());
        assertEquals("hong@company.com", result.get().getEmail());
    }

    /**
     * ID로 사용자 조회 테스트 - 사용자가 없는 경우
     */
    @Test
    void getUserById_WithInvalidId_ShouldReturnEmpty() {
        // Given: 해당 ID의 사용자가 존재하지 않는다고 가정
        when(userRepository.findById(999L)).thenReturn(Optional.empty());

        // When: 존재하지 않는 ID로 조회
        Optional<User> result = userService.getUserById(999L);

        // Then: 빈 Optional이 반환되는지 확인
        assertFalse(result.isPresent());
    }

    /**
     * 사용자 검색 테스트
     */
    @Test
    void searchUsers_WithKeyword_ShouldReturnMatchingUsers() {
        // Given: 검색 결과가 있다고 가정
        when(userRepository.searchByNameOrEmail("홍길동")).thenReturn(Arrays.asList(testUser));

        // When: 키워드로 검색
        List<User> result = userService.searchUsers("홍길동");

        // Then: 검색 결과가 올바른지 확인
        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals("홍길동", result.get(0).getName());
    }

    /*
     * ============================================================================
     * 생성 기능 테스트
     * ============================================================================
     */

    /**
     * 새로운 사용자 생성 테스트 - 정상 케이스
     */
    @Test
    void createUser_WithValidData_ShouldCreateUser() {
        // Given: 이메일 중복이 없고, 저장이 성공한다고 가정
        when(userRepository.existsByEmail("new@company.com")).thenReturn(false);
        when(userRepository.save(any(User.class))).thenReturn(testUser);

        User newUser = User.builder()
                .name("새로운 사용자")
                .email("new@company.com")
                .department("개발팀")
                .build();

        // When: 새로운 사용자를 생성
        User result = userService.createUser(newUser);

        // Then: 사용자가 성공적으로 생성되는지 확인
        assertNotNull(result);
        assertEquals("홍길동", result.getName()); // Mock에서 반환하는 testUser
        
        // Repository 메서드들이 올바르게 호출되었는지 확인
        verify(userRepository, times(1)).existsByEmail("new@company.com");
        verify(userRepository, times(1)).save(any(User.class));
    }

    /**
     * 중복 이메일로 사용자 생성 시도 테스트
     */
    @Test
    void createUser_WithDuplicateEmail_ShouldThrowException() {
        // Given: 이메일이 이미 존재한다고 가정
        when(userRepository.existsByEmail("hong@company.com")).thenReturn(true);

        User duplicateUser = User.builder()
                .name("중복 사용자")
                .email("hong@company.com")
                .department("개발팀")
                .build();

        // When & Then: 예외가 발생하는지 확인
        IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> userService.createUser(duplicateUser)
        );

        assertTrue(exception.getMessage().contains("이미 사용 중인 이메일"));
        
        // 저장이 호출되지 않았는지 확인
        verify(userRepository, never()).save(any(User.class));
    }

    /**
     * 유효하지 않은 데이터로 사용자 생성 시도 테스트
     */
    @Test
    void createUser_WithInvalidData_ShouldThrowException() {
        User invalidUser = User.builder()
                .name("") // 빈 이름
                .email("invalid-email") // 잘못된 이메일 형식
                .build();

        // When & Then: 예외가 발생하는지 확인
        assertThrows(
                IllegalArgumentException.class,
                () -> userService.createUser(invalidUser)
        );
    }

    /*
     * ============================================================================
     * 수정 기능 테스트
     * ============================================================================
     */

    /**
     * 사용자 정보 수정 테스트 - 이메일 변경 없는 경우
     * 
     * 이 테스트는 이메일을 변경하지 않는 시나리오를 검증합니다.
     * 이 경우 이메일 중복 확인이 수행되지 않으므로 existsByEmail Mock이 필요하지 않습니다.
     */
    @Test
    void updateUser_WithSameEmail_ShouldUpdateUser() {
        // Given: 기존 사용자가 존재하고, 이메일은 변경하지 않는다고 가정
        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
        when(userRepository.save(any(User.class))).thenReturn(testUser);
        // 주의: existsByEmail Mock을 제거했습니다. 같은 이메일이므로 호출되지 않기 때문입니다.

        User updatedUser = User.builder()
                .id(1L)
                .name("홍길동 수정") // 이름만 변경
                .email("hong@company.com") // 기존과 동일한 이메일
                .phone("010-1111-2222")
                .department("개발팀")
                .build();

        // When: 사용자 정보를 수정
        User result = userService.updateUser(updatedUser);

        // Then: 수정이 성공하는지 확인
        assertNotNull(result);
        verify(userRepository, times(1)).findById(1L);
        verify(userRepository, times(1)).save(any(User.class));
        // existsByEmail은 호출되지 않았음을 확인
        verify(userRepository, never()).existsByEmail(anyString());
    }
    
    /**
     * 사용자 정보 수정 테스트 - 이메일 변경하는 경우
     * 
     * 이 테스트는 이메일을 변경하는 시나리오를 검증합니다.
     * 이 경우 새로운 이메일의 중복 확인이 수행됩니다.
     */
    @Test
    void updateUser_WithDifferentEmail_ShouldUpdateUser() {
        // Given: 기존 사용자가 존재하고, 새로운 이메일로 변경한다고 가정
        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
        when(userRepository.existsByEmail("newemail@company.com")).thenReturn(false); // 새 이메일은 중복되지 않음
        when(userRepository.save(any(User.class))).thenReturn(testUser);

        User updatedUser = User.builder()
                .id(1L)
                .name("홍길동")
                .email("newemail@company.com") // 다른 이메일로 변경
                .phone("010-1111-2222")
                .department("개발팀")
                .build();

        // When: 사용자 정보를 수정
        User result = userService.updateUser(updatedUser);

        // Then: 수정이 성공하는지 확인
        assertNotNull(result);
        verify(userRepository, times(1)).findById(1L);
        verify(userRepository, times(1)).existsByEmail("newemail@company.com"); // 새 이메일 중복 확인
        verify(userRepository, times(1)).save(any(User.class));
    }

    /**
     * 존재하지 않는 사용자 수정 시도 테스트
     */
    @Test
    void updateUser_WithNonExistentUser_ShouldThrowException() {
        // Given: 해당 ID의 사용자가 존재하지 않는다고 가정
        when(userRepository.findById(999L)).thenReturn(Optional.empty());

        User nonExistentUser = User.builder()
                .id(999L)
                .name("존재하지 않는 사용자")
                .email("nonexistent@company.com")
                .build();

        // When & Then: 예외가 발생하는지 확인
        assertThrows(
                IllegalArgumentException.class,
                () -> userService.updateUser(nonExistentUser)
        );
    }

    /*
     * ============================================================================
     * 삭제(비활성화) 기능 테스트
     * ============================================================================
     */

    /**
     * 사용자 비활성화 테스트
     */
    @Test
    void deactivateUser_WithValidId_ShouldDeactivateUser() {
        // Given: 사용자가 존재한다고 가정
        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
        when(userRepository.save(any(User.class))).thenReturn(testUser);

        // When: 사용자를 비활성화
        assertDoesNotThrow(() -> userService.deactivateUser(1L));

        // Then: Repository 메서드들이 올바르게 호출되었는지 확인
        verify(userRepository, times(1)).findById(1L);
        verify(userRepository, times(1)).save(testUser);
        assertFalse(testUser.getActive()); // 사용자가 비활성화되었는지 확인
    }

    /*
     * ============================================================================
     * 경계값 및 예외 상황 테스트
     * ============================================================================
     */

    /**
     * null ID로 사용자 조회 테스트
     */
    @Test
    void getUserById_WithNullId_ShouldReturnEmpty() {
        // When: null ID로 조회
        Optional<User> result = userService.getUserById(null);

        // Then: 빈 Optional이 반환되는지 확인
        assertFalse(result.isPresent());
        
        // Repository가 호출되지 않았는지 확인 (null 체크에서 미리 반환)
        verify(userRepository, never()).findById(any());
    }

    /**
     * 빈 검색어로 검색 테스트
     */
    @Test
    void searchUsers_WithEmptyKeyword_ShouldReturnAllActiveUsers() {
        // Given: 빈 키워드로 검색하면 전체 활성 사용자를 반환한다고 가정
        when(userRepository.findByActiveTrue()).thenReturn(testUsers);

        // When: 빈 키워드로 검색
        List<User> result = userService.searchUsers("");

        // Then: 전체 활성 사용자가 반환되는지 확인
        assertNotNull(result);
        assertEquals(2, result.size());
        verify(userRepository, times(1)).findByActiveTrue();
    }

    /**
     * null 사용자 객체로 생성 시도 테스트
     * 
     * 수정사항: UserService에서 null 체크 순서를 수정했으므로
     * 이제 IllegalArgumentException이 올바르게 발생합니다.
     */
    @Test
    void createUser_WithNullUser_ShouldThrowException() {
        // When & Then: null 객체로 생성 시도하면 IllegalArgumentException 발생
        IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> userService.createUser(null)
        );
        
        // 예외 메시지도 확인하여 더 정확한 테스트
        assertTrue(exception.getMessage().contains("사용자 정보가 필요합니다"));
    }
}

/*
============================================================================
실무 테스트 작성 시 중요한 원칙들
============================================================================

1. AAA 패턴 준수:
   - Arrange (Given): 테스트 조건 설정
   - Act (When): 실제 테스트 실행
   - Assert (Then): 결과 검증

2. 테스트 이름의 명확성:
   - 메서드명만 봐도 무엇을 테스트하는지 알 수 있어야 합니다
   - "상황_조건_예상결과" 형태로 작성하는 것이 좋습니다

3. 하나의 테스트는 하나의 기능만:
   - 여러 기능을 한 번에 테스트하면 실패 원인 파악이 어려워집니다
   - 각 테스트는 독립적이어야 합니다

4. 의미있는 경계값 테스트:
   - null, 빈 값, 최대값, 최소값 등 경계 조건을 테스트합니다
   - 실제 운영에서 발생할 수 있는 상황들을 고려합니다

5. Mock 사용의 적절성:
   - 외부 의존성(데이터베이스, 네트워크 등)은 Mock으로 대체합니다
   - 하지만 과도한 Mock 사용은 테스트의 신뢰성을 떨어뜨릴 수 있습니다

6. 테스트 유지보수성:
   - 테스트 코드도 프로덕션 코드만큼 중요합니다
   - 중복을 제거하고 가독성을 높여야 합니다

이런 원칙들을 따르면:
- 버그를 조기에 발견할 수 있습니다
- 리팩토링 시 안전성을 보장할 수 있습니다
- 코드 변경의 영향 범위를 파악하기 쉬워집니다
- 새로운 팀원이 코드를 이해하기 쉬워집니다

실무에서는 "완벽한 테스트 커버리지"보다는
"핵심 비즈니스 로직의 확실한 검증"이 더 중요합니다.
*/
