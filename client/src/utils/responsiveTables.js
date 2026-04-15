/**
 * Dynamically adds data-label attributes to table cells
 * based on the corresponding header text content.
 * 
 * Usage: Call initResponsiveTables() after rendering tables.
 * Or import and call in useEffect/useLayoutEffect.
 */

export function initResponsiveTables() {
  const tables = document.querySelectorAll('.custom-table');
  
  tables.forEach(table => {
    const headers = table.querySelectorAll('thead th');
    const rows = table.querySelectorAll('tbody tr');
    
    const headerLabels = Array.from(headers).map(th => th.textContent.trim());
    
    rows.forEach(row => {
      const cells = row.querySelectorAll('td');
      cells.forEach((cell, index) => {
        if (headerLabels[index]) {
          cell.setAttribute('data-label', headerLabels[index]);
        }
      });
    });
  });
}

/**
 * Re-initialize tables on window resize (debounced)
 */
let resizeTimeout;
export function setupResponsiveTablesListener() {
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      initResponsiveTables();
    }, 150);
  });
}
