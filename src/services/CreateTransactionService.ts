import { getRepository, getCustomRepository } from 'typeorm';

import AppError from '../errors/AppError';
import Transaction from '../models/Transaction';
import CategoriesRepository from '../repositories/CategoriesRepository';
import TransactionsRepository from '../repositories/TransactionsRepository';

interface Request {
  title: string;
  value: number;
  type: 'income' | 'outcome';
  category_title: string;
}

class CreateTransactionService {
  public async execute({
    title,
    value,
    type,
    category_title,
  }: Request): Promise<Transaction> {
    const transactionsRepository = getRepository(Transaction);
    const transactionsCustomRepository = getCustomRepository(
      TransactionsRepository,
    );
    const categoriesRepository = new CategoriesRepository();

    const category = await categoriesRepository.findByTitleOrCreate(
      category_title,
    );

    const balance = await transactionsCustomRepository.getBalance();

    if (type === 'outcome' && value > balance.total) {
      throw new AppError('Outcome transaction is greater than total');
    }

    const transaction = transactionsRepository.create({
      title,
      value,
      type,
      category_id: category.id,
    });

    await transactionsRepository.save(transaction);

    return transaction;
  }
}

export default CreateTransactionService;
