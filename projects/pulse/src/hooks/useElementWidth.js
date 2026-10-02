import { useEffect, useRef, useState } from 'react';

/**
 * Measures how wide an element is, and measures again whenever it changes
 * (for example when the window is resized). The charts use this to redraw
 * at the right size.
 *
 * Usage:  const [ref, width] = useElementWidth();   <div ref={ref}>
 */
export function useElementWidth() {
  const ref = useRef(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return [ref, width];
}
