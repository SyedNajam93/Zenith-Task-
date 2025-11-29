import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Sun, Moon, Monitor, Palette } from 'lucide-react';
import { cn } from "@/lib/utils";

const accentColors = [
  { name: 'Indigo', value: '#4F46E5' },
  { name: 'Purple', value: '#7C3AED' },
  { name: 'Pink', value: '#EC4899' },
  { name: 'Rose', value: '#F43F5E' },
  { name: 'Orange', value: '#F97316' },
  { name: 'Amber', value: '#F59E0B' },
  { name: 'Emerald', value: '#10B981' },
  { name: 'Teal', value: '#14B8A6' },
  { name: 'Cyan', value: '#06B6D4' },
  { name: 'Blue', value: '#3B82F6' }
];

export default function ThemeSettings({ preferences, onUpdate }) {
  const themes = [
    { id: 'light', icon: Sun, label: 'Light' },
    { id: 'dark', icon: Moon, label: 'Dark' },
    { id: 'system', icon: Monitor, label: 'System' }
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sun className="h-5 w-5" />
            Appearance
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label className="text-base mb-3 block">Theme</Label>
            <div className="flex gap-3">
              {themes.map(({ id, icon: Icon, label }) => (
                <button
                  key={id}
                  onClick={() => onUpdate({ ...preferences, theme: id })}
                  className={cn(
                    "flex-1 flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all",
                    preferences.theme === id 
                      ? "border-indigo-500 bg-indigo-50" 
                      : "border-slate-200 hover:border-slate-300"
                  )}
                >
                  <Icon className={cn(
                    "h-6 w-6",
                    preferences.theme === id ? "text-indigo-600" : "text-slate-500"
                  )} />
                  <span className={cn(
                    "text-sm font-medium",
                    preferences.theme === id ? "text-indigo-600" : "text-slate-600"
                  )}>
                    {label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label className="text-base mb-3 block flex items-center gap-2">
              <Palette className="h-4 w-4" />
              Accent Color
            </Label>
            <div className="flex flex-wrap gap-3">
              {accentColors.map((color) => (
                <button
                  key={color.value}
                  onClick={() => onUpdate({ ...preferences, accent_color: color.value })}
                  className={cn(
                    "w-10 h-10 rounded-full transition-transform hover:scale-110",
                    preferences.accent_color === color.value && "ring-2 ring-offset-2 ring-slate-400"
                  )}
                  style={{ backgroundColor: color.value }}
                  title={color.name}
                />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base">Push Notifications</Label>
              <p className="text-sm text-slate-500">Receive reminders and updates</p>
            </div>
            <Switch
              checked={preferences.notifications_enabled}
              onCheckedChange={(v) => onUpdate({ ...preferences, notifications_enabled: v })}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Default View</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            {['list', 'calendar', 'kanban'].map((view) => (
              <button
                key={view}
                onClick={() => onUpdate({ ...preferences, default_view: view })}
                className={cn(
                  "flex-1 py-3 px-4 rounded-lg border-2 text-sm font-medium capitalize transition-all",
                  preferences.default_view === view
                    ? "border-indigo-500 bg-indigo-50 text-indigo-600"
                    : "border-slate-200 text-slate-600 hover:border-slate-300"
                )}
              >
                {view}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}