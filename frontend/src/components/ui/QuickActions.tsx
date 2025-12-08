import React from 'react';
import { PlusIcon } from 'lucide-react';
import { Button } from './Button';
type QuickAction = {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'outline';
};
type QuickActionsProps = {
  actions: QuickAction[];
  className?: string;
};
export function QuickActions({
  actions,
  className = ''
}: QuickActionsProps) {
  return <div className={`flex flex-wrap gap-2 sm:gap-3 ${className}`}>
      {actions.map((action, index) => <Button key={index} variant={action.variant || 'primary'} size="sm" onClick={action.onClick} icon={action.icon || <PlusIcon className="w-4 h-4" />} className="flex-1 sm:flex-none">
          {action.label}
        </Button>)}
    </div>;
}