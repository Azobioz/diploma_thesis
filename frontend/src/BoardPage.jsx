import { useParams } from "react-router-dom";
import HeaderPanel from "./HeaderPanel";
import Sidebar from "./SideBar";
import {useEffect, useState} from "react";
import axios from "axios";
import BoardElements from "./BoardElements";

function BoardPage() {
    const { boardId } = useParams();
    const [elements, setElements] = useState([]);

    useEffect(() => {
        axios.get(`http://localhost:8081/boards/${boardId}/elements`)
            .then(res => setElements(res.data));
    }, [boardId]);

    const loadElements = () => {
        axios
            .get(`http://localhost:8081/boards/${boardId}/elements`)
            .then(res => setElements(res.data))
    };

    useEffect(() => {
        loadElements();
    }, [boardId]);

    const addSquare = () => {
        const newElement = {
            type: "square",
            x: 1000,
            y: 50,
            width: 100,
            height: 100,
            color: "#61b2d6"
        };

        axios.post(`http://localhost:8081/boards/${boardId}/elements`, newElement)
            .then(res => setElements(prev => [...prev, res.data]));
    };

    const updateElement = async (elementId, width, height, x, y) => {
        await fetch(`http://localhost:8081/boards/${boardId}/elements/${elementId}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                width,
                height,
                x,
                y
            })
        });

    };

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
            <HeaderPanel/>
            <Sidebar onAddSquare={addSquare}/>
            <BoardElements
                elements={elements}
                onDragStop={updatePosition}
                onResizeStop={updateResize}
            />
        </div>
    );
}

export default BoardPage;