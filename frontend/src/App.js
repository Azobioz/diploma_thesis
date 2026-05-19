import React from 'react';
import {Routes, Route, Navigate } from 'react-router-dom';
import './designs/authpage/AuthPage.css';
import './designs/spacepage/SpacePage.css'
import AuthPage from "./pages/AuthPage";
import SpacePage from "./pages/SpacePage";
import InvitePage from "./pages/InvitePage";
import ProfilePage from "./pages/ProfilePage";
import TasksPage from "./pages/TasksPage";
import BoardPage from "./pages/BoardPage";

function App() {
    return (
        <Routes>
            <Route path="/boardiox/auth" element={<AuthPage />} />
            <Route path="/boardiox/spaces/:spaceId" element={<SpacePage />} />
            <Route path="*" element={<Navigate to="/boardiox/auth" replace />} />
            <Route path="/boardiox/spaces/:spaceId/boards/:boardId" element={<BoardPage />} />
            <Route path="/boardiox/profile/:userId" element={<ProfilePage />} />
            <Route path="/boardiox/invite/:token" element={<InvitePage />} />
            <Route path="/boardiox/spaces/:spaceId/boards/:boardId/tasks" element={<TasksPage />} />

        </Routes>
    );
}

export default App;