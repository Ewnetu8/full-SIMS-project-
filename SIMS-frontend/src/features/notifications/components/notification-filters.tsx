'use client';

import * as React from 'react';

import { Badge, Button } from '@/components/ui';

import type { NotificationFilterTab } from '../types/notification';

export interface NotificationFiltersProps {
  activeTab: NotificationFilterTab;
  onTabChange: (tab: NotificationFilterTab) => void;
  unreadCount?: number;
  totalCount?: number;
}

export function NotificationFilters({
  activeTab,
  onTabChange,
  unreadCount,
  totalCount,
}: NotificationFiltersProps) {
  const tabs: { key: NotificationFilterTab; label: string; count?: number }[] = [
    { key: 'all', label: 'All', count: totalCount },
    { key: 'unread', label: 'Unread', count: unreadCount },
    { key: 'read', label: 'Read' },
  ];

  return (
    <div className="flex items-center gap-2 border-b border-border pb-3">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.key;
        return (
          <Button
            key={tab.key}
            size="sm"
            variant={isActive ? 'default' : 'ghost'}
            className="flex items-center gap-1.5 text-xs h-8 px-3"
            onClick={() => onTabChange(tab.key)}
          >
            <span>{tab.label}</span>
            {tab.count !== undefined && tab.count > 0 && (
              <Badge
                variant={isActive ? 'outline' : 'secondary'}
                className="text-[10px] px-1.5 py-0 h-4 border-none"
              >
                {tab.count}
              </Badge>
            )}
          </Button>
        );
      })}
    </div>
  );
}
