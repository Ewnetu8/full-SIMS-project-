'use client';

import {
  ShieldAlert,
  Download,
} from 'lucide-react';
import * as React from 'react';

import { toast } from '@/components/feedback';
import { Badge, Button, Card, SearchInput } from '@/components/ui';

import { useAdminStore } from '../store';

export function AuditLogs() {
  const {
    auditLogs,
    auditSearchQuery,
    auditCategoryFilter,
    setAuditSearchQuery,
    setAuditCategoryFilter,
  } = useAdminStore();

  const handleExportCSV = () => {
    toast.success('Audit Logs Exported', {
      description: 'Audit records successfully exported to CSV file.',
    });
  };

  const filteredLogs = auditLogs.filter((log) => {
    const matchesSearch =
      log.actionEvent.toLowerCase().includes(auditSearchQuery.toLowerCase()) ||
      log.actorName.toLowerCase().includes(auditSearchQuery.toLowerCase()) ||
      log.details.toLowerCase().includes(auditSearchQuery.toLowerCase()) ||
      log.resourceName.toLowerCase().includes(auditSearchQuery.toLowerCase());

    const matchesCat = auditCategoryFilter === 'ALL' || log.actorRole === auditCategoryFilter;

    return matchesSearch && matchesCat;
  });

  const selectClass =
    'flex h-9 w-full rounded-lg border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring text-foreground';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl flex items-center gap-2">
            <ShieldAlert className="h-6 w-6 text-accent" /> Security & System Audit Trail
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Immutable log of all user logins, administrative actions, exam publications, settings updates, and AI jobs.
          </p>
        </div>

        <Button leftIcon={<Download className="h-4 w-4" />} onClick={handleExportCSV}>
          Export Audit Trail (CSV)
        </Button>
      </div>

      {/* Filter Bar */}
      <Card className="p-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <SearchInput
              placeholder="Search action event, user name, IP..."
              value={auditSearchQuery}
              onChange={(e) => setAuditSearchQuery(e.target.value)}
              onClear={() => setAuditSearchQuery('')}
            />
          </div>

          <div>
            <select
              className={selectClass}
              value={auditCategoryFilter}
              onChange={(e) => setAuditCategoryFilter(e.target.value)}
            >
              <option value="ALL">All User Roles</option>
              <option value="admin">Administrator Actions</option>
              <option value="lecturer">Lecturer Actions</option>
              <option value="student">Student Actions</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Audit Log Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-muted/50 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3.5">Timestamp</th>
                <th className="px-4 py-3.5">Actor</th>
                <th className="px-4 py-3.5">Event Action</th>
                <th className="px-4 py-3.5">Target Resource</th>
                <th className="px-4 py-3.5">IP Address</th>
                <th className="px-4 py-3.5">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-sm text-muted-foreground">
                    No audit records match the current filter parameters.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-accent/40 transition-colors">
                    <td className="px-4 py-3.5 text-xs text-muted-foreground font-mono whitespace-nowrap">
                      {log.timestamp}
                    </td>

                    <td className="px-4 py-3.5">
                      <div className="min-w-0">
                        <p className="font-semibold text-foreground text-xs">{log.actorName}</p>
                        <p className="text-[10px] text-muted-foreground">{log.actorEmail}</p>
                      </div>
                    </td>

                    <td className="px-4 py-3.5">
                      <Badge variant="outline" className="font-mono text-[11px] bg-secondary/30">
                        {log.actionEvent}
                      </Badge>
                    </td>

                    <td className="px-4 py-3.5 text-xs text-foreground font-medium max-w-[180px] truncate">
                      {log.resourceName}
                    </td>

                    <td className="px-4 py-3.5 text-xs font-mono text-muted-foreground">{log.ipAddress}</td>

                    <td className="px-4 py-3.5 text-xs text-muted-foreground max-w-[280px] truncate">
                      {log.details}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
