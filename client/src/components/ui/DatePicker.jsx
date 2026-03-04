import { useState } from 'react';
import * as Popover from '@radix-ui/react-popover';
import { DayPicker } from 'react-day-picker';
import { Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import 'react-day-picker/style.css';

function toYMD(d) {
  if (!d) return '';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function fromYMD(str) {
  if (!str) return undefined;
  const parts = str.split('-').map(Number);
  if (parts.length !== 3 || parts.some((n) => !Number.isFinite(n))) return undefined;
  const [y, m, day] = parts;
  const d = new Date(y, m - 1, day);
  return isNaN(d.getTime()) ? undefined : d;
}

function parseDateLocal(input) {
  if (!input) return null;
  if (typeof input === 'string') {
    const parts = input.split('-').map(Number);
    if (parts.length !== 3) return null;
    return new Date(parts[0], parts[1] - 1, parts[2]);
  }
  return input instanceof Date ? input : null;
}

export function DatePicker({ value, onChange, maxDate, minDate, placeholder = '选择日期', className }) {
  const [open, setOpen] = useState(false);
  const date = fromYMD(value);

  const handleSelect = (d) => {
    onChange?.(d ? toYMD(d) : '');
    setOpen(false);
  };

  const matchers = [];
  const maxD = parseDateLocal(maxDate);
  if (maxD) {
    matchers.push({ after: maxD });
  }
  const minD = parseDateLocal(minDate);
  if (minD) {
    matchers.push({ before: minD });
  }
  const disabled = matchers.length ? matchers : undefined;

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <button
          type="button"
          className={cn(
            'flex h-10 w-full items-center justify-between gap-2 rounded-lg border border-white/10 bg-white/5 px-3 text-left text-base transition-colors',
            'hover:bg-white/[0.07] hover:border-white/20 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20',
            !value && 'text-foreground/50',
            className
          )}
          aria-label={placeholder}
        >
          <span className={value ? 'text-foreground' : 'text-foreground/50'}>{value || placeholder}</span>
          <Calendar className="size-4 shrink-0 text-foreground/60" />
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          align="start"
          sideOffset={4}
          className="z-50 rounded-xl border border-white/10 bg-[hsl(222_40%_10%)] p-4 shadow-xl outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
        >
          <DayPicker
            className="rdp-dark"
            mode="single"
            selected={date}
            onSelect={handleSelect}
            disabled={disabled}
            defaultMonth={date || new Date()}
            footer={
              <div className="flex justify-end gap-3">
                <button type="button" className="text-sm font-medium text-primary hover:underline" onClick={() => handleSelect(null)}>清除</button>
                <button type="button" className="text-sm font-medium text-primary hover:underline" onClick={() => handleSelect(new Date())}>今天</button>
              </div>
            }
            classNames={{
              months: 'flex flex-col gap-4',
              month: 'flex flex-col gap-4',
              month_caption: 'flex justify-center gap-2 text-sm font-medium text-foreground',
              nav: 'flex gap-1',
              button_previous: 'size-8 rounded hover:bg-white/10 flex items-center justify-center text-foreground',
              button_next: 'size-8 rounded hover:bg-white/10 flex items-center justify-center text-foreground',
              weekdays: 'flex',
              weekday: 'w-9 text-center text-xs font-medium text-foreground/70',
              week: 'flex',
              day: 'size-9 p-0',
              day_button: 'size-9 rounded text-sm hover:bg-white/10 text-foreground',
              selected: '!bg-primary !text-primary-foreground hover:!bg-primary/90',
              disabled: 'opacity-40 cursor-not-allowed',
              outside: 'text-foreground/40',
              today: 'font-semibold text-primary',
            }}
          />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
