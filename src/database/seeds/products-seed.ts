/**
 * Products Seed — adds all 14 SRV product categories with real images
 * Run: npx ts-node -r tsconfig-paths/register src/database/seeds/products-seed.ts
 */
import { DataSource } from 'typeorm';
import { Product } from '../entities/product.entity';
import { ProductCategory } from '../entities/product-category.entity';
import { QrCode } from '../entities/qr-code.entity';

// ── All 27 categories from srvelectricals.com ─────────────────────────────────
const ALL_CATEGORIES = [
  { label: 'Fan Box',          sortOrder: 1,  imageUrl: 'https://srvelectricals.com/cdn/shop/files/FC_4_17-30.png?v=1757426626&width=320' },
  { label: 'Concealed Box',    sortOrder: 2,  imageUrl: 'https://srvelectricals.com/cdn/shop/files/CRD_PL_3.png?v=1757426566&width=320' },
  { label: 'Modular Box',      sortOrder: 3,  imageUrl: 'https://srvelectricals.com/cdn/shop/files/3x3_679e5d30-ecf2-446e-9452-354bbf4c4a26.png?v=1757426377&width=320' },
  { label: 'MCB Box',          sortOrder: 4,  imageUrl: 'https://srvelectricals.com/cdn/shop/files/MCB_Box_4_Way_GI.png?v=1757426418&width=320' },
  { label: 'Bus Bar',          sortOrder: 5,  imageUrl: 'https://srvelectricals.com/cdn/shop/files/Bus_Bar_100A_Super.png?v=1757426672&width=320' },
  { label: 'Exhaust Fan',      sortOrder: 6,  imageUrl: 'https://srvelectricals.com/cdn/shop/files/AP-Turtle-Fan.webp?v=1747938680&width=320' },
  { label: 'LED Lights',       sortOrder: 7,  imageUrl: 'https://srvelectricals.com/cdn/shop/files/FloodLightSleek.png?v=1757426471&width=320' },
  { label: 'Changeover',       sortOrder: 8,  imageUrl: 'https://srvelectricals.com/cdn/shop/files/ACO_100A_FP.png?v=1757426480&width=320' },
  { label: 'Main Switch',      sortOrder: 9,  imageUrl: 'https://srvelectricals.com/cdn/shop/files/CO_32A_DP_PRM.png?v=1757426515&width=320' },
  { label: 'Louver',           sortOrder: 10, imageUrl: 'https://srvelectricals.com/cdn/shop/files/Louver_6_inch.png?v=1757426390&width=320' },
  { label: 'Axial Fan',        sortOrder: 11, imageUrl: 'https://srvelectricals.com/cdn/shop/files/AP-Turtle-Fan.webp?v=1747938680&width=320' },
  { label: 'LED Flood Light',  sortOrder: 12, imageUrl: 'https://srvelectricals.com/cdn/shop/files/FloodLightLense_533x.png?v=1757426472&width=320' },
  { label: 'Kitkat Fuse',      sortOrder: 13, imageUrl: 'https://cdn.shopify.com/s/files/1/0651/4583/1466/files/KK_RGL_b6278cc2-47de-4af4-ab1b-3f39a31a3469.png?v=1757426689' },
  { label: 'Connector',        sortOrder: 14, imageUrl: 'https://cdn.shopify.com/s/files/1/0651/4583/1466/files/Connector.png?v=1774344618' },
  { label: 'PVC Pipe',         sortOrder: 15, imageUrl: 'https://cdn.shopify.com/s/files/1/0651/4583/1466/files/PVCPipe_d645973b-bd5e-41de-8eb0-53331cce1c19.png?v=1772786167' },
  { label: 'PVC Bend',         sortOrder: 16, imageUrl: 'https://cdn.shopify.com/s/files/1/0651/4583/1466/files/PVCBend_d61ba143-800b-4706-b068-0f30bd6fac45.png?v=1772533125' },
  { label: 'PVC Batten',       sortOrder: 17, imageUrl: 'https://cdn.shopify.com/s/files/1/0651/4583/1466/files/PVC_Batten.png?v=1773475766' },
  { label: 'Ventilation Fan',  sortOrder: 18, imageUrl: 'https://cdn.shopify.com/s/files/1/0651/4583/1466/files/VentilationFan_3594eae1-055d-4a86-b75c-b8cbbfcb22d6.png?v=1763708515' },
  { label: 'Door Bell',        sortOrder: 19, imageUrl: 'https://cdn.shopify.com/s/files/1/0651/4583/1466/files/Door_Bell_Tring_Trong.png?v=1757426728' },
  { label: 'Solar LED Light',  sortOrder: 20, imageUrl: 'https://cdn.shopify.com/s/files/1/0651/4583/1466/files/SolarLEDPoleLight50w.png?v=1757426727' },
  { label: 'Street LED Light', sortOrder: 21, imageUrl: 'https://cdn.shopify.com/s/files/1/0651/4583/1466/files/LEDFront.jpg?v=1765629593' },
  { label: 'Room Warmer',      sortOrder: 22, imageUrl: 'https://cdn.shopify.com/s/files/1/0651/4583/1466/files/RoomWarmerH3_ae88b047-f837-4807-a7c7-52e2e3107d4f.png?v=1772694850' },
  { label: 'Heat Blower',      sortOrder: 23, imageUrl: 'https://cdn.shopify.com/s/files/1/0651/4583/1466/files/HeatBlowerM2_04f122c9-0cc4-4df8-a422-cd731205da85.png?v=1772694634' },
  { label: 'Auto Changeover',  sortOrder: 24, imageUrl: 'https://cdn.shopify.com/s/files/1/0651/4583/1466/files/ACO_100A_Phase_Selector.png?v=1757426707' },
  { label: 'Cover Sheet',      sortOrder: 25, imageUrl: 'https://cdn.shopify.com/s/files/1/0651/4583/1466/files/FanBoxCoverSheet.png?v=1757426708' },
  { label: 'Multi Pin',        sortOrder: 26, imageUrl: 'https://srvelectricals.com/cdn/shop/files/FC_4_17-30.png?v=1757426626&width=320' },
  { label: 'Pin Top',          sortOrder: 27, imageUrl: 'https://srvelectricals.com/cdn/shop/files/FC_4_17-30.png?v=1757426626&width=320' },
];

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

  // ── Real products from srvelectricals.com ─────────────────────────────────
  // Kitkat Fuses
  { name: 'REGULAR KITKAT FUSES 32A', sub: 'High quality ceramics, brass parts', category: 'kitkat', points: 10, price: 94, image: 'https://cdn.shopify.com/s/files/1/0651/4583/1466/files/KK_RGL_3679bde7-0185-456e-b514-e7ce88dc2723.png?v=1757426687', badge: '', sku: 'KK-32-001', description: 'Shock proof ceramics, heavy duty copper & brass parts' },
  { name: 'REGULAR KITKAT FUSES 63A', sub: 'Porcelain, Copper, Brass', category: 'kitkat', points: 15, price: 330, image: 'https://cdn.shopify.com/s/files/1/0651/4583/1466/files/KK_RGL_b6278cc2-47de-4af4-ab1b-3f39a31a3469.png?v=1757426689', badge: 'Popular', sku: 'KK-63-001', description: 'Domestic, Agricultural, Commercial use' },
  { name: 'REGULAR KITKAT FUSES 100A', sub: 'Porcelain, Copper, Brass 100A', category: 'kitkat', points: 25, price: 500, image: 'https://cdn.shopify.com/s/files/1/0651/4583/1466/files/KK_RGL_f9a4b254-cce3-428b-8b49-f76bcc589a97.png?v=1757426700', badge: '', sku: 'KK-100-001', description: 'Heavy duty 100A kitkat fuse' },
  { name: 'REGULAR KITKAT FUSES 200A', sub: 'Porcelain, Copper, Brass 200A', category: 'kitkat', points: 40, price: 730, image: 'https://cdn.shopify.com/s/files/1/0651/4583/1466/files/KK_RGL_28c7354d-28d5-4bf8-b7ec-b52612d51a5a.png?v=1757426705', badge: '', sku: 'KK-200-001', description: 'Industrial grade 200A fuse' },
  { name: 'REGULAR KITKAT FUSES 500A', sub: 'Porcelain, Copper, Brass 500A', category: 'kitkat', points: 60, price: 1565, image: 'https://cdn.shopify.com/s/files/1/0651/4583/1466/files/KK_RGL.png?v=1757426706', badge: '', sku: 'KK-500-001', description: 'Heavy industrial 500A fuse' },
  { name: 'PREMIUM KITKAT FUSE 500A', sub: 'Premium quality porcelain fuse', category: 'kitkat', points: 70, price: 1660, image: 'https://cdn.shopify.com/s/files/1/0651/4583/1466/files/KK_PRM.png?v=1757426686', badge: 'Premium', sku: 'KK-PRM-500', description: 'Best quality copper, phosphorus bronze, brass' },

  // Connectors
  { name: 'CONNECTOR 32A / 2P', sub: 'Bake-lite connector, brass screws', category: 'connector', points: 5, price: 45, image: 'https://cdn.shopify.com/s/files/1/0651/4583/1466/files/Connector.png?v=1774344618', badge: '', sku: 'CON-32-001', description: 'For multiple joints during POP underground wiring' },
  { name: 'CONNECTOR 63A / 2P', sub: 'Heavy brass parts, brass screws', category: 'connector', points: 8, price: 84, image: 'https://cdn.shopify.com/s/files/1/0651/4583/1466/files/Connector.png?v=1774344618', badge: '', sku: 'CON-63-001', description: 'Long lasting, hazel free uses' },
  { name: 'CONNECTOR 100A / 2P', sub: 'PC housing, 100A capacity', category: 'connector', points: 12, price: 119, image: 'https://cdn.shopify.com/s/files/1/0651/4583/1466/files/Connector.png?v=1774344618', badge: '', sku: 'CON-100-001', description: 'Heavy duty 100A connector' },

  // PVC Pipe
  { name: 'PVC CONDUIT PIPE 3/4"', sub: 'Light duty conduit pipe 20mm', category: 'pvcpipe', points: 5, price: 55, image: 'https://cdn.shopify.com/s/files/1/0651/4583/1466/files/PVCPipe_d645973b-bd5e-41de-8eb0-53331cce1c19.png?v=1772786167', badge: '', sku: 'PVC-P-001', description: 'CP 1000 - 20mm OD conduit pipe' },
  { name: 'PVC CONDUIT PIPE 1"', sub: 'Medium duty conduit pipe 25mm', category: 'pvcpipe', points: 7, price: 79, image: 'https://cdn.shopify.com/s/files/1/0651/4583/1466/files/PVCPipe_d645973b-bd5e-41de-8eb0-53331cce1c19.png?v=1772786167', badge: '', sku: 'PVC-P-002', description: 'CP 1001 - 25mm OD conduit pipe' },
  { name: 'PVC CONDUIT PIPE 1.25"', sub: 'Heavy duty conduit pipe 32mm', category: 'pvcpipe', points: 10, price: 181, image: 'https://cdn.shopify.com/s/files/1/0651/4583/1466/files/PVCPipe_d645973b-bd5e-41de-8eb0-53331cce1c19.png?v=1772786167', badge: '', sku: 'PVC-P-003', description: 'CP 1006 - 32mm OD conduit pipe' },

  // PVC Bend
  { name: 'PVC CONDUIT BEND 3/4"', sub: 'Small bend 20mm', category: 'pvcbend', points: 3, price: 9, image: 'https://cdn.shopify.com/s/files/1/0651/4583/1466/files/PVCBend_d61ba143-800b-4706-b068-0f30bd6fac45.png?v=1772533125', badge: '', sku: 'PVC-B-001', description: 'CP 1025 - 20mm conduit bend' },
  { name: 'PVC CONDUIT BEND 1"', sub: 'Medium bend 25mm', category: 'pvcbend', points: 4, price: 12, image: 'https://cdn.shopify.com/s/files/1/0651/4583/1466/files/PVCBend_d61ba143-800b-4706-b068-0f30bd6fac45.png?v=1772533125', badge: '', sku: 'PVC-B-002', description: 'CP 1026 - 25mm conduit bend' },
  { name: 'PVC CONDUIT BEND 1.5"', sub: 'Heavy bend 40mm', category: 'pvcbend', points: 6, price: 30, image: 'https://cdn.shopify.com/s/files/1/0651/4583/1466/files/PVCBend_d61ba143-800b-4706-b068-0f30bd6fac45.png?v=1772533125', badge: '', sku: 'PVC-B-003', description: 'CP 1029 - 40mm conduit bend' },

  // PVC Batten
  { name: 'PVC CASING BATTEN 3/4"', sub: 'CP 1041 - 20mm batten', category: 'pvcbatten', points: 4, price: 41, image: 'https://cdn.shopify.com/s/files/1/0651/4583/1466/files/PVC_Batten.png?v=1773475766', badge: '', sku: 'PVC-BAT-001', description: 'White PVC casing batten 3/4 inch' },
  { name: 'PVC CASING BATTEN 1"', sub: 'CP 1042 - 25mm batten', category: 'pvcbatten', points: 5, price: 56, image: 'https://cdn.shopify.com/s/files/1/0651/4583/1466/files/PVC_Batten.png?v=1773475766', badge: '', sku: 'PVC-BAT-002', description: 'White PVC casing batten 1 inch' },

  // Ventilation Fan
  { name: 'VENTILATION FAN 200 ALM', sub: '50W, 1350 RPM, 240V AC', category: 'ventilation', points: 35, price: 1555, image: 'https://cdn.shopify.com/s/files/1/0651/4583/1466/files/VentilationFan_799ce365-795a-435a-a305-2adedd4eae0c.png?v=1763708585', badge: '', sku: 'VF-200-001', description: 'Copper bound motor, silent rotation, kitchen/bathroom' },
  { name: 'VENTILATION FAN 250 ALM', sub: '55W, 1310 RPM, 240V AC', category: 'ventilation', points: 40, price: 1640, image: 'https://cdn.shopify.com/s/files/1/0651/4583/1466/files/VentilationFan_3594eae1-055d-4a86-b75c-b8cbbfcb22d6.png?v=1763708515', badge: 'Popular', sku: 'VF-250-001', description: 'Dynamically balanced blade, corrosion resistant' },
  { name: 'VENTILATION FAN 300 ALM', sub: '70W, 1310 RPM, 240V AC', category: 'ventilation', points: 45, price: 1640, image: 'https://cdn.shopify.com/s/files/1/0651/4583/1466/files/VentilationFan_cd2e67d7-1908-4fc7-8004-a2922f6f3793.png?v=1763708375', badge: '', sku: 'VF-300-001', description: 'Heavy duty 300mm ventilation fan' },

  // Door Bell
  { name: 'DOOR BELL TRING TRONG', sub: 'Clear & Loud Sound, Easy Install', category: 'doorbell', points: 8, price: 195, image: 'https://cdn.shopify.com/s/files/1/0651/4583/1466/files/Door_Bell_Tring_Trong.png?v=1757426728', badge: '', sku: 'DB-130-001', description: 'Elegant minimal design, energy efficient' },
  { name: 'DOOR BELL KOYAL', sub: 'Musical tone door bell', category: 'doorbell', points: 8, price: 195, image: 'https://cdn.shopify.com/s/files/1/0651/4583/1466/files/Door_Bell_Tring_Trong.png?v=1757426728', badge: '', sku: 'DB-131-001', description: 'Koyal tone, durable build quality' },

  // Solar LED
  { name: 'SOLAR LED ST LIGHT 12W', sub: '12W, 1200 Lumens, 12V 1AMP', category: 'solarled', points: 30, price: 1008, image: 'https://cdn.shopify.com/s/files/1/0651/4583/1466/files/SolarLEDPoleLight12w.png?v=1757426724', badge: '', sku: 'SL-12-001', description: 'Street/garden lighting, 10 year life span' },
  { name: 'SOLAR LED ST LIGHT 24W', sub: '24W, 2400 Lumens, 12V 2AMP', category: 'solarled', points: 45, price: 1148, image: 'https://cdn.shopify.com/s/files/1/0651/4583/1466/files/SolarLEDPoleLight24w.png?v=1757426726', badge: '', sku: 'SL-24-001', description: 'Energy efficient solar street light' },
  { name: 'SOLAR LED ST LIGHT 50W', sub: '50W, 5000 Lumens, 12V 4.17AMP', category: 'solarled', points: 70, price: 1288, image: 'https://cdn.shopify.com/s/files/1/0651/4583/1466/files/SolarLEDPoleLight50w.png?v=1757426727', badge: 'Popular', sku: 'SL-50-001', description: 'High power solar LED for campus/industrial' },

  // Street LED
  { name: 'LED ST LIGHT 24W ALM', sub: '24W, 3000 Lumens, 100-290V', category: 'streetled', points: 40, price: 1460, image: 'https://cdn.shopify.com/s/files/1/0651/4583/1466/files/LEDFront.jpg?v=1765629593', badge: '', sku: 'SL-LED-24', description: 'Aluminum housing, 4Kv SPD protection' },
  { name: 'LED ST LIGHT 50W ALM', sub: '50W, 5000 Lumens, 100-290V', category: 'streetled', points: 65, price: 1780, image: 'https://cdn.shopify.com/s/files/1/0651/4583/1466/files/LEDFront.jpg?v=1765629593', badge: 'Popular', sku: 'SL-LED-50', description: 'Energy saving, minimum 10 year life' },
  { name: 'LED ST LIGHT 100W ALM', sub: '100W, 10000 Lumens, 100-290V', category: 'streetled', points: 90, price: 1680, image: 'https://cdn.shopify.com/s/files/1/0651/4583/1466/files/LEDFront.jpg?v=1765629593', badge: '', sku: 'SL-LED-100', description: 'High power street/industrial lighting' },

  // Room Warmer
  { name: 'ROOM WARMER H3', sub: '800W, 3 heat settings, FR plastic', category: 'warmer', points: 50, price: 2195, image: 'https://cdn.shopify.com/s/files/1/0651/4583/1466/files/RoomWarmerH3_ae88b047-f837-4807-a7c7-52e2e3107d4f.png?v=1772694850', badge: 'Popular', sku: 'RW-H3-001', description: 'Unbreakable, fire resistant, shock proof ABS housing' },
  { name: 'SUN WARMER', sub: '800W, 180 degree rotation', category: 'warmer', points: 45, price: 1680, image: 'https://cdn.shopify.com/s/files/1/0651/4583/1466/files/SUNWARMER.png?v=1757426741', badge: '', sku: 'SW-586-001', description: 'Halogen heating element, thermal shock proof' },

  // Heat Blower
  { name: 'M2 HOME HEATER BLOWER', sub: '1165W, Cream-Coffee color', category: 'heater', points: 55, price: 1165, image: 'https://cdn.shopify.com/s/files/1/0651/4583/1466/files/HeatBlowerM2_04f122c9-0cc4-4df8-a422-cd731205da85.png?v=1772694634', badge: '', sku: 'HH-591-001', description: 'Home heater blower M2 series' },

  // Auto Changeover
  { name: 'AUTO CHANGEOVER 100A TP', sub: '100A, 3 Phase, GPSP TATA Sheet', category: 'autochangeover', points: 120, price: 23755, image: 'https://cdn.shopify.com/s/files/1/0651/4583/1466/files/ACO_100A_Phase_Selector.png?v=1757426707', badge: '', sku: 'ACO-100-TP', description: 'Automatic phase changeover, domestic/agriculture/commercial' },

  // Cover Sheet
  { name: 'FAN BOX COVER SHEET SPRING', sub: 'Dia 165mm, A grade plastic', category: 'coversheet', points: 5, price: 29, image: 'https://cdn.shopify.com/s/files/1/0651/4583/1466/files/FanBoxCoverSheet.png?v=1757426708', badge: '', sku: 'FBC-194-001', description: 'Smart look, unbreakable, safety cover' },
  { name: 'FAN BOX COVER SHEET PLANE', sub: 'Dia 165mm, plain design', category: 'coversheet', points: 4, price: 24, image: 'https://cdn.shopify.com/s/files/1/0651/4583/1466/files/FanBoxCoverSheet.png?v=1757426708', badge: '', sku: 'FBC-195-001', description: 'Plain design fan box cover' },
  { name: 'JUNCTION BOX COVER SHEET', sub: 'Dia 100mm, plastic material', category: 'coversheet', points: 3, price: 8, image: 'https://cdn.shopify.com/s/files/1/0651/4583/1466/files/RoundSHeet_0b637b31-05fd-4882-934c-41d97295eed7.png?v=1757426709', badge: '', sku: 'JBC-196-001', description: 'Safety cover for junction box' },

  // Bus Bar (additional from website)
  { name: 'BUS BAR 32A SUPER', sub: '99% pure copper strip, 16 way', category: 'busbar', points: 25, price: 1450, image: 'https://cdn.shopify.com/s/files/1/0651/4583/1466/files/BusBar32A.png?v=1772450944', badge: '', sku: 'BB-32-001', description: 'GPSP TATA sheet, powder coated, DMC insulators' },
  { name: 'BUS BAR 200A SUPER', sub: '200A, 16 way, powder coated', category: 'busbar', points: 80, price: 5600, image: 'https://srvelectricals.com/cdn/shop/files/Bus_Bar_100A_Super.png?v=1757426672&width=320', badge: '', sku: 'BB-200-001', description: 'Heavy industrial bus bar 200A' },
];

