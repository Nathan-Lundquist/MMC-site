import { cn } from '@/lib/utils';

type Variant = 'default' | 'secondary' | 'outline';

const variantStyles: Record<Variant, string> = {
  default: 'bg-brand text-white',
  secondary: 'bg-secondary text-secondary-foreground',
  outline: 'border border-input text-foreground',
};

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: Variant;
}

export function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-medium transition-colors',
        variantStyles[variant],
        className,
      )}
      {...props}
    />
  );
}
