import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bookmark, Check, Plus, Trash2 } from 'lucide-react';
import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { api } from '../api/client';
import { CustomSalad, Ingredient } from '../types';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { buildNutritionalInsights } from '../utils/nutritionalInsights';

const MACRO_COLORS = {
  Protein: '#1B5E37',
  Carbs: '#D97706',
  Fats: '#0F766E',
} as const;

export function SaladBuilder() {
  const { user } = useAuth();
  const { addCustomSalad } = useCart();
  const navigate = useNavigate();

  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [savedSalads, setSavedSalads] = useState<CustomSalad[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedBase, setSelectedBase] = useState<string>('');
  const [selectedProteins, setSelectedProteins] = useState<string[]>([]);
  const [selectedToppings, setSelectedToppings] = useState<string[]>([]);
  const [selectedDressing, setSelectedDressing] = useState<string>('');
  const [bowlName, setBowlName] = useState('');
  const [specialInstructions, setSpecialInstructions] = useState('');

  const [feedback, setFeedback] = useState('');
  const [loadError, setLoadError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const requests: Promise<unknown>[] = [api.get('/ingredients')];
    if (user) {
      requests.push(api.get('/custom-salads'));
    }

    Promise.all(requests)
      .then(([ingRes, savedRes]) => {
        const list: Ingredient[] = (
          ingRes as { data: { ingredients: Ingredient[] } }
        ).data.ingredients;
        setIngredients(list);

        const defaultBase = list.find((i) => i.category === 'base');
        const defaultDressing = list.find((i) => i.category === 'dressing');
        if (defaultBase) setSelectedBase(defaultBase._id);
        if (defaultDressing) setSelectedDressing(defaultDressing._id);

        if (savedRes) {
          setSavedSalads(
            (savedRes as { data: { customSalads: CustomSalad[] } }).data
              .customSalads
          );
        }
      })
      .catch((err) =>
        setLoadError(
          err?.response?.data?.message ||
            err?.message ||
            'Unable to load ingredients.'
        )
      )
      .finally(() => setLoading(false));
  }, [user]);

  const bases = useMemo(
    () => ingredients.filter((i) => i.category === 'base'),
    [ingredients]
  );
  const proteins = useMemo(
    () => ingredients.filter((i) => i.category === 'protein'),
    [ingredients]
  );
  const toppings = useMemo(
    () => ingredients.filter((i) => i.category === 'topping'),
    [ingredients]
  );
  const dressings = useMemo(
    () => ingredients.filter((i) => i.category === 'dressing'),
    [ingredients]
  );

  const selectedItems = useMemo(() => {
    const map = new Map(ingredients.map((i) => [i._id, i]));
    const list: Ingredient[] = [];
    if (selectedBase && map.has(selectedBase)) list.push(map.get(selectedBase)!);
    selectedProteins.forEach((id) => map.has(id) && list.push(map.get(id)!));
    selectedToppings.forEach((id) => map.has(id) && list.push(map.get(id)!));
    if (selectedDressing && map.has(selectedDressing))
      list.push(map.get(selectedDressing)!);
    return list;
  }, [
    ingredients,
    selectedBase,
    selectedProteins,
    selectedToppings,
    selectedDressing,
  ]);

  const totals = useMemo(() => {
    return selectedItems.reduce(
      (acc, item) => ({
        price: acc.price + item.price,
        calories: acc.calories + item.calories,
        protein: acc.protein + (item.proteinGrams || 0),
        carbs: acc.carbs + (item.carbsGrams || 0),
        fat: acc.fat + (item.fatGrams || 0),
      }),
      { price: 0, calories: 0, protein: 0, carbs: 0, fat: 0 }
    );
  }, [selectedItems]);

  const macroBreakdown = useMemo(() => {
    const totalGrams = totals.protein + totals.carbs + totals.fat;
    const rows = [
      {
        name: 'Protein' as const,
        grams: totals.protein,
        color: MACRO_COLORS.Protein,
        percent:
          totalGrams > 0 ? Math.round((totals.protein / totalGrams) * 100) : 0,
      },
      {
        name: 'Carbs' as const,
        grams: totals.carbs,
        color: MACRO_COLORS.Carbs,
        percent:
          totalGrams > 0 ? Math.round((totals.carbs / totalGrams) * 100) : 0,
      },
      {
        name: 'Fats' as const,
        grams: totals.fat,
        color: MACRO_COLORS.Fats,
        percent:
          totalGrams > 0 ? Math.round((totals.fat / totalGrams) * 100) : 0,
      },
    ];
    return { totalGrams, rows };
  }, [totals.protein, totals.carbs, totals.fat]);

  const insights = useMemo(
    () => buildNutritionalInsights(selectedItems, totals),
    [selectedItems, totals]
  );

  const toggleMulti = (
    id: string,
    current: string[],
    setter: (next: string[]) => void
  ) => {
    if (current.includes(id)) {
      setter(current.filter((item) => item !== id));
    } else {
      setter([...current, id]);
    }
  };

  const handleSaveFavorite = async () => {
    if (!user) {
      navigate('/login', { state: { from: '/builder' } });
      return;
    }
    if (!selectedBase || !selectedDressing) return;

    setSaving(true);
    setFeedback('');
    try {
      const { data } = await api.post('/custom-salads', {
        name: bowlName.trim() || 'My Custom Salad',
        baseId: selectedBase,
        proteinIds: selectedProteins,
        toppingIds: selectedToppings,
        dressingId: selectedDressing,
        specialInstructions,
        isFavorite: true,
      });
      setSavedSalads((prev) => [data.customSalad, ...prev]);
      setFeedback('Saved to your favorite custom bowls.');
    } catch {
      setFeedback('Could not save custom salad. Please check your selection.');
    } finally {
      setSaving(false);
    }
  };

  const handleAddToCart = () => {
    if (!selectedBase || !selectedDressing) return;
    const summary = selectedItems.map((i) => i.name).join(', ');
    const resolvedName = bowlName.trim() || 'Custom Built Salad Bowl';

    addCustomSalad({
      itemType: 'custom',
      inlineCustom: {
        name: resolvedName,
        totalPrice: totals.price,
        totalCalories: totals.calories,
        summary,
        specialInstructions: specialInstructions.trim(),
      },
      name: resolvedName,
      imageUrl: '/src/assets/images/hero_salad_bowl_1794716475266.jpg',
      unitPrice: totals.price,
      calories: totals.calories,
      quantity: 1,
      customizationsSummary: summary,
      specialInstructions: specialInstructions.trim(),
    });

    setFeedback('Custom bowl added to cart.');
  };

  const handleAddSavedToCart = (saved: CustomSalad) => {
    const summary = [
      saved.base?.name,
      ...saved.proteins.map((p) => p.name),
      ...saved.toppings.map((t) => t.name),
      saved.dressing?.name,
    ]
      .filter(Boolean)
      .join(', ');

    addCustomSalad({
      itemType: 'custom',
      customSaladId: saved._id,
      name: saved.name,
      imageUrl: '/src/assets/images/hero_salad_bowl_1794716475266.jpg',
      unitPrice: saved.totalPrice,
      calories: saved.totalCalories,
      quantity: 1,
      customizationsSummary: summary,
      specialInstructions: saved.specialInstructions,
    });
    setFeedback(`"${saved.name}" added to cart.`);
  };

  const handleDeleteSaved = async (id: string) => {
    try {
      await api.delete(`/custom-salads/${id}`);
      setSavedSalads((prev) => prev.filter((s) => s._id !== id));
    } catch {
      // ignore
    }
  };

  if (loading) {
    return (
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-12 text-sm text-[#4D5E53]">
        Loading fresh ingredients...
      </div>
    );
  }

  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-10">
      <div className="pb-6 border-b border-[#DCE3D8]">
        <h1 className="font-display text-3xl sm:text-4xl font-semibold text-[#16221A]">
          Custom Salad Builder
        </h1>
        <p className="text-sm text-[#4D5E53] mt-1.5">
          Craft your own bowl step by step with live calorie, macro-nutrient, and
          price calculation.
        </p>
      </div>

      {loadError && (
        <div className="mt-6 p-4 rounded-xl bg-[#FEF2F2] border border-[#FECACA] text-sm text-[#B91C1C]">
          {loadError}
        </div>
      )}

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left 8 Columns: 4 Selection Steps */}
        <div className="lg:col-span-8 space-y-8">
          {/* Step 1: Base */}
          <section className="bg-white border border-[#DCE3D8] rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-[#16221A]">
                01. Choose Your Base
              </h2>
              <span className="text-xs text-[#4D5E53]">Select 1</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {bases.map((item) => {
                const active = selectedBase === item._id;
                return (
                  <button
                    key={item._id}
                    type="button"
                    onClick={() => setSelectedBase(item._id)}
                    className={`p-3.5 rounded-lg border text-left transition-colors cursor-pointer flex items-center justify-between ${
                      active
                        ? 'border-[#1B5E37] bg-[#EEF2EC]/70'
                        : 'border-[#DCE3D8] hover:bg-[#F7F8F5]'
                    }`}
                  >
                    <div>
                      <p className="text-sm font-medium text-[#16221A]">
                        {item.name}
                      </p>
                      <p className="text-xs text-[#4D5E53] mt-0.5 tabular-nums">
                        {item.calories} kcal · {item.proteinGrams}g P ·{' '}
                        {item.carbsGrams ?? 0}g C · {item.fatGrams ?? 0}g F
                      </p>
                    </div>
                    <span className="text-sm font-semibold text-[#16221A] tabular-nums">
                      ₹{item.price}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Step 2: Proteins */}
          <section className="bg-white border border-[#DCE3D8] rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-[#16221A]">
                02. Add Proteins
              </h2>
              <span className="text-xs text-[#4D5E53]">Select any</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {proteins.map((item) => {
                const active = selectedProteins.includes(item._id);
                return (
                  <button
                    key={item._id}
                    type="button"
                    onClick={() =>
                      toggleMulti(item._id, selectedProteins, setSelectedProteins)
                    }
                    className={`p-3.5 rounded-lg border text-left transition-colors cursor-pointer flex items-center justify-between ${
                      active
                        ? 'border-[#1B5E37] bg-[#EEF2EC]/70'
                        : 'border-[#DCE3D8] hover:bg-[#F7F8F5]'
                    }`}
                  >
                    <div>
                      <p className="text-sm font-medium text-[#16221A]">
                        {item.name}
                      </p>
                      <p className="text-xs text-[#4D5E53] mt-0.5 tabular-nums">
                        {item.calories} kcal · {item.proteinGrams}g P ·{' '}
                        {item.carbsGrams ?? 0}g C · {item.fatGrams ?? 0}g F ·{' '}
                        {item.isVegan ? 'Vegan' : item.isVeg ? 'Veg' : 'Non-Veg'}
                      </p>
                    </div>
                    <span className="text-sm font-semibold text-[#16221A] tabular-nums">
                      +₹{item.price}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Step 3: Toppings */}
          <section className="bg-white border border-[#DCE3D8] rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-[#16221A]">
                03. Pick Fresh Toppings
              </h2>
              <span className="text-xs text-[#4D5E53]">Select any</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {toppings.map((item) => {
                const active = selectedToppings.includes(item._id);
                return (
                  <button
                    key={item._id}
                    type="button"
                    onClick={() =>
                      toggleMulti(item._id, selectedToppings, setSelectedToppings)
                    }
                    className={`p-3.5 rounded-lg border text-left transition-colors cursor-pointer flex items-center justify-between ${
                      active
                        ? 'border-[#1B5E37] bg-[#EEF2EC]/70'
                        : 'border-[#DCE3D8] hover:bg-[#F7F8F5]'
                    }`}
                  >
                    <div>
                      <p className="text-sm font-medium text-[#16221A]">
                        {item.name}
                      </p>
                      <p className="text-xs text-[#4D5E53] mt-0.5 tabular-nums">
                        {item.calories} kcal · {item.proteinGrams}g P ·{' '}
                        {item.carbsGrams ?? 0}g C · {item.fatGrams ?? 0}g F
                      </p>
                    </div>
                    <span className="text-sm font-semibold text-[#16221A] tabular-nums">
                      +₹{item.price}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Step 4: Dressing & Instructions */}
          <section className="bg-white border border-[#DCE3D8] rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-[#16221A]">
                04. Select Dressing &amp; Special Instructions
              </h2>
              <span className="text-xs text-[#4D5E53]">Select 1 dressing</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {dressings.map((item) => {
                const active = selectedDressing === item._id;
                return (
                  <button
                    key={item._id}
                    type="button"
                    onClick={() => setSelectedDressing(item._id)}
                    className={`p-3.5 rounded-lg border text-left transition-colors cursor-pointer flex items-center justify-between ${
                      active
                        ? 'border-[#1B5E37] bg-[#EEF2EC]/70'
                        : 'border-[#DCE3D8] hover:bg-[#F7F8F5]'
                    }`}
                  >
                    <div>
                      <p className="text-sm font-medium text-[#16221A]">
                        {item.name}
                      </p>
                      <p className="text-xs text-[#4D5E53] mt-0.5 tabular-nums">
                        {item.calories} kcal · {item.proteinGrams}g P ·{' '}
                        {item.carbsGrams ?? 0}g C · {item.fatGrams ?? 0}g F
                      </p>
                    </div>
                    <span className="text-sm font-semibold text-[#16221A] tabular-nums">
                      +₹{item.price}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-[#4D5E53] mb-1.5">
                  Name Your Bowl (optional)
                </label>
                <input
                  type="text"
                  value={bowlName}
                  onChange={(e) => setBowlName(e.target.value)}
                  placeholder="e.g. Post-Workout Kale Bowl"
                  className="w-full px-3.5 py-2.5 bg-[#F7F8F5] border border-[#DCE3D8] rounded-lg text-sm text-[#16221A] focus:outline-none focus:border-[#1B5E37]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#4D5E53] mb-1.5">
                  Special Instructions
                </label>
                <input
                  type="text"
                  value={specialInstructions}
                  onChange={(e) => setSpecialInstructions(e.target.value)}
                  placeholder="e.g. No onion, dressing on the side"
                  className="w-full px-3.5 py-2.5 bg-[#F7F8F5] border border-[#DCE3D8] rounded-lg text-sm text-[#16221A] focus:outline-none focus:border-[#1B5E37]"
                />
              </div>
            </div>
          </section>

          {/* Nutritional Insights */}
          <section className="bg-white border border-[#DCE3D8] rounded-xl p-6">
            <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-2 pb-4 border-b border-[#EEF2EC]">
              <h2 className="text-base font-semibold text-[#16221A]">
                Nutritional Insights
              </h2>
              <p className="text-xs font-medium text-[#4D5E53] tabular-nums">
                {insights.dietaryLabel} · {insights.macroFocus} ·{' '}
                {totals.calories} kcal
              </p>
            </div>

            <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-[#4D5E53] mb-3">
                  Health Benefits
                </h3>
                {insights.benefits.length > 0 ? (
                  <div className="space-y-3">
                    {insights.benefits.map((item) => (
                      <div
                        key={item.title}
                        className="p-3.5 rounded-lg bg-[#F7F8F5] border border-[#EEF2EC]"
                      >
                        <p className="text-sm font-medium text-[#16221A]">
                          {item.title}
                        </p>
                        <p className="text-xs text-[#4D5E53] mt-1 leading-relaxed">
                          {item.detail}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-[#4D5E53] p-3.5 rounded-lg bg-[#F7F8F5] border border-[#EEF2EC]">
                    Select a base, protein, or toppings to view ingredient-specific
                    health benefits.
                  </p>
                )}
              </div>

              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-[#4D5E53] mb-3">
                  Pairing &amp; Nutrition Tips
                </h3>
                <div className="space-y-3">
                  {insights.tips.map((tip) => (
                    <div
                      key={tip.title}
                      className="p-3.5 rounded-lg bg-[#F7F8F5] border border-[#EEF2EC]"
                    >
                      <p className="text-sm font-medium text-[#16221A]">
                        {tip.title}
                      </p>
                      <p className="text-xs text-[#4D5E53] mt-1 leading-relaxed">
                        {tip.detail}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Right 4 Columns: Live Price, Macro Donut Chart & Calorie Summary */}
        <aside className="lg:col-span-4 lg:sticky lg:top-24 space-y-6">
          <div className="bg-white border border-[#DCE3D8] rounded-xl p-6">
            <div className="flex items-baseline justify-between gap-2">
              <h2 className="text-lg font-semibold text-[#16221A]">
                Live Bowl Summary
              </h2>
              <span className="text-xl font-semibold text-[#1B5E37] tabular-nums">
                ₹{totals.price}
              </span>
            </div>

            {/* Dynamic Macro-Nutrient Donut Chart (Recharts) */}
            <div className="mt-4 py-4 border-t border-b border-[#EEF2EC]">
              <p className="text-xs font-medium text-[#4D5E53] mb-2">
                Macro-Nutrient Breakdown
              </p>

              {macroBreakdown.totalGrams > 0 ? (
                <div className="relative h-44 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={macroBreakdown.rows}
                        dataKey="grams"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={72}
                        paddingAngle={3}
                        strokeWidth={0}
                        isAnimationActive={false}
                      >
                        {macroBreakdown.rows.map((entry) => (
                          <Cell key={entry.name} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value, name) => [
                          `${value}g`,
                          String(name),
                        ]}
                        contentStyle={{
                          backgroundColor: '#FFFFFF',
                          borderColor: '#DCE3D8',
                          borderRadius: '8px',
                          fontSize: '12px',
                          color: '#16221A',
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>

                  {/* Center Calorie Readout */}
                  <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-xl font-semibold text-[#16221A] tabular-nums leading-none">
                      {totals.calories}
                    </span>
                    <span className="text-[11px] text-[#4D5E53] mt-1">
                      kcal
                    </span>
                  </div>
                </div>
              ) : (
                <div className="h-36 flex items-center justify-center text-xs text-[#4D5E53] bg-[#F7F8F5] rounded-lg">
                  Select ingredients to view macro breakdown.
                </div>
              )}

              {/* Explicit Text + Color Legend */}
              <div className="mt-3 space-y-2">
                {macroBreakdown.rows.map((macro) => (
                  <div
                    key={macro.name}
                    className="flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2 text-[#16221A] font-medium">
                      <span
                        className="w-2.5 h-2.5 rounded-sm shrink-0"
                        style={{ backgroundColor: macro.color }}
                        aria-hidden="true"
                      />
                      <span>{macro.name}</span>
                    </div>
                    <div className="font-mono tabular-nums text-[#4D5E53]">
                      <span className="text-[#16221A] font-medium">
                        {macro.grams}g
                      </span>
                      <span className="ml-2">({macro.percent}%)</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 space-y-2 max-h-48 overflow-y-auto">
              {selectedItems.map((item) => (
                <div
                  key={item._id}
                  className="flex items-center justify-between text-xs text-[#4D5E53]"
                >
                  <span className="truncate pr-2">{item.name}</span>
                  <span className="font-mono tabular-nums shrink-0">
                    ₹{item.price}
                  </span>
                </div>
              ))}
            </div>

            {specialInstructions.trim() && (
              <p className="mt-3 text-xs text-[#4D5E53] bg-[#F7F8F5] p-2.5 rounded-lg border border-[#EEF2EC]">
                Note: {specialInstructions}
              </p>
            )}

            {feedback && (
              <div className="mt-4 flex items-center gap-2 text-xs font-medium text-[#15803D] bg-[#ECFDF3] border border-[#BBF7D0] px-3 py-2 rounded-lg">
                <Check className="w-3.5 h-3.5 shrink-0" />
                <span>{feedback}</span>
              </div>
            )}

            <div className="mt-5 space-y-2.5">
              <button
                type="button"
                onClick={handleAddToCart}
                className="w-full py-2.5 px-4 bg-[#1B5E37] text-white text-sm font-medium rounded-lg hover:bg-[#154A2B] transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add Bowl to Cart — ₹{totals.price}</span>
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={handleSaveFavorite}
                className="w-full py-2.5 px-4 bg-white border border-[#DCE3D8] text-[#16221A] text-sm font-medium rounded-lg hover:bg-[#EEF2EC] transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                <Bookmark className="w-4 h-4" />
                <span>{saving ? 'Saving...' : 'Save to Favorites'}</span>
              </button>
            </div>
          </div>

          {/* Saved Favorites Shelf */}
          {user && savedSalads.length > 0 && (
            <div className="bg-white border border-[#DCE3D8] rounded-xl p-6">
              <h3 className="text-sm font-semibold text-[#16221A] mb-3">
                Saved Favorite Bowls
              </h3>
              <div className="space-y-3">
                {savedSalads.map((saved) => (
                  <div
                    key={saved._id}
                    className="p-3 rounded-lg bg-[#F7F8F5] border border-[#EEF2EC]"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-medium text-[#16221A]">
                          {saved.name}
                        </p>
                        <p className="text-xs text-[#4D5E53] mt-0.5 tabular-nums">
                          {saved.totalCalories} kcal · {saved.totalProtein}g
                          protein · ₹{saved.totalPrice}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteSaved(saved._id)}
                        aria-label={`Delete ${saved.name}`}
                        className="p-1 text-[#4D5E53] hover:text-[#B91C1C] cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleAddSavedToCart(saved)}
                      className="mt-2.5 w-full py-1.5 px-3 text-xs font-medium text-[#1B5E37] bg-white border border-[#DCE3D8] rounded-md hover:bg-[#EEF2EC] cursor-pointer"
                    >
                      Add to Cart
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
