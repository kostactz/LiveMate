/**
 * TextFormattingIsland Component
 * 
 * A floating popup that appears near the user's text selection in the editor.
 * Provides quick access to common text formatting options (bold, italic, etc.)
 * with visual indicators showing which formats are already applied.
 * 
 * Features:
 * - Positioned near cursor/selection
 * - Shows formatting state with visual indicators
 * - Keyboard navigation support
 * - Auto-hides when selection is lost
 * - Smooth animations
 */

'use client';

import React, { useRef, useEffect, useState } from 'react';
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
  List,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePopupPosition } from '@/hooks/use-popup-position';
import type { FormatType, FormatState } from '@/lib/formatting-actions';

/**
 * Configuration for a single formatting button
 */
interface FormattingButton {
  type: FormatType;
  icon: LucideIcon;
  label: string;
  tooltip: string;
  group?: 'inline' | 'block'; // For visual grouping
}

/**
 * Props for TextFormattingIsland
 */
interface TextFormattingIslandProps {
  /** Whether the island is visible */
  isOpen: boolean;

  /** Screen position where the island should appear */
  position: {
    x: number;
    y: number;
  };

  /** Current formatting state of the selection */
  formatState: FormatState;

  /** Callback when a format button is clicked */
  onFormat: (formatType: FormatType) => void;

  /** Callback when the island should close */
  onClose: () => void;

  /** Whether there is an active selection */
  hasSelection: boolean;

  /** Whether this is a single-line selection (enables headers/bullets) */
  isSingleLineSelection?: boolean;
}

/**
 * Define all available formatting buttons
 * Order and grouping determines visual layout
 */
const FORMATTING_BUTTONS: FormattingButton[] = [
  {
    type: 'bold',
    icon: Bold,
    label: 'Bold',
    tooltip: 'Bold (⌘B)',
    group: 'inline',
  },
  {
    type: 'italic',
    icon: Italic,
    label: 'Italic',
    tooltip: 'Italic (⌘I)',
    group: 'inline',
  },
  {
    type: 'underline',
    icon: Underline,
    label: 'Underline',
    tooltip: 'Underline (⌘U)',
    group: 'inline',
  },
  {
    type: 'strikethrough',
    icon: Strikethrough,
    label: 'Strikethrough',
    tooltip: 'Strikethrough',
    group: 'inline',
  },
  {
    type: 'h1',
    icon: Heading1,
    label: 'Heading 1',
    tooltip: 'Heading 1 (single-line only)',
    group: 'block',
  },
  {
    type: 'h2',
    icon: Heading2,
    label: 'Heading 2',
    tooltip: 'Heading 2 (single-line only)',
    group: 'block',
  },
  {
    type: 'h3',
    icon: Heading3,
    label: 'Heading 3',
    tooltip: 'Heading 3 (single-line only)',
    group: 'block',
  },
  {
    type: 'bullet',
    icon: List,
    label: 'Bullet List',
    tooltip: 'Bullet List',
    group: 'block',
  },
];

/**
 * TextFormattingIsland Component
 * 
 * Renders a floating toolbar with formatting options near the text selection.
 * 
 * @example
 * <TextFormattingIsland
 *   isOpen={hasSelection}
 *   position={{ x: 100, y: 50 }}
 *   formatState={formatState}
 *   onFormat={(type) => toggleFormat(type)}
 *   onClose={() => clearSelection()}
 * />
 */
export const TextFormattingIsland = React.forwardRef<
  HTMLDivElement,
  TextFormattingIslandProps
