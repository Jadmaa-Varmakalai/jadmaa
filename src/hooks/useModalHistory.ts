import { useEffect, useRef } from 'react';

/**
 * Pushes a browser history entry when a modal/drawer opens so pressing
 * the browser or device Back button closes the modal instead of leaving
 * the current page.
 */
export function useModalHistory(isOpen: boolean, onClose: () => void, modalKey = 'admin-modal') {
  const pushedRef = useRef(false);

  useEffect(() => {
    if (isOpen && !pushedRef.current) {
      window.history.pushState({ modal: modalKey }, '', window.location.href);
      pushedRef.current = true;
    } else if (!isOpen && pushedRef.current) {
      pushedRef.current = false;
    }

    const handlePopState = () => {
      if (pushedRef.current) {
        pushedRef.current = false;
        onClose();
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [isOpen, onClose, modalKey]);

  // Helper when user closes modal via "X" or "Cancel" button so history stays clean
  const closeWithHistory = () => {
    if (pushedRef.current) {
      pushedRef.current = false;
      window.history.back(); // Triggers popstate -> calls onClose() and stays on current route
    } else {
      onClose();
    }
  };

  return { closeWithHistory };
}
