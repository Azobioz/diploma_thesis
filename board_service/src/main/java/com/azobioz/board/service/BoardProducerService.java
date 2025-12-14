package com.azobioz.board.service;

import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

@Service
public class BoardProducerService {

    private final KafkaTemplate<String, String> kafkaTemplate;

    public BoardProducerService(KafkaTemplate<String, String> kafkaTemplate) {
        this.kafkaTemplate = kafkaTemplate;
    }

    public void sendMessage(String topic, String message) {
        kafkaTemplate.send(topic, message);
        System.out.println("Message sent to topic " + topic + " : " + message);
    }

}
