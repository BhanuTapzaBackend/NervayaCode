'use client';

import { DayPicker, type DayPickerProps } from 'react-day-picker';
import 'react-day-picker/style.css';

/**
 * Thin wrapper so react-day-picker AND its stylesheet sit in one lazily-loaded
 * chunk. DateField dynamic-imports this, which keeps the calendar out of every
 * page that merely imports something else from the common barrel.
 */
export default function Calendar(props: DayPickerProps) {
  return <DayPicker {...props} />;
}
