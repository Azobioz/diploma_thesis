package com.azobioz.board.service;

import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;

@Service
public class BoardConsumerService {

    @KafkaListener(topics = "board", groupId = "board-consumer-group")
    public void listenBoardTopic(String message) {
        System.out.println("Received from topic 'board': " + message);
        // Дальше добавить обработку сообщений
    }

    @KafkaListener(topics = "task-management", groupId = "board-consumer-group")
    public void listenTaskManagement(String message) {
        System.out.println("Received on 'task-management': " + message);
        // Дальше добавить обработку сообщений
    }

    @KafkaListener(topics = "account-and-team", groupId = "board-consumer-group")
    public void listenAccountAndTeam(String message) {
        System.out.println("Received on 'account-and-team': " + message);
        //Дальше добавить обработку сообщений
    }



}
