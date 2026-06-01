import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const BoardPage = () => {



    const { spaceId, boardId } = useParams();
    const navigate = useNavigate();
    const [boardData, setBoardData] = useState(null);
    const [loading, setLoading] = useState(true);
    
    // Current user info from localStorage
    const currentUserId = localStorage.getItem('userId') ? parseInt(localStorage.getItem('userId')) : null;

    // Board and space creator IDs for permission checks
    const [boardCreatorId, setBoardCreatorId] = useState(null);
    const [spaceCreatorId, setSpaceCreatorId] = useState(null);

    // Cache for user avatars and nicknames
    const [userCache, setUserCache] = useState({});
    const fetchedUserIdsRef = useRef(new Set()); // Track which users have been fetched

    // Fetch user info (avatar and nickname) for a given userId
    const fetchUserInfo = async (userId) => {
        if (!userId || fetchedUserIdsRef.current.has(userId)) {
            console.log('Skipping fetch for userId:', userId);
            return; // Skip if already fetched
        }

        // Mark as fetched immediately to prevent duplicate requests
        fetchedUserIdsRef.current.add(userId);

        try {
            console.log('Fetching user info for userId:', userId);
            const token = localStorage.getItem('accessToken');
            const response = await fetch(`http://localhost:8081/boardiox/users/${userId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const userData = await response.json();
                console.log('Fetched user data:', userData);
                setUserCache(prev => ({
                    ...prev,
                    [userId]: {
                        nickname: userData.nickname,
                        avatar: userData.avatar // base64 string
                    }
                }));
            } else {
                console.error('Failed to fetch user info, status:', response.status);
                // Remove from fetched set so we can retry
                fetchedUserIdsRef.current.delete(userId);
            }
        } catch (err) {
            console.error('Error fetching user info:', err);
            // Remove from fetched set so we can retry
            fetchedUserIdsRef.current.delete(userId);
        }
    };

    // Состояния для панелей
    const [selectedTool, setSelectedTool] = useState(null);
    const [showShapesMenu, setShowShapesMenu] = useState(false);
    const [imageFile, setImageFile] = useState(null);
    const [isUploadingImage, setIsUploadingImage] = useState(false);
    const fileInputRef = useRef(null);

    // Состояния для панорамирования и масштабирования
    const [scale, setScale] = useState(1);
    const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
    const [isPanning, setIsPanning] = useState(false);
    const [panStart, setPanStart] = useState({ x: 0, y: 0 });

    // Состояния для элементов на доске
    const [elements, setElements] = useState([]);
    const [selectedElementId, setSelectedElementId] = useState(null);

    // Перемещение элемента
    const [isDraggingElement, setIsDraggingElement] = useState(false);
    const [dragElementStart, setDragElementStart] = useState({ x: 0, y: 0 });
    const [dragElementOffset, setDragElementOffset] = useState({ x: 0, y: 0 });

    // Масштабирование элемента
    const [isResizing, setIsResizing] = useState(false);
    const [activeHandle, setActiveHandle] = useState(null);
    const [resizeStart, setResizeStart] = useState({ x: 0, y: 0 });
    const [resizeInitial, setResizeInitial] = useState({ x: 0, y: 0, width: 0, height: 0 });

    // Состояния для панели форматирования и редактирования текста
    const [showFormatPanel, setShowFormatPanel] = useState(false);
    const [isEditingText, setIsEditingText] = useState(false);
    const [editText, setEditText] = useState('');

    // Состояния для панелей форматирования
    const [showBorderPanel, setShowBorderPanel] = useState(false);
    const [showColorPicker, setShowColorPicker] = useState(false);

    // Состояния для инструментов рисования
    const [showDrawingPanel, setShowDrawingPanel] = useState(false);
    const [drawingTool, setDrawingTool] = useState(null); // 'pencil', 'eraser', 'lasso'
    const [drawingSize, setDrawingSize] = useState(1); // 1: small (default), 2: medium, 3: large
    const [drawingColor, setDrawingColor] = useState('#000000'); // black (default)
    const [isDrawing, setIsDrawing] = useState(false);
    const [drawPoints, setDrawPoints] = useState([]);
    const drawingCanvasRef = useRef(null);
    const [lassoPoints, setLassoPoints] = useState([]);
    const [isLassoSelecting, setIsLassoSelecting] = useState(false);
    const [multiSelectedElements, setMultiSelectedElements] = useState([]); // For lasso multi-selection

    // Comment tool states
    const [showCommentPopup, setShowCommentPopup] = useState(false);
    const [showCommentInput, setShowCommentInput] = useState(false);
    const [commentPosition, setCommentPosition] = useState({ x: 0, y: 0 });
    const [isAddingComment, setIsAddingComment] = useState(false);
    const [commentText, setCommentText] = useState('');
    const [expandedCommentId, setExpandedCommentId] = useState(null); // Track which comment is expanded
    const [replyingToCommentId, setReplyingToCommentId] = useState(null); // Track which comment we're replying to
    const [replyText, setReplyText] = useState(''); // Reply text input
    const [commentMenuId, setCommentMenuId] = useState(null); // Track which comment menu is open

    const canvasRef = useRef(null);
    const textInputRef = useRef(null);
    const formatPanelRef = useRef(null);

    // Загрузка данных доски и элементов
    useEffect(() => {
        const fetchBoardData = async () => {
            try {
                const token = localStorage.getItem('accessToken');

                // Fetch space data to get space creator
                const spaceResponse = await fetch(`http://localhost:8081/boardiox/spaces/${spaceId}`, {
                    headers: { 'Authorization': `Bearer ${token}` },
                });

                if (spaceResponse.ok) {
                    const spaceData = await spaceResponse.json();
                    setSpaceCreatorId(spaceData.spaceCreatedByUserId);
                }

                const boardResponse = await fetch(`http://localhost:8081/boardiox/spaces/${spaceId}/boards/${boardId}`, {
                    headers: { 'Authorization': `Bearer ${token}` },
                });

                if (boardResponse.ok) {
                    const data = await boardResponse.json();
                    setBoardData(data);
                    setBoardCreatorId(data.boardCreatedByUserId);
                } else {
                    navigate(`/boardiox/spaces/${spaceId}`);
                    return;
                }

                const elementsResponse = await fetch(`http://localhost:8081/boardiox/boards/${boardId}/elements`, {
                    headers: { 'Authorization': `Bearer ${token}` },
                });

                if (elementsResponse.ok) {
                    const elementsData = await elementsResponse.json();
                    setElements(elementsData);
                    console.log("elements after response", elements)
                }
            } catch (err) {
                console.error('Error fetching board:', err);
                navigate(`/boardiox/spaces/${spaceId}`);
            } finally {
                setLoading(false);
            }
        };

        fetchBoardData();
    }, [spaceId, boardId, navigate]);

    // Fetch user info for all comments when elements change or on initial load
    useEffect(() => {
        if (!elements || elements.length === 0) return;
        
        const commentElements = elements.filter(el => el.type === 'COMMENT');
        console.log('Found comment elements:', commentElements.length);
        
        commentElements.forEach(commentEl => {
            const userId = commentEl.element?.userId;
            console.log('Comment userId:', userId, 'Already fetched:', fetchedUserIdsRef.current.has(userId));
            
            if (userId && !fetchedUserIdsRef.current.has(userId)) {
                console.log('Need to fetch user info for userId:', userId);
                fetchUserInfo(userId);
            }
        });
    }, [elements]);

    // Фокус на textarea при начале редактирования
    useEffect(() => {
        if (isEditingText && textInputRef.current) {
            textInputRef.current.focus();
        }
    }, [isEditingText]);

    // Закрытие панелей при клике вне
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (formatPanelRef.current && !formatPanelRef.current.contains(e.target)) {
                setShowBorderPanel(false);
                setShowColorPicker(false);
            }
            
            // Cancel reply if clicking outside comment panel
            if (replyingToCommentId) {
                const commentElement = e.target.closest('.comment-element');
                if (!commentElement) {
                    handleCancelReply();
                }
            }
            
            // Close comment menu if clicking outside
            if (commentMenuId) {
                const menuElement = e.target.closest('.comment-thread-menu-wrapper');
                if (!menuElement) {
                    setCommentMenuId(null);
                }
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [replyingToCommentId, commentMenuId]);

    // Обработчик клавиши Escape для деактивации инструментов рисования
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                if (drawingTool) {
                    deactivateDrawingTool();
                }
                if (isAddingComment) {
                    setIsAddingComment(false);
                    setSelectedTool(null);
                    setShowCommentInput(false);
                    setCommentText('');
                }
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [drawingTool, isAddingComment]);

    const handleLogoClick = () => navigate(`/boardiox/spaces/${spaceId}`);

    // Check if current user can delete a comment
    const canDeleteComment = (commentUserId) => {
        if (!currentUserId) return false;
        
        // User who created the comment can delete it
        if (commentUserId === currentUserId) return true;
        
        // Board creator can delete any comment
        if (boardCreatorId && boardCreatorId === currentUserId) return true;
        
        // Space creator can delete any comment
        if (spaceCreatorId && spaceCreatorId === currentUserId) return true;
        
        return false;
    };

    const handleToolClick = (toolId) => {
        if (toolId === 'shapes') {
            setShowShapesMenu(prev => !prev);
            setSelectedTool(prev => prev === 'shapes' ? null : toolId);
        } else {
            setShowShapesMenu(false);
            setSelectedTool(prev => prev === toolId ? null : toolId);
        }
    };

    const getCenterScreenCoords = () => {
        const canvas = canvasRef.current;
        if (!canvas) return { x: 0, y: 0 };
        const rect = canvas.getBoundingClientRect();
        const centerX = (rect.width / 2 - panOffset.x) / scale;
        const centerY = (rect.height / 2 - panOffset.y) / scale;
        return { x: centerX, y: centerY };
    };

    const createShape = async (shapeType) => {
        const center = getCenterScreenCoords();
        const token = localStorage.getItem('accessToken');

        const request = {
            x: Math.round(center.x - 50),
            y: Math.round(center.y - 50),
            z: 0,
            width: 100,
            height: 100,
            color: '#64B5F6',
            borderColor: '#000000',
            fillColor: '#64B5F6',
            text: '',
            shapeType: shapeType
        };

        try {
            const response = await fetch(`http://localhost:8081/boardiox/boards/${boardId}/elements/shape`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify(request),
            });

            if (response.ok) {
                const newElement = await response.json();
                setElements(prev => [...prev, newElement]);
            }
        } catch (err) {
            console.error('Error creating shape:', err);
        }

        setShowShapesMenu(false);
        setSelectedTool(null);
    };

    const createArrow = async () => {
        const center = getCenterScreenCoords();
        const token = localStorage.getItem('accessToken');

        const request = {
            startX: Math.round(center.x - 50),
            startY: Math.round(center.y - 50),
            endX: Math.round(center.x + 50),
            endY: Math.round(center.y + 50),
            x: Math.round(center.x - 50),
            y: Math.round(center.y - 50),
            z: 0,
            width: 100,
            height: 100,
            color: '#64B5F6'
        };

        try {
            const response = await fetch(`http://localhost:8081/boardiox/boards/${boardId}/elements/arrow`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify(request),
            });

            if (response.ok) {
                const newElement = await response.json();
                setElements(prev => [...prev, newElement]);
            }
        } catch (err) {
            console.error('Error creating arrow:', err);
        }

        setShowShapesMenu(false);
        setSelectedTool(null);
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            alert('Please select an image file');
            return;
        }

        setIsUploadingImage(true);
        const center = getCenterScreenCoords();
        const token = localStorage.getItem('accessToken');

        const formData = new FormData();
        formData.append('file', file);
        formData.append('x', Math.round(center.x - 100));
        formData.append('y', Math.round(center.y - 100));
        formData.append('z', 0);
        formData.append('width', 200);
        formData.append('height', 200);
        formData.append('color', '#ffffff');




