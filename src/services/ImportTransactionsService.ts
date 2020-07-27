import { getCustomRepository, In } from 'typeorm';
import csvParse from 'csv-parse';
import fs from 'fs';
import Transaction from '../models/Transaction';
import CategoriesRepository from '../repositories/CategoriesRepository';
import TransactionsRepository from '../repositories/TransactionsRepository';
import Category from '../models/Category';

interface FileTransaction {
  title: string;
  type: 'income' | 'outcome';
  value: number;
  category_title: string;
}

class ImportTransactionsService {
  async execute(filePath: string): Promise<Transaction[]> {
    const readStream = fs.createReadStream(filePath);

    const csvParseStream = csvParse({
      from_line: 2,
      ltrim: true,
      rtrim: true,
    });

    const parseCSV = readStream.pipe(csvParseStream);

    const transactions: FileTransaction[] = [];
    const categories: string[] = [];

    parseCSV.on('data', line => {
      const [title, type, value, category] = line;

      if (!title || !type || !value) return;

      categories.push(category);

      transactions.push({
        title,
        type,
        value,
        category_title: category,
      });
    });

    await new Promise(resolve => {
      parseCSV.on('end', resolve);
    });

    const categoriesRepository = getCustomRepository(CategoriesRepository);

    const existentingCategories = await categoriesRepository.find({
      where: {
        title: In(categories),
      },
    });

    const existingCategoriesTitles = existentingCategories.map(
      (category: Category) => category.title,
    );

    const addCategoriesTitles = categories
      .filter(category => !existingCategoriesTitles.includes(category))
      .filter((value, index, self) => self.indexOf(value) === index);

    const newCategories = categoriesRepository.create(
      addCategoriesTitles.map(title => ({ title })),
    );

    await categoriesRepository.save(newCategories);

    const finalCategories = [...existentingCategories, ...newCategories];

    const transactionsRepository = getCustomRepository(TransactionsRepository);

    const addTransactions = transactions.map(
      ({ title, type, value, category_title }: FileTransaction) => {
        const transaction_category = finalCategories.find(
          (category: Category) => category.title === category_title,
        );
        const transaction = {
          title,
          type,
          value,
          category_id: transaction_category?.id,
        };
        return transaction;
      },
    );

    const newTransactions = transactionsRepository.create(addTransactions);

    await transactionsRepository.save(newTransactions);

    return newTransactions;
  }
}

export default ImportTransactionsService;
