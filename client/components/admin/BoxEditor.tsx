import React, { useState, useCallback } from 'react';
import { ChromePicker } from 'react-color';
import { Rnd } from 'react-rnd';
import EmojiPicker from 'emoji-picker-react';
import { X, Upload, Palette, Smile, Copy, Trash2, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { useBoxesStore, BoxData } from '@/state/boxes-store';
import { cn } from '@/lib/utils';

interface BoxEditorProps {
  boxId: string;
  isOpen: boolean;
  onClose: () => void;
}

interface ColorPickerProps {
  color: string;
  onChange: (color: string) => void;
  label: string;
}

function ColorPickerComponent({ color, onChange, label }: ColorPickerProps) {
  const [showPicker, setShowPicker] = useState(false);

  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">{label}</Label>
      <Popover open={showPicker} onOpenChange={setShowPicker}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="w-full justify-start gap-2 color-picker-trigger"
            onClick={() => setShowPicker(true)}
          >
            <div
              className="w-4 h-4 rounded border"
              style={{ backgroundColor: color }}
            />
            {color}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 color-picker">
          <ChromePicker
            color={color}
            onChange={(result) => onChange(result.hex)}
            disableAlpha={false}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}

interface ImageUploaderProps {
  imageUrl?: string;
  onImageChange: (url: string) => void;
  label: string;
}

function ImageUploader({ imageUrl, onImageChange, label }: ImageUploaderProps) {
  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const url = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      onImageChange(url);
    } catch (error) {
      console.error('Error uploading image:', error);
    }
  }, [onImageChange]);

  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">{label}</Label>
      <div className="flex items-center gap-3">
        {imageUrl && (
          <img
            src={imageUrl}
            alt="Preview"
            className="w-16 h-16 object-cover rounded border"
          />
        )}
        <div className="flex-1">
          <label className="cursor-pointer">
            <div className="flex items-center gap-2 px-3 py-2 border border-dashed rounded-md hover:bg-gray-50 transition-colors">
              <Upload className="w-4 h-4" />
              <span className="text-sm">
                {imageUrl ? 'Change Image' : 'Upload Image'}
              </span>
            </div>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileUpload}
            />
          </label>
        </div>
        {imageUrl && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onImageChange('')}
          >
            Remove
          </Button>
        )}
      </div>
    </div>
  );
}

interface EmojiPickerComponentProps {
  onEmojiSelect: (emoji: string) => void;
}

function EmojiPickerComponent({ onEmojiSelect }: EmojiPickerComponentProps) {
  const [showPicker, setShowPicker] = useState(false);

  return (
    <Popover open={showPicker} onOpenChange={setShowPicker}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="emoji-picker-trigger">
          <Smile className="w-4 h-4 mr-2" />
          Add Emoji
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 emoji-picker">
        <EmojiPicker
          onEmojiClick={(emojiData) => {
            onEmojiSelect(emojiData.emoji);
            setShowPicker(false);
          }}
          height={400}
          width={350}
        />
      </PopoverContent>
    </Popover>
  );
}

