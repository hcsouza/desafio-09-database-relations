import { inject, injectable } from 'tsyringe';

import AppError from '@shared/errors/AppError';

import Customer from '../infra/typeorm/entities/Customer';
import ICustomersRepository from '../repositories/ICustomersRepository';

interface IRequest {
  name: string;
  email: string;
}

@injectable()
class CreateCustomerService {
  private customersRepository: ICustomersRepository;

  constructor(
    @inject('CustomersRepository')
    customersRepository: ICustomersRepository,
  ) {
    this.customersRepository = customersRepository;
  }

  public async execute({ name, email }: IRequest): Promise<Customer> {
    try {
      let customer = await this.customersRepository.findByEmail(email);
      if (customer) {
        throw new AppError('Email already used.');
      }

      customer = await this.customersRepository.create({ name, email });
      return customer;
    } catch (err) {
      throw new AppError(`Error on create customer: ${err}`);
    }
  }
}

export default CreateCustomerService;
