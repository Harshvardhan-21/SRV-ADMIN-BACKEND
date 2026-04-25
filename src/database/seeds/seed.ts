import { DataSource } from 'typeorm';
import { Admin } from '../entities/admin.entity';
import { AdminRole } from '../../common/enums';

const AppDataSource = new DataSource({
  type: 'postgres',
  host: 'localhost',
  port: 5432,
  username: 'postgres',
  password: '4268',
  database: 'srv_admin',
  entities: [__dirname + '/../entities/*.entity{.ts,.js}'],
  synchronize: true,
  dropSchema: true,
});

async function seed() {
  try {
    await AppDataSource.initialize();
    console.log('✅ PostgreSQL Database connected successfully');

    const adminRepository = AppDataSource.getRepository(Admin);

    // Check if admin already exists
    const existingAdmin = await adminRepository.findOne({
      where: { email: 'admin@srvelectricals.com' },
    });

    if (!existingAdmin) {
      // Create default admin
      const admin = adminRepository.create({
        email: 'admin@srvelectricals.com',
        password: 'Admin@123', // Will be hashed by the entity
        name: 'Super Admin',
        role: AdminRole.SUPER_ADMIN,
        phone: '+91-9876543210',
        isActive: true,
      });

      await adminRepository.save(admin);
      console.log('✅ Default admin created successfully');
      console.log('📧 Email: admin@srvelectricals.com');
      console.log('🔑 Password: Admin@123');
    } else {
      console.log('ℹ️  Default admin already exists');
    }

    await AppDataSource.destroy();
    console.log('🎉 Database seeding completed successfully');
  } catch (error) {
    console.error('❌ Error during seeding:', error);
    console.log('\n💡 Make sure PostgreSQL is running and database "srv_admin" exists');
    console.log('💡 Create database: CREATE DATABASE srv_admin;');
    process.exit(1);
  }
}

seed();