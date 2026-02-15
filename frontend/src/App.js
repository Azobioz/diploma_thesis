import { Routes, Route } from "react-router-dom";
import ListOfBoards from "./ListOfBoards";
import BoardPage from "./BoardPage"


function App() {
    return (
        <Routes>
            <Route path="/boards" element={<ListOfBoards />} />
            <Route path="/boards/:boardId" element={<BoardPage />} />
        </Routes>
    );
}

export default App;