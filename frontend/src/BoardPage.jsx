import { useParams } from "react-router-dom";
import HeaderPanel from "./HeaderPanel";
import Sidebar from "./SideBar";
import {useEffect, useState} from "react";
import axios from "axios";
import BoardElements from "./BoardElements";

function BoardPage() {
    const { boardId } = useParams();
    const [elements, setElements] = useState([]);
    const [boardTitle, setBoardTitle] = useState("");


    useEffect(() => {
        axios.get(`http://localhost:8081/boards/${boardId}/elements`)
            .then(res => setElements(res.data));
    }, [boardId]);

    useEffect(() => {
        axios.get(`http://localhost:8081/boards/${boardId}`)
            .then(res => {
                setBoardTitle(res.data.name);
            });
    }, [boardId]);

    useEffect(() => {
        const loadElements = () => {
            axios
                .get(`http://localhost:8081/boards/${boardId}/elements`)
                .then(res => setElements(res.data));
        };

        loadElements();
    }, [boardId]);

    const updateBoardTitleInBoard = (newTitle) => {

        setBoardTitle(newTitle);

        axios.put(`http://localhost:8081/boards/${boardId}/edit`, {
            name: newTitle
        });
    };

    const createElement = (type, color) => {
        const newElement = {
            type,
            x: 300,
            y: 150,
            width: 120,
            height: 120,
            color,
            text: ""
        };

        axios
            .post(`http://localhost:8081/boards/${boardId}/elements`, newElement)
            .then(res => setElements(prev => [...prev, res.data]));
    };


    const addSquare = () => {
        createElement("square", "#61b2d6");
    };

    const addTriangle = () => {
        createElement("triangle", "#E8D79A");
    };

    // const updateElement = async (elementId, width, height, x, y) => {
    //     await fetch(`http://localhost:8081/boards/${boardId}/elements/${elementId}`, {
    //         method: "PUT",
    //         headers: {
    //             "Content-Type": "application/json"
    //         },
    //         body: JSON.stringify({
    //             width,
    //             height,
    //             x,
    //             y
    //         })
    //     });
    //
    // };

    const updatePosition = (elementId, x, y) => {

        setElements(prev =>
            prev.map(e =>
                e.id === elementId ? { ...e, x, y } : e
            )
        );

        const element = elements.find(e => e.id === elementId);
        if (!element) return;

        axios
            .put(
            `http://localhost:8081/boards/${boardId}/elements/${elementId}`,
            {
                ...element,
                x,
                y
            }
        );
    };

    const deleteElement = (elementId) => {
        setElements(prev => prev.filter(e => e.id !== elementId));

        axios.delete(`http://localhost:8081/boards/${boardId}/elements/${elementId}`)
            .then(() => {
                // обновляем состояние элементов после удаления
                setElements(prev => prev.filter(e => e.id !== elementId));
            });
    }

    const updateText = (elementId, text) => {
        const element = elements.find(e => e.id === elementId);
        if (!element) return;

        setElements(prev =>
            prev.map(e =>
                e.id === elementId ? { ...e, text } : e
            )
        );

        axios.put(
            `http://localhost:8081/boards/${boardId}/elements/${elementId}`,
            { ...element, text }
        );
    };

    const updateResize = (elementId, width, height, x, y) => {

        setElements(prev =>
            prev.map(e =>
                e.id === elementId
                    ? { ...e, width, height, x, y }
                    : e
            )
        );

        const element = elements.find(e => e.id === elementId);
        if (!element) return;

        axios
            .put(
            `http://localhost:8081/boards/${boardId}/elements/${elementId}`,
            {
                ...element,
                width,
                height,
                x,
                y
            }
        );
    };

    return (
        <div className="board-page">
            <HeaderPanel
                boardId={boardId}
                title={boardTitle}
                onTitleChange={updateBoardTitleInBoard}
            />
            <Sidebar onAddSquare={addSquare} onAddTriangle={addTriangle}/>
            <BoardElements
                elements={elements}
                onDragStop={updatePosition}
                onResizeStop={updateResize}
                onTextChange={updateText}
                onDelete={deleteElement}
            />
        </div>
    );
}

export default BoardPage;