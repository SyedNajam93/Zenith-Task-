import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  CheckCircle2, Clock, TrendingUp, Target, 
  Calendar, Flame, BarChart3, PieChart 
} from 'lucide-react';
import { format, subDays, isAfter, isSameDay, startOfWeek, endOfWeek, eachDayOfInterval } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart as RechartsPie, Pie, Cell, LineChart, Line } from 'recharts';
import { cn } from "@/lib/utils";

const COLORS = ['#4F46E5', '#7C3AED', '#EC4899', '#EF4444', '#F97316', '#22C55E', '#06B6D4'];

export default function ProductivityStats({ tasks, pomodoroSessions }) {
  const stats = useMemo(() => {
    const today = new Date();
    const weekStart = startOfWeek(today);
    const weekEnd = endOfWeek(today);
    
    const completedToday = tasks.filter(t => 
      t.status === 'completed' && 
      t.completed_at && 
      isSameDay(new Date(t.completed_at), today)
    ).length;

    const completedThisWeek = tasks.filter(t => 
      t.status === 'completed' && 
      t.completed_at && 
      isAfter(new Date(t.completed_at), weekStart)
    ).length;

    const totalCompleted = tasks.filter(t => t.status === 'completed').length;
    const totalPending = tasks.filter(t => t.status === 'pending').length;
    const overdueTasks = tasks.filter(t => 
      t.status !== 'completed' && 
      t.due_date && 
      isAfter(today, new Date(t.due_date))
    ).length;

    // Calculate streak
    let streak = 0;
    let checkDate = today;
    while (true) {
      const dayCompleted = tasks.some(t => 
        t.status === 'completed' && 
        t.completed_at && 
        isSameDay(new Date(t.completed_at), checkDate)
      );
      if (dayCompleted) {
        streak++;
        checkDate = subDays(checkDate, 1);
      } else {
        break;
      }
    }

    // Weekly data
    const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });
    const weeklyData = weekDays.map(day => ({
      name: format(day, 'EEE'),
      completed: tasks.filter(t => 
        t.status === 'completed' && 
        t.completed_at && 
        isSameDay(new Date(t.completed_at), day)
      ).length
    }));

    // Category breakdown
    const categoryData = {};
    tasks.forEach(task => {
      const cat = task.category || 'other';
      categoryData[cat] = (categoryData[cat] || 0) + 1;
    });
    const categoryChartData = Object.entries(categoryData).map(([name, value]) => ({ name, value }));

    // Time tracking
    const totalTimeSpent = tasks.reduce((acc, t) => acc + (t.actual_time_spent || 0), 0);
    const avgTimePerTask = totalCompleted > 0 ? Math.round(totalTimeSpent / totalCompleted) : 0;

    return {
      completedToday,
      completedThisWeek,
      totalCompleted,
      totalPending,
      overdueTasks,
      streak,
      weeklyData,
      categoryChartData,
      totalTimeSpent,
      avgTimePerTask,
      pomodoroCount: pomodoroSessions?.length || 0
    };
  }, [tasks, pomodoroSessions]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-indigo-100 text-sm">Completed Today</p>
                <p className="text-4xl font-bold mt-1">{stats.completedToday}</p>
              </div>
              <CheckCircle2 className="h-10 w-10 text-indigo-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-400 to-pink-500 text-white border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-sm">Current Streak</p>
                <p className="text-4xl font-bold mt-1">{stats.streak} <span className="text-lg">days</span></p>
              </div>
              <Flame className="h-10 w-10 text-orange-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-400 to-teal-500 text-white border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-emerald-100 text-sm">This Week</p>
                <p className="text-4xl font-bold mt-1">{stats.completedThisWeek}</p>
              </div>
              <TrendingUp className="h-10 w-10 text-emerald-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-rose-400 to-red-500 text-white border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-rose-100 text-sm">Overdue</p>
                <p className="text-4xl font-bold mt-1">{stats.overdueTasks}</p>
              </div>
              <Clock className="h-10 w-10 text-rose-200" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-indigo-500" />
              Weekly Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={stats.weeklyData}>
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip 
                  contentStyle={{ 
                    borderRadius: '8px', 
                    border: 'none', 
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' 
                  }} 
                />
                <Bar dataKey="completed" fill="#4F46E5" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5 text-indigo-500" />
              Tasks by Category
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <RechartsPie>
                <Pie
                  data={stats.categoryChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {stats.categoryChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </RechartsPie>
            </ResponsiveContainer>
            <div className="flex flex-wrap justify-center gap-2 mt-4">
              {stats.categoryChartData.map((entry, index) => (
                <Badge 
                  key={entry.name} 
                  variant="secondary"
                  className="capitalize"
                  style={{ backgroundColor: `${COLORS[index % COLORS.length]}20`, color: COLORS[index % COLORS.length] }}
                >
                  {entry.name}: {entry.value}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-indigo-100 rounded-xl">
              <Target className="h-6 w-6 text-indigo-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Total Completed</p>
              <p className="text-2xl font-bold text-slate-800">{stats.totalCompleted}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-amber-100 rounded-xl">
              <Clock className="h-6 w-6 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Avg. Time per Task</p>
              <p className="text-2xl font-bold text-slate-800">{stats.avgTimePerTask} min</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-green-100 rounded-xl">
              <Flame className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Pomodoro Sessions</p>
              <p className="text-2xl font-bold text-slate-800">{stats.pomodoroCount}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}