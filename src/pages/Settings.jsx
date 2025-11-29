import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Slider } from "@/components/ui/slider";
import { 
  User, Palette, Bell, Timer, Shield, 
  Download, Upload, Trash2, LogOut, ArrowLeft,
  Sun, Moon, Monitor
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import ThemeSettings from '../components/settings/ThemeSettings';

export default function Settings() {
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me()
  });

  const { data: preferences, isLoading } = useQuery({
    queryKey: ['preferences'],
    queryFn: async () => {
      const prefs = await base44.entities.UserPreferences.filter({ created_by: user?.email });
      return prefs[0] || {
        theme: 'light',
        accent_color: '#4F46E5',
        pomodoro_work_duration: 25,
        pomodoro_short_break: 5,
        pomodoro_long_break: 15,
        default_view: 'list',
        notifications_enabled: true
      };
    },
    enabled: !!user
  });

  const updatePrefsMutation = useMutation({
    mutationFn: async (data) => {
      if (preferences?.id) {
        return base44.entities.UserPreferences.update(preferences.id, data);
      } else {
        return base44.entities.UserPreferences.create(data);
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['preferences'] })
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => base44.entities.Task.list()
  });

  const handleExportTasks = () => {
    const dataStr = JSON.stringify(tasks, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'tasks-export.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportCSV = () => {
    const headers = ['Title', 'Description', 'Priority', 'Category', 'Status', 'Due Date', 'Created Date'];
    const rows = tasks.map(t => [
      t.title,
      t.description || '',
      t.priority || '',
      t.category || '',
      t.status || '',
      t.due_date || '',
      t.created_date || ''
    ]);
    
    const csv = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'tasks-export.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const getInitials = (name) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase() || '?';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <Link to={createPageUrl('Dashboard')}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-2xl font-semibold text-slate-800">Settings</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-6">
        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="bg-white border">
            <TabsTrigger value="profile" className="gap-2">
              <User className="h-4 w-4" /> Profile
            </TabsTrigger>
            <TabsTrigger value="appearance" className="gap-2">
              <Palette className="h-4 w-4" /> Appearance
            </TabsTrigger>
            <TabsTrigger value="pomodoro" className="gap-2">
              <Timer className="h-4 w-4" /> Pomodoro
            </TabsTrigger>
            <TabsTrigger value="data" className="gap-2">
              <Download className="h-4 w-4" /> Data
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>Manage your account details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center gap-6">
                  <Avatar className="h-20 w-20 bg-indigo-500">
                    <AvatarFallback className="text-white text-xl">
                      {getInitials(user?.full_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-lg font-medium">{user?.full_name}</h3>
                    <p className="text-slate-500">{user?.email}</p>
                  </div>
                </div>

                <div className="grid gap-4">
                  <div>
                    <Label>Full Name</Label>
                    <Input value={user?.full_name || ''} disabled className="mt-1" />
                  </div>
                  <div>
                    <Label>Email</Label>
                    <Input value={user?.email || ''} disabled className="mt-1" />
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <Button
                    variant="outline"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={() => base44.auth.logout()}
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign Out
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="appearance">
            {preferences && (
              <ThemeSettings
                preferences={preferences}
                onUpdate={(data) => updatePrefsMutation.mutate(data)}
              />
            )}
          </TabsContent>

          <TabsContent value="pomodoro">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Timer className="h-5 w-5" />
                  Pomodoro Settings
                </CardTitle>
                <CardDescription>Customize your focus sessions</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <Label>Focus Duration</Label>
                    <span className="text-sm text-slate-500">
                      {preferences?.pomodoro_work_duration || 25} minutes
                    </span>
                  </div>
                  <Slider
                    value={[preferences?.pomodoro_work_duration || 25]}
                    onValueChange={([v]) => updatePrefsMutation.mutate({
                      ...preferences,
                      pomodoro_work_duration: v
                    })}
                    min={5}
                    max={60}
                    step={5}
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-3">
                    <Label>Short Break</Label>
                    <span className="text-sm text-slate-500">
                      {preferences?.pomodoro_short_break || 5} minutes
                    </span>
                  </div>
                  <Slider
                    value={[preferences?.pomodoro_short_break || 5]}
                    onValueChange={([v]) => updatePrefsMutation.mutate({
                      ...preferences,
                      pomodoro_short_break: v
                    })}
                    min={1}
                    max={15}
                    step={1}
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-3">
                    <Label>Long Break</Label>
                    <span className="text-sm text-slate-500">
                      {preferences?.pomodoro_long_break || 15} minutes
                    </span>
                  </div>
                  <Slider
                    value={[preferences?.pomodoro_long_break || 15]}
                    onValueChange={([v]) => updatePrefsMutation.mutate({
                      ...preferences,
                      pomodoro_long_break: v
                    })}
                    min={5}
                    max={30}
                    step={5}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="data">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Download className="h-5 w-5" />
                    Export Data
                  </CardTitle>
                  <CardDescription>Download your tasks and data</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-3">
                    <Button variant="outline" onClick={handleExportTasks} className="gap-2">
                      <Download className="h-4 w-4" />
                      Export as JSON
                    </Button>
                    <Button variant="outline" onClick={handleExportCSV} className="gap-2">
                      <Download className="h-4 w-4" />
                      Export as CSV
                    </Button>
                  </div>
                  <p className="text-sm text-slate-500">
                    Your data includes {tasks.length} tasks
                  </p>
                </CardContent>
              </Card>

              <Card className="border-red-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-red-600">
                    <Trash2 className="h-5 w-5" />
                    Danger Zone
                  </CardTitle>
                  <CardDescription>Irreversible actions</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="destructive" className="gap-2">
                    <Trash2 className="h-4 w-4" />
                    Delete All Completed Tasks
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}