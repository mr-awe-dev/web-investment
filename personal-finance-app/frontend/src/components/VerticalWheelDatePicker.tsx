import React, { useState, useEffect } from 'react';
import { isLeapYear } from 'date-fns';

export type VerticalWheelDatePickerProps = {
  value?: string;
  defaultValue?: string;
  minDate?: string;
  maxDate?: string;
  onChange?: (date: string) => void;
  label?: string;
  yearRange?: { start: number; end: number };
  disabled?: boolean;
  controlled?: boolean;
};

const getDaysInMonth = (year: number, month: number): number => {
  if (month === 2 && isLeapYear(year)) return 29;
  const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  return daysInMonth[month - 1];
};

export const VerticalWheelDatePicker: React.FC<VerticalWheelDatePickerProps> = ({
  value: valueProp,
  defaultValue: defaultValueProp,
  minDate,
  maxDate,
  onChange,
  label: labelProp,
  yearRange = { start: 1900, end: 2030 },
  disabled = false,
  controlled = false,
}) => {
  // Determine selected date
  const [selectedDate, setSelectedDate] = useState<{
    year: number;
    month: number;
    day: number;
  }>(() => {
    if (valueProp) {
      const d = new Date(valueProp);
      return { year: d.getFullYear(), month: d.getMonth() + 1, day: d.getDate() };
    }
    if (defaultValueProp) {
      const d = new Date(defaultValueProp);
      return { year: d.getFullYear(), month: d.getMonth() + 1, day: d.getDate() };
    }
    return { year: new Date().getFullYear(), month: new Date().getMonth() + 1, day: new Date().getDate() };
  });

  // Sync with controlled mode
  useEffect(() => {
    if (valueProp && controlled) {
      const d = new Date(valueProp);
      setSelectedDate({ year: d.getFullYear(), month: d.getMonth() + 1, day: d.getDate() });
    }
  }, [valueProp, controlled]);

  const year = selectedDate.year;
  const month = selectedDate.month;
  const day = selectedDate.day;

  // Calculate valid days for current month/year
  const monthDays = getDaysInMonth(year, month);
  const adjustedDay = day > monthDays ? monthDays : day;

  // Month names
  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
  ];

  // Year range considering constraints
  const minYear = minDate ? new Date(minDate).getFullYear() : yearRange.start;
  const maxYear = maxDate ? new Date(maxDate).getFullYear() : yearRange.end;
  const startYear = Math.max(yearRange.start, minYear);
  const endYear = Math.min(yearRange.end, maxYear);
  const yearItems = Array.from({ length: endYear - startYear + 1 }, (_, i) => startYear + i);

  // Month items (1-12) with labels
  const monthItems = Array.from({ length: 12 }, (_, i) => ({
    value: `${i + 1}`,
    label: monthNames[i],
  }));

  // Day items based on current month/year
  const dayItems = Array.from({ length: monthDays }, (_, i) => ({
    value: `${i + 1}`,
    label: `${i + 1}`,
  }));

  // Selected strings
  const selectedMonthStr = `${month}`.padStart(2, '0');
  const selectedDayStr = `${adjustedDay}`.padStart(2, '0');
  const selectedYearStr = `${year}`;

  return (
    <div className="w-full bg-surface/80 backdrop-blur-sm border border-line rounded-lg p-6 shadow-sm">
      {labelProp && (
        <div className="mb-6 flex justify-between items-center">
          <span className="text-sm text-muted capitalize">{labelProp}</span>
          <span className="text-base font-medium text-[rgb(var(--c-accent))]">
            {adjustedDay} {monthNames[month - 1]} {year}
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
        {/* Month Column */}
        <div>
          <select
            disabled={disabled}
            onChange={(e) => {
              const newMonth = parseInt(e.target.value, 10);
              const newMaxDay = getDaysInMonth(year, newMonth);
              const newDay = adjustedDay > newMaxDay ? getDaysInMonth(year, newMonth) : adjustedDay;
              const newDate = `${year}-${newMonth.toString().padStart(2, '0')}-${newDay.toString().padStart(2, '0')}`;
              setSelectedDate({ year, month: newMonth, day: newDay });
              onChange?.(newDate);
            }}
            className="block w-full py-2 px-3 pr-8 text-[rgb(var(--c-ink))] font-medium text-sm appearance-none bg-surface/50 border border-line rounded-lg cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-[rgb(var(--c-accent))] focus:ring-offset-2"
          >
            <option value="" disabled>{'- Bulan -'}</option>
            {monthItems.map((item) => (
              <option key={item.value} value={item.value} selected={item.value === selectedMonthStr}>
                {item.label}
              </option>
            ))}
          </select>
        </div>

        {/* Day Column */}
        <div>
          <select
            disabled={disabled}
            onChange={(e) => {
              const newDay = parseInt(e.target.value, 10);
              const newDate = `${year}-${selectedMonthStr}-${newDay.toString().padStart(2, '0')}`;
              setSelectedDate({ year, month, day: newDay });
              onChange?.(newDate);
            }}
            className="block w-full py-2 px-3 pr-8 text-[rgb(var(--c-ink))] font-medium text-sm appearance-none bg-surface/50 border border-line rounded-lg cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-[rgb(var(--c-accent))] focus:ring-offset-2"
          >
            <option value="" disabled>{'- Tanggal -'}</option>
            {dayItems.map((item) => (
              <option key={item.value} value={item.value} selected={item.value === selectedDayStr}>
                {item.label}
              </option>
            ))}
          </select>
        </div>

        {/* Year Column */}
        <div>
          <select
            disabled={disabled}
            onChange={(e) => {
              const newYear = parseInt(e.target.value, 10);
              const newMaxDay = getDaysInMonth(newYear, month);
              const newDay = adjustedDay > newMaxDay ? getDaysInMonth(newYear, month) : adjustedDay;
              const newDate = `${newYear}-${selectedMonthStr}-${newDay.toString().padStart(2, '0')}`;
              setSelectedDate({ year: newYear, month, day: newDay });
              onChange?.(newDate);
            }}
            className="block w-full py-2 px-3 pr-8 text-[rgb(var(--c-ink))] font-medium text-sm appearance-none bg-surface/50 border border-line rounded-lg cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-[rgb(var(--c-accent))] focus:ring-offset-2"
          >
            <option value="" disabled>{'- Tahun -'}</option>
            {yearItems.map((y) => (
              <option key={y} value={y.toString()} selected={y.toString() === selectedYearStr}>
                {y}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Selection indicator lines */}
      <div className="my-4 border-t border-line opacity-20 border-b border-line opacity-20" />
    </div>
  );
};