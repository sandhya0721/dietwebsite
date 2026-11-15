import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { Order, Subscription } from '../types';
import { DashboardLayout } from '../components/DashboardLayout';
import { StatusBadge } from '../components/StatusBadge';

interface OverviewMetrics {
  totalMembers: number;
  activeMembers: number;
  totalOrders: number;
  pendingOrders: number;
  activeSubscriptions: number;
  totalSalads: number;
  totalRevenue: number;
}

export function AdminDashboard() {
  const [metrics, setMetrics] = useState<OverviewMetrics | null>(null);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.get('/members/overview'), api.get('/subscriptions')])
      .then(([overviewRes, subsRes]) => {
        setMetrics(overviewRes.data.metrics);
        setRecentOrders(overviewRes.data.recentOrders);
        setSubscriptions(subsRes.data.subscriptions);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <DashboardLayout
      title="Admin Overview"
      subtitle="Monitor daily kitchen operations, active memberships, and member orders."
      action={
        <Link
          to="/admin/members"
          className="inline-flex items-center px-4 py-2 bg-[#1B5E37] text-white text-sm font-medium rounded-lg hover:bg-[#154A2B] whitespace-nowrap"
        >
          Manage Members
        </Link>
      }
    >
      {/* KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white border border-[#DCE3D8] rounded-xl p-5">
          <p className="text-xs text-[#4D5E53]">Active Members</p>
          <p className="text-2xl font-semibold text-[#16221A] mt-1 tabular-nums">
            {loading ? '—' : metrics?.activeMembers ?? 0}
          </p>
          <p className="text-xs text-[#4D5E53] mt-1 tabular-nums">
            {metrics?.totalMembers ?? 0} total registered
          </p>
        </div>

        <div className="bg-white border border-[#DCE3D8] rounded-xl p-5">
          <p className="text-xs text-[#4D5E53]">Active Subscriptions</p>
          <p className="text-2xl font-semibold text-[#16221A] mt-1 tabular-nums">
            {loading ? '—' : metrics?.activeSubscriptions ?? 0}
          </p>
          <p className="text-xs text-[#4D5E53] mt-1">Monthly plans</p>
        </div>

        <div className="bg-white border border-[#DCE3D8] rounded-xl p-5">
          <p className="text-xs text-[#4D5E53]">Kitchen Queue</p>
          <p className="text-2xl font-semibold text-[#16221A] mt-1 tabular-nums">
            {loading ? '—' : metrics?.pendingOrders ?? 0}
          </p>
          <p className="text-xs text-[#4D5E53] mt-1">Pending &amp; preparing</p>
        </div>

        <div className="bg-white border border-[#DCE3D8] rounded-xl p-5">
          <p className="text-xs text-[#4D5E53]">Total Revenue</p>
          <p className="text-2xl font-semibold text-[#1B5E37] mt-1 tabular-nums">
            ₹{loading ? '—' : (metrics?.totalRevenue ?? 0).toLocaleString()}
          </p>
          <p className="text-xs text-[#4D5E53] mt-1 tabular-nums">
            {metrics?.totalOrders ?? 0} total orders
          </p>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="bg-white border border-[#DCE3D8] rounded-xl overflow-hidden mb-8">
        <div className="px-6 py-4 border-b border-[#EEF2EC] flex items-center justify-between">
          <h2 className="text-base font-semibold text-[#16221A]">
            Recent Orders
          </h2>
          <Link
            to="/admin/orders"
            className="text-xs font-medium text-[#1B5E37] hover:underline"
          >
            Manage all orders →
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#DCE3D8] bg-[#F7F8F5] text-xs font-medium text-[#4D5E53]">
                <th className="py-3 px-4">Order #</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Items</th>
                <th className="py-3 px-4 text-right">Amount</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EEF2EC] text-sm">
              {recentOrders.map((order) => {
                const customer =
                  typeof order.user === 'object' ? order.user : null;
                return (
                  <tr key={order._id} className="hover:bg-[#F7F8F5]/60">
                    <td className="py-3 px-4 font-mono text-xs text-[#16221A] whitespace-nowrap">
                      {order.orderNumber}
                    </td>
                    <td className="py-3 px-4 text-[#16221A] whitespace-nowrap">
                      {customer?.name || 'Member'}
                    </td>
                    <td className="py-3 px-4 text-[#4D5E53] truncate max-w-xs">
                      {order.items
                        .map((i) => `${i.quantity}x ${i.name}`)
                        .join(', ')}
                    </td>
                    <td className="py-3 px-4 text-right font-semibold text-[#16221A] tabular-nums whitespace-nowrap">
                      {order.paymentStatus === 'Included in Plan'
                        ? 'Plan'
                        : `₹${order.totalAmount}`}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <StatusBadge status={order.status} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Subscriptions Overview */}
      <div className="bg-white border border-[#DCE3D8] rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-[#EEF2EC]">
          <h2 className="text-base font-semibold text-[#16221A]">
            Member Subscriptions
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#DCE3D8] bg-[#F7F8F5] text-xs font-medium text-[#4D5E53]">
                <th className="py-3 px-4">Member</th>
                <th className="py-3 px-4">Plan</th>
                <th className="py-3 px-4">Period</th>
                <th className="py-3 px-4 text-right">Paid</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EEF2EC] text-sm">
              {subscriptions.slice(0, 6).map((sub) => {
                const member = typeof sub.user === 'object' ? sub.user : null;
                return (
                  <tr key={sub._id} className="hover:bg-[#F7F8F5]/60">
                    <td className="py-3 px-4 font-medium text-[#16221A] whitespace-nowrap">
                      {member?.name || 'Member'}
                    </td>
                    <td className="py-3 px-4 text-[#4D5E53] whitespace-nowrap">
                      {sub.plan?.name} ({sub.plan?.saladsPerDay}/day)
                    </td>
                    <td className="py-3 px-4 text-xs text-[#4D5E53] tabular-nums whitespace-nowrap">
                      {new Date(sub.startDate).toLocaleDateString()} –{' '}
                      {new Date(sub.endDate).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-right font-semibold text-[#16221A] tabular-nums whitespace-nowrap">
                      ₹{sub.amountPaid}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <StatusBadge
                        status={
                          sub.status.charAt(0).toUpperCase() + sub.status.slice(1)
                        }
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
}
