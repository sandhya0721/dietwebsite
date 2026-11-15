import { useState } from 'react';
import { Check, Plus } from 'lucide-react';
import { Salad } from '../types';
import { useCart } from '../context/CartContext';
import { SafeImage } from './SafeImage';

interface SaladCardProps {
  salad: Salad;
}

export function SaladCard({ salad }: SaladCardProps) {
  const { addSalad } = useCart();
  const [added, setAdded] = useState(false);

  const handleAdd = () => {
    addSalad(salad, 1);
    setAdded(true);
    setTimeout(() => setAdded(false), 1200);
  };

  return (
    <article className="bg-white border border-[#DCE3D8] rounded-xl overflow-hidden flex flex-col transition-transform duration-150 hover:-translate-y-0.5">
      {/* Image leads (~68% visual weight) */}
      <div className="aspect-[4/3] w-full bg-[#EEF2EC] overflow-hidden">
        <SafeImage
          src={salad.imageUrl}
          alt={salad.name}
          className="w-full h-full object-cover"
        />
      </div>

      <div className="p-5 flex-1 flex flex-col">
        {/* Clean unboxed metadata with typographic separators */}
        <div className="flex items-center gap-1.5 text-xs text-[#4D5E53] mb-1.5">
          <span>{salad.category}</span>
          <span aria-hidden="true">·</span>
          <span>{salad.dietaryTag}</span>
          <span aria-hidden="true">·</span>
          <span className="tabular-nums">{salad.calories} kcal</span>
        </div>

        <h3 className="text-base font-semibold text-[#16221A] leading-snug">
          {salad.name}
        </h3>

        <p className="text-sm text-[#4D5E53] mt-2 line-clamp-2 leading-relaxed flex-1">
          {salad.description}
        </p>

        <div className="mt-4 pt-4 border-t border-[#EEF2EC] flex items-center justify-between gap-3">
          <div>
            <span className="text-base font-semibold text-[#16221A] tabular-nums">
              ₹{salad.price}
            </span>
            <span className="text-xs text-[#4D5E53] ml-2 tabular-nums">
              {salad.proteinGrams}g protein
            </span>
          </div>

          <button
            type="button"
            onClick={handleAdd}
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
              added
                ? 'bg-[#15803D] text-white'
                : 'bg-[#1B5E37] text-white hover:bg-[#154A2B]'
            }`}
          >
            {added ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Added</span>
              </>
            ) : (
              <>
                <Plus className="w-3.5 h-3.5" />
                <span>Add to Cart</span>
              </>
            )}
          </button>
        </div>
      </div>
    </article>
  );
}
