import { Response, NextFunction } from 'express';
import { CustomSalad } from '../models/CustomSalad.ts';
import { Ingredient } from '../models/Ingredient.ts';
import { AuthRequest } from '../middleware/auth.ts';

export async function listMyCustomSalads(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const customSalads = await CustomSalad.find({ user: req.user?._id })
      .populate('base proteins toppings dressing')
      .sort({ createdAt: -1 });

    res.json({ customSalads });
  } catch (err) {
    next(err);
  }
}

export async function createCustomSalad(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const {
      name,
      baseId,
      proteinIds = [],
      toppingIds = [],
      dressingId,
      specialInstructions = '',
      isFavorite = true,
    } = req.body;

    if (!baseId || !dressingId) {
      res.status(400).json({ message: 'Please select a base and a dressing.' });
      return;
    }

    const allIds = [baseId, dressingId, ...proteinIds, ...toppingIds];
    const ingredients = await Ingredient.find({ _id: { $in: allIds } });

    const byId = new Map(ingredients.map((item) => [String(item._id), item]));
    const base = byId.get(String(baseId));
    const dressing = byId.get(String(dressingId));

    if (!base || !dressing) {
      res.status(400).json({ message: 'Selected base or dressing is unavailable.' });
      return;
    }

    const selectedProteins = (proteinIds as string[])
      .map((id) => byId.get(String(id)))
      .filter(Boolean);
    const selectedToppings = (toppingIds as string[])
      .map((id) => byId.get(String(id)))
      .filter(Boolean);

    const chosenList = [base, dressing, ...selectedProteins, ...selectedToppings];
    const totalPrice = chosenList.reduce((sum, item) => sum + (item?.price || 0), 0);
    const totalCalories = chosenList.reduce(
      (sum, item) => sum + (item?.calories || 0),
      0
    );
    const totalProtein = chosenList.reduce(
      (sum, item) => sum + (item?.proteinGrams || 0),
      0
    );
    const totalCarbs = chosenList.reduce(
      (sum, item) => sum + (item?.carbsGrams || 0),
      0
    );
    const totalFat = chosenList.reduce(
      (sum, item) => sum + (item?.fatGrams || 0),
      0
    );

    const customSalad = await CustomSalad.create({
      user: req.user?._id,
      name: (name && name.trim()) || `Custom ${base.name.split(' ')[0]} Bowl`,
      base: base._id,
      proteins: selectedProteins.map((p) => p!._id),
      toppings: selectedToppings.map((t) => t!._id),
      dressing: dressing._id,
      specialInstructions: String(specialInstructions).trim(),
      totalPrice,
      totalCalories,
      totalProtein,
      totalCarbs,
      totalFat,
      isFavorite: Boolean(isFavorite),
    });

    const populated = await CustomSalad.findById(customSalad._id).populate(
      'base proteins toppings dressing'
    );
    res.status(201).json({ customSalad: populated });
  } catch (err) {
    next(err);
  }
}

export async function toggleFavoriteCustomSalad(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const customSalad = await CustomSalad.findOne({
      _id: req.params.id,
      user: req.user?._id,
    });
    if (!customSalad) {
      res.status(404).json({ message: 'Custom salad not found.' });
      return;
    }

    customSalad.isFavorite = !customSalad.isFavorite;
    await customSalad.save();

    const populated = await CustomSalad.findById(customSalad._id).populate(
      'base proteins toppings dressing'
    );
    res.json({ customSalad: populated });
  } catch (err) {
    next(err);
  }
}

export async function deleteCustomSalad(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const deleted = await CustomSalad.findOneAndDelete({
      _id: req.params.id,
      user: req.user?._id,
    });
    if (!deleted) {
      res.status(404).json({ message: 'Custom salad not found.' });
      return;
    }
    res.json({ message: 'Saved custom salad removed.' });
  } catch (err) {
    next(err);
  }
}
