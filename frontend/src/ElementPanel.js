import React from "react";

function ElementPanel({ x, y, visible, onDelete, onClose }) {
    if (!visible) return null;

    const panelStyle = {
        position: "absolute",
        top: y,
        left: x,
        backgroundColor: "#fff",
        border: "1px solid #333",
        borderRadius: "8px",
        padding: "10px",
        display: "grid",
        gridTemplateColumns: "repeat(2, 1fr)", // 2 кнопки в ряд
        gap: "10px",
        zIndex: 1000,
        boxShadow: "0 4px 6px rgba(0,0,0,0.2)"
    };

    const buttonStyle = {
        padding: "8px 12px",
        borderRadius: "6px",
        border: "none",
        cursor: "pointer",
        backgroundColor: "#61b2d6",
        color: "#fff",
        fontWeight: "bold"
    };

    return (
        <div style={panelStyle} onMouseLeave={onClose}>
            <button style={buttonStyle} onClick={onDelete}>Удалить</button>
            <button style={buttonStyle} onClick={() => alert("Кнопка 2")}>Кнопка 2</button>
            <button style={buttonStyle} onClick={() => alert("Кнопка 3")}>Кнопка 3</button>
            <button style={buttonStyle} onClick={() => alert("Кнопка 4")}>Кнопка 4</button>
        </div>
    );
}

export default ElementPanel;