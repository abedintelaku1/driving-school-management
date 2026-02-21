/**
 * Date utility functions with Kosovo timezone (Europe/Pristina)
 * Timezone: UTC+1 (CET) / UTC+2 (CEST with DST)
 */

const KOSOVO_TIMEZONE = 'Europe/Pristina';

/**
 * Format date with Kosovo timezone
 */
export const formatDate = (dateString: string | Date, locale: string = 'sq-AL'): string => {
  if (!dateString) return '';
  
  try {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    
    return date.toLocaleDateString(locale, {
      timeZone: KOSOVO_TIMEZONE,
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  } catch {
    return typeof dateString === 'string' ? dateString : dateString.toString();
  }
};

/**
 * Format date with full month name
 */
export const formatDateFull = (dateString: string | Date, locale: string = 'sq-AL'): string => {
  if (!dateString) return '';
  
  try {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    
    return date.toLocaleDateString(locale, {
      timeZone: KOSOVO_TIMEZONE,
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch {
    return typeof dateString === 'string' ? dateString : dateString.toString();
  }
};

/**
 * Format time with Kosovo timezone
 */
export const formatTime = (dateString: string | Date, locale: string = 'sq-AL'): string => {
  if (!dateString) return '';
  
  try {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    
    return date.toLocaleTimeString(locale, {
      timeZone: KOSOVO_TIMEZONE,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  } catch {
    return '';
  }
};

/**
 * Format date and time with Kosovo timezone
 */
export const formatDateTime = (dateString: string | Date, locale: string = 'sq-AL'): string => {
  if (!dateString) return '';
  
  try {
    // Convert to Date object if it's a string
    let date: Date;
    if (typeof dateString === 'string') {
      // Handle ISO strings and other date formats
      date = new Date(dateString);
    } else {
      date = dateString;
    }
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return typeof dateString === 'string' ? dateString : dateString.toString();
    }
    
    // Format date with Kosovo timezone
    const formattedDate = date.toLocaleDateString(locale, {
      timeZone: KOSOVO_TIMEZONE,
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    // Format time with Kosovo timezone
    const formattedTime = date.toLocaleTimeString(locale, {
      timeZone: KOSOVO_TIMEZONE,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
    
    // For Albanian, use "në" between date and time
    if (locale.startsWith('sq')) {
      return `${formattedDate} në ${formattedTime}`;
    }
    return `${formattedDate} ${formattedTime}`;
  } catch (err) {
    // If formatting fails, try to return at least a basic formatted version
    try {
      const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
      if (!isNaN(date.getTime())) {
        return date.toLocaleString(locale, { timeZone: KOSOVO_TIMEZONE });
      }
    } catch {
      // If all else fails, return the original string
    }
    return typeof dateString === 'string' ? dateString : dateString.toString();
  }
};

/**
 * Format date and time for export (with timezone info)
 */
export const formatDateTimeForExport = (dateString: string | Date, locale: string = 'sq-AL'): string => {
  if (!dateString) return '';
  
  try {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    
    return date.toLocaleString(locale, {
      timeZone: KOSOVO_TIMEZONE,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  } catch {
    return typeof dateString === 'string' ? dateString : dateString.toString();
  }
};

/**
 * Get current date in Kosovo timezone as ISO string (YYYY-MM-DD)
 */
export const getTodayKosovo = (): string => {
  const now = new Date();
  const kosovoDate = new Date(now.toLocaleString('en-US', { timeZone: KOSOVO_TIMEZONE }));
  return kosovoDate.toISOString().split('T')[0];
};

/**
 * Get current date and time in Kosovo timezone
 */
export const getNowKosovo = (): Date => {
  const now = new Date();
  const kosovoString = now.toLocaleString('en-US', { timeZone: KOSOVO_TIMEZONE });
  return new Date(kosovoString);
};

/**
 * Format date with weekday, month and day (for calendar)
 */
export const formatDateWithWeekday = (dateString: string | Date, locale: string = 'sq-AL'): string => {
  if (!dateString) return '';
  
  try {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    
    return date.toLocaleDateString(locale, {
      timeZone: KOSOVO_TIMEZONE,
      weekday: 'long',
      month: 'long',
      day: 'numeric'
    });
  } catch {
    return typeof dateString === 'string' ? dateString : dateString.toString();
  }
};

/**
 * Format month name only (for reports)
 */
export const formatMonthName = (dateString: string | Date, locale: string = 'sq-AL'): string => {
  if (!dateString) return '';
  
  try {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    
    return date.toLocaleDateString(locale, {
      timeZone: KOSOVO_TIMEZONE,
      year: 'numeric',
      month: 'long'
    });
  } catch {
    return typeof dateString === 'string' ? dateString : dateString.toString();
  }
};

/**
 * Format current date for export (with Kosovo timezone)
 */
export const formatCurrentDate = (locale: string = 'sq-AL'): string => {
  return formatDate(new Date().toISOString(), locale);
};

/**
 * Format current date and time for export (with Kosovo timezone)
 */
export const formatCurrentDateTime = (locale: string = 'sq-AL'): string => {
  return formatDateTimeForExport(new Date().toISOString(), locale);
};

