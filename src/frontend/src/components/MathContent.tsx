import { useEffect, useRef } from 'react';
import { useTheme } from 'next-themes';

interface MathContentProps {
  content: string;
  className?: string;
  inline?: boolean;
}

declare global {
  interface Window {
    MathJax: {
      typesetPromise: (elements?: HTMLElement[]) => Promise<void>;
      startup: {
        promise: Promise<void>;
      };
    };
  }
}

export default function MathContent({ content, className = '', inline = false }: MathContentProps) {
  const containerRef = useRef<HTMLDivElement | HTMLSpanElement>(null);
  const { theme } = useTheme();

  useEffect(() => {
    const typesetMath = async () => {
      if (containerRef.current && window.MathJax) {
        try {
          // Wait for MathJax to be ready
          await window.MathJax.startup.promise;
          // Typeset the content
          await window.MathJax.typesetPromise([containerRef.current]);
        } catch (error) {
          console.error('MathJax typesetting failed:', error);
        }
      }
    };

    typesetMath();
  }, [content, theme]); // Re-render when content or theme changes

  const Component = inline ? 'span' : 'div';

  return (
    <Component
      ref={containerRef as any}
      className={`math-content ${className}`}
      dangerouslySetInnerHTML={{ __html: content }}
    />
  );
}
