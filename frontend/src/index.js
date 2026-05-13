import React from 'react';
import ReactDOM from 'react-dom/client';
import 'bootstrap/dist/css/bootstrap.min.css';
import {BrowserRouter} from "react-router-dom";
import App from "./App";
import "bootstrap-icons/font/bootstrap-icons.css";
import './designs/AuthPage.css';
import  './designs/UserListDropdown.css'
import './designs/NotificationPanel.css'
import './designs/ProfilePanel.css'
import './designs/CreateBoardPanel.css'
import './designs/BoardFilters.css'
import './designs/CreateSpacePanel.css'
import './designs/InvitePanel.css'
import './designs/InvitePage.css'
import './designs/SpaceLeftSidebar.css'
import './designs/BoardInfoPanel.css'
import './designs/EditBoardPanel.css'
import './designs/BoardRow.css'
import './designs/ProfilePage.css'
import './designs/TasksPage.css';
import './designs/CreateTaskListPanel.css'
import './designs/CreateTaskPanel.css'

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
    <React.StrictMode>
        <BrowserRouter>
            <App />
        </BrowserRouter>
    </React.StrictMode>
);


