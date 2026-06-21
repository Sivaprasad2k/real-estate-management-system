import React, { useState, useRef, useEffect, useId } from 'react';

const CustomSelect = ({
    id,
    name,
    value,
    onChange,
    options = [],
    placeholder = 'Select option',
    className = '',
    required = false
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [activeIndex, setActiveIndex] = useState(-1);
    const containerRef = useRef(null);
    const listRef = useRef(null);
    const listboxId = useId();

    // Normalize options into { value, label } format
    const normalizedOptions = options.map(opt => {
        if (typeof opt === 'string') {
            return { value: opt, label: opt };
        }
        return opt;
    });

    const selectedOption = normalizedOptions.find(opt => opt.value === value);

    // Close dropdown on click or touch outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('touchstart', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('touchstart', handleClickOutside);
        };
    }, []);

    // Scroll active item into view inside the dropdown list
    useEffect(() => {
        if (isOpen && activeIndex >= 0 && listRef.current) {
            const activeEl = listRef.current.children[activeIndex];
            if (activeEl) {
                const container = listRef.current;
                const elemTop = activeEl.offsetTop;
                const elemBottom = elemTop + activeEl.offsetHeight;
                const containerTop = container.scrollTop;
                const containerBottom = containerTop + container.clientHeight;

                if (elemTop < containerTop) {
                    container.scrollTop = elemTop;
                } else if (elemBottom > containerBottom) {
                    container.scrollTop = elemBottom - container.clientHeight;
                }
            }
        }
    }, [activeIndex, isOpen]);

    const handleToggle = () => {
        setIsOpen(!isOpen);
        if (!isOpen) {
            // Focus current selected option
            const selectedIdx = normalizedOptions.findIndex(opt => opt.value === value);
            setActiveIndex(selectedIdx >= 0 ? selectedIdx : 0);
        }
    };

    const handleSelectOption = (optValue) => {
        if (onChange) {
            onChange({
                target: {
                    id: id || '',
                    name: name || '',
                    value: optValue
                }
            });
        }
        setIsOpen(false);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') {
            e.preventDefault();
            if (isOpen) {
                if (activeIndex >= 0 && activeIndex < normalizedOptions.length) {
                    handleSelectOption(normalizedOptions[activeIndex].value);
                } else {
                    setIsOpen(false);
                }
            } else {
                setIsOpen(true);
                const selectedIdx = normalizedOptions.findIndex(opt => opt.value === value);
                setActiveIndex(selectedIdx >= 0 ? selectedIdx : 0);
            }
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            if (!isOpen) {
                setIsOpen(true);
                setActiveIndex(0);
            } else {
                setActiveIndex(prev => (prev + 1) % normalizedOptions.length);
            }
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            if (!isOpen) {
                setIsOpen(true);
                setActiveIndex(normalizedOptions.length - 1);
            } else {
                setActiveIndex(prev => (prev - 1 + normalizedOptions.length) % normalizedOptions.length);
            }
        } else if (e.key === 'Escape') {
            e.preventDefault();
            setIsOpen(false);
        } else if (e.key === 'Tab') {
            setIsOpen(false);
        }
    };

    const getOptionId = (idx) => `${listboxId}-option-${idx}`;

    return (
        <div ref={containerRef} className={`relative w-full ${className}`}>
            <button
                type="button"
                id={id}
                name={name}
                onClick={handleToggle}
                onKeyDown={handleKeyDown}
                className="w-full bg-[#0B0B0B] border border-dark-border rounded-lg px-4 py-2.5 text-left text-white text-xs md:text-sm focus:border-brand focus:ring-1 focus:ring-brand outline-none transition-all duration-300 flex items-center justify-between cursor-pointer"
                aria-haspopup="listbox"
                aria-expanded={isOpen}
                aria-controls={listboxId}
                aria-activedescendant={activeIndex >= 0 ? getOptionId(activeIndex) : undefined}
            >
                <span className={selectedOption ? 'text-white' : 'text-gray-500 font-light'}>
                    {selectedOption ? selectedOption.label : placeholder}
                </span>
                <svg
                    className={`w-4 h-4 text-brand-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {isOpen && (
                <ul
                    ref={listRef}
                    id={listboxId}
                    className="absolute z-50 w-full bg-[#0B0F1A] border border-dark-border rounded-lg shadow-[0_10px_30px_rgba(0,0,0,0.85)] max-h-60 overflow-y-auto mt-1 py-1 text-xs md:text-sm hidden-scroll"
                    role="listbox"
                >
                    {normalizedOptions.map((opt, idx) => {
                        const isSelected = opt.value === value;
                        const isActive = idx === activeIndex;
                        const optionId = getOptionId(idx);
                        return (
                            <li
                                key={opt.value}
                                id={optionId}
                                onClick={() => handleSelectOption(opt.value)}
                                onMouseEnter={() => setActiveIndex(idx)}
                                className={`px-4 py-2.5 cursor-pointer transition-colors flex items-center justify-between ${
                                    isSelected 
                                        ? 'bg-brand/10 text-brand font-bold' 
                                        : isActive 
                                        ? 'bg-[#151a2d] text-white' 
                                        : 'text-gray-300 hover:text-white'
                                }`}
                                role="option"
                                aria-selected={isSelected}
                            >
                                <span>{opt.label}</span>
                                {isSelected && (
                                    <svg className="w-4 h-4 text-brand" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                    </svg>
                                )}
                            </li>
                        );
                    })}
                </ul>
            )}

            {/* Hidden native select for HTML5 validation support */}
            <select
                name={name}
                value={value || ''}
                required={required}
                onChange={(e) => handleSelectOption(e.target.value)}
                className="absolute opacity-0 pointer-events-none w-px h-px"
                style={{ bottom: 0, left: '50%', transform: 'translateX(-50%)' }}
                tabIndex={-1}
                aria-hidden="true"
            >
                <option value="">{placeholder}</option>
                {normalizedOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
            </select>
        </div>
    );
};

export default CustomSelect;
