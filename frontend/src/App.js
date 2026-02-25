import { Routes, Route } from "react-router-dom";
import BoardPage from "./BoardPage"
import MainPage from "./MainPage";


function App() {
    return (
        <Routes>
            <Route path="/boards" element={<MainPage />} />
            <Route path="/boards/:boardId" element={<BoardPage />} />
        </Routes>
    );
}

export default App;