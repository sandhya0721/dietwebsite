import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Order, Subscription } from '../types';
import { DashboardLayout } from '../components/DashboardLayout';
import { StatusBadge } from '../components/StatusBadge';

export function MemberDashboard() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.get('/orders/my'), api.get('/subscriptions/my')])
      .then(([ordersRes, subsRes]) => {
        setOrders(ordersRes.data.orders);
        setSubscriptions(subsRes.data.subscriptions);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const activeSub = subscriptions.find(
    (s) => s.status === 'active' || s.status === 'paused'
  );
  const upcomingDaily = orders.filter(
    (o) => o.orderType === 'subscription' && o.status !== 'Delivered' && o.status !== 'Cancelled'
  );

  return (
    <DashboardLayout
      title={`Welcome, ${user?.name?.split(' ')[0] || 'Member'}`}
      subtitle="Track your daily salad deliveries, active membership plan, and order history."
      action={
        <Link
          to="/menu"
          className="inline-flex items-center px-4 py-2 bg-[#1B5E37] text-white text-sm font-medium rounded-lg hover:bg-[#154A2B] whitespace-nowrap"
        >
          Order Fresh Bowl
        </Link>
      }
    >
      {/* Top Stat Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-white border border-[#DCE3D8] rounded-xl p-5">
          <p className="text-xs text-[#4D5E53]">Current Membership</p>
          <p className="text-xl font-semibold text-[#16221A] mt-1">
            {activeSub ? activeSub.plan.name : 'No Active Plan'}
          </p>
          <p className="text-xs text-[#4D5E53] mt-1 tabular-nums">
            {activeSub
              ? `${activeSub.plan.discountPercent}% discount on extra orders`
              : 'Subscribe for daily deliveries & discounts'}
          </p>
        </div>

        <div className="bg-white border border-[#DCE3D8] rounded-xl p-5">
          <p className="text-xs text-[#4D5E53]">Upcoming Scheduled Bowls</p>
          <p className="text-xl font-semibold text-[#16221A] mt-1 tabular-nums">
            {upcomingDaily.length}
          </p>
          <p className="text-xs text-[#4D5E53] mt-1">
            {activeSub ? `Slot: ${activeSub.timeSlot}` : 'Auto-scheduled on subscribe'}
          </p>
        </div>

        <div className="bg-white border border-[#DCE3D8] rounded-xl p-5">
          <p className="text-xs text-[#4D5E53]">Total Orders</p>
          <p className="text-xl font-semibold text-[#16221A] mt-1 tabular-nums">
            {orders.length}
          </p>
          <p className="text-xs text-[#4D5E53] mt-1">
            Delivered to {user?.address?.split(',')[0]}
          </p>
        </div>
      </div>

      {/* Active Subscription Banner */}
      {activeSub ? (
        <div className="bg-white border border-[#DCE3D8] rounded-xl p-6 mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-base font-semibold text-[#16221A]">
                {activeSub.plan.name} Monthly Plan
              </h2>
              <StatusBadge
                status={
                  activeSub.status.charAt(0).toUpperCase() +
                  activeSub.status.slice(1)
                }
              />
            </div>
            <p className="text-sm text-[#4D5E53] mt-1.5 tabular-nums">
              Period: {new Date(activeSub.startDate).toLocaleDateString()} –{' '}
              {new Date(activeSub.endDate).toLocaleDateString()} ·{' '}
              {activeSub.plan.saladsPerDay} bowl/day · {activeSub.timeSlot}
            </p>
          </div>
          <Link
            to="/subscription"
            className="px-4 py-2 text-sm font-medium text-[#16221A] bg-[#EEF2EC] rounded-lg hover:bg-[#DCE3D8] whitespace-nowrap shrink-0"
          >
            Manage Plan
          </Link>
        </div>
      ) : (
        <div className="bg-white border border-[#DCE3D8] rounded-xl p-6 mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-[#16221A]">
              Start a Monthly Salad Membership
            </h2>
            <p className="text-sm text-[#4D5E53] mt-1">
              Get up to 25% off extra orders and automated daily deliveries.
            </p>
          </div>
          <Link
            to="/plans"
            className="px-4 py-2 text-sm font-medium text-white bg-[#1B5E37] rounded-lg hover:bg-[#154A2B] whitespace-nowrap shrink-0"
          >
            Choose a Plan
          </Link>
        </div>
      )}

      {/* Recent Orders */}
      <div className="bg-white border border-[#DCE3D8] rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-[#EEF2EC] flex items-center justify-between">
          <h2 className="text-base font-semibold text-[#16221A]">
            Recent Orders
          </h2>
          <Link
            to="/orders"
            className="text-xs font-medium text-[#1B5E37] hover:underline"
          >
            View all orders →
          </Link>
        </div>

        {loading ? (
          <div className="p-6 text-sm text-[#4D5E53]">Loading orders...</div>
        ) : orders.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-sm text-[#4D5E53]">
              You haven&apos;t placed any orders yet.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[#EEF2EC]">
            {orders.slice(0, 5).map((order) => (
              <div
                key={order._id}
                className="px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div>
                  <div className="flex items-center gap-2 text-sm font-medium text-[#16221A]">
                    <span className="font-mono tabular-nums">
                      {order.orderNumber}
                    </span>
                    <span className="text-[#4D5E53]">·</span>
                    <span>
                      {order.items.map((i) => `${i.quantity}x ${i.name}`).join(', ')}
                    </span>
                  </div>
                  <p className="text-xs text-[#4D5E53] mt-0.5 tabular-nums">
                    Scheduled:{' '}
                    {new Date(order.scheduledFor).toLocaleDateString()} ·{' '}
                    {order.timeSlot} ·{' '}
                    {order.orderType === 'subscription'
                      ? 'Subscription Daily'
                      : 'One-Time Order'}
                  </p>
                </div>

                <div className="flex items-center gap-4 shrink-0">
                  <span className="text-sm font-semibold text-[#16221A] tabular-nums">
                    {order.paymentStatus === 'Included in Plan'
                      ? 'Included'
                      : `₹${order.totalAmount}`}
                  </span>
                  <StatusBadge status={order.status} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
