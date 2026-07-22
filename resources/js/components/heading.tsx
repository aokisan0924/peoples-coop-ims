import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Heading({
    title,
    description,
    variant = 'default',
    icon: Icon,
}: {
    title: string;
    description?: string;
    variant?: 'default' | 'small';
    icon?: LucideIcon;
}) {
    return (
        <header
            className={cn(
                'flex items-start gap-3',
                variant === 'small' ? '' : 'mb-8',
            )}
        >
            {Icon && (
                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[var(--pos-teal,#00a79b)]/10 text-[var(--pos-teal,#00a79b)]">
                    <Icon className="size-4" />
                </div>
            )}
            <div className="space-y-0.5">
                <h2
                    className={
                        variant === 'small'
                            ? 'text-base leading-none font-medium'
                            : 'text-xl font-semibold tracking-tight'
                    }
                >
                    {title}
                </h2>
                {description && (
                    <p className="text-sm text-muted-foreground">
                        {description}
                    </p>
                )}
            </div>
        </header>
    );
}
