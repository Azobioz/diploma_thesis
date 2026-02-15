import { Rnd } from "react-rnd";

function BoardElement({ element, onDragStop, onResizeStop }) {

    return (
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
            // bounds="parent"
            style={{
                backgroundColor: element.color,
                border: "2px solid #333"
            }}
        />
    );
}

export default BoardElement;