/**
 * AIProcessingDialog
 * 
 * A modal dialog that displays while an AI request is in progress.
 * Shows a spinner and a clear message about what's being processed.
 * Persists until the request completes (success or failure).
 * 
 * The dialog is non-dismissible during processing - users cannot close it
 * by clicking the X button or clicking outside the dialog (modal backdrop).
 */

'use client';

import React from 'react';

interface AIProcessingDialogProps {
  isOpen: boolean;
  message?: string;
}

export default function AIProcessingDialog({ 
  isOpen, 
  message = 'Analyzing diagram with AI...' 
}: AIProcessingDialogProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <>
      {/* Fixed backdrop overlay - prevents closing dialog */}
      <div 
        className="fixed inset-0 z-50 bg-black/80"
        style={{
          animation: 'fadeIn 200ms ease-in-out',
        }}
      />

      {/* Centered dialog content */}
      <div 
        className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
        style={{
          animation: 'fadeIn 200ms ease-in-out',
        }}
      >
        <div 
          className="bg-card border border-border rounded-lg shadow-lg p-8 w-full max-w-sm mx-4 pointer-events-auto"
          role="dialog"
          aria-modal="true"
          aria-labelledby="ai-processing-title"
          aria-describedby="ai-processing-description"
        >
          <div className="flex flex-col items-center justify-center gap-6">
            {/* Loading dots animation */}
            <div className="flex gap-2 justify-center">
              <div 
                className="h-2 w-2 bg-primary rounded-full animate-bounce"
                style={{ animationDelay: '0ms' }}
              />
              <div 
                className="h-2 w-2 bg-primary rounded-full animate-bounce"
                style={{ animationDelay: '150ms' }}
              />
              <div 
                className="h-2 w-2 bg-primary rounded-full animate-bounce"
                style={{ animationDelay: '300ms' }}
              />
            </div>

            {/* Primary message */}
            <div className="text-center space-y-3">
              <h2 
                id="ai-processing-title"
                className="text-xl font-semibold text-foreground"
              >
                🤖 AI Processing
              </h2>
              <p 
                id="ai-processing-description"
                className="text-sm text-muted-foreground leading-relaxed"
              >
                {message}
              </p>
            </div>

            {/* Subtitle with subtle guidance */}
            <p className="text-xs text-muted-foreground/70">
              Please wait while the model processes your request...
            </p>
          </div>
        </div>
      </div>

      {/* CSS for animations if not already defined */}
      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
      `}</style>
    </>
  );
}
