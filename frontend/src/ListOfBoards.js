import { useEffect, useState } from "react";
import { Link } from 'react-router-dom'
import { ListGroup, Row, Col } from "react-bootstrap";
import axios from "axios";

function ListOfBoards() {

    const [boards, setBoards] = useState([]);

    useEffect(() => {
        const fetchBoards = async () => {
            try {
                const response = await axios.get("http://localhost:8081/boards");
                setBoards(response.data);
            } catch (error) {
                console.error("Ошибка загрузки:", error);
            }
        };

        fetchBoards();
    }, []);

    return (
        <div className="for-lists">

            {/* Заголовки */}
            <Row>
                <Col className="for-column-board-name">Название</Col>
                <Col className="for-column-online-people">Сейчас онлайн</Col>
                <Col className="for-column-board-owner">Владелец</Col>
            </Row>

            <ListGroup>
                {boards.map((board) => (
                    <ListGroup.Item key={board.id} className="py-3">
                        <Link to={'/boards/' + board.id}>
                            <Row className="align-items-center">
                                <Col md={4}>{board.name}</Col>
                                <Col md={4}>Some User</Col>
                                <Col md={3}>Owner 1</Col>
                                <Col md={1}>•••</Col>
                            </Row>
                        </Link>
                    </ListGroup.Item>
                ))}
            </ListGroup>
        </div>
    );
}

export default ListOfBoards;