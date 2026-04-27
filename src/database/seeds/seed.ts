import { DataSource } from 'typeorm';
import { Admin } from '../entities/admin.entity';
import { ProductCategory } from '../entities/product-category.entity';
import { RewardScheme } from '../entities/reward-scheme.entity';
import { Festival } from '../entities/festival.entity';
import { Settings } from '../entities/settings.entity';
import { Product } from '../entities/product.entity';
import { Testimonial } from '../entities/testimonial.entity';
import { AdminRole } from '../../common/enums';

const AppDataSource = new DataSource({
  type: 'postgres',
  host: 'localhost',
  port: 5433,
  username: 'postgres',
  password: '4268',
  database: 'srv_admin',
  entities: [__dirname + '/../entities/*.entity{.ts,.js}'],
  synchronize: true,
});

async function seed() {
  try {
    await AppDataSource.initialize();
    console.log('Database connected successfully');

    const adminRepository = AppDataSource.getRepository(Admin);
    const categoryRepository = AppDataSource.getRepository(ProductCategory);
    const rewardSchemeRepository = AppDataSource.getRepository(RewardScheme);
    const festivalRepository = AppDataSource.getRepository(Festival);
    const settingsRepository = AppDataSource.getRepository(Settings);
    const productRepository = AppDataSource.getRepository(Product);
    const testimonialRepository = AppDataSource.getRepository(Testimonial);

    const existingAdmin = await adminRepository.findOne({
      where: { email: 'admin@srvelectricals.com' },
    });

    if (!existingAdmin) {
      const admin = adminRepository.create({
        email: 'admin@srvelectricals.com',
        password: 'Admin@123',
        name: 'Super Admin',
        role: AdminRole.SUPER_ADMIN,
        phone: '+91-9876543210',
        isActive: true,
      });
      await adminRepository.save(admin);
      console.log('Default admin created successfully');
    } else {
      console.log('Default admin already exists');
    }

    const settingsSeed = [
      ['promo_title', 'Earn Rewards with Every Purchase!'],
      ['promo_description', 'Join thousands of electricians earning reward points on SRV Electricals products. Scan QR codes, earn points, and redeem exciting gifts.'],
      ['promo_cta_text', 'Start Earning Now'],
      ['promo_cta_link', 'https://srvelectricals.in/app'],
      ['promo_is_active', 'true'],
      ['appName', 'SRV Electricals'],
      ['tagline', 'Power Your Rewards'],
      ['appVersion', '2.1.0'],
      ['minAppVersion', '2.0.0'],
      ['maintenanceMode', 'false'],
      ['maintenanceMessage', 'App is under maintenance. Please try again later.'],
      ['supportPhone', '+91 88376 84004'],
      ['supportEmail', 'support@srvelectricals.com'],
      ['whatsappNumber', '918837684004'],
      ['scanEnabled', 'true'],
      ['giftsEnabled', 'true'],
      ['referralEnabled', 'true'],
      ['transferPointsEnabled', 'true'],
      ['privacyPolicyUrl', 'https://srvelectricals.com/privacy'],
      ['termsUrl', 'https://srvelectricals.com/terms'],
      ['playStoreUrl', 'https://play.google.com/store/apps/details?id=com.srvelectricals'],
      ['appStoreUrl', 'https://apps.apple.com/app/srv-electricals'],
      ['rateUsEnabled', 'true'],
      ['rateUsMinScans', '5'],
      ['rateUsPromptDelay', '3'],
      ['playStoreRatingUrl', 'market://details?id=com.srvelectricals'],
      ['appStoreRatingUrl', 'https://apps.apple.com/app/srv-electricals'],
      ['defaultLanguage', 'English'],
      ['forceUpdate', 'false'],
      ['gift_store_policy_title', 'SRV Gift Store Policy'],
      ['gift_store_policy_body', 'Redeem points against available SRV rewards. Cashback is processed to verified bank or UPI details, while physical gifts are dispatched after confirmation by the SRV team.'],
      ['gift_store_minimum_redeem_points', '500'],
    ] as const;

    for (const [key, value] of settingsSeed) {
      const existing = await settingsRepository.findOne({ where: { key } });
      if (!existing) {
        await settingsRepository.save(settingsRepository.create({ key, value }));
      }
    }

    const products = await productRepository.find();
    const distinctCategories = Array.from(
      new Set(products.map((product) => product.category).filter(Boolean)),
    );

    for (const [index, label] of distinctCategories.entries()) {
      const existing = await categoryRepository.findOne({ where: { label } });
      if (!existing) {
        await categoryRepository.save(
          categoryRepository.create({
            label,
            imageUrl: products.find((product) => product.category === label)?.image ?? null,
            sortOrder: index + 1,
            isActive: true,
          }),
        );
      }
    }

    const defaultRewardSchemes = [
      {
        name: 'Instant Cashback',
        description: 'Redeem points for direct cashback to your linked payout account.',
        pointsCost: 500,
        category: 'cashback',
        storeCategory: 'Cashback',
        imageUrl: null,
        mrp: 500,
        targetRole: 'ELECTRICIAN',
        sortOrder: 1,
      },
      {
        name: 'Gift Hamper',
        description: 'Redeem for a festive gift hamper curated for top performers.',
        pointsCost: 1500,
        category: 'gift',
        storeCategory: 'Gifts',
        imageUrl: null,
        mrp: 1500,
        targetRole: 'ELECTRICIAN',
        sortOrder: 2,
      },
      {
        name: 'Dealer Growth Bonus',
        description: 'Special dealer incentive for network expansion and engagement.',
        pointsCost: 1000,
        category: 'bonus',
        storeCategory: 'Cashback',
        imageUrl: null,
        mrp: 1000,
        targetRole: 'DEALER',
        sortOrder: 1,
      },
    ];

    for (const item of defaultRewardSchemes) {
      const existing = await rewardSchemeRepository.findOne({ where: { name: item.name } });
      if (!existing) {
        await rewardSchemeRepository.save(
          rewardSchemeRepository.create({
            ...item,
            active: true,
          }),
        );
      }
    }

    const existingFestival = await festivalRepository.findOne({ where: { slug: 'diwali' } });
    if (!existingFestival) {
      await festivalRepository.save(
        festivalRepository.create({
          name: 'Diwali Celebration',
          slug: 'diwali',
          greeting: 'Happy Diwali from SRV Electricals',
          subGreeting: 'Celebrate brighter rewards all season long.',
          emoji: '🪔',
          bannerEmojis: '🪔✨🎆',
          particleEmojis: '✨🪔⭐',
          primaryColor: '#B45309',
          secondaryColor: '#F59E0B',
          accentColor: '#FFFFFF',
          bgColor: '#FFF7ED',
          cardColor: '#FFFBEB',
          textColor: '#7C2D12',
          startDate: new Date('2026-10-25'),
          endDate: new Date('2026-11-15'),
          active: true,
        }),
      );
    }

    const testimonialCount = await testimonialRepository.count();
    if (!testimonialCount) {
      await testimonialRepository.save([
        testimonialRepository.create({
          personName: 'Arjun Sharma',
          initials: 'AS',
          location: 'Ludhiana, Punjab',
          tier: 'Gold',
          yearsConnected: 3,
          quote: 'SRV rewards have made product loyalty genuinely valuable for my daily work.',
          highlight: '3 years with SRV',
          gradientColors: ['#FDE68A', '#F59E0B', '#B45309'],
          ringColor: '#F59E0B',
          userCategory: 'electrician',
          isActive: true,
          displayOrder: 1,
          name: 'Arjun Sharma',
          role: 'ELECTRICIAN',
          content: 'SRV rewards have made product loyalty genuinely valuable for my daily work.',
          rating: 5,
        }),
        testimonialRepository.create({
          personName: 'Rajeev Traders',
          initials: 'RT',
          location: 'Jaipur, Rajasthan',
          tier: 'Platinum',
          yearsConnected: 4,
          quote: 'Admin control and dealer tracking make it easier to grow our network with confidence.',
          highlight: 'Top dealer network',
          gradientColors: ['#DBEAFE', '#3B82F6', '#1D4ED8'],
          ringColor: '#1D4ED8',
          userCategory: 'dealer',
          isActive: true,
          displayOrder: 2,
          name: 'Rajeev Traders',
          role: 'DEALER',
          content: 'Admin control and dealer tracking make it easier to grow our network with confidence.',
          rating: 5,
        }),
      ]);
    }

    await AppDataSource.destroy();
    console.log('Database seeding completed successfully');
  } catch (error) {
    console.error('Error during seeding:', error);
    process.exit(1);
  }
}

seed();
