import { EntityRepository, getRepository, Repository } from 'typeorm';

import Category from '../models/Category';

@EntityRepository(Category)
class CategoriesRepository extends Repository<Category> {
  public async findByTitleOrCreate(title: string): Promise<Category> {
    const categoriesRepository = getRepository(Category);

    let category = await categoriesRepository.findOne({
      title,
    });

    if (!category) {
      category = categoriesRepository.create({ title });
      await categoriesRepository.save(category);
    }

    return category;
  }
}

export default CategoriesRepository;
