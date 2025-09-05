import React, { useState, useCallback, useEffect } from 'react';
import { Plus, Settings, Monitor, Smartphone, Tablet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useBoxesStore } from '@/state/boxes-store';
import DynamicBoxes from '@/components/home/DynamicBoxes';
import BoxEditor from '@/components/admin/BoxEditor';
import {
  AdminPageHeader,
  AdminCard,
  AdminButton,
  AdminEmptyState,
} from '@/components/admin/AdminUI';

const BREAKPOINTS = {
  lg: { name: 'Desktop', icon: Monitor, width: '1200px' },
  md: { name: 'Tablet', icon: Tablet, width: '996px' },
  sm: { name: 'Mobile', icon: Smartphone, width: '768px' },
};

export default function DynamicBoxesAdmin() {
  const {
    boxes,
    isEditMode,
    selectedBox,
    currentBreakpoint,
    addBox,
    setEditMode,
    setSelectedBox,
    setCurrentBreakpoint,
    getVisibleBoxes,
  } = useBoxesStore();

  const [editingBoxId, setEditingBoxId] = useState<string | null>(null);

  const visibleBoxes = getVisibleBoxes();
  const hiddenCount = boxes.length - visibleBoxes.length;

  const handleAddBox = useCallback(() => {
    console.log('Adding new box...'); // Debug log
    addBox();
  }, [addBox]);

  const handleAddTestBox = useCallback(() => {
    console.log('Adding test box with sample content...'); // Debug log
    const { addBox, updateBox } = useBoxesStore.getState();
    addBox();

    // Get the newly added box and populate with test data
    setTimeout(() => {
      const boxes = useBoxesStore.getState().boxes;
      const newBox = boxes[boxes.length - 1];
      if (newBox) {
        updateBox(newBox.id, {
          title: 'Sample Content Box',
          description: '<p>This is a <strong>sample box</strong> with rich text content. You can edit this content using the advanced editor.</p><ul><li>Feature 1</li><li>Feature 2</li><li>Feature 3</li></ul>',
          type: 'mixed',
          size: 'medium',
          background: { kind: 'gradient', from: '#3b82f6', to: '#8b5cf6', direction: 'to bottom right' },
          buttonLabel: 'Learn More',
          ctaMode: 'both',
        });
      }
    }, 100);
  }, []);

  const handleEditModeToggle = useCallback((enabled: boolean) => {
    setEditMode(enabled);
  }, [setEditMode]);

  // stable wrapper passed to Switch to avoid passing store setter directly
  const handleEditModeSwitch = useCallback((checked: boolean) => {
    handleEditModeToggle(checked);
  }, [handleEditModeToggle]);

  useEffect(() => {
    if (!isEditMode) setSelectedBox(null);
  }, [isEditMode, setSelectedBox]);

  const handleBoxEdit = useCallback((boxId: string) => {
    // Expose the currently editing box id globally so the grid can mark it static
    (window as any).__CURRENT_EDITING_BOX_ID__ = boxId;
    setEditingBoxId(boxId);
    // also select it in the global store for visual state
    setSelectedBox(boxId);
  }, [setSelectedBox]);

  const handleBreakpointChange = useCallback((breakpoint: string) => {
    setCurrentBreakpoint(breakpoint);
  }, [setCurrentBreakpoint]);

  // Migrate existing boxes from site-config if needed
  useEffect(() => {
    // This would be where we could migrate from the old system if needed
    // For now, we'll start fresh
  }, []);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Dynamic Content Boxes"
        description="Manage your content boxes with advanced drag & drop, resizing, and editing capabilities."
        action={
          <div className="flex items-center gap-3">
            <Badge variant="secondary">
              {visibleBoxes.length} visible
              {hiddenCount > 0 && ` • ${hiddenCount} hidden`}
            </Badge>
            <div className="flex gap-2">
              <AdminButton onClick={handleAddBox}>
                <Plus className="h-4 w-4 mr-2" />
                Add Box
              </AdminButton>
              <AdminButton onClick={handleAddTestBox} variant="outline">
                Add Test Box
              </AdminButton>
            </div>
          </div>
        }
      />

      <AdminCard>
        <div className="space-y-4">
          {/* Controls */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="edit-mode"
                  checked={isEditMode}
                  onCheckedChange={setEditMode}
                />
                <Label htmlFor="edit-mode" className="font-medium">
                  Edit Mode
                </Label>
              </div>
              
              {isEditMode && (
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                  <Settings className="w-3 h-3 mr-1" />
                  Editing Enabled
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Label className="text-sm font-medium">Breakpoint:</Label>
              {Object.entries(BREAKPOINTS).map(([key, { name, icon: Icon }]) => (
                <Button
                  key={key}
                  variant={currentBreakpoint === key ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleBreakpointChange(key)}
                  className="gap-1"
                >
                  <Icon className="w-4 h-4" />
                  {name}
                </Button>
              ))}
            </div>
          </div>

          {/* Instructions */}
          {isEditMode && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Edit Mode Instructions</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Drag boxes by their grid handles to reposition</li>
                <li>• Resize boxes by dragging their corners</li>
                <li>• Click the Edit button inside any box to open the advanced editor</li>
                <li>• Changes are automatically saved to localStorage</li>
                <li>• Switch breakpoints to see responsive layouts</li>
              </ul>
            </div>
          )}
        </div>
      </AdminCard>

      {/* Single Unified Grid View */}
      {boxes.length === 0 ? (
        <AdminEmptyState
          title="No content boxes yet"
          description="Create your first content box to get started with the dynamic grid system."
          action={
            <AdminButton onClick={handleAddBox}>
              <Plus className="h-4 w-4 mr-2" />
              Create First Box
            </AdminButton>
          }
        />
      ) : (
        <AdminCard>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">
                Live Preview - {BREAKPOINTS[currentBreakpoint as keyof typeof BREAKPOINTS]?.name}
              </h3>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Monitor className="w-4 h-4" />
                {BREAKPOINTS[currentBreakpoint as keyof typeof BREAKPOINTS]?.width}
              </div>
            </div>
            
            <div 
              className="border border-gray-200 rounded-lg overflow-hidden bg-gray-50"
              style={{
                maxWidth: currentBreakpoint === 'sm' ? '480px' : 
                         currentBreakpoint === 'md' ? '768px' : '100%'
              }}
            >
              <DynamicBoxes
                isEditMode={isEditMode}
                onBoxEdit={handleBoxEdit}
                selectedBox={selectedBox}
                showEditButtons={true}
              />
            </div>
          </div>
        </AdminCard>
      )}

      {/* Advanced Box Editor */}
      {editingBoxId && (
        <BoxEditor
          boxId={editingBoxId}
          isOpen={!!editingBoxId}
          onClose={() => {
            console.log('Closing BoxEditor'); // Debug log
            // Clear global editing marker to re-enable dragging/resizing
            (window as any).__CURRENT_EDITING_BOX_ID__ = null;
            setEditingBoxId(null);
            setSelectedBox(null);
          }}
        />
      )}

      {/* Status Footer */}
      <div className="text-sm text-gray-600 space-y-1">
        <p>
          <strong>Status:</strong> Unified grid system active with {boxes.length} total boxes
        </p>
        <p>
          <strong>Storage:</strong> Changes automatically persist to localStorage
        </p>
        <p>
          <strong>Responsive:</strong> Layout adapts across {Object.keys(BREAKPOINTS).length} breakpoints
        </p>
        <p>
          <strong>Editing:</strong> Click edit buttons inside boxes for advanced editing
        </p>
      </div>
    </div>
  );
}
