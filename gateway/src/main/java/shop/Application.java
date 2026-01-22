package shop;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.ApplicationContext;
import io.github.cdimascio.dotenv.Dotenv;
import java.io.File;

@SpringBootApplication
public class Application {

    public static ApplicationContext applicationContext;

    public static void main(String[] args) {
        // 로컬 개발 환경에서만 루트 디렉토리의 .env 파일 로드
        loadEnvFile();
        
        applicationContext = SpringApplication.run(Application.class, args);
    }

    /**
     * 로컬 개발 환경에서 루트 디렉토리의 .env 파일을 로드합니다.
     * .env 파일이 존재하는 경우에만 로드하며, 환경변수로 설정합니다.
     */
    private static void loadEnvFile() {
        try {
            // gateway 디렉토리에서 루트 디렉토리로 이동 (../)
            File currentDir = new File(System.getProperty("user.dir"));
            File rootDir = currentDir.getParentFile();
            
            // 루트 디렉토리가 null이거나 gateway 디렉토리가 아닌 경우 현재 디렉토리 사용
            if (rootDir == null || !currentDir.getName().equals("gateway")) {
                rootDir = currentDir;
            }
            
            File envFile = new File(rootDir, ".env");
            
            // .env 파일이 존재하는 경우에만 로드
            if (envFile.exists() && envFile.isFile()) {
                System.out.println("Loading .env file from: " + envFile.getAbsolutePath());
                
                Dotenv dotenv = Dotenv.configure()
                    .directory(rootDir.getAbsolutePath())
                    .filename(".env")
                    .ignoreIfMissing()
                    .load();
                
                // .env 파일의 모든 변수를 시스템 환경변수로 설정
                dotenv.entries().forEach(entry -> {
                    String key = entry.getKey();
                    String value = entry.getValue();
                    // 이미 환경변수가 설정되어 있지 않은 경우에만 설정
                    if (System.getenv(key) == null) {
                        System.setProperty(key, value);
                        System.out.println("Loaded environment variable: " + key);
                    }
                });
                
                System.out.println("Successfully loaded .env file");
            } else {
                System.out.println(".env file not found at: " + envFile.getAbsolutePath() + " (skipping .env loading)");
            }
        } catch (Exception e) {
            // .env 파일 로드 실패 시에도 애플리케이션은 계속 실행
            System.err.println("Warning: Failed to load .env file: " + e.getMessage());
        }
    }
}
