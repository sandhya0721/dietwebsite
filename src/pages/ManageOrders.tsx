import { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import { api } from '../api/client';
import { Order, OrderStatus } from '../types';
import { DashboardLayout } from '../components/DashboardLayout';
import { StatusBadge } from '../components/StatusBadge';

const STATUS_OPTIONS: OrderStatus[] = [
  'Pending',
  'Preparing',
  'Out for Delivery',
  'Delivered',
  'Cancelled',
];

export function ManageOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');
  const [search, setSearch] = useState('');

  const loadOrders = () => {
    setLoading(true);
    api
      .get('/orders', {
        params: {
          status: statusFilter,
          orderType: typeFilter,
          search: search.trim() || undefined,
        },
      })
      .then((res) => setOrders(res.data.orders))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, typeFilter]);

  const handleStatusChange = async (orderId: string, nextStatus: OrderStatus) => {
    try {
      const { data } = await api.patch(`/orders/${orderId}/status`, {
        status: nextStatus,
      });
      setOrders((prev) =>
        prev.map((o) => (o._id === orderId ? data.order : o))
      );
    } catch {
      // ignore
    }
  };

  return (
    <DashboardLayout
      title="Manage Orders"
      subtitle="Update kitchen preparation and delivery status across one-time and subscription orders."
    >
      {/* Filters */}
      <div className="bg-white border border-[#DCE3D8] rounded-xl p-4 mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            loadOrders();
          }}
          className="flex gap-2 flex-1 max-w-sm"
        >
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#4D5E53] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search order #..."
              className="w-full pl-9 pr-3 py-2 bg-[#F7F8F5] border border-[#DCE3D8] rounded-lg text-sm"
            />
          </div>
          <button
            type="submit"
            className="px-3.5 py-2 text-xs font-medium bg-[#EEF2EC] text-[#16221A] rounded-lg hover:bg-[#DCE3D8] cursor-pointer"
          >
            Find
          </button>
        </form>

        <div className="flex flex-wrap items-center gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            aria-label="Filter by order status"
            className="px-3 py-2 bg-[#F7F8F5] border border-[#DCE3D8] rounded-lg text-xs font-medium text-[#16221A]"
          >
            <option value="All">All Statuses</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            aria-label="Filter by order type"
            className="px-3 py-2 bg-[#F7F8F5] border border-[#DCE3D8] rounded-lg text-xs font-medium text-[#16221A]"
          >
            <option value="All">All Types</option>
            <option value="one-time">One-Time Orders</option>
            <option value="subscription">Subscription Daily</option>
          </select>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white border border-[#DCE3D8] rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-6 text-sm text-[#4D5E53]">Loading orders...</div>
        ) : orders.length === 0 ? (
          <div className="p-10 text-center text-sm text-[#4D5E53]">
            No orders match the selected filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#DCE3D8] bg-[#F7F8F5] text-xs font-medium text-[#4D5E53]">
                  <th className="py-3 px-4">Order #</th>
                  <th className="py-3 px-4">Member &amp; Address</th>
                  <th className="py-3 px-4">Items</th>
                  <th className="py-3 px-4">Schedule</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Update Stage</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EEF2EC] text-sm">
                {orders.map((order) => {
                  const member =
                    typeof order.user === 'object' ? order.user : null;
                  return (
                    <tr key={order._id} className="hover:bg-[#F7F8F5]/60">
                      <td className="py-3.5 px-4 font-mono text-xs text-[#16221A] whitespace-nowrap">
                        {order.orderNumber}
                      </td>
                      <td className="py-3.5 px-4">
                        <p className="font-medium text-[#16221A]">
                          {member?.name || 'Member'}
                        </p>
                        <p className="text-xs text-[#4D5E53] truncate max-w-[220px]">
                          {order.deliveryAddress}
                        </p>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-[#16221A] max-w-[220px]">
                        {order.items
                          .map((i) => `${i.quantity}x ${i.name}`)
                          .join(', ')}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-[#4D5E53] tabular-nums whitespace-nowrap">
                        {new Date(order.scheduledFor).toLocaleDateString()} ·{' '}
                        {order.timeSlot}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <StatusBadge status={order.status} />
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <select
                          value={order.status}
                          onChange={(e) =>
                            handleStatusChange(
                              order._id,
                              e.target.value as OrderStatus
                            )
                          }
                          aria-label={`Update status for ${order.orderNumber}`}
                          className="px-2.5 py-1.5 bg-[#F7F8F5] border border-[#DCE3D8] rounded-md text-xs font-medium text-[#16221A] cursor-pointer"
                        >
                          {STATUS_OPTIONS.map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
