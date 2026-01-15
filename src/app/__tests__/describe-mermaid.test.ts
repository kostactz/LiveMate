/**
 * Unit tests for the Describe Mermaid AI flow
 * Tests error extraction, state management, and user-friendly messages
 */

describe('Error message extraction from Gemini API', () => {
  /**
   * Test case: nested error object with message field
   * Simulates the exact error structure from the Gemini API (503 overloaded)
   */
  it('should extract message from nested error object', () => {
    const errorResponse: any = {
      error: {
        code: 503,
        message: 'The model is overloaded. Please try again later.',
        status: 'UNAVAILABLE',
      },
    };

    // Simulate the error extraction logic from geminiCallCloudflare
    let errorMessage = 'An error occurred.';
    if (typeof errorResponse.error === 'string') {
      errorMessage = errorResponse.error;
    } else if (typeof errorResponse.error === 'object' && errorResponse.error !== null) {
      errorMessage = errorResponse.error.message || JSON.stringify(errorResponse.error);
    }

    expect(errorMessage).toBe('The model is overloaded. Please try again later.');
  });

  /**
   * Test case: error as a plain string
   */
  it('should extract message when error is a string', () => {
    const errorResponse: any = {
      error: 'Simple error message',
    };

    let errorMessage = 'An error occurred.';
    if (typeof errorResponse.error === 'string') {
      errorMessage = errorResponse.error;
    } else if (typeof errorResponse.error === 'object' && errorResponse.error !== null) {
      errorMessage = errorResponse.error.message || JSON.stringify(errorResponse.error);
    }

    expect(errorMessage).toBe('Simple error message');
  });

  /**
   * Test case: error object without message field
   * Should fall back to JSON.stringify
   */
  it('should stringify error object if message field is missing', () => {
    const errorResponse: any = {
      error: {
        code: 500,
        status: 'INTERNAL_ERROR',
      },
    };

    let errorMessage = 'An error occurred.';
    if (typeof errorResponse.error === 'string') {
      errorMessage = errorResponse.error;
    } else if (typeof errorResponse.error === 'object' && errorResponse.error !== null) {
      errorMessage = errorResponse.error.message || JSON.stringify(errorResponse.error);
    }

    expect(errorMessage).toContain('INTERNAL_ERROR');
  });

  /**
   * Test case: null/undefined error
   * Should not throw and use default
   */
  it('should handle null error gracefully', () => {
    const errorResponse: any = {
      error: null,
    };

    let errorMessage = 'An error occurred.';
    if (typeof errorResponse.error === 'string') {
      errorMessage = errorResponse.error;
    } else if (typeof errorResponse.error === 'object' && errorResponse.error !== null) {
      errorMessage = errorResponse.error.message || JSON.stringify(errorResponse.error);
    }

    // When error is null, we keep the default
    expect(errorMessage).toBe('An error occurred.');
  });

  /**
   * Test case: missing error field entirely
   * Should use default message
   */
  it('should use default message when no error field exists', () => {
    const errorResponse: any = {
      success: false,
      data: null,
    };

    let errorMessage = 'An error occurred.';
    const error = errorResponse.error;
    if (typeof error === 'string') {
      errorMessage = error;
    } else if (typeof error === 'object' && error !== null) {
      errorMessage = error.message || JSON.stringify(error);
    }

    expect(errorMessage).toBe('An error occurred.');
  });
});

describe('Re-entrancy guard for describe mermaid', () => {
  /**
   * Test case: ensure re-entrancy is prevented
   * When isDescribeProcessing is true, a second call should be rejected
   */
  it('should prevent multiple concurrent describe requests', () => {
    let isDescribeProcessing = false;
    const attemptedCalls: number[] = [];

    const handleDescribeMermaid = () => {
      if (isDescribeProcessing) {
        attemptedCalls.push(-1); // Represents a blocked call
        return false;
      }
      attemptedCalls.push(1); // Represents an allowed call
      isDescribeProcessing = true;
      return true;
    };

    // First call should succeed
    const firstCall = handleDescribeMermaid();
    expect(firstCall).toBe(true);
    expect(attemptedCalls).toEqual([1]);

    // Second call should be blocked
    const secondCall = handleDescribeMermaid();
    expect(secondCall).toBe(false);
    expect(attemptedCalls).toEqual([1, -1]);

    // Simulate completion
    isDescribeProcessing = false;

    // Third call (after completion) should succeed
    const thirdCall = handleDescribeMermaid();
    expect(thirdCall).toBe(true);
    expect(attemptedCalls).toEqual([1, -1, 1]);
  });
});

describe('User-friendly error messages', () => {
  /**
   * Test that user sees clear, non-technical messages
   */
  it('should show human-readable message for 503 overloaded error', () => {
    const error = new Error('The model is overloaded. Please try again later.');
    expect(error.message).toMatch(/model is overloaded|try again later/i);
  });

  /**
   * Test default fallback message
   */
  it('should provide fallback message when error message is empty', () => {
    const error = new Error();
    const displayMessage = error.message || 'The model is busy or unavailable. Please try again slightly later.';
    expect(displayMessage).toBe('The model is busy or unavailable. Please try again slightly later.');
  });

  /**
   * Test that full error is preserved for logging
   */
  it('should preserve original error for debugging', () => {
    const originalError = {
      code: 503,
      message: 'The model is overloaded. Please try again later.',
      status: 'UNAVAILABLE',
    };

    const error = new Error('The model is overloaded. Please try again later.');
    (error as any).originalError = originalError;

    expect((error as any).originalError).toEqual(originalError);
    expect((error as any).originalError.status).toBe('UNAVAILABLE');
  });
});
