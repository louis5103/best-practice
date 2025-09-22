package com.company.javafxdemo;

import javafx.application.Application;
import javafx.application.Platform;
import javafx.fxml.FXMLLoader;
import javafx.scene.Parent;
import javafx.scene.Scene;
import javafx.stage.Stage;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.ConfigurableApplicationContext;

/**
 * JavaFX + Spring Boot 통합 애플리케이션의 메인 클래스
 * 
 * 이 클래스가 해결하는 핵심 문제:
 * 기존 코드에서는 FXWeaver라는 외부 라이브러리를 사용했지만, 
 * 이것은 Spring Boot 3.x와의 호환성 문제가 있을 수 있습니다.
 * 
 * 대신 여기서는 "직접 통합" 방식을 사용합니다. 이 방식의 장점:
 * 1. 외부 라이브러리 의존성 없음 - 안정성 향상
 * 2. 완전한 제어 가능 - 문제 발생 시 직접 수정 가능  
 * 3. Spring Boot 업그레이드에 영향받지 않음
 * 4. 코드가 명확하고 이해하기 쉬움
 * 
 * 이는 마치 기성품 가구 대신 직접 만든 가구를 사용하는 것과 같습니다.
 * 조금 더 복잡할 수 있지만, 우리의 정확한 요구사항에 맞게 만들 수 있고
 * 문제가 생겼을 때 직접 고칠 수 있습니다.
 * 
 * @author JavaFX Demo Team
 * @version 1.0
 * @since 2024
 */
@SpringBootApplication
public class JavaFxDemoApplication extends Application {

    /**
     * Spring Boot 애플리케이션 컨텍스트
     * 
     * 이것이 중요한 이유: Spring의 모든 빈(Bean)들이 이 컨텍스트 안에서 관리됩니다.
     * 마치 도서관의 도서 관리 시스템과 같은 역할을 합니다.
     * 모든 책(빈)들의 위치를 알고 있고, 필요할 때 빌려줄 수 있습니다.
     */
    private ConfigurableApplicationContext springContext;

    /**
     * 애플리케이션의 시작점
     * 
     * 주목할 점: 여기서는 SpringApplication.run()을 호출하지 않습니다!
     * 대신 JavaFX의 launch() 메서드를 호출합니다.
     * 
     * 이렇게 하는 이유:
     * JavaFX는 특별한 방식으로 시작되어야 합니다. JavaFX Application Thread라는
     * 특별한 스레드에서 모든 UI 작업이 이루어져야 하기 때문입니다.
     * 이는 마치 오케스트라에서 지휘자가 있어야 하는 것과 같습니다.
     * 
     * @param args 명령줄 인수
     */
    public static void main(String[] args) {
        /*
         * 시스템 속성 설정
         * 이것들이 필요한 이유를 자세히 설명해보겠습니다:
         */
        
        // JavaFX가 headless 모드에서 실행되지 않도록 설정
        // headless 모드란 모니터나 키보드가 없는 서버 환경을 의미합니다
        System.setProperty("java.awt.headless", "false");
        
        // 텍스트 렌더링 최적화 설정
        // 이 설정은 특히 Windows에서 텍스트가 더 선명하게 보이도록 도와줍니다
        System.setProperty("prism.lcdtext", "false");
        
        // JavaFX 애플리케이션 시작
        // 이 호출로 인해 JavaFX가 필요한 모든 초기화를 수행하고
        // 우리의 start() 메서드가 호출됩니다
        launch(args);
    }

