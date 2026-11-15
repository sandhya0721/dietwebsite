import { Request, Response, NextFunction } from 'express';
import { Salad } from '../models/Salad.ts';

export async function listSalads(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { category, dietary, search, includeUnavailable } = req.query as Record<
      string,
      string
    >;

    const filter: Record<string, unknown> = {};
    if (includeUnavailable !== 'true') {
      filter.isAvailable = true;
    }
    if (category && category !== 'All') {
      filter.category = category;
    }
    if (dietary === 'Veg') {
      filter.isVeg = true;
    } else if (dietary === 'Vegan') {
      filter.isVegan = true;
    } else if (dietary === 'High-Protein') {
      filter.dietaryTag = 'High-Protein';
    }
    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      filter.$or = [{ name: regex }, { description: regex }];
    }

    const salads = await Salad.find(filter).sort({ createdAt: -1 });
    res.json({ salads });
  } catch (err) {
    next(err);
  }
}

export async function getSalad(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const salad = await Salad.findById(req.params.id);
    if (!salad) {
      res.status(404).json({ message: 'Salad item not found.' });
      return;
    }
    res.json({ salad });
  } catch (err) {
    next(err);
  }
}

export async function createSalad(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const {
      name,
      description,
      price,
      calories,
      proteinGrams,
      carbsGrams,
      fatGrams,
      imageUrl,
      category,
      dietaryTag,
      isVeg,
      isVegan,
      ingredientsList,
      isAvailable,
    } = req.body;

    if (!name || !description || !price || !calories) {
      res
        .status(400)
        .json({ message: 'Name, description, price, and calories are required.' });
      return;
    }

    const salad = await Salad.create({
      name,
      description,
      price: Number(price),
      calories: Number(calories),
      proteinGrams: Number(proteinGrams || 18),
      carbsGrams: Number(carbsGrams || 28),
      fatGrams: Number(fatGrams || 12),
      imageUrl:
        imageUrl || '/src/assets/images/salad_mediterranean_quinoa_1794716475366.jpg',
      category: category || 'Signature',
      dietaryTag: dietaryTag || (isVegan ? 'Vegan' : isVeg !== false ? 'Veg' : 'High-Protein'),
      isVeg: isVeg !== undefined ? Boolean(isVeg) : true,
      isVegan: Boolean(isVegan),
      ingredientsList: Array.isArray(ingredientsList) ? ingredientsList : [],
      isAvailable: isAvailable !== undefined ? Boolean(isAvailable) : true,
    });

    res.status(201).json({ salad });
  } catch (err) {
    next(err);
  }
}

export async function updateSalad(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const salad = await Salad.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );
    if (!salad) {
      res.status(404).json({ message: 'Salad item not found.' });
      return;
    }
    res.json({ salad });
  } catch (err) {
    next(err);
  }
}

export async function deleteSalad(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const salad = await Salad.findByIdAndDelete(req.params.id);
    if (!salad) {
      res.status(404).json({ message: 'Salad item not found.' });
      return;
    }
    res.json({ message: 'Salad deleted from menu.' });
  } catch (err) {
    next(err);
  }
}
