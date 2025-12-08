import React, { useState, createContext, useContext } from 'react';
type TabsContextType = {
  activeTab: string;
  setActiveTab: (tab: string) => void;
};
const TabsContext = createContext<TabsContextType | null>(null);
type TabsProps = {
  defaultTab: string;
  children: React.ReactNode;
  className?: string;
  onChange?: (tab: string) => void;
};
export function Tabs({
  defaultTab,
  children,
  className = '',
  onChange
}: TabsProps) {
  const [activeTab, setActiveTab] = useState(defaultTab);
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    onChange?.(tab);
  };
  return <TabsContext.Provider value={{
    activeTab,
    setActiveTab: handleTabChange
  }}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>;
}
type TabListProps = {
  children: React.ReactNode;
  className?: string;
};
export function TabList({
  children,
  className = ''
}: TabListProps) {
  return <div className={`flex border-b border-gray-200 ${className}`} role="tablist">
      {children}
    </div>;
}
type TabProps = {
  value: string;
  children: React.ReactNode;
  className?: string;
};
export function Tab({
  value,
  children,
  className = ''
}: TabProps) {
  const context = useContext(TabsContext);
  if (!context) throw new Error('Tab must be used within Tabs');
  const {
    activeTab,
    setActiveTab
  } = context;
  const isActive = activeTab === value;
  return <button role="tab" aria-selected={isActive} onClick={() => setActiveTab(value)} className={`
        px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors
        ${isActive ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
        ${className}
      `}>
      {children}
    </button>;
}
type TabPanelProps = {
  value: string;
  children: React.ReactNode;
  className?: string;
};
export function TabPanel({
  value,
  children,
  className = ''
}: TabPanelProps) {
  const context = useContext(TabsContext);
  if (!context) throw new Error('TabPanel must be used within Tabs');
  const {
    activeTab
  } = context;
  if (activeTab !== value) return null;
  return <div role="tabpanel" className={`pt-4 ${className}`}>
      {children}
    </div>;
}