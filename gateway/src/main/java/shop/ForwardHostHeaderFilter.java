package shop;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.core.io.buffer.DataBuffer;
import org.springframework.core.io.buffer.DataBufferFactory;
import org.springframework.http.HttpCookie;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.http.server.reactive.ServerHttpResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureException;

import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.util.*;

@Component
public class ForwardHostHeaderFilter implements GlobalFilter, Ordered {

    private static final Logger logger = LoggerFactory.getLogger(ForwardHostHeaderFilter.class);

    private static final String SECRET_KEY = Optional.ofNullable(
            System.getProperty("SECRET_KEY") != null ? System.getProperty("SECRET_KEY") : System.getenv("SECRET_KEY"))
            .orElse("super-secret-jwt-token-with-at-least-32-characters-long");

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        ServerHttpRequest request = exchange.getRequest();
        String requestPath = request.getURI().getPath();

        if (requestPath.equals("/health")) {
            ServerHttpResponse response = exchange.getResponse();
            response.setStatusCode(HttpStatus.OK);
            return response.setComplete();
        }

        InetSocketAddress host = request.getHeaders().getHost();
        String originalHost = (host != null) ? host.getHostName() : "unknown";

        String subdomain = extractSubdomain(originalHost);

        List<String> protectedPaths = Arrays.asList(
                "/completion/(?!set-tenant|complete|vision-complete|invite-user|set-initial-info).*",
                "/autonomous/.*",
                "/memento/.*",
                "/agent/.*",
                "/mcp/.*");

        boolean requiresAuth = false;

        for (String path : protectedPaths) {
            if (requestPath.matches(path)) {
                requiresAuth = true;
                break;
            }
        }

        if (requiresAuth) {
            List<HttpCookie> cookies = request.getCookies().getOrDefault("access_token", Collections.emptyList());
            if (cookies.isEmpty()) {
                return buildErrorResponse(exchange, "TOKEN_MISSING", "Access token is missing");
            }
            
            TokenValidationResult validationResult = validateToken(cookies.get(0).getValue(), subdomain);
            if (!validationResult.isValid()) {
                return buildErrorResponse(exchange, validationResult.getErrorCode(), validationResult.getErrorMessage());
            }
        }

        // 안전한 헤더 수정 방식 사용
        ServerHttpRequest updatedRequest = request.mutate()
                .header("X-Forwarded-Host", originalHost)
                .build();

        return chain.filter(exchange.mutate().request(updatedRequest).build());
    }

    private TokenValidationResult validateToken(String token, String expectedSubdomain) {
        try {
            Claims claims = Jwts.parser()
                    .setSigningKey(SECRET_KEY.getBytes(StandardCharsets.UTF_8))
                    .parseClaimsJws(token)
                    .getBody();

            @SuppressWarnings("unchecked")
            Map<String, Object> appMetadata = claims.get("app_metadata", Map.class);
            if (appMetadata == null) {
                logger.warn("No app_metadata found in token");
                return new TokenValidationResult(false, "TOKEN_INVALID", "No app_metadata found in token");
            }

            Object tenantIdObj = appMetadata.get("tenant_id");
            if (tenantIdObj == null) {
                logger.warn("No tenant_id found in app_metadata");
                return new TokenValidationResult(false, "TOKEN_INVALID", "No tenant_id found in app_metadata");
            }

            String tenantId = tenantIdObj.toString();
            if (!expectedSubdomain.equals(tenantId)) {
                logger.warn("Invalid tenant ID: expected {}, found {}", expectedSubdomain, tenantId);
                return new TokenValidationResult(false, "TENANT_MISMATCH", 
                    String.format("Tenant ID mismatch: expected '%s', found '%s'", expectedSubdomain, tenantId));
            }

            return new TokenValidationResult(true, null, null);
        } catch (SignatureException e) {
            logger.error("SignatureException: Invalid token signature", e);
            return new TokenValidationResult(false, "TOKEN_INVALID", "Invalid token signature");
        } catch (Exception e) {
            logger.error("Exception during token validation", e);
            return new TokenValidationResult(false, "TOKEN_INVALID", "Token validation failed: " + e.getMessage());
        }
    }

    private Mono<Void> buildErrorResponse(ServerWebExchange exchange, String errorCode, String message) {
        ServerHttpResponse response = exchange.getResponse();
        response.setStatusCode(HttpStatus.UNAUTHORIZED);
        response.getHeaders().setContentType(MediaType.APPLICATION_JSON);
        
        String errorJson = String.format(
            "{\"errorCode\":\"%s\",\"message\":\"%s\",\"status\":401}",
            errorCode, message.replace("\"", "\\\"")
        );
        
        DataBufferFactory bufferFactory = response.bufferFactory();
        DataBuffer buffer = bufferFactory.wrap(errorJson.getBytes(StandardCharsets.UTF_8));
        
        return response.writeWith(Mono.just(buffer));
    }

    private String extractSubdomain(String host) {
        String[] parts = host.split("\\.");
        if (parts.length > 2) {
            return parts[0];
        }
        return host;
    }

    @Override
    public int getOrder() {
        return -1;
    }

    private static class TokenValidationResult {
        private final boolean valid;
        private final String errorCode;
        private final String errorMessage;

        public TokenValidationResult(boolean valid, String errorCode, String errorMessage) {
            this.valid = valid;
            this.errorCode = errorCode;
            this.errorMessage = errorMessage;
        }

        public boolean isValid() {
            return valid;
        }

        public String getErrorCode() {
            return errorCode;
        }

        public String getErrorMessage() {
            return errorMessage;
        }
    }
}
