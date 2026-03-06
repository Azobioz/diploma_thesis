import {Button} from "react-bootstrap";
import CreateBoardPanel from "./CreateBoardPanel";
import {useState} from "react"

function CreateBoardButton ({setBoards}) {

    const [showPanel, setShowPanel] = useState(false);

    return (
        <div>
            <Button
                variant="primary"
                onClick={() => setShowPanel(prev => !prev)}
                className="create-board-button"
            >
                <i className="bi bi-plus-lg"></i> Новая доска
            </Button>

            {showPanel && <CreateBoardPanel setBoards={setBoards} closePanel={() => setShowPanel(false)} />}
        </div>
    );
}

export default CreateBoardButton;