    /**
     * JavaFX 애플리케이션 초기화 단계
     * 
     * 이 메서드는 매우 중요합니다. JavaFX Application Thread가 아닌 
     * 별도의 스레드에서 실행되기 때문에, 무거운 초기화 작업을 
     * 안전하게 수행할 수 있습니다.
     * 
     * 이는 마치 극장에서 공연이 시작되기 전에 무대 뒤에서 
     * 모든 준비 작업을 마치는 것과 같습니다.
     * 
     * @throws Exception 초기화 중 발생할 수 있는 예외
     */
    @Override
    public void init() throws Exception {
        super.init();
        
        /*
         * Spring Boot 컨텍스트 초기화
         * 
         * 여기서 중요한 설정 두 가지를 주목해보세요:
         */
        SpringApplication springApp = new SpringApplication(JavaFxDemoApplication.class);
        
        // 1. 웹 애플리케이션 타입을 NONE으로 설정
        //    이유: 데스크톱 애플리케이션에서는 웹 서버가 필요하지 않습니다
        //    이렇게 하면 메모리 사용량이 줄어들고 시작 시간이 빨라집니다
        springApp.setWebApplicationType(org.springframework.boot.WebApplicationType.NONE);
        
        // 2. Headless 모드 비활성화
        //    이유: GUI 애플리케이션이므로 화면 출력이 필요합니다
        springApp.setHeadless(false);
        
        // Spring 컨텍스트 시작
        // 이 순간 모든 @Component, @Service, @Repository 등이 생성되고 의존성이 주입됩니다
        this.springContext = springApp.run();
        
        // 추가 초기화 작업들
        // 예: 데이터베이스 연결 확인, 초기 데이터 로드 등
        performAdditionalInitialization();
    }

    /**
     * JavaFX UI 시작 단계
     * 
     * 이 메서드는 JavaFX Application Thread에서 실행됩니다.
     * 따라서 모든 UI 관련 작업을 안전하게 수행할 수 있습니다.
     * 
     * 기존 코드와의 가장 큰 차이점:
     * FXWeaver.loadView() 대신 직접 FXML을 로드하고 Spring 빈을 주입합니다.
     * 이 방식이 더 명확하고 제어 가능합니다.
     * 
     * @param primaryStage JavaFX에서 제공하는 메인 창(Stage)
     * @throws Exception UI 초기화 중 발생할 수 있는 예외
     */
    @Override
    public void start(Stage primaryStage) throws Exception {
        /*
         * FXML 로더 생성 및 설정
         * 
         * 중요한 개선사항: 커스텀 컨트롤러 팩토리 사용
         * 이것이 FXWeaver를 대체하는 핵심 메커니즘입니다.
         */
        FXMLLoader fxmlLoader = new FXMLLoader(getClass().getResource("/fxml/main.fxml"));
        
        // 컨트롤러 팩토리 설정
        // 이 함수는 FXML에서 컨트롤러가 필요할 때 호출됩니다
        // Spring 컨텍스트에서 해당 컨트롤러를 찾아서 반환합니다
        fxmlLoader.setControllerFactory(controllerType -> {
            try {
                // Spring 컨텍스트에서 컨트롤러를 찾습니다
                // 이렇게 하면 컨트롤러에 @Autowired로 설정된 의존성들이 자동으로 주입됩니다
                return springContext.getBean(controllerType);
            } catch (Exception e) {
                // 만약 Spring 컨텍스트에서 찾을 수 없다면 직접 생성합니다
                // 하지만 이 경우 의존성 주입은 작동하지 않습니다
                System.err.println("Warning: Controller not found in Spring context: " + controllerType.getName());
                try {
                    return controllerType.getDeclaredConstructor().newInstance();
                } catch (Exception ex) {
                    throw new RuntimeException("Failed to create controller: " + controllerType.getName(), ex);
                }
            }
        });

        // FXML 파일 로드
        Parent root = fxmlLoader.load();

        // 애플리케이션 설정에서 창 크기와 제목 가져오기
        // 이렇게 하면 설정 파일에서 UI 속성들을 중앙 관리할 수 있습니다
        String title = springContext.getEnvironment().getProperty("app.ui.title", "JavaFX Demo");
        int width = springContext.getEnvironment().getProperty("app.ui.width", Integer.class, 1000);
        int height = springContext.getEnvironment().getProperty("app.ui.height", Integer.class, 700);
        boolean resizable = springContext.getEnvironment().getProperty("app.ui.resizable", Boolean.class, true);

        // Scene 생성 및 스타일시트 적용
        Scene scene = new Scene(root, width, height);
        
        // CSS 스타일시트 로드
        String cssPath = getClass().getResource("/css/application.css").toExternalForm();
        scene.getStylesheets().add(cssPath);

        // Stage 설정
        primaryStage.setTitle(title);
        primaryStage.setScene(scene);
        primaryStage.setResizable(resizable);
        
        // 최소 크기 설정 (사용자 경험 향상을 위해)
        primaryStage.setMinWidth(600);
        primaryStage.setMinHeight(400);

        // 창 닫기 이벤트 처리
        // 이것이 중요한 이유: 사용자가 창을 닫을 때 정리 작업을 수행해야 합니다
        primaryStage.setOnCloseRequest(event -> {
            // 이벤트를 일단 취소합니다 (기본 닫기 동작 방지)
            event.consume();
            
            // 안전한 종료 처리
            handleApplicationExit();
        });

        // 창을 화면에 표시
        primaryStage.show();
        
        // 중앙에 위치시키기 (사용자 경험 향상)
        primaryStage.centerOnScreen();
        
        System.out.println("JavaFX 애플리케이션이 성공적으로 시작되었습니다!");
    }

