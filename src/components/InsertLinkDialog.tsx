/**
 * InsertLinkDialog Component
 * 
 * A dialog for inserting a link into the markdown editor.
 * Allows users to specify:
 * - Link text (displayed to users)
 * - Link URL (the destination)
 * 
 * Features:
 * - Simple form with validation
 * - URL validation and suggestions
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
import { LinkIcon } from 'lucide-react';

/**
 * Props for InsertLinkDialog
 */
interface InsertLinkDialogProps {
  /** Whether the dialog is open */
  open: boolean;

  /** Callback when dialog should close */
  onOpenChange: (open: boolean) => void;

  /** Callback when user submits form */
  onInsert: (text: string, url: string) => void;

  /** Pre-filled link text (optional) */
  selectedText?: string;
}

/**
 * Validate and sanitize URL
 * Ensures URL is properly formatted
 */
function validateUrl(url: string): boolean {
  if (!url.trim()) return false;
  
  // Allow relative URLs and absolute URLs
  if (url.startsWith('/') || url.startsWith('#')) return true;
  
  // Check if it looks like a URL
  try {
    new URL(url);
    return true;
  } catch {
    // If it doesn't start with http, add it
    return url.includes('.') || url.includes(':');
  }
}

/**
 * Normalize URL by adding http:// if missing
 */
function normalizeUrl(url: string): string {
  const trimmed = url.trim();
  
  // Don't modify relative URLs or fragments
  if (trimmed.startsWith('/') || trimmed.startsWith('#') || trimmed.startsWith('http')) {
    return trimmed;
  }
  
  // Add http:// for absolute URLs
  if (trimmed.includes('.') && !trimmed.includes('://')) {
    return `https://${trimmed}`;
  }
  
  return trimmed;
}

/**
 * InsertLinkDialog Component
 */
export function InsertLinkDialog({
  open,
  onOpenChange,
  onInsert,
  selectedText = '',
}: InsertLinkDialogProps) {
  const [linkText, setLinkText] = useState(selectedText);
  const [url, setUrl] = useState('');
  const textInputRef = useRef<HTMLInputElement>(null);

  // Focus text input when dialog opens
  useEffect(() => {
    if (open) {
      setTimeout(() => {
        if (!selectedText) {
          textInputRef.current?.focus();
        }
      }, 0);
    }
  }, [open, selectedText]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateUrl(url)) {
      const normalizedUrl = normalizeUrl(url);
      onInsert(linkText || 'Link', normalizedUrl);
      // Reset form
      setLinkText(selectedText);
      setUrl('');
      onOpenChange(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && validateUrl(url)) {
      handleSubmit(e as any);
    }
  };

  const isValidUrl = validateUrl(url);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <LinkIcon className="h-5 w-5" />
            <DialogTitle>Insert Link</DialogTitle>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="link-text">Link Text</Label>
            <Input
              ref={textInputRef}
              id="link-text"
              placeholder="Click here"
              value={linkText}
              onChange={(e) => setLinkText(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <p className="text-xs text-muted-foreground">
              The text displayed to users
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="link-url">URL</Label>
            <Input
              id="link-url"
              placeholder="https://example.com"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={handleKeyDown}
              className={!url ? '' : isValidUrl ? 'border-green-500' : 'border-red-500'}
            />
            <p className="text-xs text-muted-foreground">
              {isValidUrl 
                ? '✓ Valid URL' 
                : url 
                  ? '✗ Enter a valid URL' 
                  : 'https://example.com, /page, or #anchor'}
            </p>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!isValidUrl}
            >
              Insert Link
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default InsertLinkDialog;
