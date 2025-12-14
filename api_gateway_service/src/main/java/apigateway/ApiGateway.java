package apigateway;

import apigateway.service.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cloud.gateway.route.RouteLocator;
import org.springframework.cloud.gateway.route.builder.RouteLocatorBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class ApiGateway {

    @Autowired
    private KafkaProducerService kafkaProducerService;

    @Bean
    public RouteLocator customRouteLocator(RouteLocatorBuilder builder) {
        return builder.routes()
                .route("create_board", r -> r.path("/boards/create")
                        .filters(f -> f.filter((exchange, chain) -> {
                            kafkaProducerService.sendEvent(
                                    "board",
                                    "Board create requested"
                            );
                            return chain.filter(exchange);
                        }))
                        .uri("http://localhost:8080")
                )
                .route("get_board", c -> c.path("/boards/{id}")
                        .uri("http://localhost:8080")
                )
                .route("get_boards", c -> c.path("/boards")
                        .uri("http://localhost:8080")
                )
                .route("edit_board", c -> c.path("/boards/{id}/edit")
                        .uri("http://localhost:8080")
                )
                .route("delete_board", c -> c.path("/boards/{id}/delete")
                        .uri("http://localhost:8080")
                )
                .build();
    }
}
