import React, { useMemo, useCallback, useEffect } from 'react';
import { Responsive, WidthProvider, Layout } from 'react-grid-layout';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Settings, Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { bgStyleFrom } from '@/lib/background';
import { useBoxesStore, BoxData, BoxLayout } from '@/state/boxes-store';
// CSS styles are handled in global.css

const ResponsiveGridLayout = WidthProvider(Responsive);

interface DynamicBoxProps {
  box: BoxData;
  isEditMode?: boolean;
  onEdit?: (id: string) => void;
  isSelected?: boolean;
  showEditButton?: boolean;
  layout?: { w: number; h: number; x: number; y: number };
}

function computeShadow(intensity: number, direction: string) {
  const d = 6 + intensity;
  const blur = 12 + intensity * 1.5;
  const spread = Math.max(0, Math.floor(intensity / 6));
  const map: Record<string, [number, number]> = {
    'top-left': [-d, -d],
    'top-right': [d, -d],
    'bottom-left': [-d, d],
    'bottom-right': [d, d],
  };
  const [x, y] = map[direction] || [d, d];
  return `${x}px ${y}px ${blur}px ${spread}px rgba(0,0,0,0.15)`;
}

function DynamicBox({ 
  box, 
  isEditMode = false, 
  onEdit, 
  isSelected = false, 
  showEditButton = false,
  layout
}: DynamicBoxProps) {
  const { toggleBoxVisibility, updateBox } = useBoxesStore();
  const modalEnabled = box?.modalEnabled !== false;
  const modalStyle = box?.modalStyle || {};
  
  // Calculate dynamic height based on grid layout
  const calculatedHeight = layout ? layout.h * 120 + (layout.h - 1) * 16 : (box?.height || 200);
  const heightPx = showEditButton || isEditMode ? Math.max(calculatedHeight - 100, 150) : (box?.height || 200);

  const handleEditClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('Edit button clicked for box:', box.id); // Debug log
    onEdit?.(box.id);
  }, [onEdit, box.id]);

  const handleVisibilityToggle = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleBoxVisibility(box.id);
  }, [toggleBoxVisibility, box.id]);

  // Sync layout changes back to box data
  useEffect(() => {
    if (layout && (showEditButton || isEditMode)) {
      const newHeight = layout.h * 120 + (layout.h - 1) * 16;
      if (newHeight !== box.height) {
        updateBox(box.id, { height: Math.max(newHeight - 100, 150) });
      }
    }
  }, [layout, showEditButton, isEditMode, box.height, box.id, updateBox]);

  const boxContent = (
    <div
      className={cn(
        'group relative w-full h-full border bg-white transition focus:outline-none focus:ring-2 focus:ring-brand-600 disabled:cursor-not-allowed overflow-hidden',
        isEditMode && 'hover:ring-2 hover:ring-blue-400',
        isSelected && 'ring-2 ring-blue-500',
        box.hidden && 'box-hidden'
      )}
      style={{
        ...bgStyleFrom(box.background as any),
        borderRadius: (box.borderRadius ?? 12) + 'px',
        boxShadow: box.shadow
          ? computeShadow(box.shadow.intensity, box.shadow.direction)
          : undefined,
        minHeight: showEditButton || isEditMode ? `${calculatedHeight}px` : 'auto',
      }}
    >
      {/* Edit Controls Overlay - Always visible when showEditButton is true */}
      {showEditButton && (
        <div className="absolute top-2 right-2 z-20 flex gap-1">
          <Button
            size="sm"
            variant="secondary"
            className="edit-btn h-8 w-8 p-0 bg-white/90 hover:bg-white border shadow-sm"
            onClick={handleEditClick}
            title="Edit Box"
          >
            <Settings className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="secondary"
            className="h-8 w-8 p-0 bg-white/90 hover:bg-white border shadow-sm"
            onClick={handleVisibilityToggle}
            title={box.hidden ? "Show Box" : "Hide Box"}
          >
            {box.hidden ? (
              <Eye className="h-4 w-4" />
            ) : (
              <EyeOff className="h-4 w-4" />
            )}
          </Button>
        </div>
      )}

      {/* Edit mode overlay for drag indication */}
      {isEditMode && !showEditButton && (
        <div className="absolute inset-0 bg-blue-500/10 z-10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="bg-white/90 px-2 py-1 rounded text-xs font-medium">
            Drag to reposition
          </div>
        </div>
      )}
      
      {/* Image on top with controlled height */}
      {box.imageUrl && (
        <div className="w-full">
          <img
            src={box.imageUrl}
            alt={box.title}
            className="w-full object-cover"
            style={{
              height: heightPx,
              borderTopLeftRadius: (box.borderRadius ?? 12) + 'px',
              borderTopRightRadius: (box.borderRadius ?? 12) + 'px',
            }}
          />
        </div>
      )}
      
      {/* Card body */}
      <div className="p-4 bg-white/90 backdrop-blur-[1px] h-full flex flex-col justify-between">
        <div>
          <div className="text-base font-semibold text-neutral-900 line-clamp-2">
            {box.title}
          </div>
          {box.description && (
            <div 
              className="mt-2 text-sm text-neutral-600 line-clamp-3"
              dangerouslySetInnerHTML={{ __html: box.description }}
            />
          )}
        </div>
        
        <div className="mt-3 flex items-center gap-2">
          {(box.ctaMode === 'button' || box.ctaMode === 'both' || !box.ctaMode) && (
            <span className="inline-flex items-center px-3 py-2 text-sm rounded-md bg-brand-600 text-white shadow group-hover:bg-brand-500 transition-colors">
              {box.buttonLabel || 'Read More'}
            </span>
          )}
          {(box.ctaMode === 'icon' || box.ctaMode === 'both') && (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="h-5 w-5 text-brand-600"
            >
              <path d="M13.5 4.5a.75.75 0 0 1 .75-.75h5.25a.75.75 0 0 1 .75.75v5.25a.75.75 0 0 1-1.5 0V6.31l-7.72 7.72a.75.75 0 1 1-1.06-1.06l7.72-7.72h-3.44a.75.75 0 0 1-.75-.75Z" />
              <path d="M3 6.75A2.25 2.25 0 0 1 5.25 4.5h5.5a.75.75 0 0 1 0 1.5h-5.5a.75.75 0 0 0-.75.75v12.5c0 .414.336.75.75.75h12.5a.75.75 0 0 0 .75-.75v-5.5a.75.75 0 0 1 1.5 0v5.5A2.25 2.25 0 0 1 17.75 21H5.25A2.25 2.25 0 0 1 3 18.75V6.75Z" />
            </svg>
          )}
        </div>
      </div>
    </div>
  );

  // In edit mode or when showEditButton is true, don't wrap with Dialog
  if (isEditMode || showEditButton) {
    return boxContent;
  }

  // Normal mode with modal functionality
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          className="w-full h-full focus:outline-none"
          disabled={!modalEnabled}
        >
          {boxContent}
        </button>
      </DialogTrigger>
      <DialogContent
        className="md:max-w-2xl lg:max-w-3xl max-h-[80vh] overflow-y-auto"
        style={{
          background: modalStyle.bg || undefined,
          color: modalStyle.text || undefined,
          boxShadow: modalStyle.shadow || undefined,
          borderRadius: modalStyle.radius ? `${modalStyle.radius}px` : undefined,
        }}
      >
        <DialogHeader className="pb-4">
          <DialogTitle className="text-xl font-semibold leading-tight break-words">
            {box.title ?? 'No Title'}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 overflow-hidden">
          {box.imageUrl && (
            <div className="flex-shrink-0">
              <img
                src={box.imageUrl}
                alt={box.title}
                className="w-full h-64 object-cover rounded"
                style={{ maxWidth: '100%' }}
              />
            </div>
          )}
          {box?.description && (
            <div
              className="text-sm leading-6 break-words overflow-wrap-anywhere hyphens-auto prose prose-sm max-w-none"
              style={{
                wordWrap: 'break-word',
                overflowWrap: 'anywhere',
                whiteSpace: 'pre-wrap',
                maxWidth: '100%',
              }}
              dangerouslySetInnerHTML={{ __html: box.description }}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface DynamicBoxesProps {
  isEditMode?: boolean;
  onBoxEdit?: (id: string) => void;
  selectedBox?: string | null;
  showEditButtons?: boolean;
}

export default function DynamicBoxes({ 
  isEditMode = false, 
  onBoxEdit, 
  selectedBox,
  showEditButtons = false
}: DynamicBoxesProps) {
  const {
    boxes,
    layouts,
    currentBreakpoint,
    getVisibleBoxes,
    setLayout,
  } = useBoxesStore();

  // Get all boxes for frontend, visible boxes for admin
  const displayBoxes = useMemo(() => {
    if (showEditButtons || isEditMode) {
      return boxes;
    } else {
      return getVisibleBoxes();
    }
  }, [boxes, getVisibleBoxes, showEditButtons, isEditMode]);

  // Load saved layouts from localStorage on mount to hydrate store layouts
  useEffect(() => {
    try {
      const saved = localStorage.getItem('gridLayout');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          Object.entries(parsed).forEach(([bp, layoutArr]) => {
            if (Array.isArray(layoutArr)) {
              setLayout(bp, layoutArr as BoxLayout[]);
            }
          });
        }
      }
    } catch (e) {
      // ignore
    }
  }, [setLayout]);

  // Sort boxes by their layout position so DOM order matches visual order
  const sortedDisplayBoxes = useMemo(() => {
    const currentLayout = layouts[currentBreakpoint] || [];
    const layoutMap = new Map(currentLayout.map(l => [l.i, l]));
    // Attach positions
    return [...displayBoxes].sort((a, b) => {
      const la = layoutMap.get(a.id);
      const lb = layoutMap.get(b.id);
      if (!la && !lb) return 0;
      if (!la) return 1;
      if (!lb) return -1;
      if (la.y !== lb.y) return la.y - lb.y;
      return la.x - lb.x;
    });
  }, [displayBoxes, layouts, currentBreakpoint]);

  // Prepare layouts for react-grid-layout using sorted boxes
  const gridLayouts = useMemo(() => {
    const currentLayout = layouts[currentBreakpoint] || [];
    const layoutMap = new Map(currentLayout.map(layout => [layout.i, layout]));

    return sortedDisplayBoxes.map((box, index) => {
      const existingLayout = layoutMap.get(box.id);
      if (existingLayout) return existingLayout;

      const getSizeForBox = (size: string) => {
        switch (size) {
          case 'large': return { w: 6, h: 2 };
          case 'medium': return { w: 4, h: 2 };
          default: return { w: 3, h: 2 };
        }
      };

      const { w, h } = getSizeForBox(box.size);
      const colsTotal = cols.lg || 12;
      const placementUnit = 3;
      const x = (index * placementUnit) % colsTotal;
      const y = Math.floor((index * placementUnit) / colsTotal) * 2;

      return {
        i: box.id,
        x,
        y,
        w,
        h,
        minW: 3,
        minH: 2,
        maxW: 12,
        maxH: 12,
      };
    });
  }, [sortedDisplayBoxes, layouts, currentBreakpoint]);

  // Save layouts to localStorage whenever layout changes
  const saveLayoutsToLocal = useCallback((newLayouts: { [key: string]: BoxLayout[] }) => {
    try {
      localStorage.setItem('gridLayout', JSON.stringify(newLayouts));
    } catch (e) {
      // ignore
    }
  }, []);

  const handleLayoutChange = useCallback((layout: Layout[]) => {
    // Only persist changes when in edit mode (admin) — but still update store
    if (!isEditMode && !showEditButtons) return;

    const boxLayouts: BoxLayout[] = layout.map(item => ({
      i: item.i,
      x: item.x,
      y: item.y,
      w: item.w,
      h: item.h,
      minW: item.minW,
      minH: item.minH,
      maxW: item.maxW,
      maxH: item.maxH,
    }));

    const newLayouts = {
      ...layouts,
      [currentBreakpoint]: boxLayouts,
    };

    setLayout(currentBreakpoint, boxLayouts);
    saveLayoutsToLocal(newLayouts);
  }, [isEditMode, showEditButtons, currentBreakpoint, setLayout, layouts, saveLayoutsToLocal]);

  const handleResizeStop = useCallback((layout: Layout[]) => {
    console.log('Resize stopped, new layout:', layout);
    handleLayoutChange(layout);
  }, [handleLayoutChange]);

  const breakpoints = { lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 };
  // Use 12-column baseline to allow flexible 1-4 per row mappings
  const cols = { lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 };

  if (displayBoxes.length === 0) {
    return (
      <section className={cn('mx-auto max-w-[1200px] px-4 sm:px-6 mt-8 sm:mt-10')}>
        <div className="text-center py-12">
          <p className="text-gray-500">No boxes to display. Add some boxes in the admin panel.</p>
        </div>
      </section>
    );
  }

  const isFrontend = !isEditMode && !showEditButtons;

  if (isFrontend) {
    // Frontend: use CSS grid auto-placement to avoid left-only packing and to auto-fill
    return (
      <section className={cn('mx-auto max-w-[1200px] px-4 sm:px-6 mt-8 sm:mt-10')}>
        <div className="frontend-grid">
          {displayBoxes.map((box) => {
            const boxLayout = gridLayouts.find(l => l.i === box.id) || { i: box.id, w: 3, h: 2 };
            const colSpan = Math.max(1, Math.min(12, boxLayout.w || 3));
            return (
              <div
                key={box.id}
                className="frontend-grid-item"
                style={{
                  // use CSS variable for responsive spans
                  ['--col-span' as any]: colSpan,
                }}
              >
                <DynamicBox
                  box={box}
                  isEditMode={false}
                  onEdit={undefined}
                  isSelected={false}
                  showEditButton={false}
                  layout={boxLayout}
                />
              </div>
            );
          })}
        </div>
      </section>
    );
  }

  // Admin/edit mode: use react-grid-layout with editing affordances
  return (
    <section className={cn('mx-auto max-w-[1200px] px-4 sm:px-6 mt-8 sm:mt-10', (isEditMode || showEditButtons) && 'admin-edit-mode')}>
      <ResponsiveGridLayout
        className="layout"
        layouts={{ [currentBreakpoint]: gridLayouts }}
        breakpoints={breakpoints}
        cols={cols}
        rowHeight={80}
        onLayoutChange={(layout) => handleLayoutChange(layout)}
        onDragStop={(layout) => handleLayoutChange(layout)}
        onResizeStop={(layout) => handleResizeStop(layout)}
        isDraggable={isEditMode || showEditButtons}
        isResizable={isEditMode || showEditButtons}
        compactType={(isEditMode || showEditButtons) ? null : 'vertical'}
        preventCollision={false}
        margin={[16, 16]}
        containerPadding={[16, 16]}
        useCSSTransforms={true}
        draggableHandle={isEditMode && !showEditButtons ? '.drag-handle' : undefined}
        draggableCancel={isEditMode ? '.edit-btn, .editor, input, textarea, select, .color-picker, .color-picker-trigger, .emoji-picker, .emoji-picker-trigger, .popover, .select-content' : undefined}
        resizeHandles={['se', 'e', 's', 'w', 'n', 'sw', 'ne', 'nw']}
      >
        {displayBoxes.map((box) => {
          const boxLayout = gridLayouts.find(l => l.i === box.id) || { i: box.id, x: 0, y: 0, w: 3, h: 2 };

          // If the admin opened the editor for this box, mark it static so it can't be dragged/resized
          const editingBoxId = (typeof (window as any).__CURRENT_EDITING_BOX_ID__ !== 'undefined') ? (window as any).__CURRENT_EDITING_BOX_ID__ : null;
          if (editingBoxId === box.id) {
            boxLayout.static = true;
          }

          return (
            <div key={box.id} className="relative">
              <DynamicBox
                box={box}
                isEditMode={isEditMode}
                onEdit={onBoxEdit}
                isSelected={selectedBox === box.id}
                showEditButton={showEditButtons}
                layout={boxLayout}
              />
              {isEditMode && !showEditButtons && (
                <div className="drag-handle absolute top-2 right-2 w-6 h-6 bg-white/80 rounded cursor-move flex items-center justify-center opacity-60 hover:opacity-100 transition-opacity z-30">
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
                    <circle cx="2" cy="2" r="1"/>
                    <circle cx="6" cy="2" r="1"/>
                    <circle cx="10" cy="2" r="1"/>
                    <circle cx="2" cy="6" r="1"/>
                    <circle cx="6" cy="6" r="1"/>
                    <circle cx="10" cy="6" r="1"/>
                    <circle cx="2" cy="10" r="1"/>
                    <circle cx="6" cy="10" r="1"/>
                    <circle cx="10" cy="10" r="1"/>
                  </svg>
                </div>
              )}
            </div>
          );
        })}
      </ResponsiveGridLayout>
    </section>
  );
}
