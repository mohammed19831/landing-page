import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface BoxLayout {
  i: string;
  x: number;
  y: number;
  w: number;
  h: number;
  minW?: number;
  minH?: number;
  maxW?: number;
  maxH?: number;
}

export interface BoxData {
  id: string;
  title: string;
  description?: string;
  imageUrl?: string;
  type: 'image' | 'text' | 'mixed';
  size: 'small' | 'medium' | 'large';
  height: number;
  background: any;
  buttonLabel?: string;
  ctaMode: 'button' | 'icon' | 'both';
  modalEnabled: boolean;
  borderRadius: number;
  shadow?: {
    intensity: number;
    direction: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  };
  modalStyle: {
    bg?: string;
    text?: string;
    shadow?: string;
    radius?: number;
  };
  hidden?: boolean;
  layout?: BoxLayout;
}

interface BoxesStore {
  boxes: BoxData[];
  layouts: { [key: string]: BoxLayout[] };
  currentBreakpoint: string;
  isEditMode: boolean;
  selectedBox: string | null;
  
  // Actions
  setBoxes: (boxes: BoxData[]) => void;
  addBox: () => void;
  updateBox: (id: string, updates: Partial<BoxData>) => void;
  removeBox: (id: string) => void;
  duplicateBox: (id: string) => void;
  toggleBoxVisibility: (id: string) => void;
  setLayout: (breakpoint: string, layout: BoxLayout[]) => void;
  setCurrentBreakpoint: (breakpoint: string) => void;
  setEditMode: (editMode: boolean) => void;
  setSelectedBox: (id: string | null) => void;
  
  // Utility functions
  getVisibleBoxes: () => BoxData[];
  getBoxById: (id: string) => BoxData | undefined;
  reorderBoxes: (fromIndex: number, toIndex: number) => void;
}

const createDefaultBox = (): BoxData => ({
  id: crypto.randomUUID(),
  title: 'New Box',
  type: 'mixed',
  size: 'small',
  height: 200,
  background: { kind: 'color', color: '#f3f4f6' },
  buttonLabel: 'Read More',
  ctaMode: 'button',
  modalEnabled: true,
  borderRadius: 12,
  shadow: { intensity: 12, direction: 'bottom-right' },
  modalStyle: {
    bg: '#111111',
    text: '#ffffff',
    shadow: '0 10px 30px rgba(0,0,0,0.3)',
    radius: 16,
  },
  hidden: false,
});

// Convert size to grid dimensions on a 12-column baseline
const getGridDimensions = (size: string) => {
  switch (size) {
    case 'large':
      return { w: 6, h: 2 }; // ~2 per row
    case 'medium':
      return { w: 4, h: 2 }; // ~3 per row
    default:
      return { w: 3, h: 2 }; // ~4 per row
  }
};

export const useBoxesStore = create<BoxesStore>()(
  persist(
    (set, get) => ({
      boxes: [],
      layouts: {},
      currentBreakpoint: 'lg',
      isEditMode: false,
      selectedBox: null,

      setBoxes: (boxes) => set({ boxes }),

      addBox: () => {
        const newBox = createDefaultBox();
        const { w, h } = getGridDimensions(newBox.size);
        const boxes = get().boxes;
        
        // Find a good position for the new box
        const currentLayout = get().layouts[get().currentBreakpoint] || [];
        let x = 0;
        let y = 0;
        
        // Simple positioning: find the first available slot
        if (currentLayout.length > 0) {
          const maxY = Math.max(...currentLayout.map(item => item.y + item.h));
          y = maxY;
        }
        
        const newLayout: BoxLayout = {
          i: newBox.id,
          x,
          y,
          w,
          h,
          minW: 3,
          minH: 2,
          maxW: 12,
        };

        set(state => ({
          boxes: [...state.boxes, newBox],
          layouts: {
            ...state.layouts,
            [state.currentBreakpoint]: [...(state.layouts[state.currentBreakpoint] || []), newLayout]
          }
        }));
      },

      updateBox: (id, updates) => {
        set(state => ({
          boxes: state.boxes.map(box => 
            box.id === id 
              ? { 
                  ...box, 
                  ...updates,
                  // Update layout if size changed
                  ...(updates.size && {
                    layout: { 
                      ...box.layout, 
                      ...getGridDimensions(updates.size) 
                    }
                  })
                }
              : box
          )
        }));
        
        // Update layout if size changed
        if (updates.size) {
          const { w, h } = getGridDimensions(updates.size);
          const currentBreakpoint = get().currentBreakpoint;
          const currentLayouts = get().layouts[currentBreakpoint] || [];
          
          set(state => ({
            layouts: {
              ...state.layouts,
              [currentBreakpoint]: currentLayouts.map(layout =>
                layout.i === id ? { ...layout, w, h } : layout
              )
            }
          }));
        }
      },

      removeBox: (id) => {
        set(state => ({
          boxes: state.boxes.filter(box => box.id !== id),
          layouts: Object.fromEntries(
            Object.entries(state.layouts).map(([breakpoint, layout]) => [
              breakpoint,
              layout.filter(item => item.i !== id)
            ])
          )
        }));
      },

      duplicateBox: (id) => {
        const originalBox = get().getBoxById(id);
        if (!originalBox) return;
        
        const duplicatedBox = {
          ...originalBox,
          id: crypto.randomUUID(),
          title: `${originalBox.title} (Copy)`,
        };
        
        const { w, h } = getGridDimensions(duplicatedBox.size);
        const currentLayout = get().layouts[get().currentBreakpoint] || [];
        
        // Position below the original
        const originalLayout = currentLayout.find(item => item.i === id);
        const newLayout: BoxLayout = {
          i: duplicatedBox.id,
          x: originalLayout?.x || 0,
          y: (originalLayout?.y || 0) + (originalLayout?.h || 2),
          w,
          h,
          minW: 3,
          minH: 2,
          maxW: 12,
        };

        set(state => ({
          boxes: [...state.boxes, duplicatedBox],
          layouts: {
            ...state.layouts,
            [state.currentBreakpoint]: [...(state.layouts[state.currentBreakpoint] || []), newLayout]
          }
        }));
      },

      toggleBoxVisibility: (id) => {
        set(state => ({
          boxes: state.boxes.map(box =>
            box.id === id ? { ...box, hidden: !box.hidden } : box
          )
        }));
      },

      setLayout: (breakpoint, layout) => {
        set(state => ({
          layouts: {
            ...state.layouts,
            [breakpoint]: layout
          }
        }));
      },

      setCurrentBreakpoint: (breakpoint) => {
        set({ currentBreakpoint: breakpoint });
      },

      setEditMode: (editMode) => {
        set({ isEditMode: editMode });
      },

      setSelectedBox: (id) => {
        set({ selectedBox: id });
      },

      getVisibleBoxes: () => {
        return get().boxes.filter(box => !box.hidden);
      },

      getBoxById: (id) => {
        return get().boxes.find(box => box.id === id);
      },

      reorderBoxes: (fromIndex, toIndex) => {
        const boxes = [...get().boxes];
        const [movedBox] = boxes.splice(fromIndex, 1);
        boxes.splice(toIndex, 0, movedBox);
        set({ boxes });
      },
    }),
    {
      name: 'boxes-storage',
      partialize: (state) => ({
        boxes: state.boxes,
        layouts: state.layouts,
      }),
    }
  )
);
