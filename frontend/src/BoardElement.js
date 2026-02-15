import { Rnd } from "react-rnd";
import { useState, useEffect } from "react";
import ElementPanel from "./ElementPanel";

function BoardElement({
                          element,
                          onDragStop,
                          onResizeStop,
                          onTextChange,
                          onDelete
                      }) {

    const [editing, setEditing] = useState(false);
    const [text, setText] = useState(element.text || "");

    const [elementPanelVisible, setElementPanelVisible] = useState(false);
    const [panelPosition, setPanelPosition] = useState({ x: 0, y: 0 });

    useEffect(() => {
        setText(element.text || "");
    }, [element.text]);

    const handleRightClick = (e) => {
        e.preventDefault();
        setPanelPosition({ x: e.clientX, y: e.clientY });
        setElementPanelVisible(true);
    };

    const closeMenu = () => setElementPanelVisible(false);

    const renderShape = () => {

        const baseStyle = {
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            wordBreak: "break-word",
            pointerEvents: "auto",
            userSelect: editing ? "text" : "none",
            cursor: "default"
        };

        switch (element.type) {

            case "triangle":
                return (
                    <div
                        onDoubleClick={() => setEditing(true)}
                        style={{
                            ...baseStyle,
                            backgroundColor: element.color,
                            clipPath: "polygon(50% 0%, 0% 100%, 100% 100%)"
                        }}
                    >
                        {!editing && text}
                    </div>
                );

            default: // square
                return (
                    <div
                        className="no-drag"
                        onDoubleClick={() => setEditing(true)}
                        style={{
                            ...baseStyle,
                            backgroundColor: element.color
                        }}
                    >
                        {!editing && text}
                    </div>
                );
        }
    };

    return (
        <>
            <Rnd
                dragGrid={[1, 1]}
                resizeGrid={[1, 1]}
                minWidth={50}
                minHeight={50}
                size={{
                    width: element.width,
                    height: element.height
                }}
                position={{
                    x: element.x,
                    y: element.y
                }}
                onDragStop={(e, d) => {
                    onDragStop(element.id, d.x, d.y);
                }}
                onResizeStop={(e, direction, ref, delta, position) => {
                    onResizeStop(
                        element.id,
                        ref.offsetWidth,
                        ref.offsetHeight,
                        position.x,
                        position.y
                    );
                }}
                enableUserSelectHack={false}
                cancel={editing ? ".no-drag" : ""}
                onContextMenu={handleRightClick}
                style={{
                    border: "2px solid #333",
                    userSelect: editing ? "text" : "none",
                    cursor: "default"
                }}
            >
                <div style={{ width: "100%", height: "100%", position: "relative" }}>
                    {renderShape()}

                    {editing && (
                        <input
                            className="no-drag"
                            autoFocus
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            onBlur={() => {
                                setEditing(false);
                                onTextChange(element.id, text);
                            }}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                    setEditing(false);
                                    onTextChange(element.id, text);
                                }
                            }}
                            style={{
                                position: "absolute",
                                top: 0,
                                left: 0,
                                width: "100%",
                                height: "100%",
                                border: "none",
                                outline: "none",
                                textAlign: "center",
                                background: "transparent",
                                color: "black",
                                userSelect: "text"
                            }}
                        />
                    )}
                </div>
            </Rnd>

            <ElementPanel
                x={panelPosition.x}
                y={panelPosition.y}
                visible={elementPanelVisible}
                onDelete={() => {
                    onDelete(element.id);
                    closeMenu();
                }}
                onClose={closeMenu}
            />
        </>
    );
}

export default BoardElement;
