import { Button } from "react-bootstrap";
import {useState} from "react";

function Sidebar({onAddSquare, onAddTriangle}) {

    const [showSubmenu, setShowSubmenu] = useState(false);

    return (
        <div className="board-side-bar">
            <Button onClick={() => setShowSubmenu(!showSubmenu)}>
                <i className="bi bi-circle-square"></i>
            </Button>

            {showSubmenu && (
                <div className="board-side-bar-submenu">
                    <Button onClick={onAddSquare}>
                        <i className="bi bi-app"></i>
                    </Button>
                    <Button onClick={onAddTriangle}>
                        <i className="bi bi-triangle"></i>
                    </Button>
                    <Button>🟡</Button>
                </div>
            )}

            <Button></Button>
            <Button></Button>
            <Button></Button>
        </div>
    );
}

export default Sidebar;