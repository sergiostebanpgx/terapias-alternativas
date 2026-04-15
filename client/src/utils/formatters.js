/**
 * Formateador de moneda colombiana (COP)
 */
export const formatCOP = (value) => {
  if (value === undefined || value === null || value === '') return '';
  const number = parseFloat(String(value).replace(/[^\d.-]/g, ''));
  if (isNaN(number)) return '';
  
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(number);
};

/**
 * Limpia un string de moneda para obtener el número puro
 */
export const cleanCurrency = (value) => {
  if (typeof value === 'number') return value;
  const clean = String(value).replace(/[^\d]/g, '');
  return clean === '' ? 0 : parseInt(clean);
};

/**
 * Formatea peso en kg con decimales
 */
export const formatWeight = (value) => {
  if (value === undefined || value === null || value === '') return '';
  const number = parseFloat(value);
  if (isNaN(number)) return '';
  return number.toFixed(2) + ' kg';
};

/**
 * Formatea fecha y hora local
 */
export const formatDateTime = (date) => {
  if (!date) return '-';
  return new Date(date).toLocaleString('es-CO', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};
