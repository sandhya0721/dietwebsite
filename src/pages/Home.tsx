import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Check } from 'lucide-react';
import { api } from '../api/client';
import { Plan, Salad } from '../types';
import { SaladCard } from '../components/SaladCard';
import { SafeImage } from '../components/SafeImage';

export function Home() {
  const [salads, setSalads] = useState<Salad[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.get('/salads'), api.get('/plans')])
      .then(([saladsRes, plansRes]) => {
        setSalads(saladsRes.data.salads.slice(0, 3));
        setPlans(plansRes.data.plans);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      {/* 1. Storefront Hero */}
      <section className="max-w-[1200px] mx-auto px-4 sm:px-6 pt-10 pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          <div className="lg:col-span-6 flex flex-col justify-center py-4 lg:py-8">
            <p className="text-xs font-medium text-[#1B5E37] mb-3">
              Daily Kitchen · Bengaluru
            </p>
            <h1
              className="font-display font-semibold text-[#16221A] tracking-tight leading-[1.1]"
              style={{
                fontSize: 'clamp(2.25rem, 4vw, 3.5rem)',
                textWrap: 'balance',
              }}
            >
              Freshly harvested diet salads, delivered on your schedule.
            </h1>
            <p className="mt-5 text-base text-[#4D5E53] leading-relaxed max-w-xl">
              Macro-measured bowls crafted every morning from crisp hydroponic
              greens, clean proteins, and cold-pressed dressings. Order once or
              subscribe for effortless daily meals.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link
                to="/menu"
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#1B5E37] text-white text-sm font-medium rounded-lg hover:bg-[#154A2B] transition-colors whitespace-nowrap"
              >
                <span>Explore Salad Menu</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/builder"
                className="inline-flex items-center px-5 py-3 bg-white border border-[#DCE3D8] text-[#16221A] text-sm font-medium rounded-lg hover:bg-[#EEF2EC] transition-colors whitespace-nowrap"
              >
                Build Custom Bowl
              </Link>
            </div>
          </div>

          <div className="lg:col-span-6">
            <div className="h-full min-h-[320px] lg:min-h-[440px] rounded-2xl overflow-hidden border border-[#DCE3D8] bg-[#EEF2EC]">
              <SafeImage
                src="/src/assets/images/hero_salad_bowl_1794716475266.jpg"
                alt="Fresh Verdant Bowl quinoa, avocado, and roasted chickpea salad on travertine stone"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>

        {/* Full-width 4-column key facts strip below hero split */}
        <div className="mt-10 grid grid-cols-2 lg:grid-cols-4 gap-4 border-t border-b border-[#DCE3D8] py-6">
          <div>
            <p className="text-sm font-semibold text-[#16221A]">Morning Harvest</p>
            <p className="text-xs text-[#4D5E53] mt-1">
              Prepped within 4 hours of delivery
            </p>
          </div>
          <div>
            <p className="text-sm font-semibold text-[#16221A] tabular-nums">
              310–490 kcal
            </p>
            <p className="text-xs text-[#4D5E53] mt-1">
              Exact calories &amp; protein tracked
            </p>
          </div>
          <div>
            <p className="text-sm font-semibold text-[#16221A]">Flexible Pause</p>
            <p className="text-xs text-[#4D5E53] mt-1">
              Pause &amp; resume monthly plans anytime
            </p>
          </div>
          <div>
            <p className="text-sm font-semibold text-[#16221A] tabular-nums">
              Up to 25% Off
            </p>
            <p className="text-xs text-[#4D5E53] mt-1">
              Member discount on every extra order
            </p>
          </div>
        </div>
      </section>

      {/* 2. Featured Signature Bowls */}
      <section className="max-w-[1200px] mx-auto px-4 sm:px-6 py-12">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <h2 className="font-display text-2xl sm:text-3xl font-semibold text-[#16221A]">
              Signature Bowls
            </h2>
            <p className="text-sm text-[#4D5E53] mt-1">
              Balanced nutrition with transparent ingredients and calorie counts.
            </p>
          </div>
          <Link
            to="/menu"
            className="text-sm font-medium text-[#1B5E37] hover:underline whitespace-nowrap"
          >
            View full menu →
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="h-[380px] rounded-xl bg-white border border-[#DCE3D8] animate-pulse"
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {salads.map((salad) => (
              <SaladCard key={salad._id} salad={salad} />
            ))}
          </div>
        )}
      </section>

      {/* 3. Membership Comparison */}
      <section className="max-w-[1200px] mx-auto px-4 sm:px-6 py-12">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <h2 className="font-display text-2xl sm:text-3xl font-semibold text-[#16221A]">
              Monthly Salad Memberships
            </h2>
            <p className="text-sm text-[#4D5E53] mt-1">
              Automated daily deliveries, member-only order discounts, and easy
              pause controls.
            </p>
          </div>
          <Link
            to="/plans"
            className="text-sm font-medium text-[#1B5E37] hover:underline whitespace-nowrap"
          >
            Compare plans &amp; subscribe →
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <div
              key={plan._id}
              className={`bg-white rounded-xl p-6 flex flex-col border ${
                plan.isPopular
                  ? 'border-[#1B5E37] ring-1 ring-[#1B5E37]'
                  : 'border-[#DCE3D8]'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-lg font-semibold text-[#16221A]">
                  {plan.name}
                </h3>
                {plan.isPopular && (
                  <span className="text-xs font-medium text-[#1B5E37]">
                    Most Popular
                  </span>
                )}
              </div>
              <p className="text-xs text-[#4D5E53] mt-1">{plan.targetAudience}</p>

              <div className="mt-5 pb-5 border-b border-[#EEF2EC]">
                <span className="text-3xl font-semibold text-[#16221A] tabular-nums">
                  ₹{plan.price}
                </span>
                <span className="text-xs text-[#4D5E53] ml-1.5">/ month</span>
                <p className="text-xs text-[#4D5E53] mt-2 tabular-nums">
                  {plan.saladsPerDay} salad{plan.saladsPerDay > 1 ? 's' : ''}/day ·{' '}
                  {plan.daysPerMonth} days/month
                </p>
              </div>

              <ul className="mt-5 space-y-2.5 flex-1">
                {plan.features.map((feat) => (
                  <li
                    key={feat}
                    className="flex items-start gap-2 text-sm text-[#4D5E53]"
                  >
                    <Check className="w-4 h-4 text-[#1B5E37] shrink-0 mt-0.5" />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>

              <Link
                to={`/plans?select=${plan._id}`}
                className={`mt-6 block text-center py-2.5 px-4 rounded-lg text-sm font-medium transition-colors ${
                  plan.isPopular
                    ? 'bg-[#1B5E37] text-white hover:bg-[#154A2B]'
                    : 'bg-[#EEF2EC] text-[#16221A] hover:bg-[#DCE3D8]'
                }`}
              >
                Choose {plan.name}
              </Link>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
