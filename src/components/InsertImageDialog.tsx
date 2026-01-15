/**
 * InsertImageDialog Component
 * 
 * A dialog for inserting an image into the markdown editor.
 * Allows users to specify:
 * - Alt text (for accessibility)
 * - Image URL (can be absolute or relative)
 * 
 * Features:
 * - Simple form with validation
 * - Preview toggle
 * - Keyboard support (Enter to submit, Escape to cancel)
 */

'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ImageIcon } from 'lucide-react';

/**
 * Props for InsertImageDialog
 */
interface InsertImageDialogProps {
  /** Whether the dialog is open */
  open: boolean;

  /** Callback when dialog should close */
  onOpenChange: (open: boolean) => void;

  /** Callback when user submits form */
  onInsert: (altText: string, url: string) => void;
}

/**
 * InsertImageDialog Component
 */
export function InsertImageDialog({
  open,
  onOpenChange,
  onInsert,
}: InsertImageDialogProps) {
  const [altText, setAltText] = useState('');
  const [url, setUrl] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const altInputRef = useRef<HTMLInputElement>(null);

  // Focus alt text input when dialog opens
  useEffect(() => {
    if (open) {
      setTimeout(() => {
        altInputRef.current?.focus();
      }, 0);
    }
  }, [open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url.trim()) {
      onInsert(altText || 'Image', url);
      // Reset form
      setAltText('');
      setUrl('');
      setShowPreview(false);
      onOpenChange(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && url.trim()) {
      handleSubmit(e as any);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            <DialogTitle>Insert Image</DialogTitle>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="alt-text">Alternative Text (for accessibility)</Label>
            <Input
              ref={altInputRef}
              id="alt-text"
              placeholder="Describe the image"
              value={altText}
              onChange={(e) => setAltText(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <p className="text-xs text-muted-foreground">
              Used for screen readers and displayed if image fails to load
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="image-url">Image URL</Label>
            <Input
              id="image-url"
              placeholder="https://example.com/image.jpg"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={handleKeyDown}
              type="url"
            />
            <p className="text-xs text-muted-foreground">
              Absolute URL (https://...) or relative path (/images/photo.jpg)
            </p>
          </div>

          {/* Preview */}
          {url && (
            <div className="space-y-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowPreview(!showPreview)}
              >
                {showPreview ? 'Hide' : 'Show'} Preview
              </Button>
              {showPreview && (
                <div className="border border-border rounded p-2 bg-muted/50 max-h-48 overflow-auto">
                  <img
                    src={url}
                    alt={altText || 'Preview'}
                    className="max-w-full h-auto"
                    onError={(e) => {
                      const img = e.target as HTMLImageElement;
                      img.style.display = 'none';
                      img.insertAdjacentHTML(
                        'afterend',
                        '<p class="text-sm text-destructive">Failed to load image</p>'
                      );
                    }}
                  />
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!url.trim()}
            >
              Insert Image
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default InsertImageDialog;
