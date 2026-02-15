import BoardElement from "./BoardElement";

function BoardElements({ elements, onDragStop, onResizeStop, onTextChange, onDelete}) {
    return (
        <div className="board-element">
            {elements.map(el => (
                <BoardElement
                    key={el.id}
                    element={el}
                    onDragStop={onDragStop}
                    onResizeStop={onResizeStop}
                    onTextChange={onTextChange}
                    onDelete={onDelete}
                />
            ))}
        </div>
    );
}

export default BoardElements;