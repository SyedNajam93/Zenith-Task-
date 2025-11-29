import React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, SortAsc, X, Calendar, Flag, Tag } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

const priorities = ['all', 'low', 'medium', 'high', 'urgent'];
const categories = ['all', 'work', 'personal', 'shopping', 'fitness', 'health', 'finance', 'education', 'travel', 'other'];
const statuses = ['all', 'pending', 'in_progress', 'completed'];
const sortOptions = [
  { value: 'due_date', label: 'Due Date' },
  { value: 'priority', label: 'Priority' },
  { value: 'created_date', label: 'Created Date' },
  { value: 'title', label: 'Alphabetical' }
];

export default function TaskFilters({ 
  filters, 
  onFilterChange, 
  sortBy, 
  onSortChange,
  activeFiltersCount 
}) {
  const updateFilter = (key, value) => {
    onFilterChange({ ...filters, [key]: value });
  };

  const clearFilters = () => {
    onFilterChange({
      search: '',
      priority: 'all',
      category: 'all',
      status: 'all'
    });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            value={filters.search}
            onChange={(e) => updateFilter('search', e.target.value)}
            placeholder="Search tasks..."
            className="pl-10 bg-white"
          />
        </div>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="gap-2">
              <Filter className="h-4 w-4" />
              Filters
              {activeFiltersCount > 0 && (
                <Badge className="bg-indigo-500 text-white h-5 w-5 p-0 flex items-center justify-center text-xs">
                  {activeFiltersCount}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80" align="end">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Filters</h4>
                {activeFiltersCount > 0 && (
                  <Button variant="ghost" size="sm" onClick={clearFilters} className="text-slate-500 h-8">
                    <X className="h-3 w-3 mr-1" /> Clear all
                  </Button>
                )}
              </div>

              <div>
                <label className="text-sm font-medium flex items-center gap-2 mb-2">
                  <Flag className="h-4 w-4 text-slate-400" /> Priority
                </label>
                <div className="flex flex-wrap gap-2">
                  {priorities.map(p => (
                    <button
                      key={p}
                      onClick={() => updateFilter('priority', p)}
                      className={cn(
                        "px-3 py-1.5 text-sm rounded-full transition-colors capitalize",
                        filters.priority === p 
                          ? "bg-indigo-500 text-white" 
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      )}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium flex items-center gap-2 mb-2">
                  <Tag className="h-4 w-4 text-slate-400" /> Category
                </label>
                <Select value={filters.category} onValueChange={(v) => updateFilter('category', v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(c => (
                      <SelectItem key={c} value={c}>
                        <span className="capitalize">{c}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium flex items-center gap-2 mb-2">
                  <Calendar className="h-4 w-4 text-slate-400" /> Status
                </label>
                <div className="flex flex-wrap gap-2">
                  {statuses.map(s => (
                    <button
                      key={s}
                      onClick={() => updateFilter('status', s)}
                      className={cn(
                        "px-3 py-1.5 text-sm rounded-full transition-colors capitalize",
                        filters.status === s 
                          ? "bg-indigo-500 text-white" 
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      )}
                    >
                      {s.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        <Select value={sortBy} onValueChange={onSortChange}>
          <SelectTrigger className="w-44">
            <SortAsc className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            {sortOptions.map(opt => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {activeFiltersCount > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-slate-500">Active filters:</span>
          {filters.priority !== 'all' && (
            <Badge variant="secondary" className="gap-1 pr-1">
              Priority: {filters.priority}
              <button onClick={() => updateFilter('priority', 'all')} className="ml-1 hover:text-red-500">
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {filters.category !== 'all' && (
            <Badge variant="secondary" className="gap-1 pr-1">
              Category: {filters.category}
              <button onClick={() => updateFilter('category', 'all')} className="ml-1 hover:text-red-500">
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {filters.status !== 'all' && (
            <Badge variant="secondary" className="gap-1 pr-1">
              Status: {filters.status}
              <button onClick={() => updateFilter('status', 'all')} className="ml-1 hover:text-red-500">
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}