package com.knack.store.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.Resource;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import org.springframework.web.servlet.resource.PathResourceResolver;

import java.io.IOException;

/**
 * Serves the Angular bundle that the {@code cf} Maven profile copies into
 * {@code classpath:/static}. Because the SPA owns client-side routing, a deep
 * link such as /products/5 has no matching file on disk — those requests are
 * forwarded to index.html so the Angular router can take over on the client.
 *
 * <p>Requests that belong to the backend are deliberately excluded: letting
 * them fall through to index.html would turn a 404 API call into an HTTP 200
 * page, which is very hard to debug from the browser.
 */
@Configuration
public class SpaWebConfig implements WebMvcConfigurer {

    private static final String STATIC_ROOT = "classpath:/static/";

    private static final Resource INDEX = new ClassPathResource("static/index.html");

    /** Path prefixes owned by Spring, never by the Angular router. */
    private static final String[] BACKEND_PREFIXES = {
            "api/",
            "v3/api-docs",
            "swagger-ui",
            "swagger-resources",
            "webjars/",
            "h2-console",
            "actuator"
    };

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        registry.addResourceHandler("/**")
                .addResourceLocations(STATIC_ROOT)
                .resourceChain(true)
                .addResolver(new PathResourceResolver() {
                    @Override
                    protected Resource getResource(String resourcePath, Resource location) throws IOException {
                        Resource requested = location.createRelative(resourcePath);
                        if (requested.exists() && requested.isReadable()) {
                            return requested;
                        }
                        if (isBackendPath(resourcePath) || !INDEX.exists()) {
                            return null;
                        }
                        return INDEX;
                    }
                });
    }

    private static boolean isBackendPath(String resourcePath) {
        for (String prefix : BACKEND_PREFIXES) {
            if (resourcePath.startsWith(prefix)) {
                return true;
            }
        }
        return false;
    }
}
