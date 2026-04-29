/**
 * Gift Store Seed — SRV Electricals
 * Seeds all gift products from the old app into the database.
 * Run: npx ts-node src/database/seeds/gift-seed.ts
 */
import { DataSource } from 'typeorm';
import { Product } from '../entities/product.entity';

const AppDataSource = new DataSource({
  type: 'postgres',
  host: 'localhost',
  port: 5433,
  username: 'postgres',
  password: '4268',
  database: 'srv_admin',
  entities: [__dirname + '/../entities/*.entity{.ts,.js}'],
  synchronize: false,
});

const GIFTS = [
  // ── Electrician Gifts (from old app screenshots) ──────────────────────────
  {
    name: 'BLDS Ceiling Fan (Small)',
    sub: 'BLDS Ceiling Fan — Standard Size',
    image: 'https://srvelectricals.com/cdn/shop/files/AP-Turtle-Fan.webp?v=1747938680&width=400',
    points: 1500,
    price: 2299,
    mrp: 2299,
    stock: 50,
    subCategory: 'electrician',
    badge: 'Popular',
    description: 'BLDS Ceiling Fan — Standard size, energy efficient motor',
  },
  {
    name: 'BLDS Ceiling Fan (Large)',
    sub: 'BLDS Ceiling Fan — Premium Size',
    image: 'https://srvelectricals.com/cdn/shop/files/AP-Turtle-Fan.webp?v=1747938680&width=400',
    points: 2000,
    price: 3999,
    mrp: 3999,
    stock: 30,
    subCategory: 'electrician',
    badge: 'Premium',
    description: 'BLDS Ceiling Fan — Large premium size with high airflow',
  },
  {
    name: 'Electric Water Heater',
    sub: 'SRV Electric Water Geyser',
    image: 'https://cdn.shopify.com/s/files/1/0651/4583/1466/files/HeatBlowerM2_04f122c9-0cc4-4df8-a422-cd731205da85.png?v=1772694634&width=400',
    points: 3000,
    price: 5599,
    mrp: 5599,
    stock: 20,
    subCategory: 'electrician',
    badge: 'Top Pick',
    description: 'SRV Electric Water Heater — Energy saving, fast heating',
  },
  {
    name: 'Drill Machine',
    sub: 'Professional Electric Drill',
    image: 'https://cdn.shopify.com/s/files/1/0651/4583/1466/files/DrillMachine.png?v=1757426700&width=400',
    points: 750,
    price: 2500,
    mrp: 2500,
    stock: 40,
    subCategory: 'electrician',
    badge: 'Best Seller',
    description: 'Professional electric drill machine for electricians',
  },
  {
    name: 'Electrician Bag',
    sub: 'SRV Branded Tool Bag',
    image: 'https://cdn.shopify.com/s/files/1/0651/4583/1466/files/ElectricianBag.png?v=1757426700&width=400',
    points: 75,
    price: 150,
    mrp: 150,
    stock: 100,
    subCategory: 'electrician',
    badge: 'New',
    description: 'SRV branded electrician tool bag — durable and spacious',
  },
  {
    name: 'Navy Blue Track Pant',
    sub: 'SRV Branded Track Pant',
    image: 'https://cdn.shopify.com/s/files/1/0651/4583/1466/files/NavyBlueTrackPant.png?v=1757426700&width=400',
    points: 175,
    price: 449,
    mrp: 449,
    stock: 60,
    subCategory: 'electrician',
    badge: '',
    description: 'SRV branded navy blue track pant — comfortable daily wear',
  },
  {
    name: 'Electric Chimney',
    sub: 'Kitchen Electric Chimney',
    image: 'https://cdn.shopify.com/s/files/1/0651/4583/1466/files/ElectricChimney.png?v=1757426700&width=400',
    points: 6000,
    price: 7500,
    mrp: 7500,
    stock: 10,
    subCategory: 'electrician',
    badge: 'Premium',
    description: 'Kitchen electric chimney — powerful suction, auto clean',
  },

  // ── Dealer Gifts ──────────────────────────────────────────────────────────
  {
    name: 'BLDS Ceiling Fan (Small)',
    sub: 'BLDS Ceiling Fan — Standard Size',
    image: 'https://srvelectricals.com/cdn/shop/files/AP-Turtle-Fan.webp?v=1747938680&width=400',
    points: 1500,
    price: 2299,
    mrp: 2299,
    stock: 50,
    subCategory: 'dealer',
    badge: 'Popular',
    description: 'BLDS Ceiling Fan — Standard size, energy efficient motor',
  },
  {
    name: 'BLDS Ceiling Fan (Large)',
    sub: 'BLDS Ceiling Fan — Premium Size',
    image: 'https://srvelectricals.com/cdn/shop/files/AP-Turtle-Fan.webp?v=1747938680&width=400',
    points: 2000,
    price: 3999,
    mrp: 3999,
    stock: 30,
    subCategory: 'dealer',
    badge: 'Premium',
    description: 'BLDS Ceiling Fan — Large premium size with high airflow',
  },
  {
    name: 'Electric Water Heater',
    sub: 'SRV Electric Water Geyser',
    image: 'https://cdn.shopify.com/s/files/1/0651/4583/1466/files/HeatBlowerM2_04f122c9-0cc4-4df8-a422-cd731205da85.png?v=1772694634&width=400',
    points: 3000,
    price: 5599,
    mrp: 5599,
    stock: 20,
    subCategory: 'dealer',
    badge: 'Top Pick',
    description: 'SRV Electric Water Heater — Energy saving, fast heating',
  },
  {
    name: 'Drill Machine',
    sub: 'Professional Electric Drill',
    image: 'https://cdn.shopify.com/s/files/1/0651/4583/1466/files/DrillMachine.png?v=1757426700&width=400',
    points: 750,
    price: 2500,
    mrp: 2500,
    stock: 40,
    subCategory: 'dealer',
    badge: 'Best Seller',
    description: 'Professional electric drill machine',
  },
  {
    name: 'Electric Chimney',
    sub: 'Kitchen Electric Chimney',
    image: 'https://cdn.shopify.com/s/files/1/0651/4583/1466/files/ElectricChimney.png?v=1757426700&width=400',
    points: 6000,
    price: 7500,
    mrp: 7500,
    stock: 10,
    subCategory: 'dealer',
    badge: 'Premium',
    description: 'Kitchen electric chimney — powerful suction, auto clean',
  },
];

