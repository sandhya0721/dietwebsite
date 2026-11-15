import { useEffect, useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { api } from '../api/client';
import { Salad } from '../types';
import { SaladCard } from '../components/SaladCard';

const CATEGORIES = ['All', 'Signature', 'High-Protein', 'Detox', 'Harvest'];
const DIETARY_FILTERS = ['All', 'Veg', 'Vegan', 'High-Protein'];

export function Menu() {
  const [salads, setSalads] = useState<Salad[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [dietary, setDietary] = useState('All');

  useEffect(() => {
    api
      .get('/salads')
      .then((res) => setSalads(res.data.salads))
      .catch((err) =>
        setError(
          err?.response?.data?.message ||
            err?.message ||
            'Unable to load salad menu.'
        )
      )
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    return salads.filter((salad) => {
      if (category !== 'All' && salad.category !== category) return false;
      if (dietary === 'Veg' && !salad.isVeg) return false;
      if (dietary === 'Vegan' && !salad.isVegan) return false;
      if (dietary === 'High-Protein' && salad.dietaryTag !== 'High-Protein')
        return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          salad.name.toLowerCase().includes(q) ||
          salad.description.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [salads, category, dietary, search]);

  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-10">
      <div className="pb-6 border-b border-[#DCE3D8]">
        <h1 className="font-display text-3xl sm:text-4xl font-semibold text-[#16221A]">
          Salad Menu
        </h1>
        <p className="text-sm text-[#4D5E53] mt-1.5">
          Freshly tossed to order with verified macro nutrition and crisp farm
          produce.
        </p>

        {/* Search & Interactive Filter Controls */}
        <div className="mt-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-[#4D5E53] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search bowls or ingredients..."
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#DCE3D8] rounded-lg text-sm text-[#16221A] placeholder:text-[#4D5E53]/70 focus:outline-none focus:border-[#1B5E37]"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1 p-1 bg-[#EEF2EC] rounded-lg overflow-x-auto">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                    category === cat
                      ? 'bg-white text-[#16221A] shadow-sm'
                      : 'text-[#4D5E53] hover:text-[#16221A]'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1 p-1 bg-[#EEF2EC] rounded-lg overflow-x-auto">
              {DIETARY_FILTERS.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => setDietary(tag)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                    dietary === tag
                      ? 'bg-white text-[#16221A] shadow-sm'
                      : 'text-[#4D5E53] hover:text-[#16221A]'
                  }`}
                >
                  {tag === 'All' ? 'All Diets' : tag}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Product Grid */}
      <div className="mt-8">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div
                key={n}
                className="h-[380px] rounded-xl bg-white border border-[#DCE3D8] animate-pulse"
              />
            ))}
          </div>
        ) : error ? (
          <div className="bg-[#FEF2F2] border border-[#FECACA] rounded-xl p-8 text-center">
            <p className="text-sm font-medium text-[#B91C1C]">{error}</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white border border-[#DCE3D8] rounded-xl p-12 text-center">
            <p className="text-base font-medium text-[#16221A]">
              No salads match your current filters.
            </p>
            <p className="text-sm text-[#4D5E53] mt-1">
              Try clearing your search or selecting another dietary category.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearch('');
                setCategory('All');
                setDietary('All');
              }}
              className="mt-4 px-4 py-2 text-sm font-medium text-white bg-[#1B5E37] rounded-lg hover:bg-[#154A2B] cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((salad) => (
              <SaladCard key={salad._id} salad={salad} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
