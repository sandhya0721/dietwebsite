import {
  CheckCircle2,
  Clock,
  PauseCircle,
  Truck,
  XCircle,
  ChefHat,
} from 'lucide-react';

interface StatusBadgeProps {
  status: string;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const normalized = status.toLowerCase();

  if (
    normalized === 'delivered' ||
    normalized === 'active' ||
    normalized === 'paid'
  ) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#15803D] bg-[#ECFDF3] border border-[#BBF7D0] px-2.5 py-1 rounded-md whitespace-nowrap">
        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
        <span>{status}</span>
      </span>
    );
  }

  if (normalized === 'preparing') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#1B5E37] bg-[#EEF2EC] border border-[#C6D6C2] px-2.5 py-1 rounded-md whitespace-nowrap">
        <ChefHat className="w-3.5 h-3.5 shrink-0" />
        <span>{status}</span>
      </span>
    );
  }

  if (normalized === 'out for delivery') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#0369A1] bg-[#F0F9FF] border border-[#BAE6FD] px-2.5 py-1 rounded-md whitespace-nowrap">
        <Truck className="w-3.5 h-3.5 shrink-0" />
        <span>{status}</span>
      </span>
    );
  }

  if (normalized === 'paused' || normalized === 'pending') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#B45309] bg-[#FFFBEB] border border-[#FDE68A] px-2.5 py-1 rounded-md whitespace-nowrap">
        {normalized === 'paused' ? (
          <PauseCircle className="w-3.5 h-3.5 shrink-0" />
        ) : (
          <Clock className="w-3.5 h-3.5 shrink-0" />
        )}
        <span>{status}</span>
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#B91C1C] bg-[#FEF2F2] border border-[#FECACA] px-2.5 py-1 rounded-md whitespace-nowrap">
      <XCircle className="w-3.5 h-3.5 shrink-0" />
      <span>{status}</span>
    </span>
  );
}