async function seed() {
  try {
    await AppDataSource.initialize();
    console.log('✅ Database connected');

    const productRepo = AppDataSource.getRepository(Product);

    let created = 0;
    let skipped = 0;

    for (const gift of GIFTS) {
      // Check if already exists (same name + subCategory)
      const existing = await productRepo.findOne({
        where: { name: gift.name, category: 'gift', subCategory: gift.subCategory },
      });

      if (existing) {
        console.log(`⏭  Skipped (exists): ${gift.name} [${gift.subCategory}]`);
        skipped++;
        continue;
      }

      const product = productRepo.create({
        name: gift.name,
        sub: gift.sub,
        category: 'gift',
        subCategory: gift.subCategory,
        image: gift.image,
        points: gift.points,
        price: gift.price,
        mrp: gift.mrp,
        stock: gift.stock,
        isActive: true,
        badge: gift.badge,
        description: gift.description,
      });

      await productRepo.save(product);
      console.log(`✅ Created: ${gift.name} [${gift.subCategory}] — ${gift.points} pts`);
      created++;
    }

    console.log(`\n🎁 Gift seed complete: ${created} created, ${skipped} skipped`);
    await AppDataSource.destroy();
  } catch (error) {
    console.error('❌ Seed error:', error);
    process.exit(1);
  }
}

seed();
