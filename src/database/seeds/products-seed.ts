/**
 * Products Seed — adds all 14 SRV product categories with real images
 * Run: npx ts-node -r tsconfig-paths/register src/database/seeds/products-seed.ts
 */
import { DataSource } from 'typeorm';
import { Product } from '../entities/product.entity';
import { QrCode } from '../entities/qr-code.entity';

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

const ALL_PRODUCTS = [
  // Fan Box
  { name: 'FAN BOX 3" RANGE', sub: 'F8/FC/FDB 18-40 PC', category: 'fanbox', points: 10, price: 89, image: 'https://srvelectricals.com/cdn/shop/files/F8_3_18-40.png?v=1757426631&width=320', badge: 'Popular', sku: 'FB-3-001' },
  { name: 'FAN BOX 4" RANGE', sub: 'FC 4 17-30/20-40 PC', category: 'fanbox', points: 12, price: 104, image: 'https://srvelectricals.com/cdn/shop/files/FC_4_17-30.png?v=1757426626&width=320', badge: '', sku: 'FB-4-001' },
  { name: 'FAN BOX 5" RANGE', sub: 'FC 5 Heavy Duty Series', category: 'fanbox', points: 14, price: 125, image: 'https://srvelectricals.com/cdn/shop/files/FC_4_17-30.png?v=1757426626&width=320', badge: '', sku: 'FB-5-001' },
  // Concealed Box
  { name: 'CONCEALED BOX 3"', sub: 'CRD PL precision build', category: 'concealedbox', points: 15, price: 120, image: 'https://srvelectricals.com/cdn/shop/files/CRD_PL_3.png?v=1757426566&width=320', badge: 'Best Seller', sku: 'CB-3-001' },
  { name: 'CONCEALED BOX 4"', sub: 'CRD PL 4 inch series', category: 'concealedbox', points: 18, price: 145, image: 'https://srvelectricals.com/cdn/shop/files/CRD_PL_3.png?v=1757426566&width=320', badge: '', sku: 'CB-4-001' },
  { name: 'OCTAGONAL BOX', sub: 'Heavy duty octagonal', category: 'concealedbox', points: 20, price: 160, image: 'https://srvelectricals.com/cdn/shop/files/CRD_PL_3.png?v=1757426566&width=320', badge: '', sku: 'CB-OCT-001' },
  // Modular
  { name: 'MODULE BOX PLATINUM', sub: 'Premium modular range', category: 'modular', points: 25, price: 180, image: 'https://srvelectricals.com/cdn/shop/files/3x3_679e5d30-ecf2-446e-9452-354bbf4c4a26.png?v=1757426377&width=320', badge: 'Premium', sku: 'MOD-P-001' },
  { name: 'MODULE BOX GOLD', sub: 'Gold series modular', category: 'modular', points: 20, price: 150, image: 'https://srvelectricals.com/cdn/shop/files/3x3_679e5d30-ecf2-446e-9452-354bbf4c4a26.png?v=1757426377&width=320', badge: '', sku: 'MOD-G-001' },
  { name: 'MODULE BOX SUPER', sub: 'Super series modular', category: 'modular', points: 15, price: 120, image: 'https://srvelectricals.com/cdn/shop/files/3x3_679e5d30-ecf2-446e-9452-354bbf4c4a26.png?v=1757426377&width=320', badge: '', sku: 'MOD-S-001' },
  // MCB
  { name: 'MCB BOX 4 WAY GI', sub: 'Reliable DB box for sites', category: 'mcb', points: 40, price: 830, image: 'https://srvelectricals.com/cdn/shop/files/MCB_Box_4_Way_GI.png?v=1757426418&width=320', badge: '', sku: 'MCB-4W-001' },
  { name: 'MCB BOX 6 WAY', sub: '6 Way Distribution Board', category: 'mcb', points: 55, price: 1100, image: 'https://srvelectricals.com/cdn/shop/files/MCB_Box_4_Way_GI.png?v=1757426418&width=320', badge: '', sku: 'MCB-6W-001' },
  { name: 'MCB BOX 8 WAY', sub: '8 Way Distribution Board', category: 'mcb', points: 70, price: 1400, image: 'https://srvelectricals.com/cdn/shop/files/MCB_Box_4_Way_GI.png?v=1757426418&width=320', badge: '', sku: 'MCB-8W-001' },
  // Bus Bar
  { name: 'BUS BAR 100A SUPER', sub: 'TATA GPSP Sheet', category: 'busbar', points: 50, price: 450, image: 'https://srvelectricals.com/cdn/shop/files/Bus_Bar_100A_Super.png?v=1757426672&width=320', badge: '', sku: 'BB-100-001' },
  { name: 'BUS BAR 63A', sub: 'Pure Copper 63 Amp', category: 'busbar', points: 35, price: 320, image: 'https://srvelectricals.com/cdn/shop/files/Bus_Bar_100A_Super.png?v=1757426672&width=320', badge: '', sku: 'BB-63-001' },
  // Exhaust Fan
  { name: 'KITCHEN FAN ROYAL', sub: 'Premium Ventilation Series', category: 'exhaust', points: 45, price: 850, image: 'https://srvelectricals.com/cdn/shop/files/AP-Turtle-Fan.webp?v=1747938680&width=320', badge: '', sku: 'EF-KR-001' },
  { name: 'EXHAUST FAN 6"', sub: 'Standard 6 inch exhaust', category: 'exhaust', points: 30, price: 550, image: 'https://srvelectricals.com/cdn/shop/files/AP-Turtle-Fan.webp?v=1747938680&width=320', badge: '', sku: 'EF-6-001' },
  { name: 'EXHAUST FAN 8"', sub: 'Heavy duty 8 inch', category: 'exhaust', points: 40, price: 750, image: 'https://srvelectricals.com/cdn/shop/files/AP-Turtle-Fan.webp?v=1747938680&width=320', badge: '', sku: 'EF-8-001' },
  // LED
  { name: 'LED FLOOD LIGHT SLEEK', sub: 'Outdoor high-throw lighting', category: 'led', points: 30, price: 699, image: 'https://srvelectricals.com/cdn/shop/files/FloodLightSleek.png?v=1757426471&width=320', badge: '', sku: 'LED-FL-001' },
  { name: 'LED PANEL LIGHT 18W', sub: 'Slim panel light 18W', category: 'led', points: 25, price: 450, image: 'https://srvelectricals.com/cdn/shop/files/FloodLightSleek.png?v=1757426471&width=320', badge: '', sku: 'LED-PL-001' },
  { name: 'LED STREET LIGHT 30W', sub: 'Outdoor street lighting', category: 'led', points: 60, price: 1200, image: 'https://srvelectricals.com/cdn/shop/files/FloodLightSleek.png?v=1757426471&width=320', badge: '', sku: 'LED-SL-001' },
  // Changeover
  { name: 'AUTO CHANGEOVER 32A', sub: 'Single Phase Auto Switch', category: 'changeover', points: 50, price: 1200, image: 'https://srvelectricals.com/cdn/shop/files/ACO_100A_FP.png?v=1757426480&width=320', badge: 'Popular', sku: 'ACO-32-001' },
  { name: 'AUTO CHANGEOVER 63A', sub: 'Heavy Duty Auto Switch', category: 'changeover', points: 80, price: 2200, image: 'https://srvelectricals.com/cdn/shop/files/ACO_100A_FP.png?v=1757426480&width=320', badge: '', sku: 'ACO-63-001' },
  { name: 'DIGITAL PANEL METER', sub: 'Digital voltage/current meter', category: 'changeover', points: 35, price: 800, image: 'https://srvelectricals.com/cdn/shop/files/ACO_100A_FP.png?v=1757426480&width=320', badge: '', sku: 'DPM-001' },
  // Main Switch
  { name: 'MAIN SWITCH 32A DP', sub: 'Double Pole Main Switch', category: 'mainswitch', points: 40, price: 950, image: 'https://srvelectricals.com/cdn/shop/files/CO_32A_DP_PRM.png?v=1757426515&width=320', badge: '', sku: 'MS-32-001' },
  { name: 'MAIN SWITCH 63A DP', sub: 'Heavy Duty Double Pole', category: 'mainswitch', points: 60, price: 1500, image: 'https://srvelectricals.com/cdn/shop/files/CO_32A_DP_PRM.png?v=1757426515&width=320', badge: '', sku: 'MS-63-001' },
  { name: 'FUSE UNIT 32A', sub: 'Rewirable fuse unit', category: 'mainswitch', points: 20, price: 350, image: 'https://srvelectricals.com/cdn/shop/files/CO_32A_DP_PRM.png?v=1757426515&width=320', badge: '', sku: 'FU-32-001' },
  // Louver
  { name: 'LOUVER 6 INCH', sub: 'Ventilation louver shutter', category: 'louver', points: 25, price: 380, image: 'https://srvelectricals.com/cdn/shop/files/Louver_6_inch.png?v=1757426390&width=320', badge: '', sku: 'LV-6-001' },
  { name: 'LOUVER 8 INCH', sub: 'Heavy duty louver', category: 'louver', points: 35, price: 520, image: 'https://srvelectricals.com/cdn/shop/files/Louver_6_inch.png?v=1757426390&width=320', badge: '', sku: 'LV-8-001' },
  { name: 'VENTOGUARD LOUVER', sub: 'Premium ventilation guard', category: 'louver', points: 40, price: 650, image: 'https://srvelectricals.com/cdn/shop/files/Louver_6_inch.png?v=1757426390&width=320', badge: '', sku: 'LV-VG-001' },
  // Axial Fan
  { name: 'AXIAL FLOW FAN 12"', sub: 'Industrial axial fan', category: 'axialfan', points: 55, price: 1100, image: 'https://srvelectricals.com/cdn/shop/files/AP-Turtle-Fan.webp?v=1747938680&width=320', badge: '', sku: 'AF-12-001' },
  { name: 'AXIAL FLOW FAN 18"', sub: 'Heavy duty axial fan', category: 'axialfan', points: 80, price: 1800, image: 'https://srvelectricals.com/cdn/shop/files/AP-Turtle-Fan.webp?v=1747938680&width=320', badge: '', sku: 'AF-18-001' },
  // LED Flood
  { name: 'LED FLOOD LIGHT LENSE', sub: 'High lumen flood light', category: 'ledflood', points: 45, price: 950, image: 'https://srvelectricals.com/cdn/shop/files/FloodLightLense_533x.png?v=1757426472&width=320', badge: '', sku: 'LF-L-001' },
  { name: 'LED FLOOD 50W', sub: 'Outdoor 50W flood light', category: 'ledflood', points: 65, price: 1400, image: 'https://srvelectricals.com/cdn/shop/files/FloodLightLense_533x.png?v=1757426472&width=320', badge: '', sku: 'LF-50-001' },
  // Multi Pin
  { name: '5 PIN MULTI PLUG', sub: 'Universal 5 pin plug', category: 'multipin', points: 8, price: 85, image: 'https://srvelectricals.com/cdn/shop/files/5_Pin_Multi_Plug.png?v=1757426390&width=320', badge: '', sku: 'MP-5-001' },
  { name: '3 PIN MULTI PLUG', sub: 'Standard 3 pin plug', category: 'multipin', points: 6, price: 65, image: 'https://srvelectricals.com/cdn/shop/files/5_Pin_Multi_Plug.png?v=1757426390&width=320', badge: '', sku: 'MP-3-001' },
  // Pin Top
  { name: '2 PIN TOP', sub: 'Standard 2 pin top', category: 'pintop', points: 4, price: 35, image: 'https://srvelectricals.com/cdn/shop/files/2_Pin_Top.png?v=1757426390&width=320', badge: '', sku: 'PT-2-001' },
  { name: '3 PIN TOP 6A', sub: '6 Amp 3 pin top', category: 'pintop', points: 5, price: 45, image: 'https://srvelectricals.com/cdn/shop/files/2_Pin_Top.png?v=1757426390&width=320', badge: '', sku: 'PT-3-001' },
  { name: '3 PIN TOP 16A', sub: '16 Amp heavy duty top', category: 'pintop', points: 8, price: 75, image: 'https://srvelectricals.com/cdn/shop/files/2_Pin_Top.png?v=1757426390&width=320', badge: '', sku: 'PT-16-001' },
];

