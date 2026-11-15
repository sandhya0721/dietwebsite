import { Link, useNavigate } from 'react-router-dom';
import { Minus, Plus, Trash2, ArrowRight } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { SafeImage } from '../components/SafeImage';

export function Cart() {
  const { items, subtotal, updateQuantity, removeItem } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const activePlan = user?.activePlan;
  const discountPercent = activePlan?.discountPercent || 0;
  const discountAmount = Math.round((subtotal * discountPercent) / 100);
  const afterDiscount = Math.max(0, subtotal - discountAmount);
  const freeDelivery = Boolean(activePlan?.freeDelivery) || afterDiscount >= 499;
  const deliveryFee = items.length === 0 ? 0 : freeDelivery ? 0 : 40;
  const estimatedTotal = afterDiscount + deliveryFee;

  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-10">
      <div className="pb-6 border-b border-[#DCE3D8]">
        <h1 className="font-display text-3xl sm:text-4xl font-semibold text-[#16221A]">
          Your Cart
        </h1>
        <p className="text-sm text-[#4D5E53] mt-1.5">
          Review your fresh bowls before choosing your delivery slot.
        </p>
      </div>

      {items.length === 0 ? (
        <div className="mt-10 bg-white border border-[#DCE3D8] rounded-xl p-12 text-center">
          <p className="text-lg font-semibold text-[#16221A]">
            Your cart is currently empty.
          </p>
          <p className="text-sm text-[#4D5E53] mt-1.5">
            Explore our signature salads or build a custom macro bowl.
          </p>
          <div className="mt-6 flex items-center justify-center gap-3">
            <Link
              to="/menu"
              className="px-5 py-2.5 bg-[#1B5E37] text-white text-sm font-medium rounded-lg hover:bg-[#154A2B]"
            >
              Browse Menu
            </Link>
            <Link
              to="/builder"
              className="px-5 py-2.5 bg-white border border-[#DCE3D8] text-[#16221A] text-sm font-medium rounded-lg hover:bg-[#EEF2EC]"
            >
              Build Custom Bowl
            </Link>
          </div>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Item List */}
          <div className="lg:col-span-8 bg-white border border-[#DCE3D8] rounded-xl divide-y divide-[#EEF2EC]">
            {items.map((item) => (
              <div
                key={item.key}
                className="p-5 flex flex-col sm:flex-row sm:items-center gap-4"
              >
                <div className="w-24 h-20 rounded-lg overflow-hidden bg-[#EEF2EC] shrink-0">
                  <SafeImage
                    src={item.imageUrl}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-base font-semibold text-[#16221A]">
                    {item.name}
                  </p>
                  <p className="text-xs text-[#4D5E53] mt-0.5 tabular-nums">
                    {item.calories} kcal · ₹{item.unitPrice} each
                  </p>
                  {item.customizationsSummary && (
                    <p className="text-xs text-[#4D5E53] mt-1 line-clamp-2">
                      {item.customizationsSummary}
                    </p>
                  )}
                  {item.specialInstructions && (
                    <p className="text-xs text-[#1B5E37] mt-1">
                      Note: {item.specialInstructions}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0">
                  <div className="inline-flex items-center border border-[#DCE3D8] rounded-lg bg-[#F7F8F5]">
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.key, item.quantity - 1)}
                      aria-label="Decrease quantity"
                      className="p-2 text-[#16221A] hover:bg-[#EEF2EC] rounded-l-lg cursor-pointer"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="px-3 text-sm font-medium text-[#16221A] tabular-nums">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.key, item.quantity + 1)}
                      aria-label="Increase quantity"
                      className="p-2 text-[#16221A] hover:bg-[#EEF2EC] rounded-r-lg cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <span className="text-base font-semibold text-[#16221A] tabular-nums w-16 text-right">
                    ₹{item.unitPrice * item.quantity}
                  </span>

                  <button
                    type="button"
                    onClick={() => removeItem(item.key)}
                    aria-label={`Remove ${item.name}`}
                    className="p-2 text-[#4D5E53] hover:text-[#B91C1C] cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Order Summary */}
          <aside className="lg:col-span-4 bg-white border border-[#DCE3D8] rounded-xl p-6">
            <h2 className="text-lg font-semibold text-[#16221A]">
              Order Summary
            </h2>

            <div className="mt-4 space-y-2.5 text-sm pb-4 border-b border-[#EEF2EC]">
              <div className="flex justify-between text-[#4D5E53]">
                <span>Subtotal</span>
                <span className="tabular-nums text-[#16221A]">₹{subtotal}</span>
              </div>
              {discountPercent > 0 && (
                <div className="flex justify-between text-[#15803D]">
                  <span>{activePlan?.name} Member Discount ({discountPercent}%)</span>
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
                Cash on Delivery Total
              </span>
              <span className="text-2xl font-semibold text-[#16221A] tabular-nums">
                ₹{estimatedTotal}
              </span>
            </div>

            <p className="mt-2 text-xs text-[#4D5E53]">
              Cash on Delivery only · No online payment required.
            </p>

            {!user && (
              <p className="mt-3 text-xs text-[#4D5E53]">
                Sign in at checkout to apply any active membership discounts.
              </p>
            )}

            <button
              type="button"
              onClick={() => navigate('/checkout')}
              className="mt-6 w-full py-3 px-4 bg-[#1B5E37] text-white text-sm font-medium rounded-lg hover:bg-[#154A2B] transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Proceed to Checkout</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </aside>
        </div>
      )}
    </div>
  );
}
