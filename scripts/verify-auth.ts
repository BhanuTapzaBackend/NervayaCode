import bcrypt from 'bcryptjs';
import connectDB from '../src/lib/db/mongodb';
import User from '../src/lib/models/user.model';
import Therapist from '../src/lib/models/therapist.model';
import { ROLES } from '../src/lib/constants/enums';
import { generateSlotsFromConsultingHours } from '../src/lib/services/therapistSchedule-generate.service';
async function seedDatabase() {
  console.log('🚀 Starting Database Seeding....!!');

  try {
    const conn = await connectDB();
    console.log('✅ Connected to MongoDB');

    // 1. Seed Admin
    console.log('\n👤 Seeding Admin User...');
    const adminData = {
      email: 'admin@nervaya.com',
      password: await bcrypt.hash('admin123', 10),
      name: 'Nervaya Admin',
      role: ROLES.ADMIN,
      emailVerified: true,
    };

    await User.findOneAndUpdate({ email: adminData.email }, adminData, {
      upsert: true,
      new: true,
      runValidators: true,
    });
    console.log('   Success: Admin seeded');

    // 2. Seed Normal User
    console.log('\n👤 Seeding Normal User...');
    const userData = {
      email: 'bhanu@nervaya.com',
      password: await bcrypt.hash('bhanu123', 10),
      name: 'Bhanu Teja',
      role: ROLES.CUSTOMER,
      emailVerified: true,
    };

    await User.findOneAndUpdate({ email: userData.email }, userData, {
      upsert: true,
      new: true,
      runValidators: true,
    });
    console.log('   Success: Normal User seeded');

    // 3. Seed Therapist
    console.log('\n👤 Seeding Therapist...');

    // Create Therapist Profile first
    const therapistProfileData = {
      name: 'Dr. Smith',
      email: 'therapist@nervaya.com',
      slug: 'dr-smith',
      qualifications: ['MBBS', 'MD (Psychiatry)'],
      experience: '12 years',
      gender: 'male',
      languages: ['English', 'Hindi', 'Telugu'],
      specializations: ['CBT', 'Anxiety', 'Sleep Disorders'],
      sessionFee: 1500,
      sessionDurationMins: 60,
      bio: 'A highly experienced psychiatrist specializing in sleep and anxiety.',
      isAvailable: true,
    };

    const therapistProfile = await Therapist.findOneAndUpdate(
      { email: therapistProfileData.email },
      therapistProfileData,
      { upsert: true, new: true, runValidators: true },
    );
    if (!therapistProfile) {
      throw new Error('Failed to seed therapist profile');
    }
    console.log(`   Success: Therapist Profile seeded (${therapistProfile._id})`);

    // Create Therapist User
    const therapistUserData = {
      email: 'therapist@nervaya.com',
      password: await bcrypt.hash('therapist123', 10),
      name: 'Dr. Smith',
      role: ROLES.THERAPIST,
      therapistId: therapistProfile._id,
      emailVerified: true,
    };

    await User.findOneAndUpdate({ email: therapistUserData.email }, therapistUserData, {
      upsert: true,
      new: true,
      runValidators: true,
    });
    console.log('   Success: Therapist User seeded');

    // 4. Generate Initial Slots for Therapist
    console.log('\n📅 Generating slots for therapist...');
    const slotResult = await generateSlotsFromConsultingHours(therapistProfile._id.toString(), new Date(), 30);
    console.log(`   Success: Generated slots (${slotResult.modifiedCount} days)`);

    console.log('\n✨ Seeding Complete!');
    process.exit(0);
  } catch (error: any) {
    console.error('\n❌ Seeding Failed:', error.message);
    process.exit(1);
  }
}

seedDatabase();
