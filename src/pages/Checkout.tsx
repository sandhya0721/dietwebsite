import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, AlertCircle, Banknote } from 'lucide-react';
import { api } from '../api/client';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { Order } from '../types';

const TIME_SLOTS = [
  '8:00 AM - 9:30 AM',
  '12:00 PM - 1:30 PM',
  '7:00 PM - 8:30 PM',
];

export function Checkout() {
  const { items, subtotal, clearCart } = useCart();
  const { user } = useAuth();

  const [recipientName, setRecipientName] = useState(user?.name || '');
  const [recipientPhone, setRecipientPhone] = useState(user?.phone || '');
  const [deliveryAddress, setDeliveryAddress] = useState(user?.address || '');
  const [postalCode, setPostalCode] = useState('560034');
  const [timeSlot, setTimeSlot] = useState('12:00 PM - 1:30 PM');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [confirmedOrder, setConfirmedOrder] = useState<Order | null>(null);

  const activePlan = user?.activePlan;
  const discountPercent = activePlan?.discountPercent || 0;
  const discountAmount = Math.round((subtotal * discountPercent) / 100);
  const afterDiscount = Math.max(0, subtotal - discountAmount);
  const freeDelivery = Boolean(activePlan?.freeDelivery) || afterDiscount >= 499;
  const deliveryFee = freeDelivery ? 0 : 40;
  const totalAmount = afterDiscount + deliveryFee;

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (
      !recipientName.trim() ||
      !recipientPhone.trim() ||
      !deliveryAddress.trim() ||
      !postalCode.trim()
    ) {
      setError(
        'Please complete Name, Phone, Delivery Address, and Postal Code.'
      );
      return;
    }

    if (!/^\d{5,6}$/.test(postalCode.trim())) {
      setError('Please enter a valid 5 or 6 digit postal code.');
      return;
    }

    setSubmitting(true);
    try {
      const payloadItems = items.map((item) => ({
        itemType: item.itemType,
        saladId: item.saladId,
        customSaladId: item.customSaladId,
        inlineCustom: item.inlineCustom,
        quantity: item.quantity,
        specialInstructions: item.specialInstructions,
      }));

      const { data } = await api.post('/orders', {
        items: payloadItems,
        recipientName: recipientName.trim(),
        recipientPhone: recipientPhone.trim(),
        deliveryAddress: deliveryAddress.trim(),
        postalCode: postalCode.trim(),
        timeSlot,
      });
      setConfirmedOrder(data.order);
      clearCart();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || 'Unable to place order. Please try again.';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (confirmedOrder) {
    return (
      <div className="max-w-[720px] mx-auto px-4 sm:px-6 py-14">
        <div className="bg-white border border-[#DCE3D8] rounded-xl p-8">
          <div className="flex items-center gap-3 text-[#15803D]">
            <CheckCircle2 className="w-7 h-7 shrink-0" />
            <div>
              <p className="text-xs font-medium uppercase tracking-wide">
                Cash on Delivery Confirmed
              </p>
              <h1 className="font-display text-2xl font-semibold text-[#16221A]">
                Order #{confirmedOrder.orderNumber} — Preparing Fresh
              </h1>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-[#EEF2EC] space-y-2 text-sm text-[#4D5E53]">
            <p>
              <strong className="text-[#16221A]">Recipient:</strong>{' '}
              {confirmedOrder.recipientName} · {confirmedOrder.recipientPhone}
            </p>
            <p>
              <strong className="text-[#16221A]">Delivery Address:</strong>{' '}
              {confirmedOrder.deliveryAddress}{' '}
              {confirmedOrder.postalCode ? `(${confirmedOrder.postalCode})` : ''}
            </p>
            <p>
              <strong className="text-[#16221A]">Time Slot:</strong>{' '}
              {confirmedOrder.timeSlot}
            </p>
            <p>
              <strong className="text-[#16221A]">Payment Method:</strong> Cash on
              Delivery — Pay{' '}
              <span className="tabular-nums font-semibold text-[#16221A]">
                ₹{confirmedOrder.totalAmount}
              </span>{' '}
              at doorstep
              {confirmedOrder.discountPercent > 0 && (
                <span className="ml-2 text-xs text-[#15803D]">
                  ({confirmedOrder.discountPercent}% member discount applied)
                </span>
              )}
            </p>
          </div>

          <div className="mt-6 pt-6 border-t border-[#EEF2EC] space-y-2">
            {confirmedOrder.items.map((item, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between text-sm text-[#16221A]"
              >
                <span>
                  {item.quantity}x {item.name}
                </span>
                <span className="tabular-nums">
                  ₹{item.unitPrice * item.quantity}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to="/orders"
              className="px-5 py-2.5 bg-[#1B5E37] text-white text-sm font-medium rounded-lg hover:bg-[#154A2B]"
            >
              View Order History
            </Link>
            <Link
              to="/menu"
              className="px-5 py-2.5 bg-white border border-[#DCE3D8] text-[#16221A] text-sm font-medium rounded-lg hover:bg-[#EEF2EC]"
            >
              Back to Menu
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="max-w-[720px] mx-auto px-4 sm:px-6 py-16 text-center">
        <p className="text-base font-medium text-[#16221A]">
          No items in your cart to check out.
        </p>
        <Link
          to="/menu"
          className="mt-4 inline-block px-5 py-2.5 bg-[#1B5E37] text-white text-sm font-medium rounded-lg"
        >
          Browse Menu
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-10">
      <div className="pb-6 border-b border-[#DCE3D8] flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl sm:text-4xl font-semibold text-[#16221A]">
            Cash on Delivery Checkout
          </h1>
          <p className="text-sm text-[#4D5E53] mt-1.5">
            Verify your delivery details below. Pay in cash when your order
            arrives — no online payment needed.
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

      <form
        onSubmit={handlePlaceOrder}
        className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start"
      >
        <div className="lg:col-span-7 bg-white border border-[#DCE3D8] rounded-xl p-6 space-y-5">
          <h2 className="text-lg font-semibold text-[#16221A]">
            Customer Verification &amp; Delivery Details
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#4D5E53] mb-1.5">
                Full Name
              </label>
              <input
                type="text"
                required
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                placeholder="Your full name"
                className="w-full px-3.5 py-2.5 bg-[#F7F8F5] border border-[#DCE3D8] rounded-lg text-sm text-[#16221A] focus:outline-none focus:border-[#1B5E37]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#4D5E53] mb-1.5">
                Phone Number
              </label>
              <input
                type="tel"
                required
                value={recipientPhone}
                onChange={(e) => setRecipientPhone(e.target.value)}
                placeholder="+91 98450 44556"
                className="w-full px-3.5 py-2.5 bg-[#F7F8F5] border border-[#DCE3D8] rounded-lg text-sm text-[#16221A] focus:outline-none focus:border-[#1B5E37]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-[#4D5E53] mb-1.5">
                Delivery Address
              </label>
              <textarea
                rows={2}
                required
                value={deliveryAddress}
                onChange={(e) => setDeliveryAddress(e.target.value)}
                placeholder="Flat/House number, Building, Street, Landmark"
                className="w-full px-3.5 py-2.5 bg-[#F7F8F5] border border-[#DCE3D8] rounded-lg text-sm text-[#16221A] focus:outline-none focus:border-[#1B5E37]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#4D5E53] mb-1.5">
                Postal Code
              </label>
              <input
                type="text"
                required
                maxLength={6}
                value={postalCode}
                onChange={(e) => setPostalCode(e.target.value)}
                placeholder="560034"
                className="w-full px-3.5 py-2.5 bg-[#F7F8F5] border border-[#DCE3D8] rounded-lg text-sm text-[#16221A] tabular-nums focus:outline-none focus:border-[#1B5E37]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#4D5E53] mb-2">
              Delivery Time Slot
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {TIME_SLOTS.map((slot) => (
                <button
                  key={slot}
                  type="button"
                  onClick={() => setTimeSlot(slot)}
                  className={`py-2.5 px-3 rounded-lg border text-xs font-medium transition-colors cursor-pointer ${
                    timeSlot === slot
                      ? 'border-[#1B5E37] bg-[#EEF2EC] text-[#1B5E37]'
                      : 'border-[#DCE3D8] text-[#4D5E53] hover:text-[#16221A]'
                  }`}
                >
                  {slot}
                </button>
              ))}
            </div>
          </div>

          <div className="p-4 rounded-lg bg-[#F7F8F5] border border-[#EEF2EC] text-xs text-[#4D5E53] space-y-1">
            <p className="font-semibold text-[#16221A]">
              Payment Method: Cash on Delivery (COD)
            </p>
            <p>
              No online payment or card details required. Please keep ₹
              {totalAmount} ready at delivery. Orders ₹499+ and Premium members
              receive free delivery.
            </p>
          </div>
        </div>

        <aside className="lg:col-span-5 bg-white border border-[#DCE3D8] rounded-xl p-6">
          <h2 className="text-lg font-semibold text-[#16221A] mb-4">
            Order Summary
          </h2>

          <div className="space-y-2.5 pb-4 border-b border-[#EEF2EC]">
            {items.map((item) => (
              <div
                key={item.key}
                className="flex justify-between text-sm text-[#16221A]"
              >
                <span className="truncate pr-2">
                  {item.quantity}x {item.name}
                </span>
                <span className="tabular-nums shrink-0">
                  ₹{item.unitPrice * item.quantity}
                </span>
              </div>
            ))}
          </div>

          <div className="py-4 space-y-2 text-sm border-b border-[#EEF2EC]">
            <div className="flex justify-between text-[#4D5E53]">
              <span>Subtotal</span>
              <span className="tabular-nums text-[#16221A]">₹{subtotal}</span>
            </div>
            {discountPercent > 0 && (
              <div className="flex justify-between text-[#15803D]">
                <span>{activePlan?.name} Discount ({discountPercent}%)</span>
                <span className="tabular-nums">-₹{discountAmount}</span>
              </div>
            )}
            <div className="flex justify-between text-[#4D5E53]">
              <span>Delivery Fee (Free at ₹499+)</span>
              <span className="tabular-nums text-[#16221A]">
                {deliveryFee === 0 ? 'Free' : `₹${deliveryFee}`}
              </span>
            </div>
          </div>

          <div className="mt-4 flex justify-between items-baseline">
            <span className="text-sm font-semibold text-[#16221A]">
              Cash Payable on Delivery
            </span>
            <span className="text-2xl font-semibold text-[#16221A] tabular-nums">
              ₹{totalAmount}
            </span>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="mt-6 w-full py-3 px-4 bg-[#1B5E37] text-white text-sm font-medium rounded-lg hover:bg-[#154A2B] transition-colors cursor-pointer disabled:opacity-60"
          >
            {submitting
              ? 'Confirming COD Order...'
              : `Place COD Order — ₹${totalAmount}`}
          </button>
        </aside>
      </form>
    </div>
  );
}
