import React from 'react';
import { ListTodo, Clock, Loader2, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './components/ui/card';
import { api } from '../api/client';

export const Dashboard = () => {
  const { data: tasks } = api.tasks.usePublication();

  const total = tasks.length;
  const todo = tasks.filter(t => t.status === 'todo').length;
  const inProgress = tasks.filter(t => t.status === 'in-progress').length;
  const done = tasks.filter(t => t.status === 'done').length;

  const metrics = [
    { label: 'Total Tasks', value: total, icon: ListTodo, color: 'text-blue-500' },
    { label: 'To Do', value: todo, icon: Clock, color: 'text-yellow-500' },
    { label: 'In Progress', value: inProgress, icon: Loader2, color: 'text-orange-500' },
    { label: 'Completed', value: done, icon: CheckCircle2, color: 'text-green-500' },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {metrics.map(({ label, value, icon: Icon, color }) => (
        <Card key={label}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{label}</CardTitle>
            <Icon className={`h-4 w-4 ${color}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
