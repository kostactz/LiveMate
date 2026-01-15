/**
 * InsertMenuPopover Component
 * 
 * An enhanced insert menu that appears near the cursor when the plus icon
 * is clicked in the editor gutter. Provides options to insert:
 * - Table (with simple configuration)
 * - Image (with URL and alt text)
 * - Link (with text and URL)
 * - Mermaid diagrams (existing functionality)
 * 
 * The menu is positioned intelligently to stay within viewport bounds.
 */

'use client';

import React, { useState, useEffect, useRef } from 'react';
import { usePopupPosition } from '@/hooks/use-popup-position';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  Image as ImageIcon,
  Link as LinkIcon,
  Network,
  type LucideIcon,
} from 'lucide-react';
import InsertImageDialog from '@/components/InsertImageDialog';
import InsertLinkDialog from '@/components/InsertLinkDialog';
import {
  insertTable,
  insertImage,
  insertLink,
} from '@/lib/insert-actions';

/**
 * Props for InsertMenuPopover
 */
interface InsertMenuPopoverProps {
  /** Whether the menu is open */
  open: boolean;

  /** Callback when menu should close */
  onOpenChange: (open: boolean) => void;

  /** Callback to insert content into the editor */
  onInsert: (text: string) => void;

  /** Current line content (used to determine if we need a newline) */
  currentLineContent?: string;

  /** Callback to insert Mermaid diagram */
  onInsertMermaid?: () => void;

  /** Callback to open Archimate generator */
  onInsertArchimate?: () => void;

  /** Position to display the menu at (in screen coordinates) */
  position?: { x: number; y: number };
}

/**
 * Configuration for a menu item
 */
interface MenuItemConfig {
  icon: LucideIcon;
  label: string;
  description?: string;
  action: 'table' | 'image' | 'link' | 'mermaid' | 'archimate';
  group?: 'insert' | 'diagram';
}

/**
 * Menu items configuration
 */
const MENU_ITEMS: MenuItemConfig[] = [
  {
    icon: Table,
    label: 'Table',
    description: 'Insert a markdown table',
    action: 'table',
    group: 'insert',
  },
  {
    icon: ImageIcon,
    label: 'Image',
    description: 'Insert an image',
    action: 'image',
    group: 'insert',
  },
  {
    icon: LinkIcon,
    label: 'Link',
    description: 'Insert a link',
    action: 'link',
    group: 'insert',
  },
  {
    icon: Network,
    label: 'Mermaid Diagram',
    description: 'Insert a Mermaid diagram',
    action: 'mermaid',
    group: 'diagram',
  },
  {
    icon: Network,
    label: 'From Archimate...',
    description: 'Generate from Archimate XML',
    action: 'archimate',
    group: 'diagram',
  },
];

/**
 * MenuItem Component
 * 
 * Individual menu item renderer with icon and label
 */
interface MenuItemProps {
  icon: LucideIcon;
  label: string;
  description?: string;
  onClick: () => void;
}

const MenuItem: React.FC<MenuItemProps> = ({
  icon: Icon,
  label,
  description,
  onClick,
}) => (
  <button
    onClick={onClick}
    className="w-full text-left px-2 py-2 hover:bg-muted rounded-sm transition-colors cursor-pointer"
  >
    <div className="flex items-start gap-2">
      <Icon className="h-4 w-4 mt-0.5 flex-shrink-0" />
      <div className="flex flex-col">
        <span className="text-sm font-medium">{label}</span>
        {description && (
          <span className="text-xs text-muted-foreground">{description}</span>
        )}
      </div>
    </div>
  </button>
);

/**
 * InsertMenuPopover Component
 * 
 * Renders a dropdown menu with insert options. Handles image and link
 * dialogs internally, and provides callbacks for other actions.
 */
export const InsertMenuPopover = React.forwardRef<
  HTMLDivElement,
  InsertMenuPopoverProps
