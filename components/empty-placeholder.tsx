'use client';

import { cn } from '@/lib/utils';
import { BarChart, AlertCircle, FileQuestion, Package } from 'lucide-react';

interface EmptyPlaceholderProps extends React.HTMLAttributes<HTMLDivElement> {}

export function EmptyPlaceholder({
  className,
  children,
  ...props
}: EmptyPlaceholderProps) {
  return (
    <div
      className={cn(
        'flex min-h-[400px] flex-col items-center justify-center rounded-md border border-dashed p-8 text-center animate-in fade-in-50',
        className
      )}
      {...props}
    >
      <div className="mx-auto flex max-w-[420px] flex-col items-center justify-center text-center">
        {children}
      </div>
    </div>
  );
}

interface EmptyPlaceholderIconProps extends React.HTMLAttributes<HTMLDivElement> {
  name: 'bar-chart' | 'alert-circle' | 'file-question' | 'package';
}

EmptyPlaceholder.Icon = function EmptyPlaceholderIcon({
  name,
  className,
  ...props
}: EmptyPlaceholderIconProps) {
  const iconMap = {
    'bar-chart': BarChart,
    'alert-circle': AlertCircle,
    'file-question': FileQuestion,
    'package': Package
  };

  const Icon = iconMap[name];

  if (!Icon) {
    return null;
  }

  return (
    <div
      className={cn(
        'flex h-20 w-20 items-center justify-center rounded-full bg-muted',
        className
      )}
      {...props}
    >
      <Icon className="h-10 w-10" />
    </div>
  );
};

interface EmptyPlaceholderTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {}

EmptyPlaceholder.Title = function EmptyPlaceholderTitle({
  className,
  ...props
}: EmptyPlaceholderTitleProps) {
  return (
    <h2 className={cn('mt-6 text-xl font-semibold', className)} {...props} />
  );
};

interface EmptyPlaceholderDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {}

EmptyPlaceholder.Description = function EmptyPlaceholderDescription({
  className,
  ...props
}: EmptyPlaceholderDescriptionProps) {
  return (
    <p
      className={cn(
        'mt-3 mb-8 text-center text-sm font-normal leading-6 text-muted-foreground',
        className
      )}
      {...props}
    />
  );
};

interface EmptyPlaceholderActionProps extends React.HTMLAttributes<HTMLDivElement> {}

EmptyPlaceholder.Action = function EmptyPlaceholderAction({
  className,
  ...props
}: EmptyPlaceholderActionProps) {
  return <div className={cn('flex justify-center gap-2', className)} {...props} />;
};
