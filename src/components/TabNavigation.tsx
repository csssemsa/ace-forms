import React from 'react';

export interface Tab {
    id: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number;
}

interface TabNavigationProps {
    tabs: Tab[];
    activeTab: string;
    onTabChange: (tabId: string) => void;
}

export const TabNavigation: React.FC<TabNavigationProps> = ({
    tabs,
    activeTab,
    onTabChange
}) => {
    return (
        <nav className="bg-white border-b border-gray-200 shadow-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex gap-2 overflow-x-auto py-2" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;

                        return (
                            <button
                                key={tab.id}
                                onClick={() => onTabChange(tab.id)}
                                className={`
                  relative
                  flex items-center gap-2
                  px-4 py-3
                  rounded-lg
                  font-medium text-sm
                  whitespace-nowrap
                  transition-all duration-200
                  focus:outline-none focus:ring-2 focus:ring-sus-blue focus:ring-offset-2
                  ${isActive
                                        ? 'bg-sus-blue text-white shadow-md'
                                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                                    }
                `}
                            >
                                <Icon className="w-5 h-5 flex-shrink-0" />
                                <span>{tab.label}</span>

                                {/* Badge de Notificação */}
                                {tab.badge && tab.badge > 0 && (
                                    <span className={`
                    ml-1 px-2 py-0.5
                    text-xs font-semibold rounded-full
                    ${isActive
                                            ? 'bg-white text-sus-blue'
                                            : 'bg-red-500 text-white'
                                        }
                  `}>
                                        {tab.badge > 99 ? '99+' : tab.badge}
                                    </span>
                                )}

                                {/* Indicador de Aba Ativa */}
                                {isActive && (
                                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-white rounded-t-full" />
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>
        </nav>
    );
};
