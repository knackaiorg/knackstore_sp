package com.knack.store.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.mvc.method.RequestMappingInfo;
import org.springframework.web.servlet.mvc.method.annotation.RequestMappingHandlerMapping;

import java.util.Map;

@Component
public class MappingLogger {
    private static final Logger log = LoggerFactory.getLogger(MappingLogger.class);

    private final RequestMappingHandlerMapping handlerMapping;

    public MappingLogger(RequestMappingHandlerMapping handlerMapping) {
        this.handlerMapping = handlerMapping;
    }

    @EventListener(ApplicationReadyEvent.class)
    public void logMappingsOnStartup() {
        try {
            Map<RequestMappingInfo, ?> map = handlerMapping.getHandlerMethods();
            log.info("Registered HTTP request mappings (total={}):", map.size());
            map.forEach((info, handlerMethod) -> log.info("{} -> {}", info, handlerMethod));
        } catch (Exception e) {
            log.error("Failed to read handler mappings", e);
        }
    }
}

