import React, { useEffect, useState } from 'react';
import { Pencil, Plus, Trash2, X } from 'lucide-react';
import { api } from '../api/client';
import { Ingredient, Salad } from '../types';
import { DashboardLayout } from '../components/DashboardLayout';
import { SafeImage } from '../components/SafeImage';

const IMAGE_PRESETS = [
  {
    label: 'Mediterranean Quinoa Bowl',
    url: '/src/assets/images/salad_mediterranean_quinoa_1794716475366.jpg',
  },
  {
    label: 'Grilled Herb Chicken Bowl',
    url: '/src/assets/images/salad_grilled_herb_chicken_1794716476184.jpg',
  },
  {
    label: 'Crispy Sesame Tofu & Kale',
    url: '/src/assets/images/salad_crispy_tofu_kale_1794716476425.jpg',
  },
  {
    label: 'Spiced Paneer & Chickpea',
    url: '/src/assets/images/salad_paneer_tikka_harvest_1794716477208.jpg',
  },
  {
    label: 'Emerald Green Detox',
    url: '/src/assets/images/salad_garden_green_detox_1794716477502.jpg',
  },
];

export function ManageMenu() {
  const [tab, setTab] = useState<'salads' | 'ingredients'>('salads');
  const [salads, setSalads] = useState<Salad[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState(true);

  // Salad Modal
  const [saladModalOpen, setSaladModalOpen] = useState(false);
  const [editingSaladId, setEditingSaladId] = useState<string | null>(null);
  const [saladForm, setSaladForm] = useState({
    name: '',
    description: '',
    price: 299,
    calories: 380,
    proteinGrams: 20,
    category: 'Signature' as Salad['category'],
    dietaryTag: 'Veg' as Salad['dietaryTag'],
    isVeg: true,
    isVegan: false,
    imageUrl: IMAGE_PRESETS[0].url,
  });

  // Ingredient Modal
  const [ingModalOpen, setIngModalOpen] = useState(false);
  const [editingIngId, setEditingIngId] = useState<string | null>(null);
  const [ingForm, setIngForm] = useState({
    name: '',
    category: 'topping' as Ingredient['category'],
    price: 35,
    calories: 45,
    proteinGrams: 2,
    carbsGrams: 4,
    fatGrams: 1,
    isVeg: true,
    isVegan: true,
  });

  const loadAll = () => {
    setLoading(true);
    Promise.all([
      api.get('/salads', { params: { includeUnavailable: 'true' } }),
      api.get('/ingredients', { params: { includeUnavailable: 'true' } }),
    ])
      .then(([saladsRes, ingRes]) => {
        setSalads(saladsRes.data.salads);
        setIngredients(ingRes.data.ingredients);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadAll();
  }, []);

  const openNewSalad = () => {
    setEditingSaladId(null);
    setSaladForm({
      name: '',
      description: '',
      price: 299,
      calories: 380,
      proteinGrams: 20,
      category: 'Signature',
      dietaryTag: 'Veg',
      isVeg: true,
      isVegan: false,
      imageUrl: IMAGE_PRESETS[0].url,
    });
    setSaladModalOpen(true);
  };

  const openEditSalad = (salad: Salad) => {
    setEditingSaladId(salad._id);
    setSaladForm({
      name: salad.name,
      description: salad.description,
      price: salad.price,
      calories: salad.calories,
      proteinGrams: salad.proteinGrams,
      category: salad.category,
      dietaryTag: salad.dietaryTag,
      isVeg: salad.isVeg,
      isVegan: salad.isVegan,
      imageUrl: salad.imageUrl,
    });
    setSaladModalOpen(true);
  };

  const saveSalad = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingSaladId) {
      await api.put(`/salads/${editingSaladId}`, saladForm);
    } else {
      await api.post('/salads', saladForm);
    }
    setSaladModalOpen(false);
    loadAll();
  };

  const deleteSalad = async (id: string) => {
    await api.delete(`/salads/${id}`);
    loadAll();
  };

  const openNewIngredient = () => {
    setEditingIngId(null);
    setIngForm({
      name: '',
      category: 'topping',
      price: 35,
      calories: 45,
      proteinGrams: 2,
      carbsGrams: 4,
      fatGrams: 1,
      isVeg: true,
      isVegan: true,
    });
    setIngModalOpen(true);
  };

  const openEditIngredient = (ing: Ingredient) => {
    setEditingIngId(ing._id);
    setIngForm({
      name: ing.name,
      category: ing.category,
      price: ing.price,
      calories: ing.calories,
      proteinGrams: ing.proteinGrams,
      carbsGrams: ing.carbsGrams ?? 0,
      fatGrams: ing.fatGrams ?? 0,
      isVeg: ing.isVeg,
      isVegan: ing.isVegan,
    });
    setIngModalOpen(true);
  };

  const saveIngredient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingIngId) {
      await api.put(`/ingredients/${editingIngId}`, ingForm);
    } else {
      await api.post('/ingredients', ingForm);
    }
    setIngModalOpen(false);
    loadAll();
  };

  const deleteIngredient = async (id: string) => {
    await api.delete(`/ingredients/${id}`);
    loadAll();
  };

  return (
    <DashboardLayout
      title="Manage Menu & Ingredients"
      subtitle="Add, edit, or remove signature salads and Salad Builder ingredients."
      action={
        <button
          type="button"
          onClick={tab === 'salads' ? openNewSalad : openNewIngredient}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#1B5E37] text-white text-sm font-medium rounded-lg hover:bg-[#154A2B] whitespace-nowrap cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>{tab === 'salads' ? 'Add Salad' : 'Add Ingredient'}</span>
        </button>
      }
    >
      {/* Tab Switcher */}
      <div className="inline-flex items-center gap-1 p-1 bg-[#EEF2EC] rounded-lg mb-6">
        <button
          type="button"
          onClick={() => setTab('salads')}
          className={`px-4 py-1.5 text-xs font-medium rounded-md cursor-pointer ${
            tab === 'salads'
              ? 'bg-white text-[#16221A] shadow-sm'
              : 'text-[#4D5E53] hover:text-[#16221A]'
          }`}
        >
          Signature Salads ({salads.length})
        </button>
        <button
          type="button"
          onClick={() => setTab('ingredients')}
          className={`px-4 py-1.5 text-xs font-medium rounded-md cursor-pointer ${
            tab === 'ingredients'
              ? 'bg-white text-[#16221A] shadow-sm'
              : 'text-[#4D5E53] hover:text-[#16221A]'
          }`}
        >
          Builder Ingredients ({ingredients.length})
        </button>
      </div>

      {loading ? (
        <div className="p-6 text-sm text-[#4D5E53]">Loading menu items...</div>
      ) : tab === 'salads' ? (
        <div className="bg-white border border-[#DCE3D8] rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#DCE3D8] bg-[#F7F8F5] text-xs font-medium text-[#4D5E53]">
                  <th className="py-3 px-4">Salad</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4 text-right">Calories</th>
                  <th className="py-3 px-4 text-right">Price</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EEF2EC] text-sm">
                {salads.map((salad) => (
                  <tr key={salad._id} className="hover:bg-[#F7F8F5]/60">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-9 rounded-md overflow-hidden bg-[#EEF2EC] shrink-0">
                          <SafeImage
                            src={salad.imageUrl}
                            alt={salad.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div>
                          <p className="font-medium text-[#16221A]">
                            {salad.name}
                          </p>
                          <p className="text-xs text-[#4D5E53]">
                            {salad.dietaryTag} · {salad.proteinGrams}g protein
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-xs text-[#4D5E53]">
                      {salad.category}
                    </td>
                    <td className="py-3 px-4 text-right text-xs text-[#4D5E53] tabular-nums">
                      {salad.calories} kcal
                    </td>
                    <td className="py-3 px-4 text-right font-semibold text-[#16221A] tabular-nums">
                      ₹{salad.price}
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => openEditSalad(salad)}
                          aria-label={`Edit ${salad.name}`}
                          className="p-1.5 text-[#4D5E53] hover:text-[#16221A] rounded hover:bg-[#EEF2EC] cursor-pointer"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteSalad(salad._id)}
                          aria-label={`Delete ${salad.name}`}
                          className="p-1.5 text-[#4D5E53] hover:text-[#B91C1C] rounded hover:bg-[#FEF2F2] cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white border border-[#DCE3D8] rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#DCE3D8] bg-[#F7F8F5] text-xs font-medium text-[#4D5E53]">
                  <th className="py-3 px-4">Ingredient</th>
                  <th className="py-3 px-4">Group</th>
                  <th className="py-3 px-4 text-right">Calories</th>
                  <th className="py-3 px-4 text-right">Price</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EEF2EC] text-sm">
                {ingredients.map((ing) => (
                  <tr key={ing._id} className="hover:bg-[#F7F8F5]/60">
                    <td className="py-3 px-4 font-medium text-[#16221A]">
                      {ing.name}
                    </td>
                    <td className="py-3 px-4 text-xs text-[#4D5E53] capitalize">
                      {ing.category}
                    </td>
                    <td className="py-3 px-4 text-right text-xs text-[#4D5E53] tabular-nums">
                      {ing.calories} kcal
                    </td>
                    <td className="py-3 px-4 text-right font-semibold text-[#16221A] tabular-nums">
                      ₹{ing.price}
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => openEditIngredient(ing)}
                          aria-label={`Edit ${ing.name}`}
                          className="p-1.5 text-[#4D5E53] hover:text-[#16221A] rounded hover:bg-[#EEF2EC] cursor-pointer"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteIngredient(ing._id)}
                          aria-label={`Delete ${ing.name}`}
                          className="p-1.5 text-[#4D5E53] hover:text-[#B91C1C] rounded hover:bg-[#FEF2F2] cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add/Edit Salad Modal */}
      {saladModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white border border-[#DCE3D8] rounded-xl max-w-lg w-full p-6 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#EEF2EC]">
              <h2 className="text-lg font-semibold text-[#16221A]">
                {editingSaladId ? 'Edit Salad' : 'Add Signature Salad'}
              </h2>
              <button
                type="button"
                onClick={() => setSaladModalOpen(false)}
                className="p-1 text-[#4D5E53] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={saveSalad} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-[#4D5E53] mb-1">
                  Salad Name
                </label>
                <input
                  type="text"
                  required
                  value={saladForm.name}
                  onChange={(e) =>
                    setSaladForm({ ...saladForm, name: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-[#F7F8F5] border border-[#DCE3D8] rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#4D5E53] mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  required
                  value={saladForm.description}
                  onChange={(e) =>
                    setSaladForm({ ...saladForm, description: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-[#F7F8F5] border border-[#DCE3D8] rounded-lg text-sm"
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#4D5E53] mb-1">
                    Price (₹)
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={saladForm.price}
                    onChange={(e) =>
                      setSaladForm({
                        ...saladForm,
                        price: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 bg-[#F7F8F5] border border-[#DCE3D8] rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#4D5E53] mb-1">
                    Calories
                  </label>
                  <input
                    type="number"
                    required
                    min={10}
                    value={saladForm.calories}
                    onChange={(e) =>
                      setSaladForm({
                        ...saladForm,
                        calories: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 bg-[#F7F8F5] border border-[#DCE3D8] rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#4D5E53] mb-1">
                    Protein (g)
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={saladForm.proteinGrams}
                    onChange={(e) =>
                      setSaladForm({
                        ...saladForm,
                        proteinGrams: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 bg-[#F7F8F5] border border-[#DCE3D8] rounded-lg text-sm"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#4D5E53] mb-1">
                    Category
                  </label>
                  <select
                    value={saladForm.category}
                    onChange={(e) =>
                      setSaladForm({
                        ...saladForm,
                        category: e.target.value as Salad['category'],
                      })
                    }
                    className="w-full px-3 py-2 bg-[#F7F8F5] border border-[#DCE3D8] rounded-lg text-sm"
                  >
                    <option value="Signature">Signature</option>
                    <option value="High-Protein">High-Protein</option>
                    <option value="Detox">Detox</option>
                    <option value="Harvest">Harvest</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#4D5E53] mb-1">
                    Dietary Tag
                  </label>
                  <select
                    value={saladForm.dietaryTag}
                    onChange={(e) => {
                      const val = e.target.value as Salad['dietaryTag'];
                      setSaladForm({
                        ...saladForm,
                        dietaryTag: val,
                        isVegan: val === 'Vegan',
                        isVeg: val !== 'High-Protein',
                      });
                    }}
                    className="w-full px-3 py-2 bg-[#F7F8F5] border border-[#DCE3D8] rounded-lg text-sm"
                  >
                    <option value="Veg">Veg</option>
                    <option value="Vegan">Vegan</option>
                    <option value="High-Protein">High-Protein</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-[#4D5E53] mb-1">
                  Photo
                </label>
                <select
                  value={saladForm.imageUrl}
                  onChange={(e) =>
                    setSaladForm({ ...saladForm, imageUrl: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-[#F7F8F5] border border-[#DCE3D8] rounded-lg text-sm"
                >
                  {IMAGE_PRESETS.map((preset) => (
                    <option key={preset.url} value={preset.url}>
                      {preset.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="pt-3 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setSaladModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium border border-[#DCE3D8] rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-[#1B5E37] rounded-lg cursor-pointer"
                >
                  Save Salad
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add/Edit Ingredient Modal */}
      {ingModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white border border-[#DCE3D8] rounded-xl max-w-md w-full p-6 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#EEF2EC]">
              <h2 className="text-lg font-semibold text-[#16221A]">
                {editingIngId ? 'Edit Ingredient' : 'Add Ingredient'}
              </h2>
              <button
                type="button"
                onClick={() => setIngModalOpen(false)}
                className="p-1 text-[#4D5E53] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={saveIngredient} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-[#4D5E53] mb-1">
                  Ingredient Name
                </label>
                <input
                  type="text"
                  required
                  value={ingForm.name}
                  onChange={(e) =>
                    setIngForm({ ...ingForm, name: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-[#F7F8F5] border border-[#DCE3D8] rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#4D5E53] mb-1">
                  Category
                </label>
                <select
                  value={ingForm.category}
                  onChange={(e) =>
                    setIngForm({
                      ...ingForm,
                      category: e.target.value as Ingredient['category'],
                    })
                  }
                  className="w-full px-3 py-2 bg-[#F7F8F5] border border-[#DCE3D8] rounded-lg text-sm"
                >
                  <option value="base">Base</option>
                  <option value="protein">Protein</option>
                  <option value="topping">Topping</option>
                  <option value="dressing">Dressing</option>
                </select>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#4D5E53] mb-1">
                    Price (₹)
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={ingForm.price}
                    onChange={(e) =>
                      setIngForm({ ...ingForm, price: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 bg-[#F7F8F5] border border-[#DCE3D8] rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#4D5E53] mb-1">
                    Calories
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={ingForm.calories}
                    onChange={(e) =>
                      setIngForm({
                        ...ingForm,
                        calories: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 bg-[#F7F8F5] border border-[#DCE3D8] rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#4D5E53] mb-1">
                    Protein (g)
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={ingForm.proteinGrams}
                    onChange={(e) =>
                      setIngForm({
                        ...ingForm,
                        proteinGrams: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 bg-[#F7F8F5] border border-[#DCE3D8] rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#4D5E53] mb-1">
                    Carbs (g)
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={ingForm.carbsGrams}
                    onChange={(e) =>
                      setIngForm({
                        ...ingForm,
                        carbsGrams: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 bg-[#F7F8F5] border border-[#DCE3D8] rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#4D5E53] mb-1">
                    Fats (g)
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={ingForm.fatGrams}
                    onChange={(e) =>
                      setIngForm({
                        ...ingForm,
                        fatGrams: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 bg-[#F7F8F5] border border-[#DCE3D8] rounded-lg text-sm"
                  />
                </div>
              </div>
              <div className="pt-3 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIngModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium border border-[#DCE3D8] rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-[#1B5E37] rounded-lg cursor-pointer"
                >
                  Save Ingredient
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
