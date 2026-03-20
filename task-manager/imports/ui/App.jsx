import { CheckSquare } from "lucide-react";
import { Dashboard } from "./Dashboard";
import { TaskList } from "./TaskList";

export const App = () => {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto flex items-center gap-2 px-4 py-4">
          <CheckSquare className="h-6 w-6 text-primary" />
          <h1 className="text-xl font-semibold">Task Manager</h1>
        </div>
      </header>
      <main className="container mx-auto px-4 py-8 space-y-8">
        <Dashboard />
        <TaskList />
      </main>
    </div>
  );
};
