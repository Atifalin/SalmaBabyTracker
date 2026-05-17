import { create } from 'zustand';
import { Child } from '../types';
import { getItem, setItem, storageKeys } from '../storage/storage';

interface ChildStore {
  children: Child[];
  selectedChildId: string | null;
  addChild: (child: Omit<Child, 'id' | 'createdAt'>) => void;
  updateChild: (id: string, updates: Partial<Child>) => void;
  deleteChild: (id: string) => void;
  selectChild: (id: string) => void;
  loadChildren: () => void;
}

export const useChildStore = create<ChildStore>((set, get) => ({
  children: [],
  selectedChildId: null,

  addChild: (child) => {
    const newChild: Child = {
      ...child,
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      createdAt: new Date().toISOString(),
    };
    const children = [...get().children, newChild];
    set({ children });
    void setItem(storageKeys.CHILDREN, children);
    
    if (!get().selectedChildId) {
      get().selectChild(newChild.id);
    }
  },

  updateChild: (id, updates) => {
    const children = get().children.map((child) =>
      child.id === id ? { ...child, ...updates } : child
    );
    set({ children });
    void setItem(storageKeys.CHILDREN, children);
  },

  deleteChild: (id) => {
    const children = get().children.filter((child) => child.id !== id);
    set({ children });
    void setItem(storageKeys.CHILDREN, children);
    
    if (get().selectedChildId === id) {
      set({ selectedChildId: children[0]?.id || null });
      void setItem(storageKeys.SELECTED_CHILD, children[0]?.id || null);
    }
  },

  selectChild: (id) => {
    set({ selectedChildId: id });
    void setItem(storageKeys.SELECTED_CHILD, id);
  },

  loadChildren: async () => {
    const children = (await getItem<Child[]>(storageKeys.CHILDREN)) || [];
    const selectedChildId = await getItem<string>(storageKeys.SELECTED_CHILD);
    set({ children, selectedChildId: selectedChildId || children[0]?.id || null });
  },
}));
