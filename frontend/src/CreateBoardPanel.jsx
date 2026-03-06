import {useState} from "react";
import axios from "axios";

function CreateBoardPanel({ setBoards, closePanel }) {
    const [name, setName] = useState("");

    const handleCreate = async () => {
        if (!name.trim()) return;

        try {
            const response = await axios.post("http://localhost:8081/boards/create", {
                name,
                background: "Color example"
            });

            const newBoard = response.data;

            // Добавляем доску в список сразу
            setBoards(prev => [...prev, newBoard]);

            // Очистка поля и закрытие панели
            setName("");
            closePanel();

        } catch (error) {
            console.error("Ошибка при создании доски:", error);
        }
    };

    return (
        <div className="create-board-panel">
            <h2>Создание новой доски</h2>
            <input
                type="text"
                placeholder="Название доски"
                value={name}
                onChange={(e) => setName(e.target.value)}
            />
            <input type="color" />
            <button onClick={handleCreate} className="create-button">
                Создать
            </button>
        </div>
    );
}

export default CreateBoardPanel;