async function seed() {
  await AppDataSource.initialize();
  console.log('✅ DB connected');

  const productRepo = AppDataSource.getRepository(Product);
  const qrRepo = AppDataSource.getRepository(QrCode);

  let created = 0;
  let skipped = 0;

  for (const p of ALL_PRODUCTS) {
    const exists = await productRepo.findOne({ where: { sku: p.sku } });
    if (!exists) {
      const product = productRepo.create({
        name: p.name,
        sub: p.sub,
        category: p.category,
        points: p.points,
        price: p.price,
        image: p.image,
        badge: p.badge || null,
        sku: p.sku,
        isActive: true,
        stock: 100,
      });
      const saved = await productRepo.save(product);

      // Create 3 QR codes per product
      for (let i = 1; i <= 3; i++) {
        const qr = qrRepo.create({
          code: `SRV-${p.sku}-QR${i.toString().padStart(3, '0')}`,
          productId: saved.id,
          productName: saved.name,
          isActive: true,
          isScanned: false,
        });
        await qrRepo.save(qr);
      }
      created++;
      console.log(`✅ ${p.name} (${p.category})`);
    } else {
      skipped++;
    }
  }

  console.log(`\n🎉 Done! Created: ${created}, Skipped: ${skipped}`);
  console.log(`Total products in DB: ${await productRepo.count()}`);
  await AppDataSource.destroy();
}

seed().catch(console.error);
