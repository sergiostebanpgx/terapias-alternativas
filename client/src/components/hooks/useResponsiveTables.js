import { useEffect } from 'react';
import { initResponsiveTables, setupResponsiveTablesListener } from '../../utils/responsiveTables';

let listenerSetup = false;

export function useResponsiveTables() {
  useEffect(() => {
    initResponsiveTables();
    
    if (!listenerSetup) {
      setupResponsiveTablesListener();
      listenerSetup = true;
    }
  }, []);
}
