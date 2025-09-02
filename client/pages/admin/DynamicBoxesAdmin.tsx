import React, { useState, useCallback, useEffect } from 'react';
import { Plus, Settings, Eye, EyeOff, RotateCcw, Monitor, Smartphone, Tablet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  const [activeTab, setActiveTab] = useState('grid');

  const visibleBoxes = getVisibleBoxes();
  const hiddenCount = boxes.length - visibleBoxes.length;

  const handleAddBox = useCallback(() => {
    addBox();
  }, [addBox]);

  const handleEditModeToggle = useCallback((enabled: boolean) => {
    setEditMode(enabled);
    if (!enabled) {
      setSelectedBox(null);
    }
  }, [setEditMode, setSelectedBox]);

  const handleBoxSelect = useCallback((boxId: string) => {
    setSelectedBox(boxId);
    setEditingBoxId(boxId);
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
            <AdminButton onClick={handleAddBox}>
              <Plus className="h-4 w-4 mr-2" />
              Add Box
            </AdminButton>
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
                  onCheckedChange={handleEditModeToggle}
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
                <li>• Click on any box to open the advanced editor</li>
                <li>• Changes are automatically saved to localStorage</li>
                <li>• Switch breakpoints to see responsive layouts</li>
              </ul>
            </div>
          )}
        </div>
      </AdminCard>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-2 w-full max-w-md">
          <TabsTrigger value="grid">Grid View</TabsTrigger>
          <TabsTrigger value="list">List View</TabsTrigger>
        </TabsList>

        <TabsContent value="grid" className="space-y-6">
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
                    onBoxSelect={handleBoxSelect}
                    selectedBox={selectedBox}
                  />
                </div>

                {isEditMode && selectedBox && (
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center gap-2 text-green-800">
                      <Settings className="w-4 h-4" />
                      <span className="font-medium">
                        Selected: {boxes.find(b => b.id === selectedBox)?.title}
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setEditingBoxId(selectedBox)}
                      >
                        Open Editor
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </AdminCard>
          )}
        </TabsContent>

        <TabsContent value="list" className="space-y-4">
          {boxes.length === 0 ? (
            <AdminEmptyState
              title="No content boxes yet"
              description="Create your first content box to get started."
              action={
                <AdminButton onClick={handleAddBox}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Box
                </AdminButton>
              }
            />
          ) : (
            <div className="space-y-3">
              {boxes.map((box) => (
                <AdminCard key={box.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {box.imageUrl && (
                        <img
                          src={box.imageUrl}
                          alt={box.title}
                          className="w-12 h-12 object-cover rounded"
                        />
                      )}
                      <div>
                        <h4 className="font-medium">{box.title}</h4>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Badge variant="outline" className="text-xs">
                            {box.size}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {box.type}
                          </Badge>
                          {box.hidden && (
                            <Badge variant="secondary" className="text-xs">
                              <EyeOff className="w-3 h-3 mr-1" />
                              Hidden
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingBoxId(box.id)}
                      >
                        <Settings className="w-4 h-4 mr-1" />
                        Edit
                      </Button>
                    </div>
                  </div>
                </AdminCard>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Advanced Box Editor */}
      {editingBoxId && (
        <BoxEditor
          boxId={editingBoxId}
          isOpen={!!editingBoxId}
          onClose={() => setEditingBoxId(null)}
        />
      )}

      {/* Status Footer */}
      <div className="text-sm text-gray-600 space-y-1">
        <p>
          <strong>Status:</strong> Dynamic grid system active with {boxes.length} total boxes
        </p>
        <p>
          <strong>Storage:</strong> Changes automatically persist to localStorage
        </p>
        <p>
          <strong>Responsive:</strong> Layout adapts across {Object.keys(BREAKPOINTS).length} breakpoints
        </p>
      </div>
    </div>
  );
}
