import React, { useState } from 'react';

interface TooltipProps {
    text: string;
    children: React.ReactNode;
}

export function Tooltip({ text, children }: TooltipProps) {
    const [isVisible, setIsVisible] = useState(false);

    return (
        <div
            className="relative inline-flex"
            onMouseEnter={() => setIsVisible(true)}
            onMouseLeave={() => setIsVisible(false)}
        >
            {children}
            {isVisible && (
                <div className="absolute bottom-full left-1/2 mb-2 w-64 -translate-x-1/2 transform rounded-lg bg-black px-3 py-2 text-center text-sm font-medium text-white shadow-xl z-50">
                    {text}
                    {/* Arrow */}
                    <div className="absolute top-full left-1/2 -mt-1 h-2 w-2 -translate-x-1/2 rotate-45 bg-black" />
                </div>
            )}
        </div>
    );
}
