import ListOfBoards from "./ListOfBoards";
import CreateBoardButton from "./CreateBoardButton";
import axios from "axios";
import {useEffect, useState} from "react";

function MainPage() {

    const [boards, setBoards] = useState([]);

    // Загружаем доски один раз при монтировании
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
        <div>
            <CreateBoardButton setBoards={setBoards} />
            <ListOfBoards boards={boards} />
        </div>
    );
}

export default MainPage;