import BoardElement from "./BoardElement";

function BoardElements({ elements, onDragStop, onResizeStop }) {
    return (
        <div className="board-element">
            {elements.map(el => (
                <BoardElement
                    key={el.id}
                    element={el}
                    onDragStop={onDragStop}
                    onResizeStop={onResizeStop}
                />
            ))}
        </div>
    );
}

export default BoardElements;