import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Pause, Play, XCircle } from 'lucide-react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Subscription } from '../types';
import { DashboardLayout } from '../components/DashboardLayout';
import { StatusBadge } from '../components/StatusBadge';
import { ConfirmModal } from '../components/ConfirmModal';

export function MySubscription() {
  const { refreshUser } = useAuth();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [cancelTarget, setCancelTarget] = useState<Subscription | null>(null);

  const loadSubscriptions = () => {
    api
      .get('/subscriptions/my')
      .then((res) => setSubscriptions(res.data.subscriptions))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadSubscriptions();
  }, []);

  const handlePause = async (id: string) => {
    setActionLoading(true);
    try {
      await api.patch(`/subscriptions/${id}/pause`);
      loadSubscriptions();
      await refreshUser();
    } finally {
      setActionLoading(false);
    }
  };

  const handleResume = async (id: string) => {
    setActionLoading(true);
    try {
      await api.patch(`/subscriptions/${id}/resume`);
      loadSubscriptions();
      await refreshUser();
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmCancel = async () => {
    if (!cancelTarget) return;
    setActionLoading(true);
    try {
      await api.patch(`/subscriptions/${cancelTarget._id}/cancel`);
      setCancelTarget(null);
      loadSubscriptions();
      await refreshUser();
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <DashboardLayout
      title="My Subscription"
      subtitle="View your billing cycle, delivery window, and pause or cancel anytime."
      action={
        <Link
          to="/plans"
          className="inline-flex items-center px-4 py-2 bg-[#1B5E37] text-white text-sm font-medium rounded-lg hover:bg-[#154A2B] whitespace-nowrap"
        >
          Browse Plans
        </Link>
      }
    >
      {loading ? (
        <div className="p-6 text-sm text-[#4D5E53]">
          Loading subscription details...
        </div>
      ) : subscriptions.length === 0 ? (
        <div className="bg-white border border-[#DCE3D8] rounded-xl p-10 text-center">
          <p className="text-base font-medium text-[#16221A]">
            You do not have an active monthly subscription.
          </p>
          <p className="text-sm text-[#4D5E53] mt-1">
            Choose Basic, Standard, or Premium to start daily deliveries.
          </p>
          <Link
            to="/plans"
            className="mt-5 inline-block px-5 py-2.5 bg-[#1B5E37] text-white text-sm font-medium rounded-lg"
          >
            View Membership Plans
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {subscriptions.map((sub) => (
            <div
              key={sub._id}
              className="bg-white border border-[#DCE3D8] rounded-xl p-6"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#EEF2EC]">
                <div>
                  <div className="flex items-center gap-3">
                    <h2 className="text-xl font-semibold text-[#16221A]">
                      {sub.plan?.name} Plan
                    </h2>
                    <StatusBadge
                      status={
                        sub.status.charAt(0).toUpperCase() + sub.status.slice(1)
                      }
                    />
                  </div>
                  <p className="text-sm text-[#4D5E53] mt-1 tabular-nums">
                    {sub.plan?.saladsPerDay} salad
                    {sub.plan?.saladsPerDay > 1 ? 's' : ''}/day ·{' '}
                    {sub.plan?.daysPerMonth} days/month · ₹{sub.amountPaid} (Cash
                    on Delivery)
                  </p>
                </div>

                {(sub.status === 'active' || sub.status === 'paused') && (
                  <div className="flex flex-wrap items-center gap-2.5">
                    {sub.status === 'active' ? (
                      <button
                        type="button"
                        disabled={actionLoading}
                        onClick={() => handlePause(sub._id)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-[#16221A] bg-[#F7F8F5] border border-[#DCE3D8] rounded-lg hover:bg-[#EEF2EC] cursor-pointer"
                      >
                        <Pause className="w-3.5 h-3.5" />
                        <span>Pause Plan</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled={actionLoading}
                        onClick={() => handleResume(sub._id)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-white bg-[#1B5E37] rounded-lg hover:bg-[#154A2B] cursor-pointer"
                      >
                        <Play className="w-3.5 h-3.5" />
                        <span>Resume Plan</span>
                      </button>
                    )}

                    <button
                      type="button"
                      disabled={actionLoading}
                      onClick={() => setCancelTarget(sub)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-[#B91C1C] bg-[#FEF2F2] border border-[#FECACA] rounded-lg hover:bg-[#FEE2E2] cursor-pointer"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Cancel</span>
                    </button>
                  </div>
                )}
              </div>

              <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-xs text-[#4D5E53]">Start Date</p>
                  <p className="font-medium text-[#16221A] mt-0.5 tabular-nums">
                    {new Date(sub.startDate).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-[#4D5E53]">End Date</p>
                  <p className="font-medium text-[#16221A] mt-0.5 tabular-nums">
                    {new Date(sub.endDate).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-[#4D5E53]">Daily Time Slot</p>
                  <p className="font-medium text-[#16221A] mt-0.5">
                    {sub.timeSlot}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-[#4D5E53]">Orders Scheduled</p>
                  <p className="font-medium text-[#16221A] mt-0.5 tabular-nums">
                    {sub.dailyOrdersGenerated} daily orders
                  </p>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-[#EEF2EC] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-[#4D5E53]">
                <span>
                  Delivery Address: {sub.deliveryAddress}
                  {sub.postalCode ? ` (${sub.postalCode})` : ''}
                </span>
                <span>
                  Payment: Cash on Delivery ({sub.codStatus || 'Due on First Delivery'})
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmModal
        open={Boolean(cancelTarget)}
        title="Cancel Monthly Subscription?"
        description="Cancelling your subscription will stop all upcoming pending daily deliveries and remove your member discount. You can resubscribe anytime."
        confirmLabel="Confirm Cancellation"
        loading={actionLoading}
        onCancel={() => setCancelTarget(null)}
        onConfirm={handleConfirmCancel}
      />
    </DashboardLayout>
  );
}
