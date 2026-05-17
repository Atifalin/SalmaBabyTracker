import { create } from 'zustand';
import { Task, TaskCompletion } from '../types';
import { getItem, setItem, storageKeys } from '../storage/storage';

interface TaskStore {
  tasks: Task[];
  completions: TaskCompletion[];
  addTask: (task: Omit<Task, 'id' | 'createdAt'>) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  restoreTask: (id: string) => void;
  completeTask: (taskId: string, childId: string, points: number) => void;
  uncompleteLatest: (taskId: string, childId: string) => void;
  getTodayCompletions: (childId: string) => TaskCompletion[];
  getTaskCompletions: (taskId: string, date: string) => TaskCompletion[];
  loadTasks: () => void;
}

export const useTaskStore = create<TaskStore>((set, get) => ({
  tasks: [],
  completions: [],

  addTask: (task) => {
    const newTask: Task = {
      ...task,
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      createdAt: new Date().toISOString(),
    };
    const tasks = [...get().tasks, newTask];
    set({ tasks });
    void setItem(storageKeys.TASKS, tasks);
  },

  updateTask: (id, updates) => {
    const tasks = get().tasks.map((task) =>
      task.id === id ? { ...task, ...updates } : task
    );
    set({ tasks });
    void setItem(storageKeys.TASKS, tasks);
  },

  deleteTask: (id) => {
    // soft-delete: archive so historical day stats remain accurate
    const tasks = get().tasks.map((task) =>
      task.id === id ? { ...task, archivedAt: new Date().toISOString() } : task,
    );
    set({ tasks });
    void setItem(storageKeys.TASKS, tasks);
  },

  restoreTask: (id) => {
    const tasks = get().tasks.map((task) =>
      task.id === id ? { ...task, archivedAt: undefined } : task,
    );
    set({ tasks });
    void setItem(storageKeys.TASKS, tasks);
  },

  completeTask: (taskId, childId, points) => {
    const completion: TaskCompletion = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      taskId,
      childId,
      completedAt: new Date().toISOString(),
      points,
    };
    const completions = [...get().completions, completion];
    set({ completions });
    void setItem(storageKeys.COMPLETIONS, completions);
  },

  uncompleteLatest: (taskId, childId) => {
    const today = new Date().toISOString().split('T')[0];
    const matching = get().completions.filter(
      (c) => c.taskId === taskId && c.childId === childId && c.completedAt.startsWith(today),
    );
    if (matching.length === 0) return;
    const latest = matching.reduce((a, b) => (a.completedAt > b.completedAt ? a : b));
    const completions = get().completions.filter((c) => c.id !== latest.id);
    set({ completions });
    void setItem(storageKeys.COMPLETIONS, completions);
  },

  getTodayCompletions: (childId) => {
    const today = new Date().toISOString().split('T')[0];
    return get().completions.filter(
      (c) => c.childId === childId && c.completedAt.startsWith(today)
    );
  },

  getTaskCompletions: (taskId, date) => {
    return get().completions.filter(
      (c) => c.taskId === taskId && c.completedAt.startsWith(date)
    );
  },

  loadTasks: async () => {
    const tasks = (await getItem<Task[]>(storageKeys.TASKS)) || [];
    const completions = (await getItem<TaskCompletion[]>(storageKeys.COMPLETIONS)) || [];
    set({ tasks, completions });
  },
}));
