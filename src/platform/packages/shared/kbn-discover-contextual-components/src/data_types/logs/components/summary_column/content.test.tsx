/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import React, { type ReactNode } from 'react';
import { render } from '@testing-library/react';
import type { EuiThemeComputed } from '@elastic/eui';
import { applyLogLevelHighlighting, highlightLogLevelsInString } from './content';

// Mock EUI theme for testing - must include mediumShade for trace log level
const mockEuiTheme = {
  colors: {
    textGhost: '#ffffff',
    textInk: '#000000',
    mediumShade: '#d3dae6',
  },
} as unknown as EuiThemeComputed;

describe('highlightLogLevelsInString', () => {
  describe('recognizes log levels', () => {
    it('highlights a log level term', () => {
      const result = highlightLogLevelsInString('Test INFO message', mockEuiTheme, false);
      const { container } = render(<>{result}</>);

      const span = container.querySelector('[data-test-subj="logLevelSpan"]');
      expect(span).toBeInTheDocument();
      expect(span).toHaveTextContent('INFO');
    });
  });

  describe('returns unchanged text', () => {
    it('when no log level is present', () => {
      const text = 'Just a regular message without levels';
      const result = highlightLogLevelsInString(text, mockEuiTheme, false);
      expect(result).toBe(text);
    });
  });

  describe('handles multiple log levels', () => {
    it('highlights all log levels in a string', () => {
      const result = highlightLogLevelsInString(
        'INFO: Starting... WARN: Issue found ERROR: Failed',
        mockEuiTheme,
        false
      );
      const { container } = render(<>{result}</>);

      const spans = container.querySelectorAll('[data-test-subj="logLevelSpan"]');
      expect(spans.length).toBe(3);
    });
  });

  describe('preserves surrounding text', () => {
    it('keeps text before and after log level', () => {
      const result = highlightLogLevelsInString('prefix INFO suffix', mockEuiTheme, false);
      const { container } = render(<>{result}</>);

      expect(container.textContent).toBe('prefix INFO suffix');
    });

    it('handles log level at the start', () => {
      const result = highlightLogLevelsInString('ERROR: Something failed', mockEuiTheme, false);
      const { container } = render(<>{result}</>);

      expect(container.textContent).toBe('ERROR: Something failed');
      expect(container.querySelector('[data-test-subj="logLevelSpan"]')).toHaveTextContent('ERROR');
    });

    it('handles log level at the end', () => {
      const result = highlightLogLevelsInString('Log level: INFO', mockEuiTheme, false);
      const { container } = render(<>{result}</>);

      expect(container.textContent).toBe('Log level: INFO');
    });
  });

  describe('applies correct colors', () => {
    it('applies background color styling to different severity levels', () => {
      const infoResult = highlightLogLevelsInString('INFO message', mockEuiTheme, false);
      const errorResult = highlightLogLevelsInString('ERROR message', mockEuiTheme, false);

      const { container: infoContainer } = render(<>{infoResult}</>);
      const { container: errorContainer } = render(<>{errorResult}</>);

      const infoSpan = infoContainer.querySelector(
        '[data-test-subj="logLevelSpan"]'
      ) as HTMLElement;
      const errorSpan = errorContainer.querySelector(
        '[data-test-subj="logLevelSpan"]'
      ) as HTMLElement;

      // Verify both spans have backgroundColor set (colors are computed from EUI palette)
      expect(infoSpan?.style.backgroundColor).toBeTruthy();
      expect(errorSpan?.style.backgroundColor).toBeTruthy();
      // And they should be different colors for different severity levels
      expect(infoSpan?.style.backgroundColor).not.toBe(errorSpan?.style.backgroundColor);
    });
  });
});