>(
  (
    { isOpen, position, formatState, onFormat, onClose, hasSelection, isSingleLineSelection = true },
    ref
  ) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [activeKeyboardIndex, setActiveKeyboardIndex] = useState(-1); // -1 = no pre-selection

    // Calculate optimal popup position to keep it in viewport
    // Assume popup is roughly 360px wide and 50px tall
    const popupPos = usePopupPosition({
      targetX: position.x,
      targetY: position.y,
      popupWidth: 360,
      popupHeight: 50,
      offset: { x: 0, y: 24 }, // 24px below selection (almost to next line)
      priority: 'bottom-right',
    });

    // Handle keyboard navigation
    useEffect(() => {
      if (!isOpen) return;

      const handleKeyDown = (e: KeyboardEvent) => {
        switch (e.key) {
          case 'Escape':
            onClose();
            break;
          case 'ArrowRight':
            e.preventDefault();
            setActiveKeyboardIndex((i) => (i + 1) % FORMATTING_BUTTONS.length);
            break;
          case 'ArrowLeft':
            e.preventDefault();
            setActiveKeyboardIndex(
              (i) => (i - 1 + FORMATTING_BUTTONS.length) % FORMATTING_BUTTONS.length
            );
            break;
          case 'Enter':
          case ' ':
            e.preventDefault();
            const button = FORMATTING_BUTTONS[activeKeyboardIndex];
            if (button) {
              onFormat(button.type);
            }
            break;
          default:
            break;
        }
      };

      document.addEventListener('keydown', handleKeyDown);
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
      };
    }, [isOpen, activeKeyboardIndex, onFormat, onClose]);

    // Handle clicks outside to close
    useEffect(() => {
      if (!isOpen) return;

      const handleClickOutside = (e: MouseEvent) => {
        if (
          containerRef.current &&
          !containerRef.current.contains(e.target as Node)
        ) {
          onClose();
        }
      };

      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }, [isOpen, onClose]);

    if (!isOpen) {
      return null;
    }

    // Group buttons by category
    const inlineButtons = FORMATTING_BUTTONS.filter((b) => b.group === 'inline');
    const blockButtons = FORMATTING_BUTTONS.filter((b) => b.group === 'block');

    return (
      <div
        ref={containerRef}
        className={cn(
          'fixed z-50 flex gap-1 p-2 bg-popover border border-border rounded-lg shadow-lg',
          'animate-in fade-in zoom-in-95 duration-200',
          'pointer-events-auto'
        )}
        style={{
          left: `${popupPos.x}px`,
          top: `${popupPos.y}px`,
        }}
      >
        {/* Inline formatting buttons (bold, italic, underline, strikethrough) */}
        <div className="flex gap-1">
          {inlineButtons.map((button, index) => {
            const Icon = button.icon;
            const isActive = formatState[button.type as keyof FormatState] as boolean;
            const isKeyboardFocused = FORMATTING_BUTTONS.indexOf(button) === activeKeyboardIndex;
            // Inline buttons are disabled when there's no selection
            const isDisabled = !hasSelection;

            return (
              <FormattingButton
                key={button.type}
                isActive={isActive}
                isKeyboardFocused={isKeyboardFocused}
                icon={Icon}
                label={button.label}
                tooltip={button.tooltip}
                onClick={() => onFormat(button.type)}
                isDisabled={isDisabled}
              />
            );
          })}
        </div>

        {/* Separator - show if block buttons are visible */}
        {isSingleLineSelection && <div className="w-px bg-border mx-1" />}

        {/* Block formatting buttons (h1, h2, h3, bullet) */}
        <div className="flex gap-1">
          {blockButtons.map((button) => {
            const Icon = button.icon;
            const isActive = formatState[button.type as keyof FormatState] as boolean;
            const isKeyboardFocused = FORMATTING_BUTTONS.indexOf(button) === activeKeyboardIndex;
            // Headers are disabled for multi-line selections or no selection
            // Bullets are always available when popup is visible
            const isHeaderButton = button.type === 'h1' || button.type === 'h2' || button.type === 'h3';
            const isDisabled = isHeaderButton && !isSingleLineSelection;

            return (
              <FormattingButton
                key={button.type}
                isActive={isActive}
                isKeyboardFocused={isKeyboardFocused}
                icon={Icon}
                label={button.label}
                tooltip={button.tooltip}
                onClick={() => onFormat(button.type)}
                isDisabled={isDisabled}
              />
            );
          })}
        </div>
      </div>
    );
  }
);

TextFormattingIsland.displayName = 'TextFormattingIsland';

/**
 * Individual formatting button component
 * Shows visual feedback for active state and disabled state
 */
interface FormattingButtonProps {
  icon: LucideIcon;
  label: string;
  tooltip: string;
  isActive: boolean;
  isKeyboardFocused: boolean;
  isDisabled?: boolean;
  onClick: () => void;
}

function FormattingButton({
  icon: Icon,
  label,
  tooltip,
  isActive,
  isKeyboardFocused,
  isDisabled = false,
  onClick,
}: FormattingButtonProps) {
  return (
    <button
      onClick={isDisabled ? undefined : onClick}
      title={isDisabled ? `${tooltip} (disabled without selection)` : tooltip}
      aria-label={label}
      aria-pressed={isActive}
      disabled={isDisabled}
      className={cn(
        'p-1.5 rounded transition-all duration-200',
        'flex items-center justify-center',
        'focus:outline-none',
        isDisabled
          ? 'opacity-50 cursor-not-allowed text-muted-foreground bg-transparent'
          : cn(
              'hover:bg-accent hover:text-accent-foreground',
              isActive
                ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                : 'bg-transparent text-muted-foreground hover:text-foreground',
              isKeyboardFocused && 'ring-2 ring-primary ring-offset-1'
            )
      )}
    >
      <Icon size={16} strokeWidth={1.5} />
    </button>
  );
}

export default TextFormattingIsland;
