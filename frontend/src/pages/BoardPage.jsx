import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { useParams, useNavigate } from 'react-router-dom';
import authFetch from '../authFetch';

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
            return; // Skip if already fetched
        }

        // Mark as fetched immediately to prevent duplicate requests
        fetchedUserIdsRef.current.add(userId);

        try {
            const token = localStorage.getItem('accessToken');
            const response = await authFetch(`http://localhost:8081/boardiox/users/${userId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const userData = await response.json();
                setUserCache(prev => ({
                    ...prev,
                    [userId]: {
                        nickname: userData.nickname,
                        avatar: userData.avatar // base64 string
                    }
                }));
            } else {
                // Remove from fetched set so we can retry
                fetchedUserIdsRef.current.delete(userId);
            }
        } catch (err) {
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
    const savedView = (() => {
        try { return JSON.parse(localStorage.getItem(`board_view_${boardId}`)); } catch { return null; }
    })();
    const [scale, setScale] = useState(savedView?.scale ?? 1);
    const [panOffset, setPanOffset] = useState(savedView?.panOffset ?? { x: 0, y: 0 });
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

    // Масштабирование лассо-выделения
    const [isLassoResizing, setIsLassoResizing] = useState(false);
    const [lassoResizeHandle, setLassoResizeHandle] = useState(null);
    const [lassoResizeStart, setLassoResizeStart] = useState({ x: 0, y: 0 });
    const [lassoResizeInitial, setLassoResizeInitial] = useState(null); // { bbox, elements }

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

    const commentDraggedRef = useRef(false); // track if comment was dragged vs clicked
    const tableWasSelectedRef = useRef(false); // capture selection state before mousedown updates it

    // Arrow endpoint dragging
    const [arrowEndpointDrag, setArrowEndpointDrag] = useState(null);

    // Arrow format panel
    const [showArrowLinePanel, setShowArrowLinePanel] = useState(false);
    const [showArrowColorPicker, setShowArrowColorPicker] = useState(false);

    // Table creation panel
    const [showTablePanel, setShowTablePanel] = useState(false);
    const [tableRows, setTableRows] = useState('');
    const [tableCols, setTableCols] = useState('');

    // Table cell editing: { elementId, tableId, row, col, initialContent }
    const [editingCell, setEditingCell] = useState(null);
    const [editingCellText, setEditingCellText] = useState('');
    const editingCellRef = useRef(null); // always-current ref to editingCell
    const elementsRef = useRef([]); // always-current ref to elements state
    // Selected cell (single click): { elementId, row, col }
    const [selectedCell, setSelectedCell] = useState(null);
    // Table structure overrides (add/remove rows/cols): { [elementId]: { rows, cols } }
    const [tableStructure, setTableStructure] = useState({});
    const getTableStructure = (element) => ({
        rows: tableStructure[element.id]?.rows ?? (element.element?.rows || 3),
        cols: tableStructure[element.id]?.cols ?? (element.element?.columns || 3),
    });

    // Table format panel
    const [showTableBorderPanel, setShowTableBorderPanel] = useState(false);
    const [showTableColorPicker, setShowTableColorPicker] = useState(false);
    const [tableBorderWidth, setTableBorderWidth] = useState({});
    // Cell contents: { [`${elementId}_${row}_${col}`]: string }
    const [cellContents, setCellContents] = useState({});
    // Cell text formatting: { [`${elementId}_${row}_${col}`]: { isBold, isUnderline, fontSize, fontFamily } }
    const [cellFormats, setCellFormats] = useState({});
    const cellFormatKey = (elementId, row, col) => `${elementId}_${row}_${col}`;
    const getCellFormat = (elementId, row, col) => cellFormats[cellFormatKey(elementId, row, col)] || { isBold: false, isUnderline: false, fontSize: 13, fontFamily: 'Noto Sans' };
    const updateCellFormat = (elementId, row, col, updates) => {
        const key = cellFormatKey(elementId, row, col);
        const newFmt = { ...getCellFormat(elementId, row, col), ...updates };
        setCellFormats(prev => ({ ...prev, [key]: newFmt }));
        // Save formatting to server
        const content = cellContents[cellFormatKey(elementId, row, col)] || '';
        const tableId = elementId; // boardElement.id
        saveCellToServer(elementId, tableId, row, col, content, newFmt);
    };
    // Table col widths / row heights: { [elementId]: { colWidths: [], rowHeights: [] } }
    const [tableSizes, setTableSizes] = useState({});
    // Table resize drag: { elementId, type: 'col'|'row', index, startX, startY, startSize }
    const [tableResizeDrag, setTableResizeDrag] = useState(null);
    // { elementId, endpoint: 'start'|'end', origStartX, origStartY, origEndX, origEndY, mouseStartX, mouseStartY }

    const canvasRef = useRef(null);
    const textInputRef = useRef(null);
    const formatPanelRef = useRef(null);

    // Сохранение позиции и масштаба при изменении
    useEffect(() => {
        localStorage.setItem(`board_view_${boardId}`, JSON.stringify({ scale, panOffset }));
    }, [scale, panOffset, boardId]);

    // Загрузка данных доски и элементов
    useEffect(() => {
        const fetchBoardData = async () => {
            try {
                const token = localStorage.getItem('accessToken');

                // Fetch space data to get space creator
                const spaceResponse = await authFetch(`http://localhost:8081/boardiox/spaces/${spaceId}`, {
                    headers: { 'Authorization': `Bearer ${token}` },
                });

                if (spaceResponse.ok) {
                    const spaceData = await spaceResponse.json();
                    setSpaceCreatorId(spaceData.spaceCreatedByUserId);
                }

                const boardResponse = await authFetch(`http://localhost:8081/boardiox/spaces/${spaceId}/boards/${boardId}`, {
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

                const elementsResponse = await authFetch(`http://localhost:8081/boardiox/boards/${boardId}/elements`, {
                    headers: { 'Authorization': `Bearer ${token}` },
                });

                if (elementsResponse.ok) {
                    const elementsData = await elementsResponse.json();
                    setElements(elementsData);
                }
            } catch (err) {
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
        
        commentElements.forEach(commentEl => {
            const userId = commentEl.element?.userId;
            if (userId && !fetchedUserIdsRef.current.has(userId)) {
                fetchUserInfo(userId);
            }

            // Fetch user info for reply authors too
            const replies = commentEl.element?.replies || [];
            replies.forEach(reply => {
                const replyUserId = reply.userId;
                if (replyUserId && !fetchedUserIdsRef.current.has(replyUserId)) {
                    fetchUserInfo(replyUserId);
                }
            });
        });
    }, [elements]);

    // Keep elementsRef in sync — updated synchronously during render (before any effects)
    elementsRef.current = elements;

    // Restore cell contents and formats from backend data when elements load
    useEffect(() => {
        const tableElements = elements.filter(el => el.type === 'TABLE');
        if (tableElements.length === 0) return;
        setCellContents(prev => {
            const updated = { ...prev };
            tableElements.forEach(el => {
                (el.element?.cells || []).forEach(cell => {
                    const key = cellFormatKey(el.id, cell.row, cell.col);
                    if (!(key in updated)) updated[key] = cell.content || '';
                });
            });
            return updated;
        });
        setCellFormats(prev => {
            const updated = { ...prev };
            tableElements.forEach(el => {
                (el.element?.cells || []).forEach(cell => {
                    const key = cellFormatKey(el.id, cell.row, cell.col);
                    if (!updated[key] && (cell.fontSize || cell.fontFamily || cell.isBold || cell.isUnderline)) {
                        updated[key] = {
                            isBold: cell.isBold ?? false,
                            isUnderline: cell.isUnderline ?? false,
                            fontSize: cell.fontSize ?? 13,
                            fontFamily: cell.fontFamily ?? 'Noto Sans',
                        };
                    }
                });
            });
            return updated;
        });
    }, [elements]);

    // Фокус на textarea при начале редактирования + авто-ресайз
    useEffect(() => {
        if (isEditingText && textInputRef.current) {
            const ta = textInputRef.current;
            ta.focus();
            ta.style.height = 'auto';
            ta.style.height = Math.min(ta.scrollHeight, ta.parentElement?.clientHeight || 99999) + 'px';
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
                if (expandedCommentId) {
                    setExpandedCommentId(null);
                }
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [drawingTool, isAddingComment, expandedCommentId]);

    const handleLogoClick = () => navigate(`/boardiox/spaces/${spaceId}`);

    const updateArrowStyle = async (elementId, updates) => {
        const element = elements.find(el => el.id === elementId);
        if (!element || element.type !== 'ARROW') return;
        const updatedElement = { ...element, ...updates, element: { ...element.element, ...updates.element } };
        setElements(prev => prev.map(el => el.id === elementId ? updatedElement : el));
        await saveElementToServer(updatedElement);
    };

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
            const response = await authFetch(`http://localhost:8081/boardiox/boards/${boardId}/elements/shape`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify(request),
            });

            if (response.ok) {
                const newElement = await response.json();
                setElements(prev => [...prev, newElement]);
            }
        } catch (err) { }

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
            const response = await authFetch(`http://localhost:8081/boardiox/boards/${boardId}/elements/arrow`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify(request),
            });

            if (response.ok) {
                const newElement = await response.json();
                setElements(prev => [...prev, newElement]);
            }
        } catch (err) { }

        setShowShapesMenu(false);
        setSelectedTool(null);
    };

    const createDoubleArrow = async () => {
        const center = getCenterScreenCoords();
        const token = localStorage.getItem('accessToken');
        const request = {
            startX: Math.round(center.x - 60),
            startY: Math.round(center.y),
            endX: Math.round(center.x + 60),
            endY: Math.round(center.y),
            x: Math.round(center.x - 60),
            y: Math.round(center.y),
            z: 0,
            width: 120,
            height: 30,
            color: '#64B5F6',
            arrowType: 'DOUBLE'
        };
        try {
            const response = await authFetch(`http://localhost:8081/boardiox/boards/${boardId}/elements/arrow`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify(request),
            });
            if (response.ok) {
                const newElement = await response.json();
                setElements(prev => [...prev, newElement]);
            }
        } catch (err) { }
        setShowShapesMenu(false);
        setSelectedTool(null);
    };

    const createLine = async () => {
        const center = getCenterScreenCoords();
        const token = localStorage.getItem('accessToken');
        const request = {
            startX: Math.round(center.x - 60),
            startY: Math.round(center.y),
            endX: Math.round(center.x + 60),
            endY: Math.round(center.y),
            x: Math.round(center.x - 60),
            y: Math.round(center.y),
            z: 0,
            width: 120,
            height: 10,
            color: '#64B5F6',
            arrowType: 'LINE'
        };
        try {
            const response = await authFetch(`http://localhost:8081/boardiox/boards/${boardId}/elements/arrow`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify(request),
            });
            if (response.ok) {
                const newElement = await response.json();
                setElements(prev => [...prev, newElement]);
            }
        } catch (err) { }
        setShowShapesMenu(false);
        setSelectedTool(null);
    };

    const getTableSizes = (element) => {
        const rows = element.element?.rows || 3;
        const cols = element.element?.columns || 3;
        const existing = tableSizes[element.id];
        const cellW = element.width / cols;
        const cellH = element.height / rows;
        return {
            colWidths: existing?.colWidths || Array(cols).fill(cellW),
            rowHeights: existing?.rowHeights || Array(rows).fill(cellH),
        };
    };

    const saveCellToServer = async (elementId, tableId, row, col, content, fmt) => {
        const token = localStorage.getItem('accessToken');
        try {
            await authFetch(`http://localhost:8081/boardiox/boards/${boardId}/elements/table/${tableId}/cell`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    row, col, content,
                    fontSize: fmt?.fontSize ?? null,
                    fontFamily: fmt?.fontFamily ?? null,
                    isBold: fmt?.isBold ?? null,
                    isUnderline: fmt?.isUnderline ?? null,
                }),
            });
        } catch (err) { }
    };

    const finishCellEditing = async (contentOverride) => {
        if (!editingCell) return;
        const { elementId, tableId, row, col } = editingCell;
        const content = contentOverride !== undefined ? contentOverride : editingCellText;
        // Clear editing state immediately (before await) to avoid race conditions
        setEditingCell(null);
        setEditingCellText('');
        setSelectedCell(null);
        editingCellRef.current = null;
        // Update cell contents state — single source of truth for display
        setCellContents(prev => ({ ...prev, [cellFormatKey(elementId, row, col)]: content }));
        // Save to server after state is cleared (include cell formatting)
        const fmt = cellFormats[cellFormatKey(elementId, row, col)];
        await saveCellToServer(elementId, tableId, row, col, content, fmt);
    };

    const createTable = async () => {
        const cols = parseInt(tableCols);
        const rows = parseInt(tableRows);
        if (!cols || !rows || cols <= 0 || rows <= 0) return;
        const center = getCenterScreenCoords();
        const token = localStorage.getItem('accessToken');
        const cellSize = 60;
        const request = {
            x: Math.round(center.x - (cols * cellSize) / 2),
            y: Math.round(center.y - (rows * cellSize) / 2),
            z: 0,
            width: cols * cellSize,
            height: rows * cellSize,
            color: '#ffffff',
            rows: rows,
            columns: cols,
        };
        try {
            const response = await authFetch(`http://localhost:8081/boardiox/boards/${boardId}/elements/table`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify(request),
            });
            if (response.ok) {
                const newElement = await response.json();
                // Fetch full table data (with cells) right after creation
                try {
                    const fullResponse = await authFetch(`http://localhost:8081/boardiox/boards/${boardId}/elements/table/${newElement.id}`, {
                        headers: { 'Authorization': `Bearer ${token}` },
                    });
                    if (fullResponse.ok) {
                        const fullElement = await fullResponse.json();
                        setElements(prev => [...prev, fullElement]);
                    } else {
                        setElements(prev => [...prev, newElement]);
                    }
                } catch {
                    setElements(prev => [...prev, newElement]);
                }
            }
        } catch (err) { }
        setShowTablePanel(false);
        setSelectedTool(null);
        setTableCols('');
        setTableRows('');
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
            const response = await authFetch(`http://localhost:8081/boardiox/boards/${boardId}/elements/image`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData,
            });

            if (response.ok) {
                const newElement = await response.json();
                setElements(prev => [...prev, newElement]);
            } else {
                const errorText = await response.text();
                alert('Failed to upload image: ' + errorText);
            }
        } catch (err) {
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
            content: '',
            fontSize: 24,
            fontFamily: 'Noto Sans'
        };

        try {
            const response = await authFetch(`http://localhost:8081/boardiox/boards/${boardId}/elements/text`, {
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
                setEditText(newElement.element?.content || '');
            }
        } catch (err) { }

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
            if (canvas) canvas.style.cursor = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'%3E%3Cpath d='M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z' fill='%23333333'/%3E%3C/svg%3E") 0 24, crosshair`;
        } else if (tool === 'eraser') {
            if (canvas) canvas.style.cursor = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 16 16' fill='%23333333'%3E%3Cpath d='M8.086 2.207a2 2 0 0 1 2.828 0l3.879 3.879a2 2 0 0 1 0 2.828l-5.5 5.5A2 2 0 0 1 7.879 15H5.12a2 2 0 0 1-1.414-.586l-2.5-2.5a2 2 0 0 1 0-2.828zm.66 11.34L3.453 8.254 1.914 9.793a1 1 0 0 0 0 1.414l2.5 2.5a1 1 0 0 0 .707.293H7.88a1 1 0 0 0 .707-.293z'/%3E%3C/svg%3E") 4 20, cell`;
        } else if (tool === 'lasso') {
            if (canvas) canvas.style.cursor = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='28' height='28' viewBox='0 0 24 24' fill='none' stroke='%23333333' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M4 14c0-4.4 3.6-8 8-8s8 3.6 8 8c0 2-1.5 3.5-3.5 3.5S13 19 11 19c-3.9 0-7-2.2-7-5z'/%3E%3Cpath d='M11 19l-3 3'/%3E%3C/svg%3E") 14 14, crosshair`;
        }
    };

    const deactivateDrawingTool = () => {
        setDrawingTool(null);
        setSelectedTool(null);
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
            const response = await authFetch(`http://localhost:8081/boardiox/boards/${boardId}/elements/comment`, {
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
        } catch (err) { } finally {
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
            const response = await authFetch(`http://localhost:8081/boardiox/boards/${boardId}/elements/${commentElementId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (response.ok) {
                // Remove the comment element reactively
                setElements(prev => prev.filter(el => el.id !== commentElementId));
                setExpandedCommentId(null);
                setCommentMenuId(null);
            }
        } catch (err) { }
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
            const response = await authFetch(`http://localhost:8081/boardiox/boards/${boardId}/elements/${commentElementId}`, {
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
            }
            
            // Clear reply mode
            setReplyText('');
            setReplyingToCommentId(null);
        } catch (err) { }
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
            // Лассо выделяет только рисунки
            if (element.type !== 'DRAWING') return false;
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
        if (!drawingTool || isPanning || isResizing || isDraggingElement || isLassoResizing) return;
        
        const canvas = canvasRef.current;
        if (!canvas) return;
        
        const rect = canvas.getBoundingClientRect();
        const x = (e.clientX - rect.left - panOffset.x) / scale;
        const y = (e.clientY - rect.top - panOffset.y) / scale;
        
        if (drawingTool === 'pencil' || drawingTool === 'eraser') {
            setIsDrawing(true);
            setDrawPoints([{ x, y }]);
        } else if (drawingTool === 'lasso') {
            // Compute bounding box of current selection (if any)
            let insideBounds = false;
            let selected = [];
            if (multiSelectedElements.length > 0) {
                selected = elements.filter(el => multiSelectedElements.includes(el.id));
                const pad = 8;
                const bMinX = Math.min(...selected.map(el => el.x)) - pad;
                const bMinY = Math.min(...selected.map(el => el.y)) - pad;
                const bMaxX = Math.max(...selected.map(el => el.x + el.width)) + pad;
                const bMaxY = Math.max(...selected.map(el => el.y + el.height)) + pad;
                insideBounds = x >= bMinX && x <= bMaxX && y >= bMinY && y <= bMaxY;
            }

            if (e.button === 2) {
                // Right click outside selection — pan the board
                if (!insideBounds) {
                    setIsPanning(true);
                    setPanStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
                }
                return;
            }

            if (insideBounds) {
                // Left click inside selection — drag
                setIsDraggingElement(true);
                setDragElementStart({ x: e.clientX, y: e.clientY });
                setDragElementOffset(selected.map(el => ({ id: el.id, x: el.x, y: el.y })));
                return;
            }

            // Left click outside selection — start new lasso
            setMultiSelectedElements([]);
            setSelectedElementId(null);
            setIsLassoSelecting(true);
            setLassoPoints([{ x, y }]);
        }
    };

    const handleDrawMouseMove = (e) => {
        if (!drawingTool || isResizing) return;

        if (isPanning) {
            setPanOffset({ x: e.clientX - panStart.x, y: e.clientY - panStart.y });
            return;
        }

        if (isLassoResizing && lassoResizeInitial) {
            const dx = (e.clientX - lassoResizeStart.x) / scale;
            const dy = (e.clientY - lassoResizeStart.y) / scale;
            const { bbox, elements: origEls } = lassoResizeInitial;
            let nx = bbox.x, ny = bbox.y, nw = bbox.w, nh = bbox.h;
            const minSize = 20;
            switch (lassoResizeHandle) {
                case 'se': nw = Math.max(minSize, bbox.w + dx); nh = Math.max(minSize, bbox.h + dy); break;
                case 'sw': nx = bbox.x + dx; nw = Math.max(minSize, bbox.w - dx); nh = Math.max(minSize, bbox.h + dy); break;
                case 'ne': nw = Math.max(minSize, bbox.w + dx); ny = bbox.y + dy; nh = Math.max(minSize, bbox.h - dy); break;
                case 'nw': nx = bbox.x + dx; ny = bbox.y + dy; nw = Math.max(minSize, bbox.w - dx); nh = Math.max(minSize, bbox.h - dy); break;
                case 'e':  nw = Math.max(minSize, bbox.w + dx); break;
                case 'w':  nx = bbox.x + dx; nw = Math.max(minSize, bbox.w - dx); break;
                case 's':  nh = Math.max(minSize, bbox.h + dy); break;
                case 'n':  ny = bbox.y + dy; nh = Math.max(minSize, bbox.h - dy); break;
                default: break;
            }
            const scaleX = nw / bbox.w;
            const scaleY = nh / bbox.h;
            setElements(prev => prev.map(el => {
                const orig = origEls.find(o => o.id === el.id);
                if (!orig) return el;
                return {
                    ...el,
                    x: Math.round(nx + (orig.x - bbox.x) * scaleX),
                    y: Math.round(ny + (orig.y - bbox.y) * scaleY),
                    width: Math.max(1, Math.round(orig.width * scaleX)),
                    height: Math.max(1, Math.round(orig.height * scaleY)),
                };
            }));
            return;
        }

        if (drawingTool === 'lasso' && isDraggingElement) {
            handleMouseMove(e);
            return;
        }

        if (isDraggingElement) return;

        const canvas = canvasRef.current;
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        const x = (e.clientX - rect.left - panOffset.x) / scale;
        const y = (e.clientY - rect.top - panOffset.y) / scale;

        if (isDrawing && drawingTool === 'pencil') {
            setDrawPoints(prev => [...prev, { x, y }]);
        } else if (isDrawing && drawingTool === 'eraser') {
            setDrawPoints(prev => [...prev, { x, y }]);
        } else if (isLassoSelecting && drawingTool === 'lasso') {
            setLassoPoints(prev => [...prev, { x, y }]);
        }
    };

    const handleDrawMouseUp = async () => {
        if (!drawingTool) return;

        if (isPanning) {
            setIsPanning(false);
            return;
        }

        // Finish lasso resize
        if (isLassoResizing) {
            const resized = elements.filter(el => multiSelectedElements.includes(el.id));
            for (const el of resized) await saveElementToServer(el);
            setIsLassoResizing(false);
            setLassoResizeHandle(null);
            setLassoResizeInitial(null);
            return;
        }

        // Finish dragging lasso selection
        if (drawingTool === 'lasso' && isDraggingElement) {
            const movedElements = elements.filter(el => multiSelectedElements.includes(el.id));
            for (const el of movedElements) await saveElementToServer(el);
            setIsDraggingElement(false);
            return;
        }
        
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
                const response = await authFetch(`http://localhost:8081/boardiox/boards/${boardId}/elements/drawing`, {
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
            } catch (err) { }
            
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
                    await authFetch(`http://localhost:8081/boardiox/boards/${boardId}/elements/${drawing.id}`, {
                        method: 'DELETE',
                        headers: { 'Authorization': `Bearer ${token}` },
                    });
                } catch (err) {
                }
            }
            
            // Обновляем локальное состояние - удаляем из elements
            setElements(prev => prev.filter(el => !drawingsToDelete.some(d => d.id === el.id)));
            setDrawPoints([]);
        } else if (isLassoSelecting && drawingTool === 'lasso' && lassoPoints.length > 2) {
            const selectedElements = findElementsInsideLasso(lassoPoints, elements);
            if (selectedElements.length > 0) {
                setMultiSelectedElements(selectedElements.map(el => el.id));
                setSelectedElementId(selectedElements[0].id);
            } else {
                setMultiSelectedElements([]);
                setSelectedElementId(null);
            }
            setLassoPoints([]);
        }
        
        setIsDrawing(false);
        setIsLassoSelecting(false);
    };

    // Сохранение элементов на сервере
    const saveElementToServer = async (element) => {
        if (!element) return;

        // Handle DRAWING elements — bake translate+scale transform into points before saving
        if (element.type === 'DRAWING') {
            if (!element.element?.pointsData) return;
            try {
                const points = JSON.parse(element.element.pointsData);
                let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
                points.forEach(p => {
                    if (p.x < minX) minX = p.x; if (p.y < minY) minY = p.y;
                    if (p.x > maxX) maxX = p.x; if (p.y > maxY) maxY = p.y;
                });
                const origWidth = maxX - minX || 1;
                const origHeight = maxY - minY || 1;
                const scaleX = element.width / origWidth;
                const scaleY = element.height / origHeight;
                const offsetX = element.x - minX;
                const offsetY = element.y - minY;
                // Skip if nothing changed
                if (scaleX === 1 && scaleY === 1 && offsetX === 0 && offsetY === 0) return;
                // Bake transform: translate(-minX,-minY) → scale → translate(element.x, element.y)
                const bakedPoints = points.map(p => ({
                    x: (p.x - minX) * scaleX + element.x,
                    y: (p.y - minY) * scaleY + element.y
                }));
                const token = localStorage.getItem('accessToken');
                const response = await authFetch(`http://localhost:8081/boardiox/boards/${boardId}/elements/${element.id}`, {
                    method: 'PUT',
                    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        x: element.x,
                        y: element.y,
                        z: element.z || 0,
                        width: element.width,
                        height: element.height,
                        color: element.element?.color || element.color,
                        strokeWidth: element.element?.strokeWidth || 3,
                        points: bakedPoints
                    }),
                });
                if (response.ok) {
                    const updated = await response.json();
                    setElements(prev => prev.map(el => el.id === updated.id ? updated : el));
                }
            } catch (err) { }
            return;
        }

        // Check if user has permission to modify this element
        if (element.type === 'COMMENT') {
            const commentUserId = element.element?.userId;
            if (!currentUserId) return;
            if (commentUserId !== undefined && commentUserId !== null && commentUserId !== currentUserId) return;
        }

        const token = localStorage.getItem('accessToken');

        // Handle IMAGE elements
        if (element.type === 'IMAGE') {
            const response = await authFetch(`http://localhost:8081/boardiox/boards/${boardId}/elements/${element.id}`, {
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
                setElements(prevElements =>
                    prevElements.map(el => el.id === updatedElement.id ? updatedElement : el)
                );
            }
            return;
        }

        // Handle TEXT elements
        if (element.type === 'TEXT') {
            const response = await authFetch(`http://localhost:8081/boardiox/boards/${boardId}/elements/text/${element.id}`, {
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
                setElements(prevElements =>
                    prevElements.map(el => el.id === updatedElement.id ? updatedElement : el)
                );
            }
            return;
        }

        // Handle COMMENT elements
        if (element.type === 'COMMENT') {
            const response = await authFetch(`http://localhost:8081/boardiox/boards/${boardId}/elements/${element.id}`, {
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
                setElements(prevElements =>
                    prevElements.map(el => el.id === updatedElement.id ? updatedElement : el)
                );
            }
            return;
        }

        // Handle ARROW elements
        if (element.type === 'ARROW') {
            const localElement = element; // capture before async
            const response = await authFetch(`http://localhost:8081/boardiox/boards/${boardId}/elements/arrow/${element.id}`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    x: element.x,
                    y: element.y,
                    z: element.z || 0,
                    width: element.width,
                    height: element.height,
                    color: element.color,
                    startX: element.element?.startX,
                    startY: element.element?.startY,
                    endX: element.element?.endX,
                    endY: element.element?.endY,
                    arrowType: element.element?.arrowType,
                    strokeStyle: element.element?.strokeStyle || 'solid',
                }),
            });
            if (response.ok) {
                const serverElement = await response.json();
                // Merge: keep local element data (e.g. strokeStyle) that server may not return correctly
                setElements(prev => prev.map(el => {
                    if (el.id !== serverElement.id) return el;
                    return {
                        ...serverElement,
                        element: { ...localElement.element, ...serverElement.element }
                    };
                }));
            }
            return;
        }

        // Handle SHAPE elements
        if (element.type !== 'SHAPE') return;
        const response = await authFetch(`http://localhost:8081/boardiox/boards/${boardId}/elements/shape/${element.id}`, {
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
            setElements(prevElements =>
                prevElements.map(el => {
                    if (el.id === updatedElement.id) {
                        return updatedElement;
                    }
                    return el;
                })
            );

        }
    };

    // === Обновление формата текста ===
    const updateTextFormat = async (elementId, updates) => {
        const element = elements.find(el => el.id === elementId);
        if (!element || (element.type !== 'SHAPE' && element.type !== 'TEXT')) return;

        const updatedElement = {
            ...element,
            element: {
                ...element.element,
                ...updates
            }
        };

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
            // Если текст не введён — удаляем элемент
            if (!editText.trim()) {
                setElements(prev => prev.filter(el => el.id !== selectedElementId));
                try {
                    const token = localStorage.getItem('accessToken');
                    await authFetch(`http://localhost:8081/boardiox/boards/${boardId}/elements/${selectedElementId}`, {
                        method: 'DELETE',
                        headers: { 'Authorization': `Bearer ${token}` },
                    });
                } catch (err) { }
            } else {
                const updatedElement = {
                    ...element,
                    element: { ...element.element, content: editText }
                };
                setElements(prev => prev.map(el => el.id === selectedElementId ? updatedElement : el));
                await saveElementToServer(updatedElement);
            }
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
        // Don't interrupt text editing for the same element
        if (isEditingText && selectedElementId === elementId) return;

        const element = elements.find(el => el.id === elementId);
        if (!element) return;

        // Check if user has permission to move this element
        if (element.type === 'COMMENT') {
            const commentUserId = element.element?.userId;
            if (!currentUserId) return;
            if (commentUserId !== undefined && commentUserId !== null && commentUserId !== currentUserId) return;
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
            setDragElementOffset({
                x: element.x, y: element.y,
                startX: element.element?.startX ?? element.x,
                startY: element.element?.startY ?? element.y,
                endX: element.element?.endX ?? (element.x + element.width),
                endY: element.element?.endY ?? (element.y + element.height),
            });
            if (element.type !== 'COMMENT') {
                setShowFormatPanel(true);
            }
            setShowBorderPanel(false);
            setShowColorPicker(false);
        }
    };

    // === ОДИНОЧНЫЙ КЛИК ДЛЯ ВЫДЕЛЕНИЯ И ПОКАЗА ПАНЕЛИ ===
    const handleElementClick = async (e, elementId) => {
        e.stopPropagation();
        // If clicking the same element that's being edited — don't cancel editing
        if (isEditingText && selectedElementId === elementId) return;
        // Clicking another element — save and exit editing
        if (isEditingText && selectedElementId !== elementId) {
            await finishEditing();
        }
        setSelectedElementId(elementId);
        setShowFormatPanel(true);
        setIsEditingText(false);
        setShowBorderPanel(false);
        setShowColorPicker(false);
        setShowTableBorderPanel(false);
        setShowTableColorPicker(false);
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
            if (e.target.closest('.comment-input-popup')) return;
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
            // Don't call finishCellEditing() here — onBlur on the contenteditable handles it
            // with the correct innerText content. Calling it here would save empty string.
            setSelectedCell(null);
            setShowTableBorderPanel(false);
            setShowTableColorPicker(false);
            setShowColorPicker(false);
            setExpandedCommentId(null);
        }
    };

    // === ГЛАВНЫЙ ОБРАБОТЧИК ДВИЖЕНИЯ МЫШИ ===
    const handleMouseMove = (e) => {
        if (tableResizeDrag) {
            const { elementId, type, index, startX, startY, startSize, nextSize } = tableResizeDrag;
            const minSize = 20;
            setTableSizes(prev => {
                const el = elements.find(el => el.id === elementId);
                if (!el) return prev;
                const sizes = getTableSizes(el);
                const arr = type === 'col' ? [...sizes.colWidths] : [...sizes.rowHeights];
                const delta = type === 'col' ? (e.clientX - startX) / scale : (e.clientY - startY) / scale;
                arr[index] = Math.max(minSize, startSize + delta);
                arr[index + 1] = Math.max(minSize, nextSize - delta);
                return {
                    ...prev,
                    [elementId]: {
                        colWidths: type === 'col' ? arr : sizes.colWidths,
                        rowHeights: type === 'row' ? arr : sizes.rowHeights,
                    }
                };
            });
            return;
        }
        if (arrowEndpointDrag) {
            const dx = (e.clientX - arrowEndpointDrag.mouseStartX) / scale;
            const dy = (e.clientY - arrowEndpointDrag.mouseStartY) / scale;
            setElements(prev => prev.map(el => {
                if (el.id !== arrowEndpointDrag.elementId) return el;
                let newStartX = arrowEndpointDrag.origStartX;
                let newStartY = arrowEndpointDrag.origStartY;
                let newEndX = arrowEndpointDrag.origEndX;
                let newEndY = arrowEndpointDrag.origEndY;
                if (arrowEndpointDrag.endpoint === 'start') {
                    newStartX = Math.round(arrowEndpointDrag.origStartX + dx);
                    newStartY = Math.round(arrowEndpointDrag.origStartY + dy);
                } else {
                    newEndX = Math.round(arrowEndpointDrag.origEndX + dx);
                    newEndY = Math.round(arrowEndpointDrag.origEndY + dy);
                }
                const minX = Math.min(newStartX, newEndX);
                const minY = Math.min(newStartY, newEndY);
                const maxX = Math.max(newStartX, newEndX);
                const maxY = Math.max(newStartY, newEndY);
                return {
                    ...el,
                    x: minX, y: minY,
                    width: Math.max(maxX - minX, 10),
                    height: Math.max(maxY - minY, 10),
                    element: { ...el.element, startX: newStartX, startY: newStartY, endX: newEndX, endY: newEndY }
                };
            }));
            return;
        }
        if (isDraggingElement) {
            const dx = Math.abs(e.clientX - dragElementStart.x);
            const dy = Math.abs(e.clientY - dragElementStart.y);
            if (dx > 3 || dy > 3) {
                commentDraggedRef.current = true;
            }
        }
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

                setElements(prev => prev.map(el => {
                    if (el.id !== selectedElementId) return el;
                    // For ARROW elements, also shift startX/Y and endX/Y using saved originals
                    if (el.type === 'ARROW') {
                        return {
                            ...el, x: newX, y: newY,
                            element: {
                                ...el.element,
                                startX: Math.round((dragElementOffset.startX ?? dragElementOffset.x) + dx),
                                startY: Math.round((dragElementOffset.startY ?? dragElementOffset.y) + dy),
                                endX: Math.round((dragElementOffset.endX ?? (dragElementOffset.x + el.width)) + dx),
                                endY: Math.round((dragElementOffset.endY ?? (dragElementOffset.y + el.height)) + dy),
                            }
                        };
                    }
                    return { ...el, x: newX, y: newY };
                }));
            }
        }
    };

    // === ЗАВЕРШЕНИЕ ДЕЙСТВИЯ ===
    const handleMouseUp = async () => {
        if (tableResizeDrag) {
            setTableResizeDrag(null);
            return;
        }
        if (arrowEndpointDrag) {
            const element = elements.find(el => el.id === arrowEndpointDrag.elementId);
            if (element) await saveElementToServer(element);
            setArrowEndpointDrag(null);
            return;
        }
        if (isPanning) {
            setIsPanning(false);
            return;
        }

        if (isResizing && selectedElementId) {
            const element = elements.find(el => el.id === selectedElementId);
            if (element) await saveElementToServer(element);
            setIsResizing(false);
            setActiveHandle(null);
        }
        else if (isDraggingElement && selectedElementId) {
            if (Array.isArray(dragElementOffset)) {
                const movedElements = elements.filter(el => multiSelectedElements.includes(el.id));
                for (const element of movedElements) {
                    await saveElementToServer(element);
                }
            } else {
                const element = elements.find(el => el.id === selectedElementId);
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

    const fontOptions = [
        'Noto Sans', 'Arial', 'Times New Roman', 'Courier New', 'Georgia', 'Verdana',
        'Roboto', 'Open Sans', 'Lato', 'Montserrat', 'Oswald', 'Raleway', 'Poppins',
        'Merriweather', 'Ubuntu', 'Playfair Display', 'Source Code Pro', 'Nunito',
        'Inter', 'Fira Sans', 'PT Sans', 'PT Serif', 'Lobster', 'Pacifico',
        'Dancing Script', 'Comfortaa', 'Bebas Neue', 'Josefin Sans', 'Tahoma', 'Impact'
    ];
    const sizeOptions = [10, 12, 14, 15, 16, 18, 20, 24, 28, 32, 36, 48, 64];
    const colorOptions = ['#90CAF9', '#A5D6A7', '#FFCC80', '#EF9A9A', '#CE93D8', '#80DEEA', '#F48FB1', '#FFF59D', '#FFFFFF', '#B0BEC5', '#78909C', '#A1887F'];

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
                            <svg width="40" height="40" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="2.2">
                                {/* Circle - left */}
                                <circle cx="10" cy="15" r="8" />
                                {/* Rounded rect - bottom right overlapping circle */}
                                <rect x="13" y="18" width="12" height="10" rx="2" />
                                {/* Arrow pointing right - outlined with white fill */}
                                <path d="M22 8 L29 12 L22 16 L22 13 L16 13 L16 11 L22 11 Z" fill="transparent" strokeLinejoin="round" />
                            </svg>
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
                        <div style={{ position: 'relative' }}>
                            <button
                                className={`tool-button ${showTablePanel ? 'active' : ''}`}
                                title="Таблица"
                                onClick={() => setShowTablePanel(prev => !prev)}
                            ><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18M3 15h18M9 3v18M15 3v18" /></svg></button>
                            {showTablePanel && (() => {
                                const colsValid = parseInt(tableCols) > 0;
                                const rowsValid = parseInt(tableRows) > 0;
                                const canConfirm = colsValid && rowsValid;
                                return (
                                    <div className="table-creation-panel" onMouseDown={e => e.stopPropagation()}>
                                        <div className="table-panel-row">
                                            <span>Число столбцов:</span>
                                            <input
                                                type="number"
                                                value={tableCols}
                                                placeholder=""
                                                onChange={(e) => setTableCols(e.target.value)}
                                                className="table-panel-input"
                                            />
                                        </div>
                                        <div className="table-panel-row">
                                            <span>Число строк:</span>
                                            <input
                                                type="number"
                                                value={tableRows}
                                                placeholder=""
                                                onChange={(e) => setTableRows(e.target.value)}
                                                className="table-panel-input"
                                            />
                                        </div>
                                        <div className="table-panel-buttons">
                                            <button className="table-panel-cancel" onClick={() => { setShowTablePanel(false); setTableCols(''); setTableRows(''); }}>Отмена</button>
                                            <button
                                                className="table-panel-confirm"
                                                onClick={createTable}
                                                disabled={!canConfirm}
                                                style={{ opacity: canConfirm ? 1 : 0.45, cursor: canConfirm ? 'pointer' : 'not-allowed' }}
                                            >Подтвердить</button>
                                        </div>
                                    </div>
                                );
                            })()}
                        </div>
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
                            <button className="shape-btn" onClick={createArrow} title="Стрелка"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="19" x2="19" y2="5" /><polyline points="9,5 19,5 19,15" /></svg></button>
                            <button className="shape-btn" onClick={createDoubleArrow} title="Двухсторонняя стрелка"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="4" y1="20" x2="20" y2="4" /><path d="M4 20 L4 14 M4 20 L10 20" /><path d="M20 4 L20 10 M20 4 L14 4" /></svg></button>
                            <button className="shape-btn" onClick={createLine} title="Линия"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="5" y1="19" x2="19" y2="5" /></svg></button>
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
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M4 14c0-4.4 3.6-8 8-8s8 3.6 8 8c0 2-1.5 3.5-3.5 3.5S13 19 11 19c-3.9 0-7-2.2-7-5z"/>
                                        <path d="M11 19l-3 3"/>
                                    </svg>
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
                    className={`board-canvas ${isAddingComment ? 'comment-mode' : ''} ${drawingTool === 'pencil' ? 'pencil-mode' : ''}`}
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
                                overflow: 'visible',
                                zIndex: drawingTool === 'pencil' ? 100 : 1
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

                                    // Compute bbox of stored points (absolute coords)
                                    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
                                    points.forEach(p => {
                                        if (p.x < minX) minX = p.x; if (p.y < minY) minY = p.y;
                                        if (p.x > maxX) maxX = p.x; if (p.y > maxY) maxY = p.y;
                                    });
                                    const origWidth = maxX - minX || 1;
                                    const origHeight = maxY - minY || 1;
                                    // Scale to match current element size (resize support)
                                    const scaleX = drawingElement.width / origWidth;
                                    const scaleY = drawingElement.height / origHeight;
                                    // Transform: move to element position, scale, then shift points to origin
                                    const transform = `translate(${drawingElement.x}, ${drawingElement.y}) scale(${scaleX}, ${scaleY}) translate(${-minX}, ${-minY})`;

                                    const isLassoSelected = multiSelectedElements.includes(drawingElement.id);
                                    return (
                                        <g key={drawingElement.id} transform={transform}>
                                            {isLassoSelected && (
                                                <path
                                                    d={pathData}
                                                    stroke="#0078D4"
                                                    strokeWidth={strokeWidth + 6}
                                                    fill="none"
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    vectorEffect="non-scaling-stroke"
                                                    opacity="0.4"
                                                    style={{ pointerEvents: 'none' }}
                                                />
                                            )}
                                            <path
                                                d={pathData}
                                                stroke={color}
                                                strokeWidth={strokeWidth}
                                                fill="none"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                vectorEffect="non-scaling-stroke"
                                                style={{ pointerEvents: 'none' }}
                                            />
                                        </g>
                                    );
                                } catch (err) {
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
                            
                            {/* Arrow elements */}
                            {elements.filter(el => el.type === 'ARROW').map((element) => {
                                const sx = element.element?.startX ?? element.x;
                                const sy = element.element?.startY ?? element.y;
                                const ex = element.element?.endX ?? (element.x + element.width);
                                const ey = element.element?.endY ?? (element.y + element.height);
                                const color = element.color || '#64B5F6';
                                const at = element.element?.arrowType;
                                const isDouble = at === 'DOUBLE';
                                const isLine = at === 'LINE';
                                const isSelected = selectedElementId === element.id;
                                const ss = element.element?.strokeStyle || 'solid';
                                const dashArray = ss === 'dashed' ? '12,6' : ss === 'dotted' ? '3,6' : undefined;
                                return (
                                    <g key={element.id}>
                                        <defs>
                                            {!isLine && <marker id={`ae-${element.id}`} markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
                                                <path d="M0,0 L0,8 L8,4 Z" fill={color} />
                                            </marker>}
                                            {isDouble && <marker id={`as-${element.id}`} markerWidth="8" markerHeight="8" refX="2" refY="4" orient="auto-start-reverse">
                                                <path d="M0,0 L0,8 L8,4 Z" fill={color} />
                                            </marker>}
                                        </defs>
                                        <line x1={sx} y1={sy} x2={ex} y2={ey}
                                            stroke={color} strokeWidth="4" strokeLinecap="round"
                                            strokeDasharray={dashArray}
                                            markerEnd={!isLine ? `url(#ae-${element.id})` : undefined}
                                            markerStart={isDouble ? `url(#as-${element.id})` : undefined}
                                            style={{ pointerEvents: 'none' }}
                                        />
                                        {/* Transparent hit line */}
                                        <line x1={sx} y1={sy} x2={ex} y2={ey}
                                            stroke="transparent" strokeWidth="20"
                                            style={{ cursor: 'default', pointerEvents: drawingTool ? 'none' : 'stroke' }}
                                            onMouseDown={(e) => handleElementMouseDown(e, element.id)}
                                            onClick={(e) => handleElementClick(e, element.id)}
                                        />
                                    </g>
                                );
                            })}

                            {/* Общая рамка для лассо-выделенных рисунков */}
                            {multiSelectedElements.length > 1 && (() => {
                                const selected = elements.filter(el => multiSelectedElements.includes(el.id));
                                if (selected.length === 0) return null;
                                let bMinX = Infinity, bMinY = Infinity, bMaxX = -Infinity, bMaxY = -Infinity;
                                selected.forEach(el => {
                                    bMinX = Math.min(bMinX, el.x);
                                    bMinY = Math.min(bMinY, el.y);
                                    bMaxX = Math.max(bMaxX, el.x + el.width);
                                    bMaxY = Math.max(bMaxY, el.y + el.height);
                                });
                                const pad = 8;
                                const rx = bMinX - pad, ry = bMinY - pad;
                                const rw = bMaxX - bMinX + pad * 2, rh = bMaxY - bMinY + pad * 2;
                                const cx = rx + rw / 2, cy = ry + rh / 2;
                                const dotR = 5 / scale;
                                const handles = [
                                    { h: 'nw', x: rx,      y: ry,       cursor: 'nw-resize' },
                                    { h: 'n',  x: cx,      y: ry,       cursor: 'n-resize'  },
                                    { h: 'ne', x: rx + rw, y: ry,       cursor: 'ne-resize' },
                                    { h: 'e',  x: rx + rw, y: cy,       cursor: 'e-resize'  },
                                    { h: 'se', x: rx + rw, y: ry + rh,  cursor: 'se-resize' },
                                    { h: 's',  x: cx,      y: ry + rh,  cursor: 's-resize'  },
                                    { h: 'sw', x: rx,      y: ry + rh,  cursor: 'sw-resize' },
                                    { h: 'w',  x: rx,      y: cy,       cursor: 'w-resize'  },
                                ];
                                return (
                                    <g>
                                        <rect
                                            x={rx} y={ry} width={rw} height={rh}
                                            fill="none"
                                            stroke="#fff"
                                            strokeWidth={2 / scale}
                                            strokeDasharray={`${6 / scale},${4 / scale}`}
                                            rx={4 / scale}
                                            style={{ pointerEvents: 'none' }}
                                        />
                                        {handles.map((d) => (
                                            <circle key={d.h} cx={d.x} cy={d.y} r={dotR}
                                                fill="#fff" stroke="#aaa" strokeWidth={1 / scale}
                                                style={{ cursor: d.cursor, pointerEvents: 'auto' }}
                                                onMouseDown={(e) => {
                                                    e.stopPropagation();
                                                    e.preventDefault();
                                                    setIsLassoResizing(true);
                                                    setLassoResizeHandle(d.h);
                                                    setLassoResizeStart({ x: e.clientX, y: e.clientY });
                                                    setLassoResizeInitial({
                                                        bbox: { x: rx, y: ry, w: rw, h: rh },
                                                        elements: selected.map(el => ({ id: el.id, x: el.x, y: el.y, width: el.width, height: el.height }))
                                                    });
                                                }}
                                            />
                                        ))}
                                    </g>
                                );
                            })()}

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
                                    {/* Панель форматирования ячейки (когда ячейка выбрана или редактируется) */}
                                    {isSelected && element.type === 'TABLE' && (selectedCell?.elementId === element.id || editingCell?.elementId === element.id) && !isDraggingElement && (() => {
                                        const { row, col } = selectedCell?.elementId === element.id ? selectedCell : editingCell;
                                        const fmt = getCellFormat(element.id, row, col);
                                        return (
                                            <div
                                                className="format-panel"
                                                style={{ left: element.x, top: element.y - 70, transform: `scale(${1 / scale})`, transformOrigin: 'bottom left' }}
                                                onMouseDown={e => { e.stopPropagation(); e.preventDefault(); }}
                                            >
                                                <button className={`format-btn ${fmt.isUnderline ? 'active' : ''}`} onClick={() => updateCellFormat(element.id, row, col, { isUnderline: !fmt.isUnderline })} title="Подчеркнутый">
                                                    <span style={{ textDecoration: 'underline', fontWeight: 400 }}>A</span>
                                                </button>
                                                <div className="format-divider" />
                                                <button className={`format-btn ${fmt.isBold ? 'active' : ''}`} onClick={() => updateCellFormat(element.id, row, col, { isBold: !fmt.isBold })} title="Жирный">
                                                    <span style={{ fontWeight: 700 }}>B</span>
                                                </button>
                                                <div className="format-divider" />
                                                <div className="format-dropdown">
                                                    <select className="format-select" value={fmt.fontSize} onMouseDown={e => e.stopPropagation()} onChange={e => updateCellFormat(element.id, row, col, { fontSize: Number(e.target.value) })}>
                                                        {sizeOptions.map(s => <option key={s} value={s}>{s}</option>)}
                                                    </select>
                                                </div>
                                                <div className="format-divider" />
                                                <div className="format-dropdown">
                                                    <select className="format-select format-font-select" value={fmt.fontFamily} onMouseDown={e => e.stopPropagation()} onChange={e => updateCellFormat(element.id, row, col, { fontFamily: e.target.value })}>
                                                        {fontOptions.map(f => <option key={f} value={f} style={{ fontFamily: f }}>{f}</option>)}
                                                    </select>
                                                </div>
                                            </div>
                                        );
                                    })()}

                                    {/* Панель форматирования для TABLE */}
                                    {isSelected && showFormatPanel && !isDraggingElement && !isResizing && element.type === 'TABLE' && !selectedCell && !editingCell && (
                                        <div
                                            className="format-panel"
                                            style={{
                                                left: element.x,
                                                top: element.y - 70,
                                                transform: `scale(${1 / scale})`,
                                                transformOrigin: 'bottom left',
                                                animation: 'none',
                                            }}
                                            onMouseDown={e => e.stopPropagation()}
                                        >
                                            {/* Border thickness button */}
                                            <div style={{ position: 'relative' }}>
                                                <button
                                                    className="format-color-btn"
                                                    onClick={() => { setShowTableBorderPanel(p => !p); setShowTableColorPicker(false); }}
                                                    title="Жирность границ"
                                                    style={{ width: 28, height: 28, borderRadius: '50%', backgroundColor: 'transparent', border: `${Math.max(2, tableBorderWidth[element.id] ?? 1)}px solid #000`, cursor: 'pointer' }}
                                                />
                                                {showTableBorderPanel && (
                                                    <div className="border-panel" style={{ left: 0, top: '110%' }}>
                                                        <div className="border-panel-row">
                                                            <span className="border-panel-label">Жирность</span>
                                                            <input
                                                                type="range" min="1" max="6"
                                                                value={tableBorderWidth[element.id] ?? 1}
                                                                onChange={e => {
                                                                    const v = Number(e.target.value);
                                                                    setTableBorderWidth(prev => ({ ...prev, [element.id]: v }));
                                                                }}
                                                                className="border-slider"
                                                            />
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                            {/* Background color button */}
                                            <div style={{ position: 'relative' }}>
                                                <button
                                                    className="format-color-btn"
                                                    onClick={() => { setShowTableColorPicker(p => !p); setShowTableBorderPanel(false); }}
                                                    title="Цвет фона таблицы"
                                                    style={{ width: 28, height: 28, borderRadius: '50%', backgroundColor: element.color || '#ffffff', border: '2px solid #000', cursor: 'pointer' }}
                                                />
                                                {showTableColorPicker && (
                                                    <div className="color-picker-panel" style={{ left: 0, top: '110%' }}>
                                                        {colorOptions.map(color => (
                                                            <div
                                                                key={color}
                                                                className="color-option"
                                                                style={{ backgroundColor: color }}
                                                                onClick={async () => {
                                                                    const token = localStorage.getItem('accessToken');
                                                                    const updated = { ...element, color };
                                                                    setElements(prev => prev.map(el => el.id === element.id ? updated : el));
                                                                    setShowTableColorPicker(false);
                                                                    try {
                                                                        await authFetch(`http://localhost:8081/boardiox/boards/${boardId}/elements/${element.id}`, {
                                                                            method: 'PUT',
                                                                            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                                                                            body: JSON.stringify({ x: element.x, y: element.y, z: element.z || 0, width: element.width, height: element.height, color }),
                                                                        });
                                                                    } catch (err) { }
                                                                }}
                                                            />
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {isSelected && showFormatPanel && !isDraggingElement && !isResizing && element.type === 'SHAPE' && (
                                        <div
                                            className="format-panel"
                                            ref={formatPanelRef}
                                            style={{
                                                left: element.x,
                                                top: element.y - 70,
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
                                                top: element.y - 70,
                                                transform: `scale(${1 / scale})`,
                                                transformOrigin: 'bottom left'
                                            }}
                                        >
                                            <button
                                                className={`format-btn ${(element.element?.isUnderline || false) ? 'active' : ''}`}
                                                onClick={() => updateTextFormat(element.id, { isUnderline: !(element.element?.isUnderline || false) })}
                                                title="Подчеркнутый текст"
                                            >
                                                <span style={{ textDecoration: 'underline', fontWeight: 400 }}>A</span>
                                            </button>

                                            <div className="format-divider"></div>

                                            <button
                                                className={`format-btn ${(element.element?.isBold || false) ? 'active' : ''}`}
                                                onClick={() => updateTextFormat(element.id, { isBold: !(element.element?.isBold || false) })}
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
                                        className={`board-element ${isSelected ? 'selected' : ''} ${multiSelectedElements.includes(element.id) && multiSelectedElements.length > 1 ? 'multi-selected' : ''} ${element.type === 'COMMENT' ? 'comment-board-element' : ''}`}
                                        style={{
                                            position: 'absolute',
                                            left: element.x,
                                            top: element.y,
                                            width: element.type === 'COMMENT' ? 48 : element.width,
                                            height: element.type === 'COMMENT' ? 48 : element.height,
                                            pointerEvents: (drawingTool || element.type === 'ARROW') ? 'none' : 'auto',
                                            ...(element.type === 'COMMENT' ? {
                                                transform: `scale(${1 / scale})`,
                                                transformOrigin: 'top left'
                                            } : {})
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
                                                        onChange={(e) => { e.target.style.height = 'auto'; e.target.style.height = Math.min(e.target.scrollHeight, e.target.parentElement?.clientHeight || 99999) + 'px'; setEditText(e.target.value); }}
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
                                                        onChange={(e) => { e.target.style.height = 'auto'; e.target.style.height = Math.min(e.target.scrollHeight, e.target.parentElement?.clientHeight || 99999) + 'px'; setEditText(e.target.value); }}
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
                                                        onChange={(e) => { e.target.style.height = 'auto'; e.target.style.height = Math.min(e.target.scrollHeight, e.target.parentElement?.clientHeight || 99999) + 'px'; setEditText(e.target.value); }}
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

                                        {element.type === 'ARROW' && null}

                                        {element.type === 'TABLE' && (() => {
                                            const { rows: numRows, cols: numCols } = getTableStructure(element);
                                            const { colWidths, rowHeights } = getTableSizes(element);
                                            const tableId = element.id; // boardElement.id — updateTableCell endpoint expects this
                                            const getCellContent = (r, c) => cellContents[cellFormatKey(element.id, r, c)] || '';

                                            // Compute cumulative offsets
                                            const colOffsets = colWidths.reduce((acc, w) => [...acc, (acc[acc.length-1]||0) + w], [0]);
                                            const rowOffsets = rowHeights.reduce((acc, h) => [...acc, (acc[acc.length-1]||0) + h], [0]);
                                            const totalW = colOffsets[numCols];
                                            const totalH = rowOffsets[numRows];

                                            return (
                                                <div
                                                    style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden', backgroundColor: element.color || '#ffffff', boxSizing: 'border-box' }}
                                                >
                                                    {/* Cells */}
                                                    {Array.from({ length: numRows }).map((_, r) =>
                                                        Array.from({ length: numCols }).map((_, c) => {
                                                            const isEditing = editingCell?.elementId === element.id && editingCell.row === r && editingCell.col === c;
                                                            const x = (colOffsets[c] / totalW) * 100;
                                                            const y = (rowOffsets[r] / totalH) * 100;
                                                            const w = (colWidths[c] / totalW) * 100;
                                                            const h = (rowHeights[r] / totalH) * 100;
                                                            return (
                                                                <div
                                                                    key={`${r}-${c}`}
                                                                    style={{
                                                                        position: 'absolute',
                                                                        left: `${x}%`, top: `${y}%`,
                                                                        width: `${w}%`, height: `${h}%`,
                                                                        border: `${tableBorderWidth[element.id] ?? 1}px solid #1a1a2e`,
                                                                        boxSizing: 'border-box',
                                                                        overflow: 'hidden',
                                                                        cursor: isDraggingElement ? 'grabbing' : 'default',
                                                                        userSelect: isDraggingElement ? 'none' : 'auto',
                                                                    }}
                                                                    onMouseDown={() => {
                                                                        // Capture BEFORE handleElementMouseDown updates selectedElementId
                                                                        tableWasSelectedRef.current = selectedElementId === element.id;
                                                                    }}
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        if (tableWasSelectedRef.current) {
                                                                            setSelectedCell({ elementId: element.id, row: r, col: c });
                                                                        }
                                                                    }}
                                                                    onDoubleClick={(e) => {
                                                                        e.stopPropagation();
                                                                        const content = cellContents[cellFormatKey(element.id, r, c)] || '';
                                                                        setSelectedCell(null);
                                                                        editingCellRef.current = content;
                                                                        setEditingCell({ elementId: element.id, tableId, row: r, col: c });
                                                                    }}
                                                                >
                                                                    {/* Dashed selection overlay for selected cell */}
                                                                    {!isEditing && selectedCell?.elementId === element.id && selectedCell.row === r && selectedCell.col === c && (
                                                                        <div style={{
                                                                            position: 'absolute', inset: 0,
                                                                            border: '2px dashed #64A1BA',
                                                                            boxSizing: 'border-box',
                                                                            pointerEvents: 'none',
                                                                            zIndex: 2,
                                                                        }} />
                                                                    )}
                                                                    {isEditing ? (
                                                                        <div
                                                                            contentEditable
                                                                            suppressContentEditableWarning
                                                                            ref={el => {
                                                                                if (el && !el.dataset.cellInitialized) {
                                                                                    el.dataset.cellInitialized = 'true';
                                                                                    el.textContent = editingCellRef.current || '';
                                                                                    el.focus();
                                                                                    const range = document.createRange();
                                                                                    range.selectNodeContents(el);
                                                                                    range.collapse(false);
                                                                                    const sel = window.getSelection();
                                                                                    sel.removeAllRanges();
                                                                                    sel.addRange(range);
                                                                                }
                                                                            }}
                                                                            onBlur={e => finishCellEditing(e.currentTarget.innerText)}
                                                                            onKeyDown={e => {
                                                                                if (e.key === 'Escape') finishCellEditing(e.currentTarget.innerText);
                                                                                e.stopPropagation();
                                                                            }}
                                                                            onMouseDown={e => e.stopPropagation()}
                                                                            style={{
                                                                                width: '100%', height: '100%',
                                                                                outline: '2px solid #64A1BA',
                                                                                outlineOffset: '-2px',
                                                                                padding: '2px 4px',
                                                                                fontSize: `${getCellFormat(element.id, r, c).fontSize}px`,
                                                                                fontFamily: getCellFormat(element.id, r, c).fontFamily,
                                                                                fontWeight: getCellFormat(element.id, r, c).isBold ? 'bold' : 'normal',
                                                                                textDecoration: getCellFormat(element.id, r, c).isUnderline ? 'underline' : 'none',
                                                                                backgroundColor: 'transparent', boxSizing: 'border-box',
                                                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                                                textAlign: 'center', whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                                                                                cursor: 'text', overflow: 'hidden',
                                                                            }}
                                                                        />
                                                                    ) : (
                                                                        <div style={{ padding: '2px 4px', fontSize: `${getCellFormat(element.id, r, c).fontSize}px`, fontFamily: getCellFormat(element.id, r, c).fontFamily, fontWeight: getCellFormat(element.id, r, c).isBold ? 'bold' : 'normal', textDecoration: getCellFormat(element.id, r, c).isUnderline ? 'underline' : 'none', whiteSpace: 'pre-wrap', wordBreak: 'break-word', width: '100%', height: '100%', boxSizing: 'border-box', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
                                                                            {getCellContent(r, c)}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            );
                                                        })
                                                    )}

                                                    {/* Column resize handles */}
                                                    {Array.from({ length: numCols - 1 }).map((_, i) => (
                                                        <div
                                                            key={`cr${i}`}
                                                            style={{
                                                                position: 'absolute',
                                                                left: `${(colOffsets[i+1] / totalW) * 100}%`,
                                                                top: 0, width: '6px', height: '100%',
                                                                transform: 'translateX(-3px)',
                                                                cursor: 'col-resize', zIndex: 10,
                                                                backgroundColor: 'transparent',
                                                            }}
                                                            onMouseDown={e => {
                                                                e.stopPropagation(); e.preventDefault();
                                                                setTableResizeDrag({ elementId: element.id, type: 'col', index: i, startX: e.clientX, startY: e.clientY, startSize: colWidths[i], nextSize: colWidths[i+1] });
                                                            }}
                                                        />
                                                    ))}

                                                    {/* Row resize handles */}
                                                    {Array.from({ length: numRows - 1 }).map((_, i) => (
                                                        <div
                                                            key={`rr${i}`}
                                                            style={{
                                                                position: 'absolute',
                                                                top: `${(rowOffsets[i+1] / totalH) * 100}%`,
                                                                left: 0, height: '6px', width: '100%',
                                                                transform: 'translateY(-3px)',
                                                                cursor: 'row-resize', zIndex: 10,
                                                                backgroundColor: 'transparent',
                                                            }}
                                                            onMouseDown={e => {
                                                                e.stopPropagation(); e.preventDefault();
                                                                setTableResizeDrag({ elementId: element.id, type: 'row', index: i, startX: e.clientX, startY: e.clientY, startSize: rowHeights[i], nextSize: rowHeights[i+1] });
                                                            }}
                                                        />
                                                    ))}
                                                </div>
                                            );
                                        })()}

                                        {/* Table add/remove row/col buttons */}
                                        {element.type === 'TABLE' && isSelected && !isDraggingElement && (() => {
                                            const { rows: numRows, cols: numCols } = getTableStructure(element);
                                            const btnStyle = {
                                                position: 'absolute',
                                                width: `${40 / scale}px`,
                                                height: `${40 / scale}px`,
                                                borderRadius: '50%',
                                                background: '#fff',
                                                border: 'none',
                                                boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontSize: `${22 / scale}px`,
                                                fontWeight: 'bold',
                                                color: '#333',
                                                zIndex: 20,
                                                pointerEvents: 'auto',
                                                lineHeight: 1,
                                            };
                                            const gap = 8 / scale;
                                            const btnSize = 40 / scale;
                                            const addCol = () => {
                                                const newCols = numCols + 1;
                                                setTableStructure(prev => ({ ...prev, [element.id]: { rows: numRows, cols: newCols } }));
                                                setTableSizes(prev => {
                                                    const sizes = getTableSizes(element);
                                                    const avgW = element.width / numCols;
                                                    return { ...prev, [element.id]: { colWidths: [...sizes.colWidths, avgW], rowHeights: sizes.rowHeights } };
                                                });
                                            };
                                            const removeCol = () => {
                                                if (numCols <= 1) return;
                                                const newCols = numCols - 1;
                                                setTableStructure(prev => ({ ...prev, [element.id]: { rows: numRows, cols: newCols } }));
                                                setTableSizes(prev => {
                                                    const sizes = getTableSizes(element);
                                                    return { ...prev, [element.id]: { colWidths: sizes.colWidths.slice(0, -1), rowHeights: sizes.rowHeights } };
                                                });
                                            };
                                            const addRow = () => {
                                                const newRows = numRows + 1;
                                                setTableStructure(prev => ({ ...prev, [element.id]: { rows: newRows, cols: numCols } }));
                                                setTableSizes(prev => {
                                                    const sizes = getTableSizes(element);
                                                    const avgH = element.height / numRows;
                                                    return { ...prev, [element.id]: { colWidths: sizes.colWidths, rowHeights: [...sizes.rowHeights, avgH] } };
                                                });
                                            };
                                            const removeRow = () => {
                                                if (numRows <= 1) return;
                                                const newRows = numRows - 1;
                                                setTableStructure(prev => ({ ...prev, [element.id]: { rows: newRows, cols: numCols } }));
                                                setTableSizes(prev => {
                                                    const sizes = getTableSizes(element);
                                                    return { ...prev, [element.id]: { colWidths: sizes.colWidths, rowHeights: sizes.rowHeights.slice(0, -1) } };
                                                });
                                            };
                                            return (
                                                <>
                                                    {/* Right: + add col */}
                                                    <button
                                                        onMouseDown={e => e.stopPropagation()}
                                                        onClick={e => { e.stopPropagation(); addCol(); }}
                                                        style={{ ...btnStyle, right: -(btnSize + gap), top: '30%' }}
                                                    >+</button>
                                                    {/* Right: − remove col */}
                                                    <button
                                                        onMouseDown={e => e.stopPropagation()}
                                                        onClick={e => { e.stopPropagation(); removeCol(); }}
                                                        style={{ ...btnStyle, right: -(btnSize + gap), top: '55%' }}
                                                    >−</button>
                                                    {/* Bottom: − remove row */}
                                                    <button
                                                        onMouseDown={e => e.stopPropagation()}
                                                        onClick={e => { e.stopPropagation(); removeRow(); }}
                                                        style={{ ...btnStyle, bottom: -(btnSize + gap), left: '30%' }}
                                                    >−</button>
                                                    {/* Bottom: + add row */}
                                                    <button
                                                        onMouseDown={e => e.stopPropagation()}
                                                        onClick={e => { e.stopPropagation(); addRow(); }}
                                                        style={{ ...btnStyle, bottom: -(btnSize + gap), left: '55%' }}
                                                    >+</button>
                                                </>
                                            );
                                        })()}

                                        {element.type === 'IMAGE' && hasImage && (
                                            <img
                                                src={`data:image/jpeg;base64,${element.element?.imageData || ''}`}
                                                alt="Uploaded image"
                                                style={{
                                                    width: '100%',
                                                    height: '100%',
                                                    objectFit: 'fill',
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
                                                        onMouseDown={(e) => e.stopPropagation()}
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Escape') finishEditing();
                                                        }}
                                                        placeholder="Напишите текст"
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
                                                        {element.element?.content || (
                                                            <span style={{ color: 'rgba(0,0,0,0.35)', fontStyle: 'italic' }}>
                                                                Напишите текст
                                                            </span>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* Comment element */}
                                        {element.type === 'COMMENT' && (
                                            <div
                                                className={`comment-element ${expandedCommentId === element.id ? 'expanded' : 'collapsed'} ${element.element?.userId && element.element?.userId !== currentUserId ? 'owned-by-other' : ''} ${isDraggingElement && selectedElementId === element.id ? 'is-dragging' : ''}`}
                                                style={{
                                                    zIndex: expandedCommentId === element.id ? 1000 : 2
                                                }}
                                                onMouseDown={(e) => {
                                                    e.stopPropagation();
                                                    // Only initiate drag from the avatar, not from panels
                                                    if (e.target.closest('.comment-thread-expanded') ||
                                                        e.target.closest('.comment-hover-preview')) {
                                                        return;
                                                    }
                                                    e.preventDefault();
                                                    commentDraggedRef.current = false;
                                                    handleElementMouseDown(e, element.id);
                                                }}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    if (commentDraggedRef.current) {
                                                        commentDraggedRef.current = false;
                                                        return;
                                                    }
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
                                                            ответов: {element.element?.replies?.length || 0}
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
                                                                                draggable="false"
                                                                                onDragStart={(e) => e.preventDefault()}
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
                                        {/* Selection border - exclude comments, arrows, and lasso-selected drawings */}
                                        {isSelected && element.type !== 'COMMENT' && element.type !== 'ARROW' && !(element.type === 'DRAWING' && multiSelectedElements.length > 1) && <div className="selection-border"></div>}

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
                                                    cursor: 'default'
                                                }}
                                            />
                                        )}

                                        {/* Маркеры масштабирования - exclude comments, arrows, and lasso-selected drawings */}
                                        {isSelected && !isDraggingElement && element.type !== 'COMMENT' && element.type !== 'ARROW' && !(element.type === 'DRAWING' && multiSelectedElements.length > 1) && (
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

                                    {/* Arrow format panel */}
                                    {isSelected && element.type === 'ARROW' && !arrowEndpointDrag && !isDraggingElement && (() => {
                                        const sx = element.element?.startX ?? element.x;
                                        const sy = element.element?.startY ?? element.y;
                                        const ex = element.element?.endX ?? (element.x + element.width);
                                        const ey = element.element?.endY ?? (element.y + element.height);
                                        const midX = (sx + ex) / 2;
                                        const topY = Math.min(sy, ey);
                                        const arrowColorOptions = ['#64B5F6','#4CAF50','#FF9800','#F44336','#9C27B0','#00BCD4','#E91E63','#FFEB3B','#FFFFFF','#000000','#607D8B','#795548','#3F51B5','#8BC34A','#FF5722','#009688'];
                                        return (
                                            <div style={{
                                                position: 'absolute',
                                                left: midX,
                                                top: topY - 80 / scale,
                                                transform: `scale(${1 / scale}) translateX(-50%)`,
                                                transformOrigin: 'bottom left',
                                                zIndex: 500,
                                                pointerEvents: 'auto',
                                                display: 'flex',
                                                alignItems: 'center',
                                                background: '#fff',
                                                borderRadius: 12,
                                                padding: '6px 10px',
                                                boxShadow: '0 2px 12px rgba(0,0,0,0.18)',
                                                gap: 8,
                                            }}
                                            onMouseDown={e => e.stopPropagation()}
                                            >
                                                {/* Line style button */}
                                                <div style={{ position: 'relative' }}>
                                                    <button
                                                        onClick={() => { setShowArrowLinePanel(p => !p); setShowArrowColorPicker(false); }}
                                                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px 4px', display: 'flex', alignItems: 'center' }}
                                                        title="Стиль линии"
                                                    >
                                                        <svg width="28" height="16" viewBox="0 0 28 16">
                                                            {element.element?.strokeStyle === 'dashed'
                                                                ? <line x1="2" y1="8" x2="26" y2="8" stroke="#222" strokeWidth="2.5" strokeDasharray="6,3" />
                                                                : element.element?.strokeStyle === 'dotted'
                                                                ? <line x1="2" y1="8" x2="26" y2="8" stroke="#222" strokeWidth="2.5" strokeDasharray="2,4" />
                                                                : <line x1="2" y1="8" x2="26" y2="8" stroke="#222" strokeWidth="2.5" />
                                                            }
                                                        </svg>
                                                    </button>
                                                    {showArrowLinePanel && (
                                                        <div style={{
                                                            position: 'absolute', top: '110%', left: '50%', transform: 'translateX(-50%)',
                                                            background: '#fff', borderRadius: 10, padding: '8px 12px',
                                                            boxShadow: '0 2px 12px rgba(0,0,0,0.18)', display: 'flex', flexDirection: 'column', gap: 6, zIndex: 600, minWidth: 120
                                                        }}>
                                                            {[
                                                                { style: 'solid', dasharray: null, label: '──────' },
                                                                { style: 'dashed', dasharray: '8,4', label: '-- -- --' },
                                                                { style: 'dotted', dasharray: '2,5', label: '· · · · ·' },
                                                            ].map(opt => (
                                                                <button key={opt.style}
                                                                    onClick={() => { updateArrowStyle(element.id, { element: { strokeStyle: opt.style } }); setShowArrowLinePanel(false); }}
                                                                    style={{
                                                                        background: element.element?.strokeStyle === opt.style ? '#eef2ff' : 'none',
                                                                        border: element.element?.strokeStyle === opt.style ? '1.5px solid #5b8dee' : '1.5px solid transparent',
                                                                        borderRadius: 6, cursor: 'pointer', padding: '6px 10px',
                                                                        display: 'flex', alignItems: 'center'
                                                                    }}
                                                                >
                                                                    <svg width="80" height="14" viewBox="0 0 80 14">
                                                                        <line x1="2" y1="7" x2="78" y2="7" stroke="#222" strokeWidth="2.5"
                                                                            strokeDasharray={opt.dasharray ?? undefined} />
                                                                    </svg>
                                                                </button>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                                <div style={{ width: 1, height: 24, background: '#e0e0e0' }} />
                                                {/* Color circle */}
                                                <div style={{ position: 'relative' }}>
                                                    <button
                                                        onClick={() => { setShowArrowColorPicker(p => !p); setShowArrowLinePanel(false); }}
                                                        style={{
                                                            width: 28, height: 28, borderRadius: '50%',
                                                            background: element.color || '#64B5F6',
                                                            border: '2.5px solid #222', cursor: 'pointer', padding: 0
                                                        }}
                                                    />
                                                    {showArrowColorPicker && (
                                                        <div style={{
                                                            position: 'absolute', top: '110%', left: '50%', transform: 'translateX(-50%)',
                                                            background: '#fff', borderRadius: 10, padding: 10,
                                                            boxShadow: '0 2px 12px rgba(0,0,0,0.18)',
                                                            display: 'grid', gridTemplateColumns: 'repeat(4, 28px)', gap: 6, zIndex: 600
                                                        }}>
                                                            {arrowColorOptions.map(c => (
                                                                <button key={c}
                                                                    onClick={() => { updateArrowStyle(element.id, { color: c }); setShowArrowColorPicker(false); }}
                                                                    style={{ width: 28, height: 28, borderRadius: '50%', background: c, border: element.color === c ? '2.5px solid #333' : '1.5px solid #ccc', cursor: 'pointer', padding: 0 }}
                                                                />
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })()}

                                    {/* Arrow endpoint handles - positioned with absolute board coordinates */}
                                    {isSelected && element.type === 'ARROW' && !arrowEndpointDrag && !isDraggingElement && (() => {
                                        const sx = element.element?.startX ?? element.x;
                                        const sy = element.element?.startY ?? element.y;
                                        const ex = element.element?.endX ?? (element.x + element.width);
                                        const ey = element.element?.endY ?? (element.y + element.height);
                                        const handleStyle = (px, py) => ({
                                            position: 'absolute',
                                            left: px - 7,
                                            top: py - 7,
                                            width: 14,
                                            height: 14,
                                            borderRadius: '50%',
                                            background: '#fff',
                                            border: '2px solid #5b8dee',
                                            cursor: 'default',
                                            zIndex: 20,
                                            pointerEvents: 'auto'
                                        });
                                        return (
                                            <>
                                                <div style={handleStyle(sx, sy)}
                                                    onMouseDown={(e) => {
                                                        e.stopPropagation(); e.preventDefault();
                                                        setArrowEndpointDrag({
                                                            elementId: element.id, endpoint: 'start',
                                                            origStartX: element.element?.startX ?? element.x,
                                                            origStartY: element.element?.startY ?? element.y,
                                                            origEndX: element.element?.endX ?? (element.x + element.width),
                                                            origEndY: element.element?.endY ?? (element.y + element.height),
                                                            mouseStartX: e.clientX, mouseStartY: e.clientY
                                                        });
                                                    }}
                                                />
                                                <div style={handleStyle(ex, ey)}
                                                    onMouseDown={(e) => {
                                                        e.stopPropagation(); e.preventDefault();
                                                        setArrowEndpointDrag({
                                                            elementId: element.id, endpoint: 'end',
                                                            origStartX: element.element?.startX ?? element.x,
                                                            origStartY: element.element?.startY ?? element.y,
                                                            origEndX: element.element?.endX ?? (element.x + element.width),
                                                            origEndY: element.element?.endY ?? (element.y + element.height),
                                                            mouseStartX: e.clientX, mouseStartY: e.clientY
                                                        });
                                                    }}
                                                />
                                            </>
                                        );
                                    })()}
                                </React.Fragment>
                            );
                        })}
                    </div>
                </div>
            </div>

            {showCommentInput && ReactDOM.createPortal(
                <div
                    className="comment-input-popup"
                    style={{
                        position: 'fixed',
                        left: commentPosition.x,
                        top: commentPosition.y,
                        transform: 'translate(-50%, -50%)',
                        zIndex: 9999,
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
                </div>,
                document.body
            )}
        </div>
    );
};

export default BoardPage;