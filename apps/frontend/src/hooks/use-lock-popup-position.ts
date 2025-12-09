import { useEffect, useRef } from 'react';

/**
 * Hook to completely lock popup position and prevent sliding
 */
export function useLockPopupPosition<T extends HTMLElement = HTMLDivElement>() {
  const elementRef = useRef<T>(null);
  const positionRef = useRef<{ left: number; top: number; width: number } | null>(null);
  const rafIdRef = useRef<number | null>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const lockPosition = () => {
      const state = element.getAttribute('data-state');
      if (state === 'open') {
        // Try to find trigger element to calculate correct position
        let targetPosition = positionRef.current;
        
        if (!targetPosition) {
          // Look for trigger element
          const trigger = document.querySelector('[data-radix-select-trigger], [data-radix-popover-trigger], [data-radix-dropdown-menu-trigger]') as HTMLElement;
          if (trigger) {
            const triggerRect = trigger.getBoundingClientRect();
            // Position below trigger for dropdowns/selects
            targetPosition = {
              left: triggerRect.left,
              top: triggerRect.bottom + 4,
              width: triggerRect.width,
            };
          } else {
            // Fallback: use current position
            const rect = element.getBoundingClientRect();
            targetPosition = {
              left: rect.left,
              top: rect.top,
              width: rect.width,
            };
          }
          positionRef.current = targetPosition;
        }

        // Find the actual positioned element (might be a wrapper)
        let targetElement = element;
        let wrapper = element.closest('[data-radix-popper-content-wrapper]');
        if (wrapper) {
          targetElement = wrapper as T;
        }

        // Force lock with !important
        targetElement.style.setProperty('position', 'fixed', 'important');
        targetElement.style.setProperty('left', `${positionRef.current.left}px`, 'important');
        targetElement.style.setProperty('top', `${positionRef.current.top}px`, 'important');
        targetElement.style.setProperty('width', `${positionRef.current.width}px`, 'important');
        targetElement.style.setProperty('transform', 'none', 'important');
        targetElement.style.setProperty('margin', '0', 'important');
        targetElement.style.setProperty('transition', 'none', 'important');
        targetElement.style.setProperty('will-change', 'auto', 'important');
      } else {
        // Reset when closed
        positionRef.current = null;
        let targetElement = element;
        let wrapper = element.closest('[data-radix-popper-content-wrapper]');
        if (wrapper) {
          targetElement = wrapper as T;
        }
        targetElement.style.removeProperty('position');
        targetElement.style.removeProperty('left');
        targetElement.style.removeProperty('top');
        targetElement.style.removeProperty('width');
        targetElement.style.removeProperty('transform');
        targetElement.style.removeProperty('margin');
        targetElement.style.removeProperty('transition');
        targetElement.style.removeProperty('will-change');
      }
    };

    // Continuous position locking
    const continuousLock = () => {
      lockPosition();
      const state = element.getAttribute('data-state');
      if (state === 'open') {
        rafIdRef.current = requestAnimationFrame(continuousLock);
      } else {
        if (rafIdRef.current) {
          cancelAnimationFrame(rafIdRef.current);
          rafIdRef.current = null;
        }
      }
    };

    // Watch for state changes
    const observer = new MutationObserver(() => {
      lockPosition();
      continuousLock();
    });

    observer.observe(element, {
      attributes: true,
      attributeFilter: ['data-state', 'style'],
      subtree: true,
    });

    // Watch for style changes on wrapper
    const styleObserver = new MutationObserver(() => {
      if (element.getAttribute('data-state') === 'open') {
        lockPosition();
      }
    });

    const wrapper = element.closest('[data-radix-popper-content-wrapper]');
    if (wrapper) {
      styleObserver.observe(wrapper, {
        attributes: true,
        attributeFilter: ['style'],
      });
    }

    // Initial lock - IMMEDIATELY, before Popper.js can move it
    // Use multiple timeouts to catch it at different stages
    lockPosition(); // Immediate
    requestAnimationFrame(() => {
      lockPosition(); // Next frame
      requestAnimationFrame(() => {
        lockPosition(); // Frame after that
        continuousLock();
      });
    });

    return () => {
      observer.disconnect();
      styleObserver.disconnect();
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, []);

  return elementRef;
}