export default function BoxEditor({ boxId, isOpen, onClose }: BoxEditorProps) {
  const { getBoxById, updateBox, removeBox, duplicateBox, toggleBoxVisibility } = useBoxesStore();
  const box = getBoxById(boxId);
  
  const [localChanges, setLocalChanges] = useState<Partial<BoxData>>({});
  const [activeTab, setActiveTab] = useState('content');

  const currentBox = { ...box, ...localChanges } as BoxData;

  const handleChange = useCallback((field: string, value: any) => {
    setLocalChanges(prev => ({
      ...prev,
      [field]: value,
    }));
  }, []);

  const handleNestedChange = useCallback((parent: string, field: string, value: any) => {
    setLocalChanges(prev => ({
      ...prev,
      [parent]: {
        ...(prev[parent as keyof BoxData] as any || currentBox[parent as keyof BoxData] || {}),
        [field]: value,
      },
    }));
  }, [currentBox]);

  const handleSave = useCallback(() => {
    if (Object.keys(localChanges).length > 0) {
      updateBox(boxId, localChanges);
      setLocalChanges({});
    }
    onClose();
  }, [boxId, localChanges, updateBox, onClose]);

  const handleEmojiInsert = useCallback((emoji: string) => {
    const currentTitle = currentBox.title || '';
    handleChange('title', currentTitle + emoji);
  }, [currentBox.title, handleChange]);

  if (!isOpen) return null;

  if (!box) {
    console.error('BoxEditor: Box not found for ID:', boxId);
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Error</DialogTitle>
          </DialogHeader>
          <p>Box not found. Please try again.</p>
          <Button onClick={onClose}>Close</Button>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Edit Box: {currentBox.title}</span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => toggleBoxVisibility(boxId)}
              >
                {currentBox.hidden ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                {currentBox.hidden ? 'Show' : 'Hide'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => duplicateBox(boxId)}
              >
                <Copy className="w-4 h-4 mr-1" />
                Duplicate
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => {
                  removeBox(boxId);
                  onClose();
                }}
              >
                <Trash2 className="w-4 h-4 mr-1" />
                Delete
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-5 w-full">
            <TabsTrigger value="content">Content</TabsTrigger>
            <TabsTrigger value="style">Style</TabsTrigger>
            <TabsTrigger value="layout">Layout</TabsTrigger>
            <TabsTrigger value="modal">Modal</TabsTrigger>
            <TabsTrigger value="advanced">Advanced</TabsTrigger>
          </TabsList>

          <TabsContent value="content" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="title">Title</Label>
                    <EmojiPickerComponent onEmojiSelect={handleEmojiInsert} />
                  </div>
                  <Input
                    id="title"
                    value={currentBox.title || ''}
                    onChange={(e) => handleChange('title', e.target.value)}
                    placeholder="Enter box title"
                  />
                </div>

                <ImageUploader
                  imageUrl={currentBox.imageUrl}
                  onImageChange={(url) => handleChange('imageUrl', url)}
                  label="Main Image"
                />

                <div className="space-y-2">
                  <Label>Box Type</Label>
                  <Select
                    value={currentBox.type}
                    onValueChange={(value) => handleChange('type', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="image">Image</SelectItem>
                      <SelectItem value="text">Text</SelectItem>
                      <SelectItem value="mixed">Mixed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Box Size</Label>
                  <Select
                    value={currentBox.size}
                    onValueChange={(value) => handleChange('size', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="small">Small (1x2)</SelectItem>
                      <SelectItem value="medium">Medium (2x2)</SelectItem>
                      <SelectItem value="large">Large (4x2)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Description (Rich Text)</Label>
                  <RichTextEditor
                    value={currentBox.description || ''}
                    onChange={(html) => handleChange('description', html)}
                    className="min-h-[200px]"
                  />
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="style" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="space-y-4">
                  <Label className="text-base font-semibold">Colors</Label>
                  
                  <div className="space-y-2">
                    <Label>Background Type</Label>
                    <Select
                      value={currentBox.background?.kind || 'color'}
                      onValueChange={(value) => {
                        if (value === 'color') {
                          handleChange('background', { kind: 'color', color: '#f3f4f6' });
                        } else if (value === 'gradient') {
                          handleChange('background', {
                            kind: 'gradient',
                            from: '#ffffff',
                            to: '#f3f4f6',
                            direction: 'to bottom',
                          });
                        } else {
                          handleChange('background', {
                            kind: 'image',
                            url: '',
                            scale: 100,
                            opacity: 1,
                          });
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="color">Solid Color</SelectItem>
                        <SelectItem value="gradient">Gradient</SelectItem>
                        <SelectItem value="image">Background Image</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {currentBox.background?.kind === 'color' && (
                    <ColorPickerComponent
                      color={currentBox.background.color || '#f3f4f6'}
                      onChange={(color) => handleNestedChange('background', 'color', color)}
                      label="Background Color"
                    />
                  )}

                  {currentBox.background?.kind === 'gradient' && (
                    <div className="space-y-3">
                      <ColorPickerComponent
                        color={currentBox.background.from || '#ffffff'}
                        onChange={(color) => handleNestedChange('background', 'from', color)}
                        label="Gradient Start"
                      />
                      <ColorPickerComponent
                        color={currentBox.background.to || '#f3f4f6'}
                        onChange={(color) => handleNestedChange('background', 'to', color)}
                        label="Gradient End"
                      />
                      <div className="space-y-2">
                        <Label>Direction</Label>
                        <Select
                          value={currentBox.background.direction || 'to bottom'}
                          onValueChange={(value) => handleNestedChange('background', 'direction', value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="to top">To Top</SelectItem>
                            <SelectItem value="to bottom">To Bottom</SelectItem>
                            <SelectItem value="to left">To Left</SelectItem>
                            <SelectItem value="to right">To Right</SelectItem>
                            <SelectItem value="to top right">To Top Right</SelectItem>
                            <SelectItem value="to top left">To Top Left</SelectItem>
                            <SelectItem value="to bottom right">To Bottom Right</SelectItem>
                            <SelectItem value="to bottom left">To Bottom Left</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}

                  {currentBox.background?.kind === 'image' && (
                    <div className="space-y-3">
                      <ImageUploader
                        imageUrl={currentBox.background.url}
                        onImageChange={(url) => handleNestedChange('background', 'url', url)}
                        label="Background Image"
                      />
                      <div className="space-y-2">
                        <Label>Scale ({currentBox.background.scale || 100}%)</Label>
                        <Slider
                          value={[currentBox.background.scale || 100]}
                          onValueChange={([value]) => handleNestedChange('background', 'scale', value)}
                          min={50}
                          max={200}
                          step={5}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Opacity ({((currentBox.background.opacity || 1) * 100).toFixed(0)}%)</Label>
                        <Slider
                          value={[(currentBox.background.opacity || 1) * 100]}
                          onValueChange={([value]) => handleNestedChange('background', 'opacity', value / 100)}
                          min={0}
                          max={100}
                          step={5}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <Label className="text-base font-semibold">Border & Shadow</Label>
                
                <div className="space-y-2">
                  <Label>Border Radius ({currentBox.borderRadius || 12}px)</Label>
                  <Slider
                    value={[currentBox.borderRadius || 12]}
                    onValueChange={([value]) => handleChange('borderRadius', value)}
                    min={0}
                    max={30}
                    step={1}
                  />
                </div>

                <div className="space-y-3">
                  <Label>Shadow</Label>
                  <div className="space-y-2">
                    <Label>Direction</Label>
                    <Select
                      value={currentBox.shadow?.direction || 'bottom-right'}
                      onValueChange={(value) => handleNestedChange('shadow', 'direction', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="top-left">Top Left</SelectItem>
                        <SelectItem value="top-right">Top Right</SelectItem>
                        <SelectItem value="bottom-left">Bottom Left</SelectItem>
                        <SelectItem value="bottom-right">Bottom Right</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Intensity ({currentBox.shadow?.intensity || 12})</Label>
                    <Slider
                      value={[currentBox.shadow?.intensity || 12]}
                      onValueChange={([value]) => handleNestedChange('shadow', 'intensity', value)}
                      min={0}
                      max={30}
                      step={1}
                    />
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="layout" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Image Height ({currentBox.height || 200}px)</Label>
                  <Slider
                    value={[currentBox.height || 200]}
                    onValueChange={([value]) => handleChange('height', value)}
                    min={120}
                    max={600}
                    step={10}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Call-to-Action Mode</Label>
                  <Select
                    value={currentBox.ctaMode || 'button'}
                    onValueChange={(value) => handleChange('ctaMode', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="button">Button Only</SelectItem>
                      <SelectItem value="icon">Icon Only</SelectItem>
                      <SelectItem value="both">Button + Icon</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="buttonLabel">Button Label</Label>
                  <Input
                    id="buttonLabel"
                    value={currentBox.buttonLabel || 'Read More'}
                    onChange={(e) => handleChange('buttonLabel', e.target.value)}
                    placeholder="Button text"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="modalEnabled"
                    checked={currentBox.modalEnabled !== false}
                    onCheckedChange={(checked) => handleChange('modalEnabled', checked)}
                  />
                  <Label htmlFor="modalEnabled">Enable Modal Dialog</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="hidden"
                    checked={currentBox.hidden || false}
                    onCheckedChange={(checked) => handleChange('hidden', checked)}
                  />
                  <Label htmlFor="hidden">Hide Box</Label>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="modal" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                <Label className="text-base font-semibold">Modal Styling</Label>
                
                <ColorPickerComponent
                  color={currentBox.modalStyle?.bg || '#111111'}
                  onChange={(color) => handleNestedChange('modalStyle', 'bg', color)}
                  label="Modal Background"
                />

                <ColorPickerComponent
                  color={currentBox.modalStyle?.text || '#ffffff'}
                  onChange={(color) => handleNestedChange('modalStyle', 'text', color)}
                  label="Modal Text Color"
                />

                <div className="space-y-2">
                  <Label>Modal Border Radius ({currentBox.modalStyle?.radius || 16}px)</Label>
                  <Slider
                    value={[currentBox.modalStyle?.radius || 16]}
                    onValueChange={([value]) => handleNestedChange('modalStyle', 'radius', value)}
                    min={0}
                    max={30}
                    step={1}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="modalShadow">Modal Shadow (CSS)</Label>
                  <Textarea
                    id="modalShadow"
                    value={currentBox.modalStyle?.shadow || '0 10px 30px rgba(0,0,0,0.3)'}
                    onChange={(e) => handleNestedChange('modalStyle', 'shadow', e.target.value)}
                    placeholder="CSS box-shadow value"
                    rows={3}
                  />
                  <p className="text-xs text-gray-500">
                    Example: 0 10px 30px rgba(0,0,0,0.3)
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="advanced" className="space-y-6">
            <div className="space-y-4">
              <Label className="text-base font-semibold">Advanced Settings</Label>
              
              <div className="space-y-2">
                <Label htmlFor="boxId">Box ID</Label>
                <Input
                  id="boxId"
                  value={currentBox.id}
                  disabled
                  className="bg-gray-50"
                />
              </div>

              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                <h4 className="font-medium text-yellow-800 mb-2">Development Info</h4>
                <p className="text-sm text-yellow-700">
                  This box is managed by the dynamic grid system. Layout changes are automatically
                  persisted to localStorage and will be preserved across page reloads.
                </p>
              </div>

              <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
                <h4 className="font-medium text-blue-800 mb-2">Database Integration Ready</h4>
                <p className="text-sm text-blue-700">
                  The current implementation uses localStorage for persistence, but the architecture
                  is designed to easily integrate with a production database when needed.
                </p>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex items-center justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
