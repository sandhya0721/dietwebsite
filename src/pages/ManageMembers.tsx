import React, { useEffect, useState } from 'react';
import { Plus, Search, UserX, RotateCcw, X, AlertCircle } from 'lucide-react';
import { api } from '../api/client';
import { Plan, User } from '../types';
import { DashboardLayout } from '../components/DashboardLayout';
import { StatusBadge } from '../components/StatusBadge';
import { ConfirmModal } from '../components/ConfirmModal';

export function ManageMembers() {
  const [members, setMembers] = useState<User[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [planFilter, setPlanFilter] = useState('all');

  // Add Member modal state
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    password: '',
    planId: '',
  });
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Soft-delete confirmation state
  const [removeTarget, setRemoveTarget] = useState<User | null>(null);
  const [removing, setRemoving] = useState(false);

  const loadData = () => {
    setLoading(true);
    Promise.all([
      api.get('/members', {
        params: {
          search: search.trim() || undefined,
          status: statusFilter,
          plan: planFilter,
        },
      }),
      api.get('/plans'),
    ])
      .then(([membersRes, plansRes]) => {
        setMembers(membersRes.data.members);
        setPlans(plansRes.data.plans);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, planFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadData();
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (form.password.length < 6) {
      setFormError('Password must be at least 6 characters.');
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/members', {
        ...form,
        planId: form.planId || undefined,
      });
      setAddOpen(false);
      setForm({
        name: '',
        email: '',
        phone: '',
        address: '',
        password: '',
        planId: '',
      });
      loadData();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || 'Unable to add member.';
      setFormError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmRemove = async () => {
    if (!removeTarget) return;
    setRemoving(true);
    try {
      await api.delete(`/members/${removeTarget._id}`);
      setRemoveTarget(null);
      loadData();
    } finally {
      setRemoving(false);
    }
  };

  const handleReactivate = async (id: string) => {
    try {
      await api.patch(`/members/${id}/reactivate`);
      loadData();
    } catch {
      // ignore
    }
  };

  return (
    <DashboardLayout
      title="Manage Members"
      subtitle="Add new members, assign starter plans, search records, or deactivate accounts."
      action={
        <button
          type="button"
          onClick={() => {
            setFormError('');
            setAddOpen(true);
          }}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#1B5E37] text-white text-sm font-medium rounded-lg hover:bg-[#154A2B] whitespace-nowrap cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add Member</span>
        </button>
      }
    >
      {/* Search & Filters */}
      <div className="bg-white border border-[#DCE3D8] rounded-xl p-4 mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <form onSubmit={handleSearchSubmit} className="flex gap-2 flex-1 max-w-md">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#4D5E53] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, email, or phone..."
              className="w-full pl-9 pr-3 py-2 bg-[#F7F8F5] border border-[#DCE3D8] rounded-lg text-sm text-[#16221A] focus:outline-none focus:border-[#1B5E37]"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 text-xs font-medium text-[#16221A] bg-[#EEF2EC] rounded-lg hover:bg-[#DCE3D8] cursor-pointer"
          >
            Search
          </button>
        </form>

        <div className="flex flex-wrap items-center gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            aria-label="Filter by member status"
            className="px-3 py-2 bg-[#F7F8F5] border border-[#DCE3D8] rounded-lg text-xs font-medium text-[#16221A]"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active Only</option>
            <option value="inactive">Deactivated</option>
          </select>

          <select
            value={planFilter}
            onChange={(e) => setPlanFilter(e.target.value)}
            aria-label="Filter by membership plan"
            className="px-3 py-2 bg-[#F7F8F5] border border-[#DCE3D8] rounded-lg text-xs font-medium text-[#16221A]"
          >
            <option value="all">All Plans</option>
            <option value="none">No Plan</option>
            {plans.map((p) => (
              <option key={p._id} value={p._id}>
                {p.name} Plan
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Members Table */}
      <div className="bg-white border border-[#DCE3D8] rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-6 text-sm text-[#4D5E53]">Loading members...</div>
        ) : members.length === 0 ? (
          <div className="p-10 text-center">
            <p className="text-sm font-medium text-[#16221A]">
              No members match your search or filter.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#DCE3D8] bg-[#F7F8F5] text-xs font-medium text-[#4D5E53]">
                  <th className="py-3 px-4">Member</th>
                  <th className="py-3 px-4">Phone</th>
                  <th className="py-3 px-4">Plan</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EEF2EC] text-sm">
                {members.map((member) => (
                  <tr key={member._id} className="hover:bg-[#F7F8F5]/60">
                    <td className="py-3.5 px-4">
                      <p className="font-medium text-[#16221A]">
                        {member.name}
                      </p>
                      <p className="text-xs text-[#4D5E53]">{member.email}</p>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-[#4D5E53] tabular-nums whitespace-nowrap">
                      {member.phone}
                    </td>
                    <td className="py-3.5 px-4 text-xs font-medium text-[#16221A] whitespace-nowrap">
                      {member.activePlan ? member.activePlan.name : 'None'}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <StatusBadge
                        status={member.isActive ? 'Active' : 'Inactive'}
                      />
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      {member.isActive ? (
                        <button
                          type="button"
                          onClick={() => setRemoveTarget(member)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-[#B91C1C] bg-[#FEF2F2] border border-[#FECACA] rounded-md hover:bg-[#FEE2E2] cursor-pointer"
                        >
                          <UserX className="w-3.5 h-3.5" />
                          <span>Remove</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleReactivate(member._id)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-[#1B5E37] bg-[#EEF2EC] border border-[#C6D6C2] rounded-md hover:bg-[#DCE3D8] cursor-pointer"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Reactivate</span>
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Member Modal */}
      {addOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white border border-[#DCE3D8] rounded-xl max-w-lg w-full p-6 shadow-xl">
            <div className="flex items-center justify-between pb-4 border-b border-[#EEF2EC]">
              <h2 className="text-lg font-semibold text-[#16221A]">
                Add New Member
              </h2>
              <button
                type="button"
                onClick={() => setAddOpen(false)}
                className="p-1 text-[#4D5E53] hover:text-[#16221A] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {formError && (
              <div className="mt-4 flex items-center gap-2 p-3 rounded-lg bg-[#FEF2F2] border border-[#FECACA] text-xs text-[#B91C1C]">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleAddMember} className="mt-4 space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-medium text-[#4D5E53] mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) =>
                      setForm({ ...form, name: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-[#F7F8F5] border border-[#DCE3D8] rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#4D5E53] mb-1">
                    Phone
                  </label>
                  <input
                    type="tel"
                    required
                    value={form.phone}
                    onChange={(e) =>
                      setForm({ ...form, phone: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-[#F7F8F5] border border-[#DCE3D8] rounded-lg text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#4D5E53] mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) =>
                    setForm({ ...form, email: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-[#F7F8F5] border border-[#DCE3D8] rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#4D5E53] mb-1">
                  Delivery Address
                </label>
                <input
                  type="text"
                  required
                  value={form.address}
                  onChange={(e) =>
                    setForm({ ...form, address: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-[#F7F8F5] border border-[#DCE3D8] rounded-lg text-sm"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-medium text-[#4D5E53] mb-1">
                    Initial Password
                  </label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={form.password}
                    onChange={(e) =>
                      setForm({ ...form, password: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-[#F7F8F5] border border-[#DCE3D8] rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#4D5E53] mb-1">
                    Membership Plan
                  </label>
                  <select
                    value={form.planId}
                    onChange={(e) =>
                      setForm({ ...form, planId: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-[#F7F8F5] border border-[#DCE3D8] rounded-lg text-sm"
                  >
                    <option value="">No Plan (Pay-as-you-go)</option>
                    {plans.map((p) => (
                      <option key={p._id} value={p._id}>
                        {p.name} (₹{p.price}/mo)
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setAddOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-[#16221A] bg-white border border-[#DCE3D8] rounded-lg hover:bg-[#EEF2EC] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 text-sm font-medium text-white bg-[#1B5E37] rounded-lg hover:bg-[#154A2B] cursor-pointer disabled:opacity-60"
                >
                  {submitting ? 'Adding...' : 'Create Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Soft Delete Confirmation Modal */}
      <ConfirmModal
        open={Boolean(removeTarget)}
        title={`Deactivate ${removeTarget?.name}?`}
        description="This performs a soft delete (isActive = false). Their historical orders remain intact, active subscriptions are cancelled, and they will no longer be able to sign in."
        confirmLabel="Deactivate Member"
        loading={removing}
        onCancel={() => setRemoveTarget(null)}
        onConfirm={handleConfirmRemove}
      />
    </DashboardLayout>
  );
}
