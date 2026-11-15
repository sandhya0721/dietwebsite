import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Check, AlertCircle, Banknote } from 'lucide-react';
import { api } from '../api/client';
import { Plan, Salad } from '../types';
import { useAuth } from '../context/AuthContext';

const TIME_SLOTS = [
  '8:00 AM - 9:30 AM',
  '12:00 PM - 1:30 PM',
  '7:00 PM - 8:30 PM',
];

export function Plans() {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [plans, setPlans] = useState<Plan[]>([]);
  const [salads, setSalads] = useState<Salad[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);

  const [recipientName, setRecipientName] = useState(user?.name || '');
  const [recipientPhone, setRecipientPhone] = useState(user?.phone || '');
  const [deliveryAddress, setDeliveryAddress] = useState(user?.address || '');
  const [postalCode, setPostalCode] = useState('560034');
  const [timeSlot, setTimeSlot] = useState('12:00 PM - 1:30 PM');
  const [preferredSaladId, setPreferredSaladId] = useState('');

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([api.get('/plans'), api.get('/salads')])
      .then(([plansRes, saladsRes]) => {
        const fetchedPlans: Plan[] = plansRes.data.plans;
        setPlans(fetchedPlans);
        setSalads(saladsRes.data.salads);

        const preselectId = searchParams.get('select');
        const found =
          fetchedPlans.find((p) => p._id === preselectId) ||
          fetchedPlans.find((p) => p.isPopular) ||
          fetchedPlans[0];
        if (found) setSelectedPlan(found);
      })
      .catch((err) =>
        setError(
          err?.response?.data?.message ||
            err?.message ||
            'Unable to load membership plans.'
        )
      )
      .finally(() => setLoading(false));
  }, [searchParams]);

  useEffect(() => {
    if (user) {
      if (!recipientName) setRecipientName(user.name);
      if (!recipientPhone) setRecipientPhone(user.phone);
      if (!deliveryAddress) setDeliveryAddress(user.address);
    }
  }, [user, recipientName, recipientPhone, deliveryAddress]);

  const handleSubscribeCod = async (plan: Plan) => {
    setError('');
    if (!user) {
      navigate('/login', { state: { from: `/plans?select=${plan._id}` } });
      return;
    }

    if (
      !recipientName.trim() ||
      !recipientPhone.trim() ||
      !deliveryAddress.trim() ||
      !postalCode.trim()
    ) {
      setError(
        'Please fill in your Name, Phone, Delivery Address, and Postal Code before activating your Cash on Delivery plan.'
      );
      return;
    }

    if (!/^\d{5,6}$/.test(postalCode.trim())) {
      setError('Please enter a valid 5 or 6 digit postal code.');
      return;
    }

    setSelectedPlan(plan);
    setSubmitting(true);

    try {
      await api.post('/payments/subscribe-cod', {
        planId: plan._id,
        recipientName: recipientName.trim(),
        recipientPhone: recipientPhone.trim(),
        deliveryAddress: deliveryAddress.trim(),
        postalCode: postalCode.trim(),
        timeSlot,
        preferredSaladId: preferredSaladId || null,
      });
      await refreshUser();
      navigate('/subscription');
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || 'Unable to activate subscription. Please check your details.';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-10">
      <div className="pb-6 border-b border-[#DCE3D8] flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl sm:text-4xl font-semibold text-[#16221A]">
            Membership Plans
          </h1>
          <p className="text-sm text-[#4D5E53] mt-1.5">
            Cash on Delivery only — zero online prepayment. Pay your monthly plan
            amount in cash on your first salad delivery.
          </p>
        </div>
        <div className="inline-flex items-center gap-2 text-xs font-medium text-[#15803D] bg-[#ECFDF3] border border-[#BBF7D0] px-3 py-2 rounded-lg shrink-0">
          <Banknote className="w-4 h-4 shrink-0" />
          <span>Cash on Delivery Only</span>
        </div>
      </div>

      {error && (
        <div className="mt-6 flex items-center gap-2.5 p-4 rounded-lg bg-[#FEF2F2] border border-[#FECACA] text-sm text-[#B91C1C]">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* COD Customer Verification & Delivery Preferences */}
      <div className="mt-8 bg-white border border-[#DCE3D8] rounded-xl p-6">
        <h2 className="text-base font-semibold text-[#16221A] mb-1">
          1. Cash on Delivery Verification &amp; Schedule
        </h2>
        <p className="text-xs text-[#4D5E53] mb-4">
          Enter your contact details and daily delivery slot. Our rider collects
          the plan fee in cash when your first bowl arrives.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-[#4D5E53] mb-1.5">
              Full Name
            </label>
            <input
              type="text"
              value={recipientName}
              onChange={(e) => setRecipientName(e.target.value)}
              placeholder="Recipient full name"
              className="w-full px-3.5 py-2.5 bg-[#F7F8F5] border border-[#DCE3D8] rounded-lg text-sm text-[#16221A] focus:outline-none focus:border-[#1B5E37]"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#4D5E53] mb-1.5">
              Phone Number
            </label>
            <input
              type="tel"
              value={recipientPhone}
              onChange={(e) => setRecipientPhone(e.target.value)}
              placeholder="+91 98450 44556"
              className="w-full px-3.5 py-2.5 bg-[#F7F8F5] border border-[#DCE3D8] rounded-lg text-sm text-[#16221A] focus:outline-none focus:border-[#1B5E37]"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#4D5E53] mb-1.5">
              Postal Code
            </label>
            <input
              type="text"
              value={postalCode}
              onChange={(e) => setPostalCode(e.target.value)}
              placeholder="560034"
              maxLength={6}
              className="w-full px-3.5 py-2.5 bg-[#F7F8F5] border border-[#DCE3D8] rounded-lg text-sm text-[#16221A] tabular-nums focus:outline-none focus:border-[#1B5E37]"
            />
          </div>

          <div className="sm:col-span-2 lg:col-span-1">
            <label className="block text-xs font-medium text-[#4D5E53] mb-1.5">
              Daily Delivery Address
            </label>
            <input
              type="text"
              value={deliveryAddress}
              onChange={(e) => setDeliveryAddress(e.target.value)}
              placeholder="House / Flat, Street, Area"
              className="w-full px-3.5 py-2.5 bg-[#F7F8F5] border border-[#DCE3D8] rounded-lg text-sm text-[#16221A] focus:outline-none focus:border-[#1B5E37]"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#4D5E53] mb-1.5">
              Preferred Time Slot
            </label>
            <select
              value={timeSlot}
              onChange={(e) => setTimeSlot(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-[#F7F8F5] border border-[#DCE3D8] rounded-lg text-sm text-[#16221A] focus:outline-none focus:border-[#1B5E37]"
            >
              {TIME_SLOTS.map((slot) => (
                <option key={slot} value={slot}>
                  {slot}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#4D5E53] mb-1.5">
              Daily Bowl Selection
            </label>
            <select
              value={preferredSaladId}
              onChange={(e) => setPreferredSaladId(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-[#F7F8F5] border border-[#DCE3D8] rounded-lg text-sm text-[#16221A] focus:outline-none focus:border-[#1B5E37]"
            >
              <option value="">Chef&apos;s Daily Rotation (Recommended)</option>
              {salads.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.name} ({s.calories} kcal)
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Plan Cards */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        {loading
          ? [1, 2, 3].map((n) => (
              <div
                key={n}
                className="h-[420px] rounded-xl bg-white border border-[#DCE3D8] animate-pulse"
              />
            ))
          : plans.map((plan) => {
              const isCurrent = user?.activePlan?._id === plan._id;
              return (
                <div
                  key={plan._id}
                  onClick={() => setSelectedPlan(plan)}
                  className={`bg-white rounded-xl p-6 flex flex-col border transition-colors cursor-pointer ${
                    selectedPlan?._id === plan._id
                      ? 'border-[#1B5E37] ring-1 ring-[#1B5E37]'
                      : 'border-[#DCE3D8] hover:border-[#4D5E53]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-xl font-semibold text-[#16221A]">
                      {plan.name}
                    </h3>
                    {plan.isPopular && (
                      <span className="text-xs font-medium text-[#1B5E37]">
                        Recommended
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#4D5E53] mt-1">
                    {plan.targetAudience}
                  </p>

                  <div className="mt-5 pb-5 border-b border-[#EEF2EC]">
                    <span className="text-3xl font-semibold text-[#16221A] tabular-nums">
                      ₹{plan.price}
                    </span>
                    <span className="text-xs text-[#4D5E53] ml-1.5">
                      / month (Cash on Delivery)
                    </span>
                    <p className="text-sm text-[#16221A] mt-2 font-medium tabular-nums">
                      {plan.saladsPerDay} salad{plan.saladsPerDay > 1 ? 's' : ''}{' '}
                      / day · {plan.daysPerMonth} days / month
                    </p>
                    <p className="text-xs text-[#4D5E53] mt-1 tabular-nums">
                      Includes {plan.discountPercent}% off extra orders
                      {plan.freeDelivery ? ' & free delivery' : ''}
                    </p>
                  </div>

                  <p className="text-sm text-[#4D5E53] mt-4 leading-relaxed">
                    {plan.description}
                  </p>

                  <ul className="mt-4 space-y-2.5 flex-1">
                    {plan.features.map((feat) => (
                      <li
                        key={feat}
                        className="flex items-start gap-2 text-sm text-[#16221A]"
                      >
                        <Check className="w-4 h-4 text-[#1B5E37] shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>

                  <button
                    type="button"
                    disabled={submitting}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSubscribeCod(plan);
                    }}
                    className={`mt-6 w-full py-2.5 px-4 rounded-lg text-sm font-medium transition-colors cursor-pointer disabled:opacity-60 ${
                      isCurrent
                        ? 'bg-[#EEF2EC] text-[#1B5E37] border border-[#1B5E37]'
                        : 'bg-[#1B5E37] text-white hover:bg-[#154A2B]'
                    }`}
                  >
                    {submitting && selectedPlan?._id === plan._id
                      ? 'Activating Plan...'
                      : isCurrent
                      ? 'Renew Plan (COD)'
                      : user
                      ? `Start ${plan.name} (Pay on Delivery)`
                      : 'Sign In to Subscribe'}
                  </button>
                </div>
              );
            })}
      </div>
    </div>
  );
}
