import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { 
  ShoppingCart, Briefcase, Plane, GraduationCap, 
  Heart, DollarSign, Plus, Trash2, Copy, Edit2
} from 'lucide-react';
import { cn } from "@/lib/utils";

const defaultTemplates = [
  {
    id: 'grocery',
    name: 'Grocery Shopping',
    icon: 'shopping',
    category: 'shopping',
    tasks: [
      { title: 'Fruits & Vegetables', subtasks: ['Apples', 'Bananas', 'Tomatoes', 'Lettuce'] },
      { title: 'Dairy', subtasks: ['Milk', 'Cheese', 'Yogurt'] },
      { title: 'Meat & Protein', subtasks: ['Chicken', 'Eggs'] },
      { title: 'Pantry Items', subtasks: ['Bread', 'Rice', 'Pasta'] }
    ]
  },
  {
    id: 'travel',
    name: 'Travel Packing',
    icon: 'travel',
    category: 'travel',
    tasks: [
      { title: 'Documents', subtasks: ['Passport', 'ID', 'Tickets', 'Insurance'] },
      { title: 'Clothes', subtasks: ['Shirts', 'Pants', 'Underwear', 'Socks'] },
      { title: 'Toiletries', subtasks: ['Toothbrush', 'Shampoo', 'Sunscreen'] },
      { title: 'Electronics', subtasks: ['Phone charger', 'Camera', 'Adapter'] }
    ]
  },
  {
    id: 'project',
    name: 'Project Launch',
    icon: 'work',
    category: 'work',
    tasks: [
      { title: 'Planning', priority: 'high', subtasks: ['Define scope', 'Set timeline', 'Assign team'] },
      { title: 'Development', subtasks: ['Build MVP', 'Testing', 'Bug fixes'] },
      { title: 'Launch', priority: 'urgent', subtasks: ['Deploy', 'Monitor', 'Celebrate'] }
    ]
  },
  {
    id: 'fitness',
    name: 'Weekly Workout',
    icon: 'fitness',
    category: 'fitness',
    tasks: [
      { title: 'Monday - Upper Body', subtasks: ['Pushups', 'Pull-ups', 'Shoulder press'] },
      { title: 'Wednesday - Lower Body', subtasks: ['Squats', 'Lunges', 'Deadlifts'] },
      { title: 'Friday - Cardio', subtasks: ['Running', 'HIIT', 'Stretching'] }
    ]
  }
];

const iconMap = {
  shopping: ShoppingCart,
  work: Briefcase,
  travel: Plane,
  education: GraduationCap,
  fitness: Heart,
  finance: DollarSign
};

export default function TemplatesList({ templates = [], onUseTemplate, onCreateTemplate, onDeleteTemplate }) {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  const allTemplates = [...defaultTemplates, ...templates];

  const handleUseTemplate = (template) => {
    setSelectedTemplate(template);
  };

  const confirmUseTemplate = () => {
    if (selectedTemplate) {
      onUseTemplate(selectedTemplate);
      setSelectedTemplate(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-800">Task Templates</h2>
          <p className="text-sm text-slate-500 mt-1">Quickly create tasks from pre-made templates</p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Create Template
        </Button>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {allTemplates.map(template => {
          const Icon = iconMap[template.icon] || Briefcase;
          
          return (
            <Card 
              key={template.id} 
              className="group hover:shadow-lg transition-all cursor-pointer border-slate-200"
              onClick={() => handleUseTemplate(template)}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className={cn(
                    "p-3 rounded-xl",
                    template.category === 'shopping' && "bg-pink-100",
                    template.category === 'work' && "bg-indigo-100",
                    template.category === 'travel' && "bg-cyan-100",
                    template.category === 'fitness' && "bg-green-100",
                    template.category === 'education' && "bg-amber-100",
                    template.category === 'finance' && "bg-emerald-100"
                  )}>
                    <Icon className={cn(
                      "h-6 w-6",
                      template.category === 'shopping' && "text-pink-600",
                      template.category === 'work' && "text-indigo-600",
                      template.category === 'travel' && "text-cyan-600",
                      template.category === 'fitness' && "text-green-600",
                      template.category === 'education' && "text-amber-600",
                      template.category === 'finance' && "text-emerald-600"
                    )} />
                  </div>
                  
                  {!defaultTemplates.find(t => t.id === template.id) && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="opacity-0 group-hover:opacity-100 h-8 w-8"
                      onClick={(e) => { e.stopPropagation(); onDeleteTemplate(template.id); }}
                    >
                      <Trash2 className="h-4 w-4 text-slate-400 hover:text-red-500" />
                    </Button>
                  )}
                </div>

                <h3 className="font-semibold text-slate-800 mb-2">{template.name}</h3>
                
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <span>{template.tasks.length} tasks</span>
                  <span>•</span>
                  <Badge variant="secondary" className="capitalize text-xs">
                    {template.category}
                  </Badge>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-100">
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Copy className="h-4 w-4" />
                    <span>Click to use template</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Dialog open={!!selectedTemplate} onOpenChange={() => setSelectedTemplate(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Use Template: {selectedTemplate?.name}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 mt-4">
            <p className="text-sm text-slate-600">
              This will create {selectedTemplate?.tasks.length} tasks:
            </p>
            
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {selectedTemplate?.tasks.map((task, idx) => (
                <div key={idx} className="p-3 bg-slate-50 rounded-lg">
                  <p className="font-medium text-slate-800">{task.title}</p>
                  {task.subtasks?.length > 0 && (
                    <p className="text-sm text-slate-500 mt-1">
                      {task.subtasks.length} subtasks
                    </p>
                  )}
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => setSelectedTemplate(null)}>
                Cancel
              </Button>
              <Button onClick={confirmUseTemplate}>
                Create Tasks
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}