    /**
     * 애플리케이션 종료 단계
     * 
     * JavaFX 플랫폼이 종료될 때 호출됩니다.
     * Spring 컨텍스트와 기타 리소스들을 정리합니다.
     * 
     * 이것이 중요한 이유: 메모리 누수를 방지하고 
     * 진행 중인 작업들을 안전하게 종료할 수 있습니다.
     * 
     * @throws Exception 종료 중 발생할 수 있는 예외
     */
    @Override
    public void stop() throws Exception {
        System.out.println("애플리케이션을 종료하는 중...");
        
        // Spring 컨텍스트 정리
        if (springContext != null) {
            springContext.close();
        }
        
        // 추가 리소스 정리
        cleanupResources();
        
        super.stop();
        System.out.println("애플리케이션이 성공적으로 종료되었습니다.");
    }

    /**
     * 추가 초기화 작업 수행
     * 
     * 여기서는 애플리케이션 시작 시 필요한 추가 작업들을 수행합니다.
     * 예를 들어, 데이터베이스 연결 확인이나 초기 데이터 로드 등입니다.
     * 
     * 개선사항: Spring Bean 등록 상태를 확인하는 진단 로직 추가
     * 이렇게 하면 Spring Boot가 우리의 컴포넌트들을 제대로 인식했는지 확인할 수 있습니다.
     */
    private void performAdditionalInitialization() {
        try {
            // Spring 컨텍스트 진단 - 매우 중요한 디버깅 정보!
            performSpringContextDiagnostics();
            
            // 샘플 데이터 로드 여부 확인
            boolean loadSampleData = springContext.getEnvironment()
                .getProperty("app.data.load-sample-data", Boolean.class, false);
            
            if (loadSampleData) {
                System.out.println("샘플 데이터를 로드하는 중...");
                // 실제 구현에서는 여기서 샘플 데이터를 생성합니다
            }
            
        } catch (Exception e) {
            System.err.println("초기화 중 오류 발생: " + e.getMessage());
            e.printStackTrace();
            // 실제 구현에서는 사용자에게 적절한 오류 메시지를 표시해야 합니다
        }
    }
    
    /**
     * Spring 컨텍스트 진단
     * 
     * 이 메서드는 Spring Boot가 우리의 컴포넌트들을 제대로 인식했는지 확인합니다.
     * 실무에서 이런 진단 코드는 문제 해결에 매우 유용합니다.
     * 마치 의사가 환자의 상태를 확인하기 위해 각종 검사를 하는 것과 같습니다.
     */
    private void performSpringContextDiagnostics() {
        System.out.println("\n=== Spring Boot 컨텍스트 진단 시작 ===");
        
        // 1. 전체 Bean 개수 확인
        String[] allBeanNames = springContext.getBeanDefinitionNames();
        System.out.println("등록된 전체 Bean 개수: " + allBeanNames.length);
        
        // 2. 우리가 만든 컴포넌트들이 등록되었는지 확인
        checkOurComponents();
        
        // 3. 컨트롤러 관련 Bean들 확인
        checkControllerBeans();
        
        // 4. 서비스 관련 Bean들 확인
        checkServiceBeans();
        
        // 5. Repository 관련 Bean들 확인
        checkRepositoryBeans();
        
        System.out.println("=== Spring Boot 컨텍스트 진단 완료 ===\n");
    }
    
