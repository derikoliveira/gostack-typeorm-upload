import { EntityRepository, Repository } from 'typeorm';

import Transaction from '../models/Transaction';

interface Balance {
  income: number;
  outcome: number;
  total: number;
}

@EntityRepository(Transaction)
class TransactionsRepository extends Repository<Transaction> {
  public async getBalance(): Promise<Balance> {
    const income = await this.getTypeTotalValue('income');
    const outcome = await this.getTypeTotalValue('outcome');
    const total = income - outcome;

    const balance = { income, outcome, total };

    return balance;
  }

  private async getTypeTotalValue(type: 'outcome' | 'income'): Promise<number> {
    const transactions = await this.find({ type });

    const reducer = (accumulator: number, transaction: Transaction): number =>
      accumulator + Number(transaction.value);

    return transactions.reduce(reducer, 0);
  }
}

export default TransactionsRepository;
