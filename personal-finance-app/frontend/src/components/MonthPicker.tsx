import React from 'react';
import { format } from 'date-fns';
import DatePicker from 'react-datepicker';

/** Menampilkan bulan/tahun, mengembalikan nilai YYYY-MM */
type MonthPickerProps = {
  /** Nilai terpilih dalam format "YYYY-MM" */
  value: string;
  /** Change handler: dipakai untuk menyimpan period di state */
  onSelect: (value: string) => void;
  /** Label di samping input */
  label: string;
};

export const MonthPicker: React.FC<MonthPickerProps> = ({
  value,
  onSelect,
  label,
}) => {
  // value adalah string "YYYY-MM", ubah ke Date untuk DatePicker
  const date = value ? new Date(value) : new Date();

  return (
    <div className="relative w-full">
      <label className="sr-only">{label}</label>

      <DatePicker
        selected={date}
        onSelect={(selectedDate) => {
          if (selectedDate) {
            // Format ke YYYY-MM agar konsisten dengan query API
            const yyyyMM = format(selectedDate, 'yyyy-MM');
            onSelect(yyyyMM);
          }
        }}
        dateFormat="MMMM yyyy"
        placeholderText="Pilih bulan"
        className="w-full pr-8"
      />
    </div>
  );
};