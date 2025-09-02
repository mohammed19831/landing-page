import React, { useMemo, useCallback } from 'react';
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
  showEditButton = false 
}: DynamicBoxProps) {
  const { toggleBoxVisibility } = useBoxesStore();
  const modalEnabled = box?.modalEnabled !== false;
  const modalStyle = box?.modalStyle || {};
  const heightPx = box?.height || 200;

  const handleEditClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onEdit?.(box.id);
  }, [onEdit, box.id]);

  const handleVisibilityToggle = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleBoxVisibility(box.id);
  }, [toggleBoxVisibility, box.id]);

  const boxContent = (
    <div
      className={cn(
        'group relative w-full h-full border bg-white transition focus:outline-none focus:ring-2 focus:ring-brand-600 disabled:cursor-not-allowed overflow-hidden',
        isEditMode && 'hover:ring-2 hover:ring-blue-400',
        isSelected && 'ring-2 ring-blue-500'
      )}
      style={{
        ...bgStyleFrom(box.background as any),
        borderRadius: (box.borderRadius ?? 12) + 'px',
        boxShadow: box.shadow
          ? computeShadow(box.shadow.intensity, box.shadow.direction)
          : undefined,
      }}
    >
      {/* Edit Controls Overlay - Always visible when showEditButton is true */}
      {showEditButton && (
        <div className="absolute top-2 right-2 z-20 flex gap-1">
          <Button
            size="sm"
            variant="secondary"
            className="h-8 w-8 p-0 bg-white/90 hover:bg-white border shadow-sm"
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

  // Get visible boxes for display
  const visibleBoxes = useMemo(() => getVisibleBoxes(), [boxes]);

  // Prepare layouts for react-grid-layout
  const gridLayouts = useMemo(() => {
    const currentLayout = layouts[currentBreakpoint] || [];
    
    // Ensure all visible boxes have layout entries
    const layoutMap = new Map(currentLayout.map(layout => [layout.i, layout]));
    
    return visibleBoxes.map((box, index) => {
      const existingLayout = layoutMap.get(box.id);
      if (existingLayout) {
        return existingLayout;
      }
      
      // Create default layout for new boxes
      const getSizeForBox = (size: string) => {
        switch (size) {
          case 'large': return { w: 4, h: 2 };
          case 'medium': return { w: 2, h: 2 };
          default: return { w: 1, h: 2 };
        }
      };
      
      const { w, h } = getSizeForBox(box.size);
      return {
        i: box.id,
        x: (index * 1) % 4,
        y: Math.floor(index / 4) * 2,
        w,
        h,
        minW: 1,
        minH: 1,
      };
    });
  }, [visibleBoxes, layouts, currentBreakpoint]);

  const handleLayoutChange = useCallback((layout: Layout[]) => {
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
    
    setLayout(currentBreakpoint, boxLayouts);
  }, [isEditMode, showEditButtons, currentBreakpoint, setLayout]);

  const breakpoints = { lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 };
  const cols = { lg: 4, md: 3, sm: 2, xs: 1, xxs: 1 };

  if (visibleBoxes.length === 0) {
    return (
      <section className="mx-auto max-w-[1200px] px-4 sm:px-6 mt-8 sm:mt-10">
        <div className="text-center py-12">
          <p className="text-gray-500">No boxes to display. Add some boxes in the admin panel.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-[1200px] px-4 sm:px-6 mt-8 sm:mt-10">
      <ResponsiveGridLayout
        className="layout"
        layouts={{ [currentBreakpoint]: gridLayouts }}
        breakpoints={breakpoints}
        cols={cols}
        rowHeight={120}
        onLayoutChange={handleLayoutChange}
        isDraggable={isEditMode || showEditButtons}
        isResizable={isEditMode || showEditButtons}
        compactType={(isEditMode || showEditButtons) ? null : 'vertical'}
        preventCollision={false}
        margin={[16, 16]}
        containerPadding={[0, 0]}
        useCSSTransforms={true}
        draggableHandle={isEditMode ? undefined : '.drag-handle'}
      >
        {visibleBoxes.map((box) => (
          <div key={box.id} className="relative">
            <DynamicBox
              box={box}
              isEditMode={isEditMode}
              onEdit={onBoxEdit}
              isSelected={selectedBox === box.id}
              showEditButton={showEditButtons}
            />
            {isEditMode && !showEditButtons && (
              <div className="drag-handle absolute top-2 right-2 w-6 h-6 bg-white/80 rounded cursor-move flex items-center justify-center opacity-60 hover:opacity-100 transition-opacity">
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
        ))}
      </ResponsiveGridLayout>
    </section>
  );
}
