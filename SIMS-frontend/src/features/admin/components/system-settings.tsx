'use client';

import {
  Settings,
  Building,
  Palette,
  Calendar,
  ClipboardCheck,
  Brain,
  Bell,
  Save,
} from 'lucide-react';
import * as React from 'react';

import { toast } from '@/components/feedback';
import {
  Button,
  Card,
  Input,
  Switch,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui';
import { Label } from '@/components/forms';
import { useAdminStore } from '../store';

export function SystemSettings() {
  const { settings, updateSettings } = useAdminStore();

  const [formData, setFormData] = React.useState({ ...settings });

  const handleSave = () => {
    updateSettings(formData);
    toast.success('Settings Saved', {
      description: 'System settings updated successfully across institutional portal.',
    });
  };

  const selectClass =
    'flex h-9 w-full rounded-lg border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring text-foreground';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl flex items-center gap-2">
            <Settings className="h-6 w-6 text-indigo-500" /> System Settings & Configuration
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Configure institutional profile, branding, examination policies, AI grading engine thresholds, and security preferences.
          </p>
        </div>

        <Button leftIcon={<Save className="h-4 w-4" />} onClick={handleSave}>
          Save Settings
        </Button>
      </div>

      {/* Tabs Container */}
      <Tabs defaultValue="institution" className="w-full space-y-6">
        <TabsList className="grid grid-cols-2 md:grid-cols-6 w-full">
          <TabsTrigger value="institution" className="flex items-center gap-2">
            <Building className="h-3.5 w-3.5" /> Institution
          </TabsTrigger>
          <TabsTrigger value="branding" className="flex items-center gap-2">
            <Palette className="h-3.5 w-3.5" /> Branding
          </TabsTrigger>
          <TabsTrigger value="academic" className="flex items-center gap-2">
            <Calendar className="h-3.5 w-3.5" /> Academic
          </TabsTrigger>
          <TabsTrigger value="exams" className="flex items-center gap-2">
            <ClipboardCheck className="h-3.5 w-3.5" /> Exam Policy
          </TabsTrigger>
          <TabsTrigger value="ai" className="flex items-center gap-2">
            <Brain className="h-3.5 w-3.5" /> AI Engine
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-3.5 w-3.5" /> Notifications
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Institution Info */}
        <TabsContent value="institution">
          <Card className="p-6 space-y-4">
            <h2 className="text-base font-semibold text-foreground flex items-center gap-2 border-b border-border pb-3">
              <Building className="h-4 w-4 text-primary" /> Institution Information
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="instName">Institution Name</Label>
                <Input
                  id="instName"
                  value={formData.institutionName}
                  onChange={(e) => setFormData({ ...formData, institutionName: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="instCode">Institution Code</Label>
                <Input
                  id="instCode"
                  value={formData.institutionCode}
                  onChange={(e) => setFormData({ ...formData, institutionCode: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="supportEmail">Support Email Address</Label>
                <Input
                  id="supportEmail"
                  type="email"
                  value={formData.supportEmail}
                  onChange={(e) => setFormData({ ...formData, supportEmail: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="timezone">Timezone</Label>
                <Input
                  id="timezone"
                  value={formData.timezone}
                  onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                />
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Tab 2: Branding */}
        <TabsContent value="branding">
          <Card className="p-6 space-y-4">
            <h2 className="text-base font-semibold text-foreground flex items-center gap-2 border-b border-border pb-3">
              <Palette className="h-4 w-4 text-purple-500" /> Portal Branding & Design System
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="portalTitle">Portal Title</Label>
                <Input
                  id="portalTitle"
                  value={formData.branding.portalTitle}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      branding: { ...formData.branding, portalTitle: e.target.value },
                    })
                  }
                />
              </div>

              <div>
                <Label htmlFor="primaryColor">Primary Color Hex</Label>
                <div className="flex gap-2">
                  <Input
                    id="primaryColor"
                    value={formData.branding.primaryColor}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        branding: { ...formData.branding, primaryColor: e.target.value },
                      })
                    }
                  />
                  <div
                    className="h-10 w-10 rounded-lg border border-border shrink-0"
                    style={{ backgroundColor: formData.branding.primaryColor }}
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-lg border border-border bg-muted/20">
              <div>
                <p className="text-sm font-semibold text-foreground">Dark Theme Default</p>
                <p className="text-xs text-muted-foreground">Automatically set dark mode as default for new user sessions.</p>
              </div>
              <Switch
                checked={formData.branding.darkThemeDefault}
                onCheckedChange={(val) =>
                  setFormData({
                    ...formData,
                    branding: { ...formData.branding, darkThemeDefault: val },
                  })
                }
              />
            </div>
          </Card>
        </TabsContent>

        {/* Tab 3: Academic Year Settings */}
        <TabsContent value="academic">
          <Card className="p-6 space-y-4">
            <h2 className="text-base font-semibold text-foreground flex items-center gap-2 border-b border-border pb-3">
              <Calendar className="h-4 w-4 text-emerald-500" /> Academic Calendar Settings
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="acadYear">Active Academic Year</Label>
                <Input
                  id="acadYear"
                  value={formData.academicYear}
                  onChange={(e) => setFormData({ ...formData, academicYear: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="activeSem">Active Semester</Label>
                <Input
                  id="activeSem"
                  value={formData.activeSemester}
                  onChange={(e) => setFormData({ ...formData, activeSemester: e.target.value })}
                />
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Tab 4: Examination Defaults */}
        <TabsContent value="exams">
          <Card className="p-6 space-y-4">
            <h2 className="text-base font-semibold text-foreground flex items-center gap-2 border-b border-border pb-3">
              <ClipboardCheck className="h-4 w-4 text-sky-500" /> Default Examination Policies
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="defDur">Default Duration (Minutes)</Label>
                <Input
                  id="defDur"
                  type="number"
                  value={formData.examDefaults.defaultDurationMinutes}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      examDefaults: {
                        ...formData.examDefaults,
                        defaultDurationMinutes: parseInt(e.target.value) || 90,
                      },
                    })
                  }
                />
              </div>

              <div>
                <Label htmlFor="passThresh">Passing Threshold (%)</Label>
                <Input
                  id="passThresh"
                  type="number"
                  value={formData.examDefaults.passPercentageThreshold}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      examDefaults: {
                        ...formData.examDefaults,
                        passPercentageThreshold: parseInt(e.target.value) || 50,
                      },
                    })
                  }
                />
              </div>

              <div>
                <Label htmlFor="autoSave">Auto-Save Interval (Seconds)</Label>
                <Input
                  id="autoSave"
                  type="number"
                  value={formData.examDefaults.autoSaveIntervalSeconds}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      examDefaults: {
                        ...formData.examDefaults,
                        autoSaveIntervalSeconds: parseInt(e.target.value) || 30,
                      },
                    })
                  }
                />
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Tab 5: AI Model Configuration Placeholders */}
        <TabsContent value="ai">
          <Card className="p-6 space-y-4">
            <h2 className="text-base font-semibold text-foreground flex items-center gap-2 border-b border-border pb-3">
              <Brain className="h-4 w-4 text-ai-primary" /> AI Evaluation Model Configuration (Placeholder)
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="aiProvider">AI Engine Provider</Label>
                <select
                  id="aiProvider"
                  className={selectClass}
                  value={formData.aiConfig.provider}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      aiConfig: { ...formData.aiConfig, provider: e.target.value },
                    })
                  }
                >
                  <option value="OpenAI GPT-4o (Fine-Tuned Academic Model)">OpenAI GPT-4o (Fine-Tuned Academic Model)</option>
                  <option value="Claude 3.5 Sonnet (Academic Fine-Tune)">Claude 3.5 Sonnet (Academic Fine-Tune)</option>
                  <option value="Local On-Premises Llama 3 Cluster">Local On-Premises Llama 3 Cluster</option>
                </select>
              </div>

              <div>
                <Label htmlFor="apiKey">API Key (Masked Placeholder)</Label>
                <Input id="apiKey" value={formData.aiConfig.apiKeyMasked} disabled />
              </div>

              <div>
                <Label htmlFor="confThresh">Auto-Grading Confidence Threshold (%)</Label>
                <Input
                  id="confThresh"
                  type="number"
                  value={formData.aiConfig.autoGradingConfidenceThreshold}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      aiConfig: {
                        ...formData.aiConfig,
                        autoGradingConfidenceThreshold: parseInt(e.target.value) || 85,
                      },
                    })
                  }
                />
              </div>

              <div>
                <Label htmlFor="maxWorkers">Parallel Grading Workers</Label>
                <Input
                  id="maxWorkers"
                  type="number"
                  value={formData.aiConfig.maxParallelGradingWorkers}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      aiConfig: {
                        ...formData.aiConfig,
                        maxParallelGradingWorkers: parseInt(e.target.value) || 4,
                      },
                    })
                  }
                />
              </div>
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-lg border border-border bg-muted/20">
              <div>
                <p className="text-sm font-semibold text-foreground">Flag Low Confidence Submissions</p>
                <p className="text-xs text-muted-foreground">Automatically route submissions below threshold to lecturer manual review.</p>
              </div>
              <Switch
                checked={formData.aiConfig.flagLowConfidenceForManualReview}
                onCheckedChange={(val) =>
                  setFormData({
                    ...formData,
                    aiConfig: { ...formData.aiConfig, flagLowConfidenceForManualReview: val },
                  })
                }
              />
            </div>
          </Card>
        </TabsContent>

        {/* Tab 6: Notifications */}
        <TabsContent value="notifications">
          <Card className="p-6 space-y-4">
            <h2 className="text-base font-semibold text-foreground flex items-center gap-2 border-b border-border pb-3">
              <Bell className="h-4 w-4 text-amber-500" /> Administrative Notification Alerts
            </h2>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-3.5 rounded-lg border border-border bg-muted/20">
                <div>
                  <p className="text-sm font-semibold text-foreground">Email Alerts on System Errors</p>
                  <p className="text-xs text-muted-foreground">Send high-priority alerts to support email when AI jobs fail or server errors occur.</p>
                </div>
                <Switch
                  checked={formData.notificationSettings.emailAlertsOnSystemErrors}
                  onCheckedChange={(val) =>
                    setFormData({
                      ...formData,
                      notificationSettings: { ...formData.notificationSettings, emailAlertsOnSystemErrors: val },
                    })
                  }
                />
              </div>

              <div className="flex items-center justify-between p-3.5 rounded-lg border border-border bg-muted/20">
                <div>
                  <p className="text-sm font-semibold text-foreground">Notify Lecturers on Exam Publish</p>
                  <p className="text-xs text-muted-foreground">Automatically send email notification to students when exam results are published.</p>
                </div>
                <Switch
                  checked={formData.notificationSettings.notifyLecturersOnExamPublish}
                  onCheckedChange={(val) =>
                    setFormData({
                      ...formData,
                      notificationSettings: { ...formData.notificationSettings, notifyLecturersOnExamPublish: val },
                    })
                  }
                />
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