// After: Panel only shows for SHAPE elements


        try {
            const response = await fetch(`http://localhost:8081/boardiox/boards/${boardId}/elements/image`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData,
            });

            if (response.ok) {
                const newElement = await response.json();
                console.log('Image element created:', newElement);
                // Reactively add the new element to the board
                setElements(prev => {
                    const updated = [...prev, newElement];
                    console.log('Updated elements:', updated);
                    return updated;
                });
            } else {
                const errorText = await response.text();
                console.error('Server error:', errorText);
                alert('Failed to upload image: ' + errorText);
            }
        } catch (err) {
            console.error('Error creating image:', err);
            alert('Error uploading image: ' + err.message);
        } finally {
            setIsUploadingImage(false);
            // Reset file input
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
            setSelectedTool(null);
        }
    };

    const handleImageToolClick = () => {
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    const handleTextToolClick = async () => {
        const center = getCenterScreenCoords();
        const token = localStorage.getItem('accessToken');

        const request = {
            x: Math.round(center.x - 100),
            y: Math.round(center.y - 25),
            z: 0,
            width: 200,
            height: 50,
            color: '#000000',
            content: 'Новый текст',
            fontSize: 24,
            fontFamily: 'Noto Sans'
        };

        try {
            const response = await fetch(`http://localhost:8081/boardiox/boards/${boardId}/elements/text`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify(request),
            });

            if (response.ok) {
                const newElement = await response.json();
                setElements(prev => [...prev, newElement]);
                setSelectedElementId(newElement.id);
                setShowFormatPanel(true);
                setIsEditingText(true);
                setEditText(newElement.element?.content || 'Новый текст');
            }
        } catch (err) {
            console.error('Error creating text:', err);
        }

        setSelectedTool(null);
    };

    const handleDrawingToolClick = () => {
        setShowDrawingPanel(prev => !prev);
        setSelectedTool(prev => prev === 'drawing' ? null : 'drawing');
    };

    const selectDrawingTool = (tool) => {
        setDrawingTool(tool);
        setShowDrawingPanel(false);
        
        // Change cursor based on tool
        const canvas = canvasRef.current;
        if (tool === 'pencil') {
            if (canvas) canvas.style.cursor = 'crosshair';
        } else if (tool === 'eraser') {
            if (canvas) canvas.style.cursor = 'cell';
        } else if (tool === 'lasso') {
            if (canvas) canvas.style.cursor = 'default';
        }
    };

    const deactivateDrawingTool = () => {
        setDrawingTool(null);
        const canvas = canvasRef.current;
        if (canvas) canvas.style.cursor = 'default';
        setIsDrawing(false);
        setDrawPoints([]);
        setLassoPoints([]);
        setIsLassoSelecting(false);
        setMultiSelectedElements([]);
    };

    // === COMMENT TOOL HANDLERS ===
    const handleCommentToolClick = () => {
        // Show comment popup at center of screen
        setIsAddingComment(!isAddingComment);
        setSelectedTool('comment');
        setShowCommentInput(false);
        setCommentText('');
    };

    const handleCreateComment = async () => {
        if (!commentText.trim()) {
            setShowCommentInput(false);
            setIsAddingComment(false);
            setSelectedTool(null);
            return;
        }

        const token = localStorage.getItem('accessToken');
        const canvas = canvasRef.current;
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        const x = (commentPosition.x - rect.left - panOffset.x) / scale;
        const y = (commentPosition.y - rect.top - panOffset.y) / scale;

        const request = {
            x: Math.round(x - 100),
            y: Math.round(y - 25),
            z: 0,
            width: 200,
            height: 50,
            message: commentText
        };

        try {
            const response = await fetch(`http://localhost:8081/boardiox/boards/${boardId}/elements/comment`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'X-User-Id': currentUserId || '1'
                },
                body: JSON.stringify(request),
            });

            if (response.ok) {
                const newElement = await response.json();
                setElements(prev => [...prev, newElement]);
            }
        } catch (err) {
            console.error('Error creating comment:', err);
        } finally {
            setShowCommentInput(false);
            setIsAddingComment(false);
            setSelectedTool(null);
            setCommentText('');
        }
    };

    // Handle delete comment element
    const handleDeleteComment = async (commentElementId) => {
        const token = localStorage.getItem('accessToken');
        
        try {
            const response = await fetch(`http://localhost:8081/boardiox/boards/${boardId}/elements/${commentElementId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (response.ok) {
                // Remove the comment element reactively
                setElements(prev => prev.filter(el => el.id !== commentElementId));
                setExpandedCommentId(null);
                setCommentMenuId(null);
            } else {
                console.error('Failed to delete comment');
            }
        } catch (err) {
            console.error('Error deleting comment:', err);
        }
    };

    const handleCancelComment = () => {
        setShowCommentPopup(false);
        setCommentText('');
        setSelectedTool(null);
    };

    // Handle reply submission
    const handleReplySubmit = async (commentElementId) => {
        if (!replyText.trim()) return;
        
        const token = localStorage.getItem('accessToken');
        
        try {
            // Find the comment element
            const commentElement = elements.find(el => el.id === commentElementId);
            if (!commentElement) return;
            
            // Create reply object
            const newReply = {
                userId: currentUserId,
                message: replyText.trim(),
                createdAt: new Date().toISOString()
            };
            
            // Update the comment element with the new reply
            const updatedReplies = [...(commentElement.element?.replies || []), newReply];
            const updatedElement = {
                ...commentElement,
                element: {
                    ...commentElement.element,
                    replies: updatedReplies
                }
            };
            
            // Update local state immediately for reactive display
            setElements(prev => prev.map(el => 
                el.id === commentElementId ? updatedElement : el
            ));
            
            // Save to server
            const response = await fetch(`http://localhost:8081/boardiox/boards/${boardId}/elements/${commentElementId}`, {
                method: 'PUT',
                headers: { 
                    'Authorization': `Bearer ${token}`, 
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    x: commentElement.x,
                    y: commentElement.y,
                    z: commentElement.z || 0,
                    width: commentElement.width,
                    height: commentElement.height,
                    color: commentElement.color,
                    message: commentElement.element?.message,
                    userId: commentElement.element?.userId,
                    createdAt: commentElement.element?.createdAt,
                    replies: updatedReplies
                }),
            });
            
            if (response.ok) {
                const serverUpdatedElement = await response.json();
                // Update with server response to ensure consistency
                setElements(prev => prev.map(el => 
                    el.id === commentElementId ? serverUpdatedElement : el
                ));
            } else {
                console.error('Failed to save reply:', await response.text());
            }
            
            // Clear reply mode
            setReplyText('');
            setReplyingToCommentId(null);
        } catch (err) {
            console.error('Error submitting reply:', err);
        }
    };

    // Cancel reply
    const handleCancelReply = () => {
        setReplyText('');
        setReplyingToCommentId(null);
    };

    // Вспомогательные функции для рисования
    const calculateBoundingBox = (points) => {
        if (!points || points.length === 0) return { minX: 0, minY: 0, width: 0, height: 0 };
        
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        
        points.forEach(point => {
            minX = Math.min(minX, point.x);
            minY = Math.min(minY, point.y);
            maxX = Math.max(maxX, point.x);
            maxY = Math.max(maxY, point.y);
        });
        
        return {
            minX,
            minY,
            width: maxX - minX,
            height: maxY - minY
        };
    };

    const findElementsInsideLasso = (lassoPoints, allElements) => {
        if (!lassoPoints || lassoPoints.length < 3) return [];
        
        return allElements.filter(element => {
            // Проверяем, находится ли центр элемента внутри полигона лассо
            const centerX = element.x + element.width / 2;
            const centerY = element.y + element.height / 2;
            
            return isPointInPolygon({ x: centerX, y: centerY }, lassoPoints);
        });
    };

    const isPointInPolygon = (point, polygon) => {
        let inside = false;
        for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
            const xi = polygon[i].x, yi = polygon[i].y;
            const xj = polygon[j].x, yj = polygon[j].y;
            
            const intersect = ((yi > point.y) !== (yj > point.y))
                && (point.x < (xj - xi) * (point.y - yi) / (yj - yi) + xi);
            if (intersect) inside = !inside;
        }
        return inside;
    };

    // === ОБРАБОТЧИКИ РИСОВАНИЯ ===
    const handleDrawMouseDown = (e) => {
        if (!drawingTool || isPanning || isResizing || isDraggingElement) return;
        
        const canvas = canvasRef.current;
        if (!canvas) return;
        
        const rect = canvas.getBoundingClientRect();
        const x = (e.clientX - rect.left - panOffset.x) / scale;
        const y = (e.clientY - rect.top - panOffset.y) / scale;
        
        if (drawingTool === 'pencil' || drawingTool === 'eraser') {
            setIsDrawing(true);
            setDrawPoints([{ x, y }]);
        } else if (drawingTool === 'lasso') {
            setIsLassoSelecting(true);
            setLassoPoints([{ x, y }]);
        }
    };

    const handleDrawMouseMove = (e) => {
        if (!drawingTool || isPanning || isResizing || isDraggingElement) return;
        
        const canvas = canvasRef.current;
        if (!canvas) return;
        
        const rect = canvas.getBoundingClientRect();
        const x = (e.clientX - rect.left - panOffset.x) / scale;
        const y = (e.clientY - rect.top - panOffset.y) / scale;
        
        if (isDrawing && drawingTool === 'pencil') {
            setDrawPoints(prev => [...prev, { x, y }]);
        } else if (isDrawing && drawingTool === 'eraser') {
            // Стиралка - просто точка, добавляем текущую позицию
            setDrawPoints(prev => [...prev, { x, y }]);
        } else if (isLassoSelecting && drawingTool === 'lasso') {
            setLassoPoints(prev => [...prev, { x, y }]);
        }
    };

    const handleDrawMouseUp = async () => {
        if (!drawingTool) return;
        
        if (isDrawing && drawingTool === 'pencil' && drawPoints.length > 1) {
            // Сохраняем рисунок на сервер
            const token = localStorage.getItem('accessToken');
            const boundingBox = calculateBoundingBox(drawPoints);
            
            const request = {
                x: boundingBox.minX,
                y: boundingBox.minY,
                z: 0,
                width: boundingBox.width,
                height: boundingBox.height,
                color: drawingColor,
                strokeWidth: drawingSize === 1 ? 2 : drawingSize === 2 ? 4 : 6,
                points: drawPoints
            };
            
            try {
                const response = await fetch(`http://localhost:8081/boardiox/boards/${boardId}/elements/drawing`, {
                    method: 'POST',
                    headers: { 
                        'Authorization': `Bearer ${token}`, 
                        'Content-Type': 'application/json' 
                    },
                    body: JSON.stringify(request),
                });
                
                if (response.ok) {
                    const newElement = await response.json();
                    setElements(prev => [...prev, newElement]);
                }
            } catch (err) {
                console.error('Error saving drawing:', err);
            }
            
            setDrawPoints([]);
        } else if (isDrawing && drawingTool === 'eraser') {
            // Удаляем рисунки, которые пересекаются с точками стирания
            const token = localStorage.getItem('accessToken');
            
            // Находим рисунки для удаления из elements массива
            const drawingElements = elements.filter(el => el.type === 'DRAWING');
            const drawingsToDelete = drawingElements.filter(drawingElement => {
                if (!drawingElement.element?.pointsData) return false;
                
                try {
                    const points = JSON.parse(drawingElement.element.pointsData);
                    return drawPoints.some(point => 
                        points.some(dp => 
                            Math.abs(dp.x - point.x) < 15 && Math.abs(dp.y - point.y) < 15
                        )
                    );
                } catch (err) {
                    return false;
                }
            });
            
            // Удаляем с сервера
            for (const drawing of drawingsToDelete) {
                try {
                    await fetch(`http://localhost:8081/boardiox/boards/${boardId}/elements/${drawing.id}`, {
                        method: 'DELETE',
                        headers: { 'Authorization': `Bearer ${token}` },
                    });
                } catch (err) {
                    console.error('Error deleting drawing:', err);
                }
            }
            
            // Обновляем локальное состояние - удаляем из elements
            setElements(prev => prev.filter(el => !drawingsToDelete.some(d => d.id === el.id)));
            setDrawPoints([]);
        } else if (isLassoSelecting && drawingTool === 'lasso' && lassoPoints.length > 2) {
            // Lasso selection - find all elements inside the polygon
            const selectedElements = findElementsInsideLasso(lassoPoints, elements);
            if (selectedElements.length > 0) {
                // Select multiple elements
                setMultiSelectedElements(selectedElements.map(el => el.id));
                // Set the first element as the primary selected element
                setSelectedElementId(selectedElements[0].id);
                setShowFormatPanel(true);
            }
            setLassoPoints([]);
        }
        
        setIsDrawing(false);
        setIsLassoSelecting(false);
    };

    // Сохранение элементов на сервере
    const saveElementToServer = async (element) => {
        if (!element) return;

        console.log('saveElementToServer called for:', element.type, 'Element ID:', element.id);
        console.log('Element data:', { x: element.x, y: element.y, width: element.width, height: element.height });

        // Check if user has permission to modify this element
        if (element.type === 'COMMENT') {
            const commentUserId = element.element?.userId;
            console.log('Comment save permission check - commentUserId:', commentUserId, 'currentUserId:', currentUserId);
            
            // Block if current user is not logged in
            if (!currentUserId) {
                console.log('Cannot save comment: user not logged in');
                return;
            }
            
            // Only block if userId exists AND doesn't match current user
            if (commentUserId !== undefined && commentUserId !== null && commentUserId !== currentUserId) {
                console.log('Cannot save comment: owned by user', commentUserId, 'current user is', currentUserId);
                return; // Don't save if user doesn't own the comment
            }
            
            console.log('Allowing comment save - owned by current user');
        }

        const token = localStorage.getItem('accessToken');
        
        // Handle IMAGE elements
        if (element.type === 'IMAGE') {
            console.log('Saving IMAGE element to server...');
            const response = await fetch(`http://localhost:8081/boardiox/boards/${boardId}/elements/${element.id}`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    x: element.x,
                    y: element.y,
                    z: element.z || 0,
                    width: element.width,
                    height: element.height,
                    color: element.color
                }),
            });

            if (response.ok) {
                const updatedElement = await response.json();
                console.log('Server response - updated element:', updatedElement);
                setElements(prevElements =>
                    prevElements.map(el => el.id === updatedElement.id ? updatedElement : el)
                );
            } else {
                const errorText = await response.text();
                console.error('Failed to update image element:', errorText);
            }
            return;
        }

        // Handle TEXT elements
        if (element.type === 'TEXT') {
            console.log('Saving TEXT element to server...');
            const response = await fetch(`http://localhost:8081/boardiox/boards/${boardId}/elements/text/${element.id}`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    x: element.x,
                    y: element.y,
                    z: element.z || 0,
                    width: element.width,
                    height: element.height,
                    color: element.color,
                    content: element.element?.content ?? '',
                    fontSize: element.element?.fontSize ?? 24,
                    fontFamily: element.element?.fontFamily ?? 'Noto Sans',
                    isBold: element.element?.isBold ?? false,
                    isUnderline: element.element?.isUnderline ?? false
                }),
            });

            if (response.ok) {
                const updatedElement = await response.json();
                console.log('Server response - updated text element:', updatedElement);
                setElements(prevElements =>
                    prevElements.map(el => el.id === updatedElement.id ? updatedElement : el)
                );
            } else {
                const errorText = await response.text();
                console.error('Failed to update text element:', errorText);
            }
            return;
        }

        // Handle COMMENT elements
        if (element.type === 'COMMENT') {
            console.log('Saving COMMENT element to server...');
            const response = await fetch(`http://localhost:8081/boardiox/boards/${boardId}/elements/${element.id}`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    x: element.x,
                    y: element.y,
                    z: element.z || 0,
                    width: element.width,
                    height: element.height,
                    color: element.color
                }),
            });

            if (response.ok) {
                const updatedElement = await response.json();
                console.log('Server response - updated comment element:', updatedElement);
                setElements(prevElements =>
                    prevElements.map(el => el.id === updatedElement.id ? updatedElement : el)
                );
            } else {
                const errorText = await response.text();
                console.error('Failed to update comment element:', errorText);
            }
            return;
        }

        // Handle SHAPE elements
        if (element.type !== 'SHAPE') return;
        const response = await fetch(`http://localhost:8081/boardiox/boards/${boardId}/elements/shape/${element.id}`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                x: element.x,
                y: element.y,
                z: 0,
                width: element.width,
                height: element.height,
                color: element.color,
                borderColor: element.element?.borderColor ?? '#000000',
                fillColor: element.element?.fillColor ?? '#64B5F6',
                text: element.element?.text ?? '',
                fontSize: element.element?.fontSize ?? 64,
                fontFamily: element.element?.fontFamily ?? 'Noto Sans',
                isBold: element.element?.isBold ?? false,
                isUnderline: element.element?.isUnderline ?? false,
                borderWidth: element.element?.borderWidth ?? 1,
                shapeType: element.element?.shapeType ?? 'SQUARE'
            }),
        });

        if (response.ok) {
            const updatedElement = await response.json()
            console.log("updatedElement", updatedElement)
            console.log("elements", elements)
            setElements(prevElements =>
                prevElements.map(el => {
                    if (el.id === updatedElement.id) {
                        return updatedElement;
                    }
                    return el;
                })
            );

        }
        else {
            console.error('Failed to update element:', await response.text());
        }
    };

    // === Обновление формата текста ===
    const updateTextFormat = async (elementId, updates) => {
        const element = elements.find(el => el.id === elementId);
        if (!element || (element.type !== 'SHAPE' && element.type !== 'TEXT')) return;

        console.log('updateTextFormat called for element:', elementId, 'type:', element.type);
        console.log('Updates:', updates);
        console.log('Current element.element:', element.element);

        // Обновляем только выбранный элемент
        const updatedElement = {
            ...element,
            element: {
                ...element.element,
                ...updates
            }
        };

        console.log('Updated element:', updatedElement);
        setElements(prev => prev.map(el => el.id === elementId ? updatedElement : el));
        await saveElementToServer(updatedElement);
    };

    // === Обновление текста для TEXT элементов ===
    const updateTextContent = async (elementId, newContent) => {
        const element = elements.find(el => el.id === elementId);
        if (!element || element.type !== 'TEXT') return;

        const updatedElement = {
            ...element,
            element: {
                ...element.element,
                content: newContent
            }
        };

        setElements(prev => prev.map(el => el.id === elementId ? updatedElement : el));
        await saveElementToServer(updatedElement);
    };

    // === Завершение редактирования текста ===
    const finishEditing = async () => {
        const element = elements.find(el => el.id === selectedElementId);
        if (!element) return;

        if (element.type === 'SHAPE') {
            const updatedElement = {
                ...element,
                element: { ...element.element, text: editText }
            };
            setElements(prev => prev.map(el => el.id === selectedElementId ? updatedElement : el));
            await saveElementToServer(updatedElement);
        } else if (element.type === 'TEXT') {
            const updatedElement = {
                ...element,
                element: { ...element.element, content: editText }
            };
            setElements(prev => prev.map(el => el.id === selectedElementId ? updatedElement : el));
            await saveElementToServer(updatedElement);
        }
        
        setIsEditingText(false);
    };

    // === ОБРАБОТЧИКИ МАСШТАБИРОВАНИЯ ===
    const handleHandleMouseDown = (e, handleType, elementId) => {
        e.stopPropagation();
        e.preventDefault();

        const element = elements.find(el => el.id === elementId);
        if (!element) return;

        setSelectedElementId(elementId);
        setIsResizing(true);
        setActiveHandle(handleType);
        setResizeStart({ x: e.clientX, y: e.clientY });
        setResizeInitial({ x: element.x, y: element.y, width: element.width, height: element.height });
        setShowFormatPanel(false);
        setShowBorderPanel(false);
        setShowColorPicker(false);
    };

    // === ОБРАБОТЧИКИ ПЕРЕМЕЩЕНИЯ ===
    const handleElementMouseDown = (e, elementId) => {
        e.stopPropagation();
        if (isPanning || isResizing) return;

        const element = elements.find(el => el.id === elementId);
        if (!element) return;

        // Check if user has permission to move this element
        if (element.type === 'COMMENT') {
            console.log("element", element)
            const commentUserId = element.element?.userId;
            console.log('Comment move permission check - commentUserId:', commentUserId, 'currentUserId:', currentUserId);
            
            // Block if current user is not logged in
            if (!currentUserId) {
                console.log('Cannot move comment: user not logged in');
                return;
            }
            
            // Only block if userId exists AND doesn't match current user
            if (commentUserId !== undefined && commentUserId !== null && commentUserId !== currentUserId) {
                console.log('Cannot move comment: owned by user', commentUserId, 'current user is', currentUserId);
                return;
            }
            
            console.log('Allowing comment move - owned by current user');
        }

        // If element is part of multi-selection, drag all selected elements
        if (multiSelectedElements.includes(elementId)) {
            setSelectedElementId(elementId);
            setIsDraggingElement(true);
            setDragElementStart({ x: e.clientX, y: e.clientY });
            // Store initial positions of all selected elements
            setDragElementOffset(elements
                .filter(el => multiSelectedElements.includes(el.id))
                .map(el => ({ id: el.id, x: el.x, y: el.y }))
            );
            setShowFormatPanel(true);
            setShowBorderPanel(false);
            setShowColorPicker(false);
        } else {
            // Single element drag
            setSelectedElementId(elementId);
            setIsDraggingElement(true);
            setDragElementStart({ x: e.clientX, y: e.clientY });
            setDragElementOffset({ x: element.x, y: element.y });
            setShowFormatPanel(true);
            setShowBorderPanel(false);
            setShowColorPicker(false);
        }
    };

    // === ОДИНОЧНЫЙ КЛИК ДЛЯ ВЫДЕЛЕНИЯ И ПОКАЗА ПАНЕЛИ ===
    const handleElementClick = (e, elementId) => {
        e.stopPropagation();
        setSelectedElementId(elementId);
        setShowFormatPanel(true);
        setIsEditingText(false);
        setShowBorderPanel(false);
        setShowColorPicker(false);
    };

    // === ДВОЙНОЙ КЛИК ДЛЯ РЕДАКТИРОВАНИЯ ТЕКСТА ===
    const handleElementDoubleClick = (e, elementId) => {
        e.stopPropagation();
        const element = elements.find(el => el.id === elementId);
        if (!element) return;

        setSelectedElementId(elementId);
        setIsEditingText(true);
        
        // Для TEXT элементов используем content, для SHAPE - text
        if (element.type === 'TEXT') {
            setEditText(element.element?.content || '');
        } else if (element.type === 'SHAPE') {
            setEditText(element.element?.text || '');
        }
        
        setShowFormatPanel(true);
        setShowBorderPanel(false);
        setShowColorPicker(false);
    };

    const handleCanvasMouseDown = async (e) => {
        // Если активен инструмент комментариев
        if (isAddingComment && e.button === 0) {
            const canvas = canvasRef.current;
            if (!canvas) return;

            const rect = canvas.getBoundingClientRect();
            const x = (e.clientX - rect.left - panOffset.x) / scale;
            const y = (e.clientY - rect.top - panOffset.y) / scale;

            setCommentPosition({ x: e.clientX, y: e.clientY });
            setShowCommentInput(true);
            return;
        }

        if (e.button === 2) {
            e.preventDefault();
            setIsPanning(true);
            setPanStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
        } else if (e.button === 0 && !isResizing) {
            if (e.target.tagName === 'TEXTAREA' ||
                e.target.tagName === 'INPUT' ||
                e.target.closest('.board-element') ||
                e.target.closest('.format-panel') ||
                e.target.closest('.comment-input-popup')) {
                return;
            }

            if (isEditingText && selectedElementId) {
                await finishEditing();
            }

            setSelectedElementId(null);
            setIsEditingText(false);
            setShowFormatPanel(false);
            setShowBorderPanel(false);
            setShowColorPicker(false);
        }
    };

    // === ГЛАВНЫЙ ОБРАБОТЧИК ДВИЖЕНИЯ МЫШИ ===
    const handleMouseMove = (e) => {
        if (isPanning) {
            setPanOffset({ x: e.clientX - panStart.x, y: e.clientY - panStart.y });
        }
        else if (isResizing && activeHandle && selectedElementId) {
            const dx = (e.clientX - resizeStart.x) / scale;
            const dy = (e.clientY - resizeStart.y) / scale;
            let { x, y, width, height } = resizeInitial;
            const minSize = 20;

            switch (activeHandle) {
                case 'se': width += dx; height += dy; break;
                case 'sw': width -= dx; height += dy; x += dx; break;
                case 'ne': width += dx; height -= dy; y += dy; break;
                case 'nw': width -= dx; height -= dy; x += dx; y += dy; break;
                case 'e':  width += dx; break;
                case 'w':  width -= dx; x += dx; break;
                case 's':  height += dy; break;
                case 'n':  height -= dy; y += dy; break;
                default: break;
            }

            width = Math.max(minSize, width);
            height = Math.max(minSize, height);

            setElements(prev => prev.map(el =>
                el.id === selectedElementId ? { ...el, x, y, width, height } : el
            ));
        }
        else if (isDraggingElement && selectedElementId) {
            const dx = (e.clientX - dragElementStart.x) / scale;
            const dy = (e.clientY - dragElementStart.y) / scale;

            // Check if we're dragging multiple elements
            if (Array.isArray(dragElementOffset)) {
                // Multi-element drag
                setElements(prev => prev.map(el => {
                    const offsetData = dragElementOffset.find(d => d.id === el.id);
                    if (offsetData) {
                        const newX = Math.round(offsetData.x + dx);
                        const newY = Math.round(offsetData.y + dy);
                        return { ...el, x: newX, y: newY };
                    }
                    return el;
                }));
            } else {
                // Single element drag
                const newX = Math.round(dragElementOffset.x + dx);
                const newY = Math.round(dragElementOffset.y + dy);

                setElements(prev => prev.map(el =>
                    el.id === selectedElementId ? { ...el, x: newX, y: newY } : el
                ));
            }
        }
    };

    // === ЗАВЕРШЕНИЕ ДЕЙСТВИЯ ===
    const handleMouseUp = async () => {
        if (isPanning) {
            setIsPanning(false);
            return;
        }

        if (isResizing && selectedElementId) {
            console.log('MouseUp - Resizing ended for element:', selectedElementId);
            const element = elements.find(el => el.id === selectedElementId);
            console.log('Current element state:', element);
            if (element) await saveElementToServer(element);
            setIsResizing(false);
            setActiveHandle(null);
        }
        else if (isDraggingElement && selectedElementId) {
            console.log('MouseUp - Dragging ended for element:', selectedElementId);
            
            // Save all moved elements to server
            if (Array.isArray(dragElementOffset)) {
                // Multi-element drag - save all selected elements
                const movedElements = elements.filter(el => multiSelectedElements.includes(el.id));
                for (const element of movedElements) {
                    await saveElementToServer(element);
                }
            } else {
                // Single element drag
                const element = elements.find(el => el.id === selectedElementId);
                console.log('Current element state:', element);
                if (element) await saveElementToServer(element);
            }
            
            setIsDraggingElement(false);
            setShowFormatPanel(true);
            setShowBorderPanel(false);
            setShowColorPicker(false);
        }
    };

    const handleContextMenu = (e) => e.preventDefault();

    //Масштабирование доски по центру экрана пользователя
    const handleWheel = (e) => {
        e.preventDefault();
        
        const canvas = canvasRef.current;
        if (!canvas) return;
        
        const rect = canvas.getBoundingClientRect();
        
        // Mouse position relative to canvas
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        // Calculate zoom delta
        const delta = -e.deltaY * 0.001;
        const newScale = Math.min(Math.max(0.1, scale + delta), 5);
        
        // Calculate scale factor
        const scaleFactor = newScale / scale;
        
        // Adjust pan offset to zoom towards mouse position
        const newPanOffsetX = mouseX - (mouseX - panOffset.x) * scaleFactor;
        const newPanOffsetY = mouseY - (mouseY - panOffset.y) * scaleFactor;
        
        setScale(newScale);
        setPanOffset({ x: newPanOffsetX, y: newPanOffsetY });
    };

    if (loading) return <div className="board-loading">Загрузка доски...</div>;

    const fontOptions = ['Noto Sans', 'Arial', 'Times New Roman', 'Courier New', 'Georgia', 'Verdana', 'Roboto', 'Open Sans'];
    const sizeOptions = [10, 12, 14, 15, 16, 18, 20, 24, 28, 32, 36, 48, 64];
    const colorOptions = ['#64B5F6', '#4CAF50', '#FF9800', '#F44336', '#9C27B0', '#00BCD4', '#E91E63', '#FFEB3B', '#FFFFFF', '#000000', '#607D8B', '#795548'];

    return (
        <div className="board-page">
            <div className="board-top-panel">
                <div className="board-navigation">
                    <span className="boardiox-logo" onClick={handleLogoClick}>Boardiox</span>
                    <div className="board-separator"></div>
                    <span className="board-name">{boardData?.boardName || 'Загрузка...'}</span>
                </div>
            </div>

            <div className="board-main-area">
                <div className="board-toolbar">
                    <div className="toolbar-tools">
                        <button className={`tool-button ${selectedTool === 'shapes' ? 'active' : ''}`} onClick={() => handleToolClick('shapes')} title="Фигуры">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="9" cy="9" r="5" /><rect x="13" y="13" width="7" height="7" rx="1" /><path d="M16 9l3 0M19 9l-2 -3M19 9l-2 3" /></svg>
                        </button>
                        <div className="toolbar-divider"></div>
                        <button 
                            className={`tool-button ${selectedTool === 'drawing' ? 'active' : ''}`} 
                            onClick={handleDrawingToolClick} 
                            title="Рисование"
                        >
                            <i className="bi bi-pencil-fill"></i>
                        </button>
                        <div className="toolbar-divider"></div>
                        <button className="tool-button" title="Таблица"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18M3 15h18M9 3v18M15 3v18" /></svg></button>
                        <div className="toolbar-divider"></div>
                        <button 
                            className="tool-button" 
                            title="Изображение" 
                            onClick={handleImageToolClick}
                            disabled={isUploadingImage}
                            style={{ opacity: isUploadingImage ? 0.5 : 1, cursor: isUploadingImage ? 'not-allowed' : 'pointer' }}
                        >
                            <i className="bi bi-image-fill"></i>
                        </button>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            style={{ display: 'none' }}
                            onChange={handleImageUpload}
                        />
                        <div className="toolbar-divider"></div>
                        <button 
                            className={`tool-button ${selectedTool === 'comment' ? 'active' : ''}`} 
                            title="Комментарий"
                            onClick={handleCommentToolClick}
                        >
                            <i className="bi bi-chat-square-fill"></i>
                        </button>
                        <div className="toolbar-divider"></div>
                        <button 
                            className="tool-button" 
                            title="Текст" 
                            onClick={handleTextToolClick}
                        >
                            <i className="bi bi-type" style={{ fontWeight: 900, fontSize: '22px' }}></i>
                        </button>
                    </div>
                    {showShapesMenu && (
                        <div className="shapes-menu">
                            <button className="shape-btn" onClick={() => createShape('SQUARE')} title="Квадрат"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="4" y="4" width="16" height="16" rx="2" /></svg></button>
                            <button className="shape-btn" onClick={() => createShape('CIRCLE')} title="Круг"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="8" /></svg></button>
                            <button className="shape-btn" onClick={() => createShape('TRIANGLE')} title="Треугольник"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polygon points="12,4 20,20 4,20" /></svg></button>
                            <button className="shape-btn" onClick={createArrow} title="Стрелка"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 19L19 5M19 5H9M19 5V15" /></svg></button>
                        </div>
                    )}
                    {showDrawingPanel && (
                        <div className="drawing-panel">
                            <div className="drawing-tools">
                                <button 
                                    className={`drawing-tool-btn ${drawingTool === 'pencil' ? 'active' : ''}`} 
                                    onClick={() => selectDrawingTool('pencil')}
                                    title="Карандаш"
                                >
                                    <i className="bi bi-pencil-fill"></i>
                                </button>
                                <button 
                                    className={`drawing-tool-btn ${drawingTool === 'eraser' ? 'active' : ''}`} 
                                    onClick={() => selectDrawingTool('eraser')}
                                    title="Стиралка"
                                >
                                    <i className="bi bi-eraser-fill"></i>
                                </button>
                                <button 
                                    className={`drawing-tool-btn ${drawingTool === 'lasso' ? 'active' : ''}`} 
                                    onClick={() => selectDrawingTool('lasso')}
                                    title="Лассо"
                                >
                                    <i className="bi bi-bezier2"></i>
                                </button>
                            </div>
                            <div className="drawing-divider"></div>
                            <div className="drawing-options">
                                <button 
                                    className={`drawing-option-btn ${drawingSize === 1 && drawingColor === '#000000' ? 'active' : ''}`} 
                                    onClick={() => { setDrawingSize(1); setDrawingColor('#000000'); }}
                                    title="Тонкая черная"
                                >
                                    <div className="option-dot option-small-black"></div>
                                </button>
                                <button 
                                    className={`drawing-option-btn ${drawingSize === 2 && drawingColor === '#F44336' ? 'active' : ''}`} 
                                    onClick={() => { setDrawingSize(2); setDrawingColor('#F44336'); }}
                                    title="Средняя красная"
                                >
                                    <div className="option-dot option-medium-red"></div>
                                </button>
                                <button 
                                    className={`drawing-option-btn ${drawingSize === 3 && drawingColor === '#4CAF50' ? 'active' : ''}`} 
                                    onClick={() => { setDrawingSize(3); setDrawingColor('#4CAF50'); }}
                                    title="Толстая зеленая"
                                >
                                    <div className="option-dot option-large-green"></div>
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                <div
                    className={`board-canvas ${isAddingComment ? 'comment-mode' : ''}`}
                    ref={canvasRef}
                    onMouseDown={(e) => {
                        if (drawingTool) {
                            handleDrawMouseDown(e);
                        } else {
                            handleCanvasMouseDown(e);
                        }
                    }}
                    onMouseMove={(e) => {
                        if (drawingTool) {
                            handleDrawMouseMove(e);
                        } else {
                            handleMouseMove(e);
                        }
                    }}
                    onMouseUp={(e) => {
                        if (drawingTool) {
                            handleDrawMouseUp();
                        } else {
                            handleMouseUp();
                        }
                    }}
                    onMouseLeave={(e) => {
                        if (drawingTool) {
                            handleDrawMouseUp();
                        } else {
                            handleMouseUp();
                        }
                    }}
                    onWheel={handleWheel}
                    onContextMenu={handleContextMenu}
                >
                    <div
                        className="canvas-grid"
                        style={{ transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${scale})`, transformOrigin: '0 0', zIndex: 0 }}
                    >
                        <div className="grid-pattern"></div>
                    </div>

                    {showCommentInput && (
                        <div
                            className="comment-input-popup"
                            style={{
                                position: 'absolute',
                                left: commentPosition.x,
                                top: commentPosition.y,
                                transform: 'translate(-50%, -50%)',
                                transformOrigin: 'center',
                                zIndex: 1000,
                                pointerEvents: 'auto'
                            }}
                        >
                            <div className="comment-popup-content">
                                <input
                                    type="text"
                                    className="comment-input"
                                    placeholder="Добавить комментарий"
                                    value={commentText}
                                    onChange={(e) => setCommentText(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleCreateComment();
                                        else if (e.key === 'Escape') {
                                            setShowCommentInput(false);
                                            setIsAddingComment(false);
                                            setSelectedTool(null);
                                            setCommentText('');
                                        }
                                    }}
                                    autoFocus
                                />
                                <button
                                    className="comment-send-btn"
                                    onClick={handleCreateComment}
                                    title="Отправить"
                                >
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M22 2L11 13M22 2L15 22L11 13M22 2L2 9L11 13" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    )}

                    <div
                        className="board-elements-layer"
                        style={{ transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${scale})`, transformOrigin: '0 0', zIndex: 1, position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'none' }}
                    >
                        {/* SVG слой для рисунков */}
                        <svg
                            className="drawing-layer"
                            style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                width: '100%',
                                height: '100%',
                                pointerEvents: 'none',
                                zIndex: 0
                            }}
                        >
                            {/* Сохраненные рисунки из elements */}
                            {elements.filter(el => el.type === 'DRAWING').map((drawingElement) => {
                                if (!drawingElement.element?.pointsData) return null;
                                
                                try {
                                    const points = JSON.parse(drawingElement.element.pointsData);
                                    if (!points || points.length < 2) return null;
                                    
                                    const strokeWidth = drawingElement.element.strokeWidth || 3;
                                    const color = drawingElement.element.color || '#000000';
                                    
                                    const pathData = points
                                        .map((point, index) => 
                                            `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`
                                        )
                                        .join(' ');
                                    
                                    return (
                                        <path
                                            key={drawingElement.id}
                                            d={pathData}
                                            stroke={color}
                                            strokeWidth={strokeWidth}
                                            fill="none"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        />
                                    );
                                } catch (err) {
                                    console.error('Error parsing drawing points:', err);
                                    return null;
                                }
                            })}
                            
                            {/* Текущий рисунок в процессе создания */}
                            {isDrawing && drawPoints.length > 1 && (
                                <path
                                    d={drawPoints
                                        .map((point, index) => 
                                            `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`
                                        )
                                        .join(' ')}
                                    stroke={drawingTool === 'eraser' ? 'rgba(255,255,255,0.5)' : drawingColor}
                                    strokeWidth={drawingSize === 1 ? 2 : drawingSize === 2 ? 4 : 6}
                                    fill="none"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    style={{ opacity: drawingTool === 'eraser' ? 0.5 : 1 }}
                                />
                            )}
                            
                            {/* Лассо выделение */}
                            {isLassoSelecting && lassoPoints.length > 1 && (
                                <path
                                    d={lassoPoints
                                        .map((point, index) => 
                                            `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`
                                        )
                                        .join(' ')}
                                    stroke="#0078D4"
                                    strokeWidth={2}
                                    fill="rgba(0,120,212,0.1)"
                                    strokeDasharray="5,5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                            )}
                        </svg>

                        {elements.map(element => {
                            const isSelected = selectedElementId === element.id;
                            const elText = element.element?.text || '';
                            const elFontSize = element.element?.fontSize || 64;
                            const elFontFamily = element.element?.fontFamily || 'Noto Sans';
                            const elIsBold = element.element?.isBold || false;
                            const elIsUnderline = element.element?.isUnderline || false;
                            const elFillColor = element.element?.fillColor || '#64B5F6';
                            const elBorderColor = element.element?.borderColor || '#000000';
                            const elBorderWidth = element.element?.borderWidth || 0;
                            const hasImage = element.element?.hasImage || false;
                            const imageSize = element.element?.imageSize || 0;

                            return (
                                <React.Fragment key={element.id}>
                                    {/* Панель форматирования - показывается при выделении */}
                                    {isSelected && showFormatPanel && !isDraggingElement && !isResizing && element.type === 'SHAPE' && (
                                        <div
                                            className="format-panel"
                                            ref={formatPanelRef}
                                            style={{
                                                left: element.x,
                                                top: element.y - 55,
                                                transform: `scale(${1 / scale})`,
                                                transformOrigin: 'bottom left'
                                            }}
                                        >
                                            <button
                                                className={`format-btn ${elIsUnderline ? 'active' : ''}`}
                                                onClick={() => updateTextFormat(element.id, { isUnderline: !elIsUnderline })}
                                                title="Подчеркнутый текст"
                                            >
                                                <span style={{ textDecoration: 'underline', fontWeight: 400 }}>A</span>
                                            </button>

                                            <div className="format-divider"></div>

                                            <button
                                                className={`format-btn ${elIsBold ? 'active' : ''}`}
                                                onClick={() => updateTextFormat(element.id, { isBold: !elIsBold })}
                                                title="Жирный текст"
                                            >
                                                <span style={{ fontWeight: 700 }}>B</span>
                                            </button>

                                            <div className="format-divider"></div>

                                            {/* Размер текста */}
                                            <div className="format-dropdown">
                                                <select
                                                    className="format-select"
                                                    value={elFontSize}
                                                    onChange={(e) => updateTextFormat(element.id, { fontSize: Number(e.target.value) })}
                                                >
                                                    {sizeOptions.map(size => (
                                                        <option key={size} value={size}>{size}</option>
                                                    ))}
                                                </select>
                                            </div>

                                            <div className="format-divider"></div>

                                            {/* Шрифт текста */}
                                            <div className="format-dropdown">
                                                <select
                                                    className="format-select format-font-select"
                                                    value={elFontFamily}
                                                    onChange={(e) => updateTextFormat(element.id, { fontFamily: e.target.value })}
                                                >
                                                    {fontOptions.map(font => (
                                                        <option key={font} value={font} style={{ fontFamily: font }}>{font}</option>
                                                    ))}
                                                </select>
                                            </div>

                                            <div className="format-divider"></div>

                                            {/* Жирность границ - КНОПКА */}
                                            <div className="format-color-wrapper" style={{ position: 'relative' }}>
                                                <button
                                                    className="format-border-btn"
                                                    onClick={() => {
                                                        setShowBorderPanel(!showBorderPanel);
                                                        setShowColorPicker(false);
                                                    }}
                                                    title="Граница фигуры"
                                                    style={{
                                                        width: '28px',
                                                        height: '28px',
                                                        borderRadius: '50%',
                                                        // border: `${elBorderWidth}px solid ${elBorderColor}`,
                                                        backgroundColor: 'transparent',
                                                        cursor: 'pointer'
                                                    }}
                                                ></button>

                                                {showBorderPanel && (
                                                    <div className="border-panel">
                                                        <div className="border-panel-row">
                                                            <span className="border-panel-label">Жирность</span>
                                                            <input
                                                                type="range"
                                                                min="0"
                                                                max="10"
                                                                value={elBorderWidth}
                                                                onChange={(e) => updateTextFormat(element.id, { borderWidth: Number(e.target.value) })}
                                                                className="border-slider"
                                                            />
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Цвет фигуры */}
                                            <div className="format-color-wrapper" style={{ position: 'relative' }}>
                                                <button
                                                    className="format-color-btn"
                                                    onClick={() => {
                                                        setShowColorPicker(!showColorPicker);
                                                        setShowBorderPanel(false);
                                                    }}
                                                    title="Цвет фигуры"
                                                    style={{
                                                        width: '28px',
                                                        height: '28px',
                                                        borderRadius: '50%',
                                                        backgroundColor: elFillColor,
                                                        border: '2px solid #000',
                                                        cursor: 'pointer'
                                                    }}
                                                ></button>

                                                {showColorPicker && (
                                                    <div className="color-picker-panel">
                                                        {colorOptions.map(color => (
                                                            <div
                                                                key={color}
                                                                className="color-option"
                                                                style={{ backgroundColor: color }}
                                                                onClick={() => {
                                                                    updateTextFormat(element.id, { fillColor: color });
                                                                    setShowColorPicker(false);
                                                                }}
                                                            ></div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* Панель форматирования для TEXT элементов */}
                                    {isSelected && showFormatPanel && !isDraggingElement && !isResizing && element.type === 'TEXT' && (
                                        <div
                                            className="format-panel"
                                            ref={formatPanelRef}
                                            style={{
                                                left: element.x,
                                                top: element.y - 55,
                                                transform: `scale(${1 / scale})`,
                                                transformOrigin: 'bottom left'
                                            }}
                                        >
                                            <button
                                                className={`format-btn ${(element.element?.isUnderline || false) ? 'active' : ''}`}
                                                onClick={() => {
                                                    console.log('Underline clicked for element:', element.id);
                                                    console.log('Current isUnderline:', element.element?.isUnderline);
                                                    updateTextFormat(element.id, { isUnderline: !(element.element?.isUnderline || false) });
                                                }}
                                                title="Подчеркнутый текст"
                                            >
                                                <span style={{ textDecoration: 'underline', fontWeight: 400 }}>A</span>
                                            </button>

                                            <div className="format-divider"></div>

                                            <button
                                                className={`format-btn ${(element.element?.isBold || false) ? 'active' : ''}`}
                                                onClick={() => {
                                                    console.log('Bold clicked for element:', element.id);
                                                    console.log('Current isBold:', element.element?.isBold);
                                                    updateTextFormat(element.id, { isBold: !(element.element?.isBold || false) });
                                                }}
                                                title="Жирный текст"
                                            >
                                                <span style={{ fontWeight: 700 }}>B</span>
                                            </button>

                                            <div className="format-divider"></div>

                                            {/* Размер текста */}
                                            <div className="format-dropdown">
                                                <select
                                                    className="format-select"
                                                    value={element.element?.fontSize || 24}
                                                    onChange={(e) => updateTextFormat(element.id, { fontSize: Number(e.target.value) })}
                                                >
                                                    {sizeOptions.map(size => (
                                                        <option key={size} value={size}>{size}</option>
                                                    ))}
                                                </select>
                                            </div>

                                            <div className="format-divider"></div>

                                            {/* Шрифт текста */}
                                            <div className="format-dropdown">
                                                <select
                                                    className="format-select format-font-select"
                                                    value={element.element?.fontFamily || 'Noto Sans'}
                                                    onChange={(e) => updateTextFormat(element.id, { fontFamily: e.target.value })}
                                                >
                                                    {fontOptions.map(font => (
                                                        <option key={font} value={font} style={{ fontFamily: font }}>{font}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                    )}

                                    {/* Элемент фигуры */}
                                    <div
                                        className={`board-element ${isSelected ? 'selected' : ''} ${multiSelectedElements.includes(element.id) && multiSelectedElements.length > 1 ? 'multi-selected' : ''}`}
                                        style={{
                                            position: 'absolute',
                                            left: element.x,
                                            top: element.y,
                                            width: element.width,
                                            height: element.height,
                                            pointerEvents: 'auto'
                                        }}
                                        onClick={(e) => handleElementClick(e, element.id)}
                                        onMouseDown={(e) => handleElementMouseDown(e, element.id)}
                                        onDoubleClick={(e) => handleElementDoubleClick(e, element.id)}
                                    >
                                        {element.type === 'SHAPE' && element.element?.shapeType === 'SQUARE' && (
                                            <div
                                                className="element-shape square-shape"
                                                style={{
                                                    backgroundColor: elFillColor,
                                                    borderColor: elBorderColor,
                                                    borderWidth: `${elBorderWidth}px`,
                                                    borderStyle: 'solid'
                                                }}
                                            >
                                                {isEditingText && isSelected ? (
                                                    <textarea
                                                        ref={textInputRef}
                                                        className="shape-text-input"
                                                        value={editText}
                                                        onChange={(e) => setEditText(e.target.value)}
                                                        onBlur={finishEditing}
                                                        onMouseDown={(e) => e.stopPropagation()}
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Escape') finishEditing();
                                                        }}
                                                        style={{
                                                            fontSize: `${elFontSize}px`,
                                                            fontFamily: elFontFamily,
                                                            fontWeight: elIsBold ? 'bold' : 'normal',
                                                            textDecoration: elIsUnderline ? 'underline' : 'none'
                                                        }}
                                                        placeholder=""
                                                    />
                                                ) : (
                                                    <div
                                                        className="shape-text-display"
                                                        style={{
                                                            fontSize: `${elFontSize}px`,
                                                            fontFamily: elFontFamily,
                                                            fontWeight: elIsBold ? 'bold' : 'normal',
                                                            textDecoration: elIsUnderline ? 'underline' : 'none'
                                                        }}
                                                    >
                                                        {elText}
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {element.type === 'SHAPE' && element.element?.shapeType === 'CIRCLE' && (
                                            <div
                                                className="element-shape circle-shape"
                                                style={{
                                                    backgroundColor: elFillColor,
                                                    borderColor: elBorderColor,
                                                    borderWidth: `${elBorderWidth}px`,
                                                    borderStyle: 'solid'
                                                }}
                                            >
                                                {isEditingText && isSelected ? (
                                                    <textarea
                                                        ref={textInputRef}
                                                        className="shape-text-input"
                                                        value={editText}
                                                        onChange={(e) => setEditText(e.target.value)}
                                                        onBlur={finishEditing}
                                                        onMouseDown={(e) => e.stopPropagation()}
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Escape') finishEditing();
                                                        }}
                                                        style={{
                                                            fontSize: `${elFontSize}px`,
                                                            fontFamily: elFontFamily,
                                                            fontWeight: elIsBold ? 'bold' : 'normal',
                                                            textDecoration: elIsUnderline ? 'underline' : 'none'
                                                        }}
                                                        placeholder=""
                                                    />
                                                ) : (
                                                    <div
                                                        className="shape-text-display"
                                                        style={{
                                                            fontSize: `${elFontSize}px`,
                                                            fontFamily: elFontFamily,
                                                            fontWeight: elIsBold ? 'bold' : 'normal',
                                                            textDecoration: elIsUnderline ? 'underline' : 'none'
                                                        }}
                                                    >
                                                        {elText}
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {element.type === 'SHAPE' && element.element?.shapeType === 'TRIANGLE' && (
                                            <div className="triangle-container" style={{ position: 'relative', width: '100%', height: '100%' }}>
                                                <svg className="element-shape triangle-shape" viewBox="0 0 100 100" preserveAspectRatio="none">
                                                    <polygon
                                                        points="50,5 95,95 5,95"
                                                        fill={elFillColor}
                                                        stroke={elBorderColor}
                                                        strokeWidth={elBorderWidth}
                                                    />
                                                </svg>
                                                {/* Текст поверх треугольника - ЦЕНТРИРОВАННЫЙ */}
                                                {isEditingText && isSelected ? (
                                                    <textarea
                                                        ref={textInputRef}
                                                        className="shape-text-input triangle-text"
                                                        value={editText}
                                                        onChange={(e) => setEditText(e.target.value)}
                                                        onBlur={finishEditing}
                                                        onMouseDown={(e) => e.stopPropagation()}
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Escape') finishEditing();
                                                        }}
                                                        style={{
                                                            fontSize: `${elFontSize}px`,
                                                            fontFamily: elFontFamily,
                                                            fontWeight: elIsBold ? 'bold' : 'normal',
                                                            textDecoration: elIsUnderline ? 'underline' : 'none'
                                                        }}
                                                        placeholder=""
                                                    />
                                                ) : (
                                                    <div
                                                        className="shape-text-display triangle-text"
                                                        style={{
                                                            fontSize: `${elFontSize}px`,
                                                            fontFamily: elFontFamily,
                                                            fontWeight: elIsBold ? 'bold' : 'normal',
                                                            textDecoration: elIsUnderline ? 'underline' : 'none'
                                                        }}
                                                    >
                                                        {elText}
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {element.type === 'ARROW' && (
                                            <svg className="element-shape arrow-shape" viewBox="0 0 100 100" fill="none" stroke={element.color || '#64B5F6'} strokeWidth="4">
                                                <path d="M10 90L90 10M90 10H30M90 10V70" />
                                            </svg>
                                        )}

                                        {element.type === 'IMAGE' && hasImage && (
                                            <img
                                                src={`data:image/jpeg;base64,${element.element?.imageData || ''}`}
                                                alt="Uploaded image"
                                                style={{
                                                    width: '100%',
                                                    height: '100%',
                                                    objectFit: 'contain',
                                                    pointerEvents: 'none'
                                                }}
                                            />
                                        )}

                                        {element.type === 'TEXT' && (
                                            <div
                                                className="text-element"
                                                style={{
                                                    width: '100%',
                                                    height: '100%',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'flex-start',
                                                    padding: '4px',
                                                    boxSizing: 'border-box'
                                                }}
                                            >
                                                {isEditingText && isSelected ? (
                                                    <textarea
                                                        ref={textInputRef}
                                                        className="text-element-input"
                                                        value={editText}
                                                        onChange={(e) => setEditText(e.target.value)}
                                                        onBlur={finishEditing}
                                                        onMouseDown={(e) => e.stopPropagation()}
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Escape') finishEditing();
                                                        }}
                                                        style={{
                                                            width: '100%',
                                                            height: '100%',
                                                            fontSize: `${element.element?.fontSize || 24}px`,
                                                            fontFamily: element.element?.fontFamily || 'Noto Sans',
                                                            fontWeight: (element.element?.isBold || false) ? 'bold' : 'normal',
                                                            textDecoration: (element.element?.isUnderline || false) ? 'underline' : 'none',
                                                            color: element.color || '#000000',
                                                            border: 'none',
                                                            outline: 'none',
                                                            resize: 'none',
                                                            backgroundColor: 'transparent',
                                                            padding: '0',
                                                            margin: '0'
                                                        }}
                                                    />
                                                ) : (
                                                    <div
                                                        className="text-element-display"
                                                        style={{
                                                            fontSize: `${element.element?.fontSize || 24}px`,
                                                            fontFamily: element.element?.fontFamily || 'Noto Sans',
                                                            fontWeight: (element.element?.isBold || false) ? 'bold' : 'normal',
                                                            textDecoration: (element.element?.isUnderline || false) ? 'underline' : 'none',
                                                            color: element.color || '#000000',
                                                            whiteSpace: 'pre-wrap',
                                                            wordBreak: 'break-word',
                                                            lineHeight: '1.2'
                                                        }}
                                                    >
                                                        {element.element?.content || 'Текст'}
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* Comment element */}
                                        {element.type === 'COMMENT' && (
                                            <div
                                                className={`comment-element ${expandedCommentId === element.id ? 'expanded' : 'collapsed'} ${element.element?.userId && element.element?.userId !== currentUserId ? 'owned-by-other' : ''}`}
                                                style={{
                                                    zIndex: expandedCommentId === element.id ? 1000 : 2
                                                }}
                                                onMouseDown={(e) => {
                                                    e.stopPropagation();
                                                }}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    // Toggle expansion
                                                    setExpandedCommentId(expandedCommentId === element.id ? null : element.id);
                                                }}
                                            >
                                                {/* Collapsed state - just avatar */}
                                                <div className="comment-avatar-collapsed">
                                                    {(() => {
                                                        const userId = element.element?.userId;
                                                        const cachedUser = userId ? userCache[userId] : null;
                                                        
                                                        if (userId && cachedUser?.avatar) {
                                                            return (
                                                                <img 
                                                                    src={`data:image/png;base64,${cachedUser.avatar}`}
                                                                    alt={cachedUser.nickname || 'User'}
                                                                />
                                                            );
                                                        } else {
                                                            const displayName = cachedUser?.nickname || element.element?.userName || 'U';
                                                            return (
                                                                <span>
                                                                    {displayName.charAt(0).toUpperCase()}
                                                                </span>
                                                            );
                                                        }
                                                    })()}
                                                </div>
                                                
                                                {/* Hover preview panel */}
                                                <div 
                                                    className="comment-hover-preview"
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    <div className="comment-thread-item">
                                                        <div className="comment-thread-avatar">
                                                            {(() => {
                                                                const userId = element.element?.userId;
                                                                const cachedUser = userId ? userCache[userId] : null;
                                                                
                                                                if (userId && cachedUser?.avatar) {
                                                                    return (
                                                                        <img 
                                                                            src={`data:image/png;base64,${cachedUser.avatar}`}
                                                                            alt={cachedUser.nickname || 'User'}
                                                                        />
                                                                    );
                                                                } else {
                                                                    const displayName = cachedUser?.nickname || element.element?.userName || 'U';
                                                                    return (
                                                                        <span>
                                                                            {displayName.charAt(0).toUpperCase()}
                                                                        </span>
                                                                    );
                                                                }
                                                            })()}
                                                        </div>
                                                        <div className="comment-thread-content">
                                                            <div className="comment-thread-user-row">
                                                                <span className="comment-thread-username">
                                                                    {(() => {
                                                                        const userId = element.element?.userId;
                                                                        const cachedUser = userId ? userCache[userId] : null;
                                                                        return cachedUser?.nickname || element.element?.userName || 'User';
                                                                    })()}
                                                                </span>
                                                                <div className="comment-thread-datetime">
                                                                    {element.element?.createdAt ? new Date(element.element.createdAt).toLocaleDateString('ru-RU') : ''}{' '}
                                                                    {element.element?.createdAt ? new Date(element.element.createdAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }) : ''}
                                                                </div>
                                                            </div>
                                                            <div className="comment-thread-message">
                                                                {element.element?.message || ''}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="comment-thread-replies">
                                                        <button
                                                            className="comment-thread-reply-btn"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                // Expand to full thread and start reply mode
                                                                setExpandedCommentId(element.id);
                                                                setReplyingToCommentId(element.id);
                                                                setReplyText('');
                                                                // Focus will be handled by useEffect
                                                            }}
                                                        >
                                                            {element.element?.replies?.length || 0} ответов
                                                        </button>
                                                    </div>
                                                </div>
                                                
                                                {/* Expanded thread panel */}
                                                <div 
                                                    className="comment-thread-expanded"
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    {/* Header with menu */}
                                                    <div className="comment-thread-header">
                                                        <div style={{ flex: 1 }} />
                                                        {canDeleteComment(element.element?.userId) && (
                                                            <div className="comment-thread-menu-wrapper" style={{ position: 'relative' }}>
                                                                <button 
                                                                    className="comment-thread-menu"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setCommentMenuId(commentMenuId === element.id ? null : element.id);
                                                                    }}
                                                                >
                                                                    •••
                                                                </button>
                                                                {commentMenuId === element.id && (
                                                                    <div 
                                                                        className="comment-delete-menu"
                                                                        onClick={(e) => e.stopPropagation()}
                                                                    >
                                                                        <button
                                                                            className="comment-delete-btn"
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                handleDeleteComment(element.id);
                                                                            }}
                                                                        >
                                                                            Удалить
                                                                        </button>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                    
                                                    {/* Original comment */}
                                                    <div className="comment-thread-item">
                                                        <div className="comment-thread-avatar">
                                                            {(() => {
                                                                const userId = element.element?.userId;
                                                                const cachedUser = userId ? userCache[userId] : null;
                                                                
                                                                if (userId && cachedUser?.avatar) {
                                                                    return (
                                                                        <img 
                                                                            src={`data:image/png;base64,${cachedUser.avatar}`}
                                                                            alt={cachedUser.nickname || 'User'}
                                                                        />
                                                                    );
                                                                } else {
                                                                    const displayName = cachedUser?.nickname || element.element?.userName || 'U';
                                                                    return (
                                                                        <span>
                                                                            {displayName.charAt(0).toUpperCase()}
                                                                        </span>
                                                                    );
                                                                }
                                                            })()}
                                                        </div>
                                                        <div className="comment-thread-content">
                                                            <div className="comment-thread-user-row">
                                                                <span className="comment-thread-username">
                                                                    {(() => {
                                                                        const userId = element.element?.userId;
                                                                        const cachedUser = userId ? userCache[userId] : null;
                                                                        return cachedUser?.nickname || element.element?.userName || 'User';
                                                                    })()}
                                                                </span>
                                                                <div className="comment-thread-datetime">
                                                                    {element.element?.createdAt ? new Date(element.element.createdAt).toLocaleDateString('ru-RU') : ''}{' '}
                                                                    {element.element?.createdAt ? new Date(element.element.createdAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }) : ''}
                                                                </div>
                                                            </div>
                                                            <div className="comment-thread-message">
                                                                {element.element?.message || ''}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    
                                                    {/* Replies */}
                                                    {element.element?.replies && element.element.replies.length > 0 && (
                                                        <div className="comment-divider"></div>
                                                    )}
                                                    {element.element?.replies?.map((reply, index) => (
                                                        <div key={index} className="comment-thread-item">
                                                            <div className="comment-thread-avatar">
                                                                {(() => {
                                                                    const userId = reply.userId;
                                                                    const cachedUser = userId ? userCache[userId] : null;
                                                                    
                                                                    if (userId && cachedUser?.avatar) {
                                                                        return (
                                                                            <img 
                                                                                src={`data:image/png;base64,${cachedUser.avatar}`}
                                                                                alt={cachedUser.nickname || 'User'}
                                                                            />
                                                                        );
                                                                    } else {
                                                                        const displayName = cachedUser?.nickname || reply.userName || 'U';
                                                                        return (
                                                                            <span>
                                                                                {displayName.charAt(0).toUpperCase()}
                                                                            </span>
                                                                        );
                                                                    }
                                                                })()}
                                                            </div>
                                                            <div className="comment-thread-content">
                                                                <div className="comment-thread-user-row">
                                                                    <span className="comment-thread-username">
                                                                        {(() => {
                                                                            const userId = reply.userId;
                                                                            const cachedUser = userId ? userCache[userId] : null;
                                                                            return cachedUser?.nickname || reply.userName || 'User';
                                                                        })()}
                                                                    </span>
                                                                    <div className="comment-thread-datetime">
                                                                        {reply.createdAt ? new Date(reply.createdAt).toLocaleDateString('ru-RU') : ''}{' '}
                                                                        {reply.createdAt ? new Date(reply.createdAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }) : ''}
                                                                    </div>
                                                                </div>
                                                                <div className="comment-thread-message">
                                                                    {reply.message || ''}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                    
                                                    {/* Reply button or input */}
                                                    <div className="comment-thread-replies">
                                                        {replyingToCommentId === element.id ? (
                                                            <>
                                                                <input
                                                                    type="text"
                                                                    className="comment-reply-input"
                                                                    placeholder="Написать комментарий..."
                                                                    value={replyText}
                                                                    onChange={(e) => setReplyText(e.target.value)}
                                                                    onKeyDown={(e) => {
                                                                        if (e.key === 'Enter' && !e.shiftKey) {
                                                                            e.preventDefault();
                                                                            handleReplySubmit(element.id);
                                                                        }
                                                                    }}
                                                                    onMouseDown={(e) => e.stopPropagation()}
                                                                    autoFocus
                                                                />
                                                                <button
                                                                    className="comment-reply-submit-btn"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleReplySubmit(element.id);
                                                                    }}
                                                                >
                                                                    Отправить
                                                                </button>
                                                                <button
                                                                    className="comment-reply-cancel-btn"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleCancelReply();
                                                                    }}
                                                                >
                                                                    Отмена
                                                                </button>
                                                            </>
                                                        ) : (
                                                            <button
                                                                className="comment-thread-reply-btn"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setReplyingToCommentId(element.id);
                                                                    setReplyText('');
                                                                }}
                                                            >
                                                                Оставить комментарий
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                        {/* Selection border - exclude comments */}
                                        {isSelected && element.type !== 'COMMENT' && <div className="selection-border"></div>}

                                        {/* Invisible hitbox for DRAWING elements */}
                                        {element.type === 'DRAWING' && (
                                            <div
                                                className="drawing-hitbox"
                                                style={{
                                                    position: 'absolute',
                                                    top: 0,
                                                    left: 0,
                                                    width: '100%',
                                                    height: '100%',
                                                    cursor: 'move'
                                                }}
                                            />
                                        )}

                                        {/* Маркеры масштабирования - exclude comments */}
                                        {isSelected && !isDraggingElement && element.type !== 'COMMENT' && (
                                            <>
                                                <div className="resize-handle nw" onMouseDown={(e) => handleHandleMouseDown(e, 'nw', element.id)} />
                                                <div className="resize-handle n" onMouseDown={(e) => handleHandleMouseDown(e, 'n', element.id)} />
                                                <div className="resize-handle ne" onMouseDown={(e) => handleHandleMouseDown(e, 'ne', element.id)} />
                                                <div className="resize-handle e" onMouseDown={(e) => handleHandleMouseDown(e, 'e', element.id)} />
                                                <div className="resize-handle se" onMouseDown={(e) => handleHandleMouseDown(e, 'se', element.id)} />
                                                <div className="resize-handle s" onMouseDown={(e) => handleHandleMouseDown(e, 's', element.id)} />
                                                <div className="resize-handle sw" onMouseDown={(e) => handleHandleMouseDown(e, 'sw', element.id)} />
                                                <div className="resize-handle w" onMouseDown={(e) => handleHandleMouseDown(e, 'w', element.id)} />
                                            </>
                                        )}
                                    </div>
                                </React.Fragment>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BoardPage;