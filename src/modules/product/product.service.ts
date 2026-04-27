import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Product } from '../../database/entities/product.entity';
import { ProductCategory } from '../../database/entities/product-category.entity';

@Injectable()
export class ProductService {
  constructor(
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    @InjectRepository(ProductCategory)
    private productCategoryRepository: Repository<ProductCategory>,
  ) {}

  async create(createProductDto: CreateProductDto) {
    if (createProductDto.sku) {
      const existingProduct = await this.productRepository.findOne({
        where: { sku: createProductDto.sku },
      });
      if (existingProduct) {
        throw new ConflictException('Product with this SKU already exists');
      }
    }

    // Normalize aliases: imageUrl → image, pointsValue → points, description → sub
    const data: any = { ...createProductDto };
    if (!data.image && data.imageUrl) { data.image = data.imageUrl; }
    if (!data.points && data.pointsValue) { data.points = data.pointsValue; }
    if (!data.sub && data.description) { data.sub = data.description; }
    // Remove alias keys so they don't hit the entity
    delete data.imageUrl;
    delete data.pointsValue;
    // keep description as-is (entity has description column too)

    const product = this.productRepository.create(data);
    return this.productRepository.save(product);
  }

  async findAll(
    page: number = 1,
    limit: number = 20,
    search?: string,
    category?: string,
    isActive?: boolean,
  ) {
    const skip = (page - 1) * limit;
    const queryBuilder = this.productRepository.createQueryBuilder('product');

    if (search) {
      queryBuilder.andWhere(
        '(product.name ILIKE :search OR product.category ILIKE :search OR product.sku ILIKE :search)',
        { search: `%${search}%` }
      );
    }

    if (category) {
      queryBuilder.andWhere('product.category = :category', { category });
    }

    if (isActive !== undefined) {
      queryBuilder.andWhere('product.isActive = :isActive', { isActive });
    }

    queryBuilder
      .orderBy('product.createdAt', 'DESC')
      .skip(skip)
      .take(limit);

    const [data, total] = await queryBuilder.getManyAndCount();

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string) {
    const product = await this.productRepository.findOne({
      where: { id },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return product;
  }

  async update(id: string, updateProductDto: UpdateProductDto) {
    const product = await this.findOne(id);

    if (updateProductDto.sku && updateProductDto.sku !== product.sku) {
      const existingProduct = await this.productRepository.findOne({
        where: { sku: updateProductDto.sku },
      });
      if (existingProduct) {
        throw new ConflictException('Product with this SKU already exists');
      }
    }

    // Normalize aliases
    const data: any = { ...updateProductDto };
    if (!data.image && data.imageUrl) { data.image = data.imageUrl; }
    if (!data.points && data.pointsValue) { data.points = data.pointsValue; }
    if (!data.sub && data.description) { data.sub = data.description; }
    delete data.imageUrl;
    delete data.pointsValue;

    await this.productRepository.update(id, data);
    return this.findOne(id);
  }

  async remove(id: string) {
    const product = await this.findOne(id);
    await this.productRepository.remove(product);
    return { message: 'Product deleted successfully' };
  }

  async getCategories() {
    const categories = await this.productCategoryRepository.find({
      order: { sortOrder: 'ASC', label: 'ASC' },
    });

    const countRows = await this.productRepository
      .createQueryBuilder('product')
      .select('product.category', 'category')
      .addSelect('COUNT(*)', 'count')
      .groupBy('product.category')
      .getRawMany();

    const countMap = new Map(
      countRows.map((row: any) => [String(row.category).toLowerCase(), Number(row.count)]),
    );

    if (categories.length) {
      return categories.map((category) => ({
        id: category.id,
        name: category.label,
        slug: category.label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
        description: '',
        image: category.imageUrl ?? '',
        productCount: countMap.get(category.label.toLowerCase()) ?? 0,
        isActive: category.isActive,
        sortOrder: category.sortOrder,
        glyph: category.glyph,
      }));
    }

    return Array.from(countMap.entries()).map(([label, count], index) => ({
      id: `${index + 1}`,
      name: label,
      slug: label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
      description: '',
      image: '',
      productCount: count,
      isActive: true,
      sortOrder: index + 1,
      glyph: null,
    }));
  }

  async createCategory(body: any) {
    const label = String(body?.name ?? body?.label ?? '').trim();
    if (!label) {
      throw new ConflictException('Category name is required');
    }

    const existing = await this.productCategoryRepository.findOne({ where: { label } });
    if (existing) {
      throw new ConflictException('Category already exists');
    }

    const category = this.productCategoryRepository.create({
      label,
      glyph: body?.glyph ?? null,
      imageUrl: body?.image ?? body?.imageUrl ?? null,
      sortOrder: Number(body?.sortOrder ?? 1),
      isActive: body?.isActive !== undefined ? Boolean(body.isActive) : true,
    });
    return this.productCategoryRepository.save(category);
  }

  async updateCategory(id: string, body: any) {
    const category = await this.productCategoryRepository.findOne({ where: { id } });
    if (!category) {
      throw new NotFoundException('Category not found');
    }

    await this.productCategoryRepository.update(id, {
      label: body?.name ?? body?.label ?? category.label,
      imageUrl: body?.image ?? body?.imageUrl ?? category.imageUrl,
      sortOrder: body?.sortOrder !== undefined ? Number(body.sortOrder) : category.sortOrder,
      isActive: body?.isActive !== undefined ? Boolean(body.isActive) : category.isActive,
      glyph: body?.glyph ?? category.glyph,
    });

    return this.productCategoryRepository.findOne({ where: { id } });
  }

  async deleteCategory(id: string) {
    const category = await this.productCategoryRepository.findOne({ where: { id } });
    if (!category) {
      throw new NotFoundException('Category not found');
    }

    const productCount = await this.productRepository.count({
      where: { category: category.label },
    });
    if (productCount > 0) {
      throw new ConflictException('Category cannot be deleted while products still exist');
    }

    await this.productCategoryRepository.remove(category);
    return { message: 'Category deleted successfully' };
  }
}