>(
  (
    {
      open,
      onOpenChange,
      onInsert,
      currentLineContent = '',
      onInsertMermaid,
      onInsertArchimate,
      position = { x: 0, y: 0 },
    },
    ref
  ) => {
    const [imageDialogOpen, setImageDialogOpen] = useState(false);
    const [linkDialogOpen, setLinkDialogOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const outsideClickHandlerRef = useRef<((e: MouseEvent) => void) | null>(null);
    // Use reasonable default dimensions - will be updated after render
    const [menuDimensions, setMenuDimensions] = useState({ width: 200, height: 340 });

    // Debug: log received position and menu state
    useEffect(() => {
      if (open) {
        // Debug logging removed for production
      }
    }, [open, position, menuDimensions]);

    // Calculate optimal menu position using the popup position hook
    // Pass raw coordinates - usePopupPosition handles intelligent viewport-aware positioning
    const menuPosition = usePopupPosition({
      targetX: position.x,
      targetY: position.y,
      popupWidth: menuDimensions.width,
      popupHeight: menuDimensions.height,
      offset: { x: 8, y: 0 },
      priority: 'bottom-right',
    });

    // Measure menu dimensions after render for accurate positioning on next render
    useEffect(() => {
      if (menuRef.current && open) {
        // Use requestAnimationFrame to ensure DOM has been painted
        const measureDimensions = () => {
          if (menuRef.current) {
            const actualWidth = menuRef.current.offsetWidth || 200;
            const actualHeight = menuRef.current.offsetHeight || 340;
            setMenuDimensions({
              width: actualWidth,
              height: actualHeight,
            });
          }
        };
        
        // Use requestAnimationFrame for reliable measurement after paint
        requestAnimationFrame(measureDimensions);
      }
    }, [open]);

    // Close menu on escape
    useEffect(() => {
      if (!open) return;

      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          onOpenChange(false);
        }
      };

      document.addEventListener('keydown', handleEscape);
      return () => {
        document.removeEventListener('keydown', handleEscape);
      };
    }, [open, onOpenChange]);

    // Close menu on outside click
    useEffect(() => {
      if (!open) {
        // Clean up any existing handler when menu closes
        if (outsideClickHandlerRef.current) {
          document.removeEventListener('mousedown', outsideClickHandlerRef.current);
          outsideClickHandlerRef.current = null;
        }
        return;
      }

      // Delay the listener slightly to avoid closing on the same click that opened the menu
      const timerId = setTimeout(() => {
        const handleClickOutside = (e: MouseEvent) => {
          if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
            onOpenChange(false);
          }
        };

        // Store handler reference for cleanup
        outsideClickHandlerRef.current = handleClickOutside;
        document.addEventListener('mousedown', handleClickOutside);
      }, 50);

      // Cleanup function
      return () => {
        clearTimeout(timerId);
        if (outsideClickHandlerRef.current) {
          document.removeEventListener('mousedown', outsideClickHandlerRef.current);
          outsideClickHandlerRef.current = null;
        }
      };
    }, [open, onOpenChange]);

    const handleInsertTable = () => {
      const tableContent = insertTable(currentLineContent, {
        columns: 3,
        rows: 3,
        hasHeader: true,
      });
      onInsert(tableContent);
      onOpenChange(false);
    };

    const handleInsertImage = (altText: string, url: string) => {
      const imageContent = insertImage(currentLineContent, altText, url);
      onInsert(imageContent);
      setImageDialogOpen(false);
      onOpenChange(false);
    };

    const handleInsertLink = (text: string, url: string) => {
      const linkContent = insertLink(currentLineContent, text, url);
      onInsert(linkContent);
      setLinkDialogOpen(false);
      onOpenChange(false);
    };

    const handleMenuItemClick = (action: MenuItemConfig['action']) => {
      switch (action) {
        case 'table':
          handleInsertTable();
          break;
        case 'image':
          setImageDialogOpen(true);
          break;
        case 'link':
          setLinkDialogOpen(true);
          break;
        case 'mermaid':
          onInsertMermaid?.();
          onOpenChange(false);
          break;
        case 'archimate':
          onInsertArchimate?.();
          onOpenChange(false);
          break;
      }
    };

    const insertItems = MENU_ITEMS.filter((item) => item.group === 'insert');
    const diagramItems = MENU_ITEMS.filter((item) => item.group === 'diagram');

    if (!open) {
      return (
        <>
          <InsertImageDialog
            open={imageDialogOpen}
            onOpenChange={setImageDialogOpen}
            onInsert={handleInsertImage}
          />
          <InsertLinkDialog
            open={linkDialogOpen}
            onOpenChange={setLinkDialogOpen}
            onInsert={handleInsertLink}
          />
        </>
      );
    }

    return (
      <>
        {/* Fixed position menu with dark theme styling */}
        <div
          ref={menuRef}
          className="fixed z-50 bg-popover border border-border rounded-lg shadow-lg"
          style={{
            left: `${menuPosition.x}px`,
            top: `${menuPosition.y}px`,
            minWidth: '200px',
            maxWidth: '300px',
          }}
        >
          <div className="py-1.5">
            {/* Insert section */}
            <div className="px-2 py-1.5">
              <p className="text-xs font-semibold text-muted-foreground px-2">
                Insert Content
              </p>
            </div>
            {insertItems.map((item) => {
              const Icon = item.icon;
              return (
                <MenuItem
                  key={item.action}
                  onClick={() => handleMenuItemClick(item.action)}
                  icon={Icon}
                  label={item.label}
                  description={item.description}
                />
              );
            })}

            <div className="border-t border-border my-1.5" />

            {/* Diagram section */}
            <div className="px-2 py-1.5">
              <p className="text-xs font-semibold text-muted-foreground px-2">
                Diagrams
              </p>
            </div>
            {diagramItems.map((item) => {
              const Icon = item.icon;
              return (
                <MenuItem
                  key={item.action}
                  onClick={() => handleMenuItemClick(item.action)}
                  icon={Icon}
                  label={item.label}
                  description={item.description}
                />
              );
            })}
          </div>
        </div>

        {/* Image Insert Dialog */}
        <InsertImageDialog
          open={imageDialogOpen}
          onOpenChange={setImageDialogOpen}
          onInsert={handleInsertImage}
        />

        {/* Link Insert Dialog */}
        <InsertLinkDialog
          open={linkDialogOpen}
          onOpenChange={setLinkDialogOpen}
          onInsert={handleInsertLink}
        />
      </>
    );
  }
);

InsertMenuPopover.displayName = 'InsertMenuPopover';

export default InsertMenuPopover;
