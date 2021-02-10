import { Request, Response } from 'express';

import { container } from 'tsyringe';

import CreateOrderService from '@modules/orders/services/CreateOrderService';
import FindOrderService from '@modules/orders/services/FindOrderService';

export default class OrdersController {
  public async show(request: Request, response: Response): Promise<Response> {
    const findService = container.resolve(FindOrderService);
    const { id } = request.body;
    const order = await findService.execute({ id });
    return response.json(order);
  }

  public async create(request: Request, response: Response): Promise<Response> {
    const createService = container.resolve(CreateOrderService);
    const { customer_id, products } = request.body;
    const order = await createService.execute({ customer_id, products });
    return response.json(order);
  }
}
