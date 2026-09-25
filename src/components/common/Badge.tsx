import React from 'react';
import { DeadlineRisk, PriorityLabel, TaskStatus } from '../../types';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'purple' | 'neutral';
  size?: 'sm' | 'md';
  dot?: boolean;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'sm',
  dot = false,
  className = '',
}) => {
  const variants = {
    default: 'bg-slate-100 text-slate-700 border-slate-200',
    neutral: 'bg-slate-100 text-slate-600 border-slate-200',
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    warning: 'bg-amber-50 text-amber-700 border-amber-200',
    danger: 'bg-rose-50 text-rose-700 border-rose-200',
    info: 'bg-teal-50 text-teal-700 border-teal-200',
    purple: 'bg-emerald-100/60 text-emerald-800 border-emerald-300/80',
  };

  const dotColors = {
    default: 'bg-slate-400',
    neutral: 'bg-slate-400',
    success: 'bg-emerald-500',
    warning: 'bg-amber-500',
    danger: 'bg-rose-500',
    info: 'bg-teal-500',
    purple: 'bg-emerald-600',
  };

  const sizes = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-xs font-medium px-2.5 py-1',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md border font-mono tracking-tight ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${dotColors[variant]}`} />}
      {children}
    </span>
  );
};

export const StatusBadge: React.FC<{ status: TaskStatus; className?: string }> = ({ status, className }) => {
  switch (status) {
    case 'COMPLETED':
      return <Badge variant="success" dot className={className}>COMPLETED</Badge>;
    case 'IN_PROGRESS':
      return <Badge variant="info" dot className={className}>IN PROGRESS</Badge>;
    case 'BLOCKED':
      return <Badge variant="danger" dot className={className}>BLOCKED</Badge>;
    case 'TODO':
    default:
      return <Badge variant="default" dot className={className}>TODO</Badge>;
  }
};

export const PriorityBadge: React.FC<{ priority: PriorityLabel; score?: number; className?: string }> = ({
  priority,
  score,
  className,
}) => {
  let variant: 'danger' | 'warning' | 'purple' | 'neutral' = 'neutral';
  if (priority === 'CRITICAL') variant = 'danger';
  else if (priority === 'HIGH') variant = 'warning';
  else if (priority === 'MEDIUM') variant = 'purple';
  else variant = 'neutral';

  return (
    <Badge variant={variant} className={className}>
      {priority} {score !== undefined && <span className="opacity-75">({score})</span>}
    </Badge>
  );
};

export const RiskBadge: React.FC<{ risk: DeadlineRisk; className?: string }> = ({ risk, className }) => {
  switch (risk) {
    case 'CRITICAL':
      return <Badge variant="danger" dot className={className}>CRITICAL RISK</Badge>;
    case 'HIGH':
      return <Badge variant="warning" dot className={className}>HIGH RISK</Badge>;
    case 'MEDIUM':
      return <Badge variant="purple" className={className}>MEDIUM RISK</Badge>;
    case 'LOW':
    default:
      return <Badge variant="success" className={className}>LOW RISK</Badge>;
  }
};
