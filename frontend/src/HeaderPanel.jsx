import Container from 'react-bootstrap/Container';
import Nav from 'react-bootstrap/Nav';
import Navbar from 'react-bootstrap/Navbar';
import {Link} from "react-router-dom";
import {useEffect, useState} from "react";

function HeaderPanel({boardId, title, onTitleChange}) {

    const [editing, setEditing] = useState(false);
    const [localTitle, setLocalTitle] = useState(title);

    // если название изменилось снаружи — обновляем
    useEffect(() => {
        setLocalTitle(title);
    }, [title]);

    const saveTitle = () => {
        setEditing(false);
        if (localTitle.trim() !== "") {
            onTitleChange(localTitle);
        }
    };

    return (
        <Navbar className="board-page-header-navbar">
            <Container>
                <Nav className="lines-between-buttons">
                    <Navbar.Brand as={Link} to="/boards">
                        Diploma Thesis
                    </Navbar.Brand>

                    {editing ? (
                        <input
                            autoFocus
                            value={localTitle}
                            onChange={(e) => setLocalTitle(e.target.value)}
                            onBlur={saveTitle}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                    saveTitle();
                                }
                            }}
                            className="board-title-input"
                        />
                    ) : (
                        <div
                            onClick={() => setEditing(true)}
                            className="board-title"
                        >
                            {title}
                        </div>
                    )}
                </Nav>
            </Container>
        </Navbar>
    );
}

export default HeaderPanel;