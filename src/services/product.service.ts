import { productRepository, ProductFilterParams } from '../repositories/product.repository.ts';
import { customerRepository } from '../repositories/customer.repository.ts';
import { BankingError } from '../lib/errors.ts';

export const productService = {
  async listProducts(params: ProductFilterParams) {
    return await productRepository.findMany(params);
  },

  async getProductById(idOrCode: string | number) {
    let product = null;
    if (typeof idOrCode === 'number' || !isNaN(Number(idOrCode))) {
      product = await productRepository.findById(Number(idOrCode));
    }
    if (!product && typeof idOrCode === 'string') {
      product = await productRepository.findByCode(idOrCode);
    }

    if (!product) {
      throw new BankingError('PRODUCT_NOT_FOUND', `Banking Product '${idOrCode}' could not be found.`, 404);
    }

    return product;
  },

  async getCustomerProducts(customerIdOrCode: string | number) {
    const customer = await customerRepository.findByIdOrCode(customerIdOrCode);
    if (!customer) {
      throw new BankingError('CUSTOMER_NOT_FOUND', `Customer '${customerIdOrCode}' could not be found.`, 404);
    }

    return await productRepository.getCustomerProducts(customer.id);
  },

  async enrollCustomerProduct(customerIdOrCode: string | number, productIdOrCode: string | number, accountId?: number) {
    const customer = await customerRepository.findByIdOrCode(customerIdOrCode);
    if (!customer) {
      throw new BankingError('CUSTOMER_NOT_FOUND', `Customer '${customerIdOrCode}' could not be found.`, 404);
    }

    const product = await this.getProductById(productIdOrCode);
    return await productRepository.enrollCustomerProduct(customer.id, product.id, accountId);
  },
};
