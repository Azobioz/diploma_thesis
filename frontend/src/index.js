import React from 'react';
import ReactDOM from 'react-dom/client';
import 'bootstrap/dist/css/bootstrap.min.css';
import {BrowserRouter} from "react-router-dom";
import App from "./App";
import "bootstrap-icons/font/bootstrap-icons.css";
import './designs/authpage/AuthPage.css';
import  './designs/spacepage/UserListDropdown.css'
import './designs/spacepage/NotificationPanel.css'
import './designs/profilepage/ProfilePanel.css'
import './designs/spacepage/CreateBoardPanel.css'
import './designs/spacepage/BoardFilters.css'
import './designs/spacepage/CreateSpacePanel.css'
import './designs/spacepage/InvitePanel.css'
import './designs/spacepage/InvitePage.css'
import './designs/spacepage/SpaceLeftSidebar.css'
import './designs/spacepage/BoardInfoPanel.css'
import './designs/spacepage/EditBoardPanel.css'
import './designs/spacepage/BoardRow.css'
import './designs/profilepage/ProfilePage.css'
import './designs/taskpage/TasksPage.css';
import './designs/taskpage/CreateTaskListPanel.css'
import './designs/taskpage/CreateTaskPanel.css'
import './designs/taskpage/TaskDetailPanel.css'
import './designs/boardpage/BoardPage.css'

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
    <React.StrictMode>
        <BrowserRouter>
            <App />
        </BrowserRouter>
    </React.StrictMode>
);


