import { getCustomRepository, getRepository } from 'typeorm';

import AppError from '../errors/AppError';

import Transaction from '../models/Transaction';
import Category from '../models/Category';
import TransactionRepository from '../repositories/TransactionsRepository';

interface Request {
  title: string;
  value: number;
  type: 'income' | 'outcome';
  category: string;
}

class CreateTransactionService {
  public async execute({
    title,
    value,
    type,
    category,
  }: Request): Promise<Transaction> {
    const transactionRepository = getCustomRepository(TransactionRepository);
    const categoryRepository = getRepository(Category);

    if (type === 'outcome') {
      const currentBalance = await transactionRepository.getBalance();
      const previewBalance = currentBalance.total - value;

      if (previewBalance < 0) {
        throw new AppError('User does not have enought balance!');
      }
    }

    const categoryExist = await categoryRepository.findOne({
      where: { title: category },
    });

    let finalCategory;

    if (!categoryExist) {
      const newCategory = categoryRepository.create({ title: category });
      await categoryRepository.save(newCategory);
      finalCategory = newCategory;
    } else {
      finalCategory = categoryExist;
    }

    const transaction = transactionRepository.create({
      title,
      type,
      category: finalCategory,
      value,
    });

    await transactionRepository.save(transaction);

    return transaction;
  }
}

export default CreateTransactionService;
