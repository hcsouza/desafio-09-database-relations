import { inject, injectable } from 'tsyringe';

import AppError from '@shared/errors/AppError';

import IProductsRepository from '@modules/products/repositories/IProductsRepository';
import ICustomersRepository from '@modules/customers/repositories/ICustomersRepository';
import Product from '@modules/products/infra/typeorm/entities/Product';
import Order from '../infra/typeorm/entities/Order';
import IOrdersRepository from '../repositories/IOrdersRepository';
import ICreateOrderDTO from '../dtos/ICreateOrderDTO';

interface IProduct {
  id: string;
  quantity: number;
}

interface IRequest {
  customer_id: string;
  products: IProduct[];
}

@injectable()
class CreateOrderService {
  constructor(
    @inject('OrdersRepository')
    private ordersRepository: IOrdersRepository,

    @inject('ProductsRepository')
    private productsRepository: IProductsRepository,

    @inject('CustomersRepository')
    private customersRepository: ICustomersRepository,
  ) {}

  public async execute({ customer_id, products }: IRequest): Promise<Order> {
    const cartOrder = await this.buildOrder(customer_id, products);
    const order = await this.ordersRepository.create(cartOrder);

    const productsToOrder = await this.getProducts(products);
    const toUpdate = productsToOrder.map((toOrder, idx) => {
      return {
        id: toOrder.id,
        quantity: toOrder.quantity - products[idx].quantity,
      };
    });
    const updates = await this.productsRepository.updateQuantity(toUpdate);
    if (!updates) {
      throw new AppError('Cannot update stock');
    }
    return order;
  }

  private async getProducts(products: IProduct[]): Promise<Product[]> {
    const findProducts = products.map(product => {
      return { id: product.id };
    });

    const items = await this.productsRepository.findAllById(findProducts);
    return items;
  }

  private async buildOrder(
    customer_id: string,
    products: IProduct[],
  ): Promise<ICreateOrderDTO> {
    const customer = await this.customersRepository.findById(customer_id);
    if (!customer) {
      throw new AppError('Customer not exists');
    }

    const productsToOrder = await this.getProducts(products);

    if (productsToOrder.length !== products.length) {
      throw new AppError('Pedido contém produto inválido.');
    }

    const productStocksExceeded = productsToOrder.filter(
      toOrder =>
        (products.find(prod => prod.id === toOrder.id)?.quantity || 0) >
        toOrder.quantity,
    );

    if (productStocksExceeded.length > 0) {
      throw new AppError('Quantidade solicitada excede estoque.');
    }

    return {
      customer,
      products: productsToOrder.map(product => {
        return {
          product_id: product.id,
          price: product.price,
          quantity:
            products.find(prod => prod.id === product.id)?.quantity || 0,
        };
      }),
    };
  }
}

export default CreateOrderService;
