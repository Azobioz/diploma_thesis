import {Button} from "react-bootstrap";
import CreateBoardPanel from "./CreateBoardPanel";
import {useState} from "react"

function CreateBoardButton (name, backgroundColor) {

    const [showCreateBoardPanel, setShowCreateBoardPanel] = useState(false);

    return (
        <>
            <Button onClick={() => setShowCreateBoardPanel(prev => !prev)} className="create-board-button" variant="primary">
                <i className="bi bi-plus-lg"></i>
                Новая доска
            </Button>

            {showCreateBoardPanel && <CreateBoardPanel />}
        </>
    )
}

export default CreateBoardButton;