describe('applyLogLevelHighlighting', () => {
  describe('handles plain strings', () => {
    it('applies highlighting to a plain string', () => {
      const result = applyLogLevelHighlighting('INFO: Test message', mockEuiTheme, false);
      const { container } = render(<>{result}</>);

      expect(container.querySelector('[data-test-subj="logLevelSpan"]')).toBeInTheDocument();
    });

    it('returns unchanged string when no log level present', () => {
      const text = 'No log level here';
      const result = applyLogLevelHighlighting(text, mockEuiTheme, false);
      expect(result).toBe(text);
    });
  });

  describe('handles React elements', () => {
    it('processes children of React elements', () => {
      const node = <span>INFO: Test message</span>;
      const result = applyLogLevelHighlighting(node, mockEuiTheme, false);
      const { container } = render(<>{result}</>);

      // Should have the outer span preserved
      expect(container.querySelector('span')).toBeInTheDocument();
      // Should have log level highlighting inside
      expect(container.querySelector('[data-test-subj="logLevelSpan"]')).toBeInTheDocument();
    });

    it('preserves element without children unchanged', () => {
      const node = <br />;
      const result = applyLogLevelHighlighting(node, mockEuiTheme, false);
      const { container } = render(<>{result}</>);

      expect(container.innerHTML).toBe('<br>');
    });

    it('preserves search highlight mark tags while adding log level highlights', () => {
      // Simulating: "INFO: User <mark>search term</mark> logged"
      const node = (
        <>
          INFO: User <mark className="ffSearch__highlight">search term</mark> logged
        </>
      );
      const result = applyLogLevelHighlighting(node, mockEuiTheme, false);
      const { container } = render(<>{result}</>);

      // Search highlight should be preserved
      expect(container.querySelector('mark.ffSearch__highlight')).toBeInTheDocument();
      expect(container.querySelector('mark.ffSearch__highlight')).toHaveTextContent('search term');

      // Log level should be highlighted
      expect(container.querySelector('[data-test-subj="logLevelSpan"]')).toHaveTextContent('INFO');

      // Full text should be present
      expect(container.textContent).toBe('INFO: User search term logged');
    });
  });

  describe('handles arrays', () => {
    it('processes each element in an array', () => {
      const node = ['INFO: First ', 'ERROR: Second'];
      const result = applyLogLevelHighlighting(node, mockEuiTheme, false);
      const { container } = render(<>{result}</>);

      const spans = container.querySelectorAll('[data-test-subj="logLevelSpan"]');
      expect(spans.length).toBe(2);
    });
  });

  describe('handles nested structures', () => {
    it('recursively processes deeply nested elements', () => {
      const node = (
        <div>
          <span>
            <strong>INFO: Nested</strong>
          </span>
        </div>
      );
      const result = applyLogLevelHighlighting(node, mockEuiTheme, false);
      const { container } = render(<>{result}</>);

      expect(container.querySelector('[data-test-subj="logLevelSpan"]')).toBeInTheDocument();
      expect(container.querySelector('div > span > strong')).toBeInTheDocument();
    });
  });

  describe('handles null/undefined/boolean', () => {
    it('returns null unchanged', () => {
      expect(applyLogLevelHighlighting(null, mockEuiTheme, false)).toBeNull();
    });

    it('returns undefined unchanged', () => {
      expect(applyLogLevelHighlighting(undefined, mockEuiTheme, false)).toBeUndefined();
    });

    it('returns boolean unchanged', () => {
      expect(applyLogLevelHighlighting(true as unknown as ReactNode, mockEuiTheme, false)).toBe(
        true
      );
    });
  });
});

describe('integration: search highlights + log level highlights', () => {
  it('both highlight types coexist in the same message', () => {
    // Simulating formatter output: search term is "user123"
    const formatterOutput = (
      <>
        ERROR: Failed to authenticate <mark className="ffSearch__highlight">user123</mark> after 3
        attempts
      </>
    );

    const result = applyLogLevelHighlighting(formatterOutput, mockEuiTheme, false);
    const { container } = render(<>{result}</>);

    // Log level highlight
    const logLevelSpan = container.querySelector('[data-test-subj="logLevelSpan"]') as HTMLElement;
    expect(logLevelSpan).toHaveTextContent('ERROR');
    expect(logLevelSpan?.style.backgroundColor).toBeTruthy();

    // Search highlight preserved
    const searchMark = container.querySelector('mark.ffSearch__highlight');
    expect(searchMark).toHaveTextContent('user123');

    // Full text content
    expect(container.textContent).toBe('ERROR: Failed to authenticate user123 after 3 attempts');
  });

  it('handles log level inside search highlight', () => {
    // Edge case: user searched for "INFO" and it's highlighted
    const formatterOutput = <mark className="ffSearch__highlight">INFO</mark>;

    const result = applyLogLevelHighlighting(formatterOutput, mockEuiTheme, false);
    const { container } = render(<>{result}</>);

    // The mark should be preserved
    expect(container.querySelector('mark')).toBeInTheDocument();
    // And log level highlighting should be applied inside
    expect(container.querySelector('[data-test-subj="logLevelSpan"]')).toHaveTextContent('INFO');
  });

  it('handles multiple search highlights with log levels between them', () => {
    const formatterOutput = (
      <>
        <mark className="ffSearch__highlight">request</mark> INFO: Processing{' '}
        <mark className="ffSearch__highlight">request</mark> complete
      </>
    );

    const result = applyLogLevelHighlighting(formatterOutput, mockEuiTheme, false);
    const { container } = render(<>{result}</>);

    // Both search highlights preserved
    const marks = container.querySelectorAll('mark.ffSearch__highlight');
    expect(marks.length).toBe(2);

    // Log level highlighted
    expect(container.querySelector('[data-test-subj="logLevelSpan"]')).toHaveTextContent('INFO');
  });
});
