import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { Order } from '../types';
import { DashboardLayout } from '../components/DashboardLayout';
import { StatusBadge } from '../components/StatusBadge';

export function MyOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'one-time' | 'subscription'>(
    'all'
  );

  useEffect(() => {
    api
      .get('/orders/my')
      .then((res) => setOrders(res.data.orders))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    if (filter === 'all') return orders;
    return orders.filter((o) => o.orderType === filter);
  }, [orders, filter]);

  return (
    <DashboardLayout
      title="My Orders"
      subtitle="View your one-time salad orders and auto-scheduled subscription deliveries."
      action={
        <div className="flex items-center gap-1 p-1 bg-[#EEF2EC] rounded-lg">
          {[
            { key: 'all', label: 'All Orders' },
            { key: 'one-time', label: 'One-Time' },
            { key: 'subscription', label: 'Daily Plan' },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() =>
                setFilter(tab.key as 'all' | 'one-time' | 'subscription')
              }
              className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap cursor-pointer ${
                filter === tab.key
                  ? 'bg-white text-[#16221A] shadow-sm'
                  : 'text-[#4D5E53] hover:text-[#16221A]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      }
    >
      <div className="bg-white border border-[#DCE3D8] rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-6 text-sm text-[#4D5E53]">Loading order history...</div>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center">
            <p className="text-sm font-medium text-[#16221A]">
              No orders found in this view.
            </p>
            <Link
              to="/menu"
              className="mt-4 inline-block px-4 py-2 bg-[#1B5E37] text-white text-sm font-medium rounded-lg"
            >
              Order a Salad
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#DCE3D8] bg-[#F7F8F5] text-xs font-medium text-[#4D5E53]">
                  <th className="py-3 px-4">Order #</th>
                  <th className="py-3 px-4">Items</th>
                  <th className="py-3 px-4">Scheduled Date</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4 text-right">Total</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EEF2EC] text-sm">
                {filtered.map((order) => (
                  <tr key={order._id} className="hover:bg-[#F7F8F5]/60">
                    <td className="py-3.5 px-4 font-mono text-xs text-[#16221A] whitespace-nowrap">
                      {order.orderNumber}
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="font-medium text-[#16221A]">
                        {order.items
                          .map((i) => `${i.quantity}x ${i.name}`)
                          .join(', ')}
                      </p>
                      <p className="text-xs text-[#4D5E53] mt-0.5 truncate max-w-xs">
                        {order.deliveryAddress}
                      </p>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-[#4D5E53] tabular-nums whitespace-nowrap">
                      {new Date(order.scheduledFor).toLocaleDateString()} ·{' '}
                      {order.timeSlot}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-[#4D5E53] whitespace-nowrap">
                      {order.orderType === 'subscription'
                        ? 'Subscription'
                        : 'One-Time'}
                    </td>
                    <td className="py-3.5 px-4 text-right font-semibold text-[#16221A] tabular-nums whitespace-nowrap">
                      {order.paymentStatus === 'Included in Plan'
                        ? 'Plan'
                        : `₹${order.totalAmount}`}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <StatusBadge status={order.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