async function seed() {
  await AppDataSource.initialize();
  console.log('✅ DB connected');

  const productRepo = AppDataSource.getRepository(Product);
  const categoryRepo = AppDataSource.getRepository(ProductCategory);
  const qrRepo = AppDataSource.getRepository(QrCode);

  // ── Seed Categories ──────────────────────────────────────────────────────
  console.log('\n📂 Seeding categories...');
  let catCreated = 0;
  for (const cat of ALL_CATEGORIES) {
    const exists = await categoryRepo.findOne({ where: { label: cat.label } });
    if (!exists) {
      await categoryRepo.save(categoryRepo.create({
        label: cat.label,
        imageUrl: cat.imageUrl,
        sortOrder: cat.sortOrder,
        isActive: true,
      }));
      catCreated++;
      console.log(`  ✅ Category: ${cat.label}`);
    }
  }
  console.log(`  Categories: ${catCreated} created\n`);

  // ── Seed Products ────────────────────────────────────────────────────────
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
        description: (p as any).description || null,
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

  console.log(`\n🎉 Done! Products created: ${created}, Skipped: ${skipped}`);
  console.log(`Total products in DB: ${await productRepo.count()}`);
  console.log(`Total categories in DB: ${await categoryRepo.count()}`);
  await AppDataSource.destroy();
}

seed().catch(console.error);
