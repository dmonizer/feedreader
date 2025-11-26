'use client';

import { UserSettings } from '@/lib/types';

interface DisplayModeSelectorProps {
    currentMode: UserSettings['displayMode'];
    onChange: (mode: UserSettings['displayMode']) => void;
}

export function DisplayModeSelector({ currentMode, onChange }: DisplayModeSelectorProps) {
    return (
        <div className="flex bg-gray-100 p-1 rounded-lg">
            <button
                onClick={() => onChange('list')}
                className={`
          p-2 rounded-md transition-all
          ${currentMode === 'list'
                        ? 'bg-white shadow text-blue-600'
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200'
                    }
        `}
                title="List View"
            >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
            </button>

            <button
                onClick={() => onChange('cards')}
                className={`
          p-2 rounded-md transition-all
          ${currentMode === 'cards'
                        ? 'bg-white shadow text-blue-600'
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200'
                    }
        `}
                title="Cards View"
            >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
            </button>

            <button
                onClick={() => onChange('cards-wide')}
                className={`
          p-2 rounded-md transition-all
          ${currentMode === 'cards-wide'
                        ? 'bg-white shadow text-blue-600'
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200'
                    }
        `}
                title="Wide Cards View"
            >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                </svg>
            </button>
        </div>
    );
}
