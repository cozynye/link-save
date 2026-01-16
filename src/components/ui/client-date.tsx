'use client';

import { useState, useEffect } from 'react';

interface ClientDateProps {
  date: string | Date;
  format?: 'date' | 'datetime';
  locale?: string;
}

export function ClientDate({
  date,
  format = 'datetime',
  locale = 'ko-KR'
}: ClientDateProps) {
  const [formattedDate, setFormattedDate] = useState<string>('');

  useEffect(() => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const formatted = format === 'date'
      ? dateObj.toLocaleDateString(locale)
      : dateObj.toLocaleString(locale);
    setFormattedDate(formatted);
  }, [date, format, locale]);

  if (!formattedDate) {
    return <span className="text-muted-foreground">-</span>;
  }

  return <span>{formattedDate}</span>;
}