    /**
     * 우리가 만든 컴포넌트들의 등록 상태 확인
     */
    private void checkOurComponents() {
        System.out.println("\n--- 우리 컴포넌트 등록 상태 ---");
        
        // 패키지 기반으로 우리 컴포넌트들 찾기
        String ourPackage = "com.company.javafxdemo";
        String[] allBeanNames = springContext.getBeanDefinitionNames();
        
        int ourComponentCount = 0;
        for (String beanName : allBeanNames) {
            try {
                Object bean = springContext.getBean(beanName);
                String packageName = bean.getClass().getPackage().getName();
                if (packageName.startsWith(ourPackage)) {
                    System.out.println("✓ " + beanName + " -> " + bean.getClass().getSimpleName());
                    ourComponentCount++;
                }
            } catch (Exception e) {
                // 일부 Bean은 조회할 때 오류가 날 수 있으므로 무시
            }
        }
        
        System.out.println("우리 패키지의 컴포넌트 개수: " + ourComponentCount);
        
        if (ourComponentCount == 0) {
            System.err.println("⚠️  경고: 우리 패키지의 컴포넌트가 하나도 발견되지 않았습니다!");
            System.err.println("   이는 컴포넌트 스캔이 제대로 작동하지 않았음을 의미할 수 있습니다.");
        }
    }
    
    /**
     * 컨트롤러 Bean 등록 상태 확인
     */
    private void checkControllerBeans() {
        System.out.println("\n--- 컨트롤러 Bean 상태 ---");
        
        try {
            // MainController가 Spring Bean으로 등록되었는지 확인
            Object mainController = springContext.getBean("mainController");
            if (mainController != null) {
                System.out.println("✓ MainController가 Spring Bean으로 등록되었습니다: " + mainController.getClass().getName());
            }
        } catch (Exception e) {
            System.err.println("❌ MainController를 Spring Bean으로 찾을 수 없습니다: " + e.getMessage());
            
            // 클래스 이름으로 다시 시도
            try {
                Object mainController = springContext.getBean(com.company.javafxdemo.controller.MainController.class);
                System.out.println("✓ MainController를 클래스 타입으로 찾았습니다: " + mainController.getClass().getName());
            } catch (Exception e2) {
                System.err.println("❌ MainController를 클래스 타입으로도 찾을 수 없습니다: " + e2.getMessage());
            }
        }
    }
    
    /**
     * 서비스 Bean 등록 상태 확인
     */
    private void checkServiceBeans() {
        System.out.println("\n--- 서비스 Bean 상태 ---");
        
        try {
            Object userService = springContext.getBean(com.company.javafxdemo.service.UserService.class);
            System.out.println("✓ UserService가 Spring Bean으로 등록되었습니다: " + userService.getClass().getName());
        } catch (Exception e) {
            System.err.println("❌ UserService를 찾을 수 없습니다: " + e.getMessage());
        }
    }
    
    /**
     * Repository Bean 등록 상태 확인
     */
    private void checkRepositoryBeans() {
        System.out.println("\n--- Repository Bean 상태 ---");
        
        try {
            Object userRepository = springContext.getBean(com.company.javafxdemo.repository.UserRepository.class);
            System.out.println("✓ UserRepository가 Spring Bean으로 등록되었습니다: " + userRepository.getClass().getName());
        } catch (Exception e) {
            System.err.println("❌ UserRepository를 찾을 수 없습니다: " + e.getMessage());
        }
    }

    /**
     * 애플리케이션 종료 처리
     * 
     * 사용자가 창을 닫으려고 할 때 호출됩니다.
     * 저장되지 않은 데이터가 있는지 확인하고, 
     * 필요하다면 사용자에게 확인을 받을 수 있습니다.
     */
    private void handleApplicationExit() {
        // 실제 구현에서는 여기서 다음과 같은 작업들을 수행할 수 있습니다:
        // 1. 저장되지 않은 데이터 확인
        // 2. 사용자에게 확인 대화상자 표시
        // 3. 애플리케이션 상태 저장
        
        // 지금은 단순히 종료합니다
        Platform.exit();
    }

    /**
     * 리소스 정리
     * 
     * 애플리케이션 종료 시 정리해야 할 리소스들이 있다면 여기서 처리합니다.
     * 예: 파일 핸들, 네트워크 연결, 백그라운드 스레드 등
     */
    private void cleanupResources() {
        // 실제 구현에서는 여기서 필요한 리소스 정리 작업을 수행합니다
        System.out.println("리소스 정리 완료");
    }
}
