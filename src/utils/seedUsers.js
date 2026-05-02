import authService from '../services/AuthService.js';
import userRepository from '../repositories/UserRepository.js';

export default async function seedUsers() {
    const adminEmail = process.env.ADMIN_EMAIL;
    if (!adminEmail) return;

    const existingAdmin = await userRepository.findByEmail(adminEmail);
    if (existingAdmin) return;

    await authService.signUp({
        name: process.env.ADMIN_NAME || 'Admin',
        lastName: process.env.ADMIN_LAST_NAME || 'Principal',
        email: adminEmail,
        password: process.env.ADMIN_PASSWORD || 'Admin123*',
        phoneNumber: process.env.ADMIN_PHONE_NUMBER || '999999999',
        birthdate: process.env.ADMIN_BIRTHDATE || '1990-01-01',
        url_profile: process.env.ADMIN_URL_PROFILE || '',
        adress: process.env.ADMIN_ADRESS || '',
        roles: ['admin']
    });

    console.log(`Seeded admin user: ${adminEmail}`);
}
