import { Ingredient } from '../types';

export interface NutritionalInsightItem {
  title: string;
  detail: string;
}

export interface NutritionalInsightsResult {
  dietaryLabel: 'Vegan' | 'Vegetarian' | 'Includes Chicken / Egg';
  macroFocus: string;
  benefits: NutritionalInsightItem[];
  tips: NutritionalInsightItem[];
}

export function buildNutritionalInsights(
  selectedItems: Ingredient[],
  totals: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  }
): NutritionalInsightsResult {
  if (selectedItems.length === 0) {
    return {
      dietaryLabel: 'Vegan',
      macroFocus: 'No ingredients selected',
      benefits: [],
      tips: [
        {
          title: 'Start with a leafy or grain base',
          detail:
            'Choose a crisp green base for lower calories or organic quinoa for steady complex carbohydrates.',
        },
      ],
    };
  }

  const allVegan = selectedItems.every((i) => i.isVegan);
  const allVeg = selectedItems.every((i) => i.isVeg);
  const dietaryLabel: NutritionalInsightsResult['dietaryLabel'] = allVegan
    ? 'Vegan'
    : allVeg
    ? 'Vegetarian'
    : 'Includes Chicken / Egg';

  let macroFocus = 'Balanced Everyday Bowl';
  if (totals.protein >= 25) {
    macroFocus = 'High-Protein Recovery';
  } else if (totals.calories <= 300) {
    macroFocus = 'Light & Low-Calorie';
  } else if (totals.carbs >= 30) {
    macroFocus = 'Sustained Energy';
  }

  const names = selectedItems.map((i) => i.name.toLowerCase());
  const hasAny = (keywords: string[]) =>
    names.some((n) => keywords.some((k) => n.includes(k)));

  const benefits: NutritionalInsightItem[] = [];

  if (hasAny(['spinach', 'kale', 'romaine'])) {
    benefits.push({
      title: 'Micronutrients & Digestive Fiber',
      detail:
        'Leafy greens supply vitamin K, folate, and dietary fiber that support gut health and steady digestion.',
    });
  }

  if (hasAny(['quinoa'])) {
    benefits.push({
      title: 'Complete Plant Carbohydrates',
      detail:
        'Tri-color quinoa provides all nine essential amino acids alongside low-glycemic energy.',
    });
  }

  if (hasAny(['chicken', 'paneer', 'tofu', 'egg', 'chickpeas'])) {
    benefits.push({
      title: 'Satiety & Muscle Maintenance',
      detail: `${totals.protein}g of protein across your selected proteins supports lean muscle repair and helps curb midday cravings.`,
    });
  }

  if (hasAny(['olive oil', 'almond', 'walnut', 'seed', 'olives'])) {
    benefits.push({
      title: 'Heart-Healthy Fats & Vitamin Absorption',
      detail:
        'Monounsaturated and omega-rich fats from nuts, seeds, and olive oil improve absorption of vitamins A, E, and K.',
    });
  }

  if (hasAny(['tomato', 'cucumber'])) {
    benefits.push({
      title: 'Hydration & Antioxidants',
      detail:
        'Fresh cucumber and cherry tomatoes contribute potassium, lycopene, and natural hydration without added calories.',
    });
  }

  if (hasAny(['yogurt'])) {
    benefits.push({
      title: 'Probiotic Dairy Creaminess',
      detail:
        'Greek yogurt dressing adds live cultures and extra calcium with fewer calories than oil-heavy dressings.',
    });
  }

  if (benefits.length === 0) {
    benefits.push({
      title: 'Clean Whole-Food Nutrition',
      detail:
        'Prepared fresh without refined sugars or artificial preservatives for predictable daily energy.',
    });
  }

  const tips: NutritionalInsightItem[] = [];

  if (hasAny(['spinach', 'kale']) && hasAny(['lemon', 'tomato'])) {
    tips.push({
      title: 'Vitamin C + Iron Synergy',
      detail:
        'Acidity from your lemon dressing or tomatoes boosts plant-based iron absorption from dark leafy greens.',
    });
  }

  if (totals.protein < 15) {
    tips.push({
      title: 'Consider Adding a Protein',
      detail:
        'Your bowl currently has under 15g of protein. Adding tofu, paneer, chickpeas, chicken, or eggs will keep you fuller longer.',
    });
  } else if (totals.protein >= 25) {
    tips.push({
      title: 'Post-Workout Ready',
      detail:
        'With 25g+ protein, this combination works well within 60 minutes after strength or cardio training.',
    });
  }

  if (totals.fat >= 12 && hasAny(['spinach', 'kale', 'romaine'])) {
    tips.push({
      title: 'Fat-Soluble Vitamin Pairing',
      detail:
        'Your dressing and seed/nut toppings provide the healthy fats needed to unlock fat-soluble nutrients in your greens.',
    });
  }

  if (totals.calories <= 280) {
    tips.push({
      title: 'Light Meal Profile',
      detail:
        'Under 280 kcal—ideal as a light dinner or side. Add quinoa or roasted seeds if you want a full lunch portion.',
    });
  } else if (totals.calories >= 520) {
    tips.push({
      title: 'Hearty Main-Meal Portion',
      detail:
        'Balanced for a full main meal; consider requesting dressing on the side if you prefer lighter seasoning.',
    });
  }

  if (tips.length === 0) {
    tips.push({
      title: 'Keep Greens Crisp',
      detail:
        'Use the Special Instructions field to request dressing on the side if you plan to enjoy your salad later.',
    });
  }

  return {
    dietaryLabel,
    macroFocus,
    benefits: benefits.slice(0, 4),
    tips: tips.slice(0, 3),
  };
}
