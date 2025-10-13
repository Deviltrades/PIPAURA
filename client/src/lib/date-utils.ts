export function formatTradeDateTime(dateString: string | null | undefined): string {
  if (!dateString) return '—';
  
  const date = new Date(dateString);
  
  // Format: Oct 6, 2025 · 16:15 (24-hour format for international trading)
  const dateOptions: Intl.DateTimeFormatOptions = { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric' 
  };
  const timeOptions: Intl.DateTimeFormatOptions = { 
    hour: '2-digit', 
    minute: '2-digit', 
    hour12: false 
  };
  
  const datePart = date.toLocaleDateString('en-US', dateOptions);
  const timePart = date.toLocaleTimeString('en-US', timeOptions);
  
  return `${datePart} · ${timePart}`;
}

export function formatTradeDate(dateString: string | null | undefined): string {
  if (!dateString) return '—';
  
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric' 
  });
}

export function formatTradeTime(dateString: string | null | undefined): string {
  if (!dateString) return '—';
  
  const date = new Date(dateString);
  return date.toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit', 
    hour12: false 
  });
}
