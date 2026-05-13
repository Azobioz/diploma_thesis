import React, { useState, useRef, useEffect } from 'react';

const BoardFilters = ({
    filter = 'all',
    sort = 'recent',
    onFilterChange,
    onSortChange
}) => {
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [isSortOpen, setIsSortOpen] = useState(false);
    const filterRef = useRef(null);
    const sortRef = useRef(null);

    // Закрытие dropdown при клике вне компонента
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (filterRef.current && !filterRef.current.contains(event.target)) {
                setIsFilterOpen(false);
            }
            if (sortRef.current && !sortRef.current.contains(event.target)) {
                setIsSortOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const getFilterText = () => {
        switch (filter) {
            case 'created_by_me': return 'Созданные мною';
            case 'all':
            default: return 'Все доски';
        }
    };

    const getSortText = () => {
        switch (sort) {
            case 'recent': return 'Открытое последний раз';
            case 'old':
            default: return 'Открытое давно';
        }
    };

    return (
        <div className="board-filters">
            {/* Фильтрация */}
            <div className="filter-section" ref={filterRef}>
                <div className="filter-text">Фильтрация</div>
                <div className="dropdown-filter-container">
                    <button
                        className="dropdown-button"
                        onClick={() => setIsFilterOpen(!isFilterOpen)}
                    >
                        {getFilterText()}
                    </button>

                    {isFilterOpen && (
                        <div className="dropdown-menu">
                            <div
                                className={`dropdown-item ${filter === 'all' ? 'active' : ''}`}
                                onClick={() => {
                                    onFilterChange('all');
                                    setIsFilterOpen(false);
                                }}
                            >
                                Все доски
                            </div>
                            <div
                                className={`dropdown-item ${filter === 'created_by_me' ? 'active' : ''}`}
                                onClick={() => {
                                    onFilterChange('created_by_me');
                                    setIsFilterOpen(false);
                                }}
                            >
                                Созданные мною
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Сортировка */}
            <div className="sort-section" ref={sortRef}>
                <span className="sort-text">Сортировать по</span>
                <div className="dropdown-sort-container">
                    <button
                        className="dropdown-button"
                        onClick={() => setIsSortOpen(!isSortOpen)}
                    >
                        {getSortText()}
                    </button>

                    {isSortOpen && (
                        <div className="dropdown-menu">
                            <div
                                className={`dropdown-item ${sort === 'recent' ? 'active' : ''}`}
                                onClick={() => {
                                    onSortChange('recent');
                                    setIsSortOpen(false);
                                }}
                            >
                                Открытое последний раз
                            </div>
                            <div
                                className={`dropdown-item ${sort === 'old' ? 'active' : ''}`}
                                onClick={() => {
                                    onSortChange('old');
                                    setIsSortOpen(false);
                                }}
                            >
                                Открытое давно
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default BoardFilters;