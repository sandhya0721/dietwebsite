import { Request, Response, NextFunction } from 'express';
import { Ingredient } from '../models/Ingredient.ts';

export async function listIngredients(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { category, includeUnavailable } = req.query as Record<string, string>;
    const filter: Record<string, unknown> = {};
    if (includeUnavailable !== 'true') {
      filter.isAvailable = true;
    }
    if (category) {
      filter.category = category;
    }

    const ingredients = await Ingredient.find(filter).sort({ category: 1, price: 1 });
    res.json({ ingredients });
  } catch (err) {
    next(err);
  }
}

export async function createIngredient(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const {
      name,
      category,
      price,
      calories,
      proteinGrams,
      carbsGrams,
      fatGrams,
      isVeg,
      isVegan,
    } = req.body;
    if (!name || !category || price === undefined || calories === undefined) {
      res
        .status(400)
        .json({ message: 'Name, category, price, and calories are required.' });
      return;
    }

    const ingredient = await Ingredient.create({
      name,
      category,
      price: Number(price),
      calories: Number(calories),
      proteinGrams: Number(proteinGrams || 0),
      carbsGrams: Number(carbsGrams || 0),
      fatGrams: Number(fatGrams || 0),
      isVeg: isVeg !== undefined ? Boolean(isVeg) : true,
      isVegan: isVegan !== undefined ? Boolean(isVegan) : true,
      isAvailable: true,
    });

    res.status(201).json({ ingredient });
  } catch (err) {
    next(err);
  }
}

export async function updateIngredient(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const ingredient = await Ingredient.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );
    if (!ingredient) {
      res.status(404).json({ message: 'Ingredient not found.' });
      return;
    }
    res.json({ ingredient });
  } catch (err) {
    next(err);
  }
}

export async function deleteIngredient(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const ingredient = await Ingredient.findByIdAndDelete(req.params.id);
    if (!ingredient) {
      res.status(404).json({ message: 'Ingredient not found.' });
      return;
    }
    res.json({ message: 'Ingredient removed.' });
  } catch (err) {
    next(err);
  }
}
