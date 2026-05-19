import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const BoardPage = () => {
    const { spaceId, boardId } = useParams();
    const navigate = useNavigate();
    const [boardData, setBoardData] = useState(null);
    const [loading, setLoading] = useState(true);

    // Состояния для панелей
    const [selectedTool, setSelectedTool] = useState(null);
    const [showShapesMenu, setShowShapesMenu] = useState(false);

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

    const canvasRef = useRef(null);
    const textInputRef = useRef(null);
    const formatPanelRef = useRef(null);

    // Загрузка данных доски и элементов
    useEffect(() => {
        const fetchBoardData = async () => {
            try {
                const token = localStorage.getItem('accessToken');

                const boardResponse = await fetch(`http://localhost:8081/boardiox/spaces/${spaceId}/boards/${boardId}`, {
                    headers: { 'Authorization': `Bearer ${token}` },
                });

                if (boardResponse.ok) {
                    const data = await boardResponse.json();
                    setBoardData(data);
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
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleLogoClick = () => navigate(`/boardiox/spaces/${spaceId}`);

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

    // Сохранение элементов на сервере
    const saveElementToServer = async (element) => {
        if (!element || element.type !== 'SHAPE') return;

        const token = localStorage.getItem('accessToken');
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
                fontSize: element.element?.fontSize ,
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

                        }
                    }
                )
            );

        }
        else {
            console.error('Failed to update element:', await response.text());
        }
    };

    // === Обновление формата текста ===
    const updateTextFormat = async (elementId, updates) => {
        const element = elements.find(el => el.id === elementId);
        if (!element || element.type !== 'SHAPE') return;

        // Обновляем только выбранный элемент
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

    // === Завершение редактирования текста ===
    const finishEditing = async () => {
        const element = elements.find(el => el.id === selectedElementId);
        if (element) {
            const updatedElement = {
                ...element,
                element: { ...element.element, text: editText }
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

        setSelectedElementId(elementId);
        setIsDraggingElement(true);
        setDragElementStart({ x: e.clientX, y: e.clientY });
        setDragElementOffset({ x: element.x, y: element.y });
        // Показываем панель при выделении (одиночный клик)
        setShowFormatPanel(true);
        setShowBorderPanel(false);
        setShowColorPicker(false);
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
        setEditText(element.element?.text || '');
        setShowFormatPanel(true);
        setShowBorderPanel(false);
        setShowColorPicker(false);
    };

    const handleCanvasMouseDown = (e) => {
        if (e.button === 2) {
            e.preventDefault();
            setIsPanning(true);
            setPanStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
        } else if (e.button === 0 && !isResizing) {
            if (!e.target.closest('.board-element') && !e.target.closest('.format-panel')) {
                setSelectedElementId(null);
                setIsEditingText(false);
                setShowFormatPanel(false);
                setShowBorderPanel(false);
                setShowColorPicker(false);
            }
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

            const newX = Math.round(dragElementOffset.x + dx);
            const newY = Math.round(dragElementOffset.y + dy);

            setElements(prev => prev.map(el =>
                el.id === selectedElementId ? { ...el, x: newX, y: newY } : el
            ));
        }
    };

    // === ЗАВЕРШЕНИЕ ДЕЙСТВИЯ ===
    const handleMouseUp = async () => {
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
            const element = elements.find(el => el.id === selectedElementId);
            if (element) await saveElementToServer(element);
            setIsDraggingElement(false);
            // Показываем панель после перемещения
            setShowFormatPanel(true);
            setShowBorderPanel(false);
            setShowColorPicker(false);
        }
    };

    const handleContextMenu = (e) => e.preventDefault();

    //Масштабирование доски
    const handleWheel = (e) => {
        e.preventDefault();
        const delta = -e.deltaY * 0.001;
        const newScale = Math.min(Math.max(0.1, scale + delta), 5);
        setScale(newScale);
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
                        <button className="tool-button" title="Ручка"><i className="bi bi-pencil-fill"></i></button>
                        <div className="toolbar-divider"></div>
                        <button className="tool-button" title="Таблица"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18M3 15h18M9 3v18M15 3v18" /></svg></button>
                        <div className="toolbar-divider"></div>
                        <button className="tool-button" title="Изображение"><i className="bi bi-image-fill"></i></button>
                        <div className="toolbar-divider"></div>
                        <button className="tool-button" title="Комментарий"><i className="bi bi-chat-square-fill"></i></button>
                        <div className="toolbar-divider"></div>
                        <button className="tool-button" title="Текст"><i className="bi bi-type" style={{ fontWeight: 900, fontSize: '22px' }}></i></button>
                    </div>
                    {showShapesMenu && (
                        <div className="shapes-menu">
                            <button className="shape-btn" onClick={() => createShape('SQUARE')} title="Квадрат"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="4" y="4" width="16" height="16" rx="2" /></svg></button>
                            <button className="shape-btn" onClick={() => createShape('CIRCLE')} title="Круг"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="8" /></svg></button>
                            <button className="shape-btn" onClick={() => createShape('TRIANGLE')} title="Треугольник"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polygon points="12,4 20,20 4,20" /></svg></button>
                            <button className="shape-btn" onClick={createArrow} title="Стрелка"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 19L19 5M19 5H9M19 5V15" /></svg></button>
                        </div>
                    )}
                </div>

                <div
                    className="board-canvas"
                    ref={canvasRef}
                    onMouseDown={handleCanvasMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
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
                        {elements.map(element => {
                            const isSelected = selectedElementId === element.id;
                            const elText = element.element?.text || '';
                            const elFontSize = element.element.fontSize;
                            const elFontFamily = element.element?.fontFamily || 'Noto Sans';
                            const elIsBold = element.element?.isBold || false;
                            const elIsUnderline = element.element?.isUnderline || false;
                            const elFillColor = element.element?.fillColor || '#64B5F6';
                            const elBorderColor = element.element?.borderColor || '#000000';
                            const elBorderWidth = element.element?.borderWidth || 0;

                            return (
                                <React.Fragment key={element.id}>
                                    {/* Панель форматирования - показывается при выделении */}
                                    {isSelected && showFormatPanel && !isDraggingElement && !isResizing && (
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

                                    {/* Элемент фигуры */}
                                    <div
                                        className={`board-element ${isSelected ? 'selected' : ''}`}
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

                                        {/* Маркер выделения */}
                                        {isSelected && <div className="selection-border"></div>}

                                        {/* Маркеры масштабирования */}
                                        {isSelected && !isDraggingElement && (
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