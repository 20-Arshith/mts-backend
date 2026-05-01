const { PrismaClient } = require('@prisma/client');
const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '../.env') });

const prisma = new PrismaClient();

const roles = [
  { role_id: 1, role_name: 'USER' },
  { role_id: 2, role_name: 'VENDOR' },
  { role_id: 3, role_name: 'AGENT' },
  { role_id: 4, role_name: 'ADMIN' },
];

const categories = [
  { category_id: 1, category_name: 'Plumbing', icon_name: 'plumbing' },
  { category_id: 2, category_name: 'Electrician', icon_name: 'electrical' },
  { category_id: 3, category_name: 'AC Repair', icon_name: 'cooling' },
  { category_id: 4, category_name: 'Cleaning', icon_name: 'cleaning' },
  { category_id: 5, category_name: 'Carpenter', icon_name: 'carpentry' },
  { category_id: 6, category_name: 'Painting', icon_name: 'painting' },
  { category_id: 8, category_name: 'Mechanic', icon_name: 'automotive' },
  { category_id: 9, category_name: 'Moving', icon_name: 'moving' },
];

const vendorAvailabilitySeed = [
  { vendorKey: 'A', day_of_week: 1, is_active: true, start_time: '09:00', end_time: '18:00' },
  { vendorKey: 'A', day_of_week: 2, is_active: true, start_time: '09:00', end_time: '18:00' },
  { vendorKey: 'A', day_of_week: 3, is_active: true, start_time: '09:00', end_time: '18:00' },
  { vendorKey: 'A', day_of_week: 4, is_active: true, start_time: '09:00', end_time: '18:00' },
  { vendorKey: 'A', day_of_week: 5, is_active: true, start_time: '09:00', end_time: '18:00' },
  { vendorKey: 'A', day_of_week: 6, is_active: false, start_time: '09:00', end_time: '18:00' },
  { vendorKey: 'A', day_of_week: 0, is_active: false, start_time: '09:00', end_time: '18:00' },
  { vendorKey: 'B', day_of_week: 1, is_active: true, start_time: '10:00', end_time: '19:00' },
  { vendorKey: 'B', day_of_week: 2, is_active: true, start_time: '10:00', end_time: '19:00' },
  { vendorKey: 'B', day_of_week: 3, is_active: true, start_time: '10:00', end_time: '19:00' },
  { vendorKey: 'B', day_of_week: 4, is_active: true, start_time: '10:00', end_time: '19:00' },
  { vendorKey: 'B', day_of_week: 5, is_active: true, start_time: '10:00', end_time: '19:00' },
  { vendorKey: 'B', day_of_week: 6, is_active: true, start_time: '10:00', end_time: '16:00' },
  { vendorKey: 'B', day_of_week: 0, is_active: false, start_time: '10:00', end_time: '19:00' },
  { vendorKey: 'C', day_of_week: 1, is_active: true, start_time: '08:00', end_time: '17:00' },
  { vendorKey: 'C', day_of_week: 2, is_active: true, start_time: '08:00', end_time: '17:00' },
  { vendorKey: 'C', day_of_week: 3, is_active: true, start_time: '08:00', end_time: '17:00' },
  { vendorKey: 'C', day_of_week: 4, is_active: true, start_time: '08:00', end_time: '17:00' },
  { vendorKey: 'C', day_of_week: 5, is_active: true, start_time: '08:00', end_time: '17:00' },
  { vendorKey: 'C', day_of_week: 6, is_active: true, start_time: '09:00', end_time: '14:00' },
  { vendorKey: 'C', day_of_week: 0, is_active: false, start_time: '08:00', end_time: '17:00' },
];

const reviewSeed = [
  {
    booking_id: 2003,
    rating: 5,
    comment: 'Fast response, clean work, and the leak was fully resolved.',
  },
];

async function upsertUser({ mobile, full_name, role_id, email = null, status = 'active', profile = null }) {
  const user = await prisma.user.upsert({
    where: { mobile },
    update: {
      full_name,
      role_id,
      email,
      status,
    },
    create: {
      full_name,
      mobile,
      role_id,
      email,
      status,
    },
  });

  if (profile) {
    await prisma.userProfile.upsert({
      where: { user_id: user.user_id },
      update: profile,
      create: {
        user_id: user.user_id,
        ...profile,
      },
    });
  }

  return user;
}

async function main() {
  console.log('Seeding data...');

  await prisma.$executeRawUnsafe(`
    ALTER TABLE "service_categories"
    ADD COLUMN IF NOT EXISTS "icon_name" TEXT NOT NULL DEFAULT 'general'
  `);

  await prisma.$executeRawUnsafe(`
    ALTER TABLE "bookings"
    ADD COLUMN IF NOT EXISTS "completion_otp" TEXT,
    ADD COLUMN IF NOT EXISTS "completion_otp_generated_at" TIMESTAMP(3),
    ADD COLUMN IF NOT EXISTS "completion_otp_verified_at" TIMESTAMP(3)
  `);

  for (const role of roles) {
    await prisma.role.upsert({
      where: { role_id: role.role_id },
      update: { role_name: role.role_name },
      create: role,
    });
  }
  console.log('Roles seeded.');

  for (const category of categories) {
    await prisma.serviceCategory.upsert({
      where: { category_id: category.category_id },
      update: { category_name: category.category_name, icon_name: category.icon_name },
      create: category,
    });
  }

  await prisma.vendorService.updateMany({
    where: { category_id: 7 },
    data: { category_id: 8 },
  });

  await prisma.serviceCategory.deleteMany({
    where: { category_id: 7 },
  });

  console.log('Service categories seeded.');

  const admin = await upsertUser({
    mobile: '0000000000',
    full_name: 'MTS Admin',
    role_id: 4,
    email: 'admin@mts.local',
  });

  await prisma.oTPVerification.deleteMany({
    where: { contact: admin.mobile },
  });

  await prisma.oTPVerification.create({
    data: {
      contact: admin.mobile,
      otp_code: '123456',
      expires_at: new Date('2030-01-01T00:00:00.000Z'),
      verified: false,
    },
  });

  const agentA = await prisma.agent.upsert({
    where: { mobile: '9999999999' },
    update: {
      name: 'Rahul Sharma',
      email: 'rahul.agent@mts.local',
      referral_code: 'AGT-RAH4-2026',
      approval_status: 'approved',
      commission_balance: 18500.5,
    },
    create: {
      name: 'Rahul Sharma',
      mobile: '9999999999',
      email: 'rahul.agent@mts.local',
      referral_code: 'AGT-RAH4-2026',
      approval_status: 'approved',
      commission_balance: 18500.5,
    },
  });

  const agentB = await prisma.agent.upsert({
    where: { mobile: '8888888888' },
    update: {
      name: 'Priya Singh',
      email: 'priya.agent@mts.local',
      referral_code: 'AGT-PRI9-2026',
      approval_status: 'pending',
      commission_balance: 9250,
    },
    create: {
      name: 'Priya Singh',
      mobile: '8888888888',
      email: 'priya.agent@mts.local',
      referral_code: 'AGT-PRI9-2026',
      approval_status: 'pending',
      commission_balance: 9250,
    },
  });

  const agentC = await prisma.agent.upsert({
    where: { mobile: '7777777777' },
    update: {
      name: 'Amit Verma',
      email: 'amit.agent@mts.local',
      referral_code: 'AGT-AMT7-2026',
      approval_status: 'rejected',
      commission_balance: 4100,
    },
    create: {
      name: 'Amit Verma',
      mobile: '7777777777',
      email: 'amit.agent@mts.local',
      referral_code: 'AGT-AMT7-2026',
      approval_status: 'rejected',
      commission_balance: 4100,
    },
  });
  console.log('Agents seeded.');

  const vendorOwnerA = await upsertUser({
    mobile: '9123456780',
    full_name: 'Rakesh Plumbing Works',
    role_id: 2,
    email: 'rakesh.vendor@mts.local',
    profile: {
      address: 'Koramangala, Bengaluru',
      latitude: 12.9352,
      longitude: 77.6245,
    },
  });

  const vendorOwnerB = await upsertUser({
    mobile: '9234567891',
    full_name: 'Spark Electrical Services',
    role_id: 2,
    email: 'spark.vendor@mts.local',
    profile: {
      address: 'Indiranagar, Bengaluru',
      latitude: 12.9719,
      longitude: 77.6412,
    },
  });

  const vendorOwnerC = await upsertUser({
    mobile: '9345678912',
    full_name: 'FreshNest Home Care',
    role_id: 2,
    email: 'freshnest.vendor@mts.local',
    profile: {
      address: 'HSR Layout, Bengaluru',
      latitude: 12.9116,
      longitude: 77.6474,
    },
  });

  const vendorA = await prisma.vendor.upsert({
    where: { vendor_id: vendorOwnerA.user_id },
    update: {
      agent_id: agentA.agent_id,
      category_id: 1,
      business_name: 'Rakesh Plumbing Works',
      owner_name: 'Rakesh Plumbing Works',
      mobile: '9123456780',
      email: 'rakesh.vendor@mts.local',
      whatsapp_number: '9123456780',
      description: 'Experienced plumbing support for homes, apartments, and offices.',
      address: 'Koramangala, Bengaluru',
      latitude: 12.9352,
      longitude: 77.6245,
      approval_status: 'approved',
      is_available: true,
    },
    create: {
      vendor_id: vendorOwnerA.user_id,
      agent_id: agentA.agent_id,
      category_id: 1,
      business_name: 'Rakesh Plumbing Works',
      owner_name: 'Rakesh Plumbing Works',
      mobile: '9123456780',
      email: 'rakesh.vendor@mts.local',
      whatsapp_number: '9123456780',
      description: 'Experienced plumbing support for homes, apartments, and offices.',
      address: 'Koramangala, Bengaluru',
      latitude: 12.9352,
      longitude: 77.6245,
      approval_status: 'approved',
      is_available: true,
    },
  });

  const vendorB = await prisma.vendor.upsert({
    where: { vendor_id: vendorOwnerB.user_id },
    update: {
      agent_id: agentB.agent_id,
      category_id: 2,
      business_name: 'Spark Electrical Services',
      owner_name: 'Spark Electrical Services',
      mobile: '9234567891',
      email: 'spark.vendor@mts.local',
      whatsapp_number: '9234567891',
      description: 'Electrical inspection, safety checks, rewiring, and switchboard fixes.',
      address: 'Indiranagar, Bengaluru',
      latitude: 12.9719,
      longitude: 77.6412,
      approval_status: 'pending',
      is_available: true,
    },
    create: {
      vendor_id: vendorOwnerB.user_id,
      agent_id: agentB.agent_id,
      category_id: 2,
      business_name: 'Spark Electrical Services',
      owner_name: 'Spark Electrical Services',
      mobile: '9234567891',
      email: 'spark.vendor@mts.local',
      whatsapp_number: '9234567891',
      description: 'Electrical inspection, safety checks, rewiring, and switchboard fixes.',
      address: 'Indiranagar, Bengaluru',
      latitude: 12.9719,
      longitude: 77.6412,
      approval_status: 'pending',
      is_available: true,
    },
  });

  const vendorC = await prisma.vendor.upsert({
    where: { vendor_id: vendorOwnerC.user_id },
    update: {
      agent_id: null,
      category_id: 4,
      business_name: 'FreshNest Home Care',
      owner_name: 'FreshNest Home Care',
      mobile: '9345678912',
      email: 'freshnest.vendor@mts.local',
      whatsapp_number: '9345678912',
      description: 'Deep residential cleaning and move-in or move-out cleaning support.',
      address: 'HSR Layout, Bengaluru',
      latitude: 12.9116,
      longitude: 77.6474,
      approval_status: 'approved',
      is_available: true,
    },
    create: {
      vendor_id: vendorOwnerC.user_id,
      agent_id: null,
      category_id: 4,
      business_name: 'FreshNest Home Care',
      owner_name: 'FreshNest Home Care',
      mobile: '9345678912',
      email: 'freshnest.vendor@mts.local',
      whatsapp_number: '9345678912',
      description: 'Deep residential cleaning and move-in or move-out cleaning support.',
      address: 'HSR Layout, Bengaluru',
      latitude: 12.9116,
      longitude: 77.6474,
      approval_status: 'approved',
      is_available: true,
    },
  });
  console.log('Vendors seeded.');

  const serviceA = await prisma.vendorService.upsert({
    where: { id: 1001 },
    update: {
      vendor_id: vendorA.vendor_id,
      category_id: 1,
      service_title: 'Emergency Pipe Leak Repair',
      description: 'Quick plumbing support for homes and offices.',
      price_min: 499,
      price_max: 1499,
      is_available: true,
      approval_status: 'approved',
      status: 'approved',
    },
    create: {
      id: 1001,
      vendor_id: vendorA.vendor_id,
      category_id: 1,
      service_title: 'Emergency Pipe Leak Repair',
      description: 'Quick plumbing support for homes and offices.',
      price_min: 499,
      price_max: 1499,
      is_available: true,
      approval_status: 'approved',
      status: 'approved',
    },
  });

  const serviceB = await prisma.vendorService.upsert({
    where: { id: 1002 },
    update: {
      vendor_id: vendorB.vendor_id,
      category_id: 2,
      service_title: 'Residential Wiring Check',
      description: 'Electrical inspection and minor rewiring.',
      price_min: 699,
      price_max: 1999,
      is_available: false,
      approval_status: 'pending',
      status: 'pending',
    },
    create: {
      id: 1002,
      vendor_id: vendorB.vendor_id,
      category_id: 2,
      service_title: 'Residential Wiring Check',
      description: 'Electrical inspection and minor rewiring.',
      price_min: 699,
      price_max: 1999,
      is_available: false,
      approval_status: 'pending',
      status: 'pending',
    },
  });

  const serviceC = await prisma.vendorService.upsert({
    where: { id: 1003 },
    update: {
      vendor_id: vendorC.vendor_id,
      category_id: 4,
      service_title: 'Deep Home Cleaning',
      description: 'End-to-end apartment and villa cleaning.',
      price_min: 1299,
      price_max: 3999,
      is_available: true,
      approval_status: 'approved',
      status: 'approved',
    },
    create: {
      id: 1003,
      vendor_id: vendorC.vendor_id,
      category_id: 4,
      service_title: 'Deep Home Cleaning',
      description: 'End-to-end apartment and villa cleaning.',
      price_min: 1299,
      price_max: 3999,
      is_available: true,
      approval_status: 'approved',
      status: 'approved',
    },
  });

  await prisma.vendorService.upsert({
    where: { id: 1004 },
    update: {
      vendor_id: vendorA.vendor_id,
      category_id: 5,
      service_title: 'Modular Kitchen Fixes',
      description: 'Cabinet alignment and hinge repairs.',
      price_min: 899,
      price_max: 2499,
      is_available: false,
      approval_status: 'rejected',
      status: 'rejected',
    },
    create: {
      id: 1004,
      vendor_id: vendorA.vendor_id,
      category_id: 5,
      service_title: 'Modular Kitchen Fixes',
      description: 'Cabinet alignment and hinge repairs.',
      price_min: 899,
      price_max: 2499,
      is_available: false,
      approval_status: 'rejected',
      status: 'rejected',
    },
  });
  console.log('Vendor services seeded.');

  const vendorLookup = {
    A: vendorA.vendor_id,
    B: vendorB.vendor_id,
    C: vendorC.vendor_id,
  };

  for (const availability of vendorAvailabilitySeed) {
    await prisma.vendorAvailability.upsert({
      where: {
        vendor_id_day_of_week: {
          vendor_id: vendorLookup[availability.vendorKey],
          day_of_week: availability.day_of_week,
        },
      },
      update: {
        is_active: availability.is_active,
        start_time: availability.start_time,
        end_time: availability.end_time,
      },
      create: {
        vendor_id: vendorLookup[availability.vendorKey],
        day_of_week: availability.day_of_week,
        is_active: availability.is_active,
        start_time: availability.start_time,
        end_time: availability.end_time,
      },
    });
  }
  console.log('Vendor availability seeded.');

  const customerA = await upsertUser({
    mobile: '9456789123',
    full_name: 'Neha Kapoor',
    role_id: 1,
    email: 'neha.user@mts.local',
    profile: {
      address: 'BTM Layout, Bengaluru',
      latitude: 12.9166,
      longitude: 77.6101,
    },
  });

  const customerB = await upsertUser({
    mobile: '9567891234',
    full_name: 'Arjun Mehta',
    role_id: 1,
    email: 'arjun.user@mts.local',
    profile: {
      address: 'Whitefield, Bengaluru',
      latitude: 12.9698,
      longitude: 77.7499,
    },
  });

  const customerC = await upsertUser({
    mobile: '9678912345',
    full_name: 'Sana Ali',
    role_id: 1,
    email: 'sana.user@mts.local',
    profile: {
      address: 'JP Nagar, Bengaluru',
      latitude: 12.9077,
      longitude: 77.5855,
    },
  });

  await prisma.booking.upsert({
    where: { booking_id: 2001 },
    update: {
      user_id: customerA.user_id,
      vendor_service_id: serviceA.id,
      booking_status: 'pending',
      completion_otp: '582301',
      completion_otp_generated_at: new Date('2026-03-25T09:00:00.000Z'),
      completion_otp_verified_at: null,
      scheduled_at: new Date('2026-03-26T05:30:00.000Z'),
      address: 'BTM Layout 2nd Stage, Bengaluru',
      total_price: 799,
    },
    create: {
      booking_id: 2001,
      user_id: customerA.user_id,
      vendor_service_id: serviceA.id,
      booking_status: 'pending',
      completion_otp: '582301',
      completion_otp_generated_at: new Date('2026-03-25T09:00:00.000Z'),
      scheduled_at: new Date('2026-03-26T05:30:00.000Z'),
      address: 'BTM Layout 2nd Stage, Bengaluru',
      total_price: 799,
    },
  });

  await prisma.booking.upsert({
    where: { booking_id: 2002 },
    update: {
      user_id: customerB.user_id,
      vendor_service_id: serviceC.id,
      booking_status: 'confirmed',
      completion_otp: '641928',
      completion_otp_generated_at: new Date('2026-03-26T14:30:00.000Z'),
      completion_otp_verified_at: null,
      scheduled_at: new Date('2026-03-27T07:00:00.000Z'),
      address: 'Whitefield Main Road, Bengaluru',
      total_price: 2499,
    },
    create: {
      booking_id: 2002,
      user_id: customerB.user_id,
      vendor_service_id: serviceC.id,
      booking_status: 'confirmed',
      completion_otp: '641928',
      completion_otp_generated_at: new Date('2026-03-26T14:30:00.000Z'),
      scheduled_at: new Date('2026-03-27T07:00:00.000Z'),
      address: 'Whitefield Main Road, Bengaluru',
      total_price: 2499,
    },
  });

  await prisma.booking.upsert({
    where: { booking_id: 2003 },
    update: {
      user_id: customerC.user_id,
      vendor_service_id: serviceA.id,
      booking_status: 'completed',
      completion_otp: '734512',
      completion_otp_generated_at: new Date('2026-03-19T15:00:00.000Z'),
      completion_otp_verified_at: new Date('2026-03-20T06:15:00.000Z'),
      scheduled_at: new Date('2026-03-20T04:00:00.000Z'),
      address: 'JP Nagar 7th Phase, Bengaluru',
      total_price: 1199,
    },
    create: {
      booking_id: 2003,
      user_id: customerC.user_id,
      vendor_service_id: serviceA.id,
      booking_status: 'completed',
      completion_otp: '734512',
      completion_otp_generated_at: new Date('2026-03-19T15:00:00.000Z'),
      completion_otp_verified_at: new Date('2026-03-20T06:15:00.000Z'),
      scheduled_at: new Date('2026-03-20T04:00:00.000Z'),
      address: 'JP Nagar 7th Phase, Bengaluru',
      total_price: 1199,
    },
  });

  await prisma.booking.upsert({
    where: { booking_id: 2004 },
    update: {
      user_id: customerA.user_id,
      vendor_service_id: serviceC.id,
      booking_status: 'cancelled',
      completion_otp: '408276',
      completion_otp_generated_at: new Date('2026-03-20T18:30:00.000Z'),
      completion_otp_verified_at: null,
      scheduled_at: new Date('2026-03-21T10:30:00.000Z'),
      address: 'Koramangala 5th Block, Bengaluru',
      total_price: 1599,
    },
    create: {
      booking_id: 2004,
      user_id: customerA.user_id,
      vendor_service_id: serviceC.id,
      booking_status: 'cancelled',
      completion_otp: '408276',
      completion_otp_generated_at: new Date('2026-03-20T18:30:00.000Z'),
      scheduled_at: new Date('2026-03-21T10:30:00.000Z'),
      address: 'Koramangala 5th Block, Bengaluru',
      total_price: 1599,
    },
  });

  await prisma.booking.upsert({
    where: { booking_id: 2005 },
    update: {
      user_id: customerB.user_id,
      vendor_service_id: serviceB.id,
      booking_status: 'pending',
      completion_otp: '915364',
      completion_otp_generated_at: new Date('2026-03-27T11:00:00.000Z'),
      completion_otp_verified_at: null,
      scheduled_at: new Date('2026-03-28T06:00:00.000Z'),
      address: 'AECS Layout, Bengaluru',
      total_price: 999,
    },
    create: {
      booking_id: 2005,
      user_id: customerB.user_id,
      vendor_service_id: serviceB.id,
      booking_status: 'pending',
      completion_otp: '915364',
      completion_otp_generated_at: new Date('2026-03-27T11:00:00.000Z'),
      scheduled_at: new Date('2026-03-28T06:00:00.000Z'),
      address: 'AECS Layout, Bengaluru',
      total_price: 999,
    },
  });
  console.log('Bookings seeded.');

  await prisma.review.deleteMany({
    where: {
      booking_id: {
        in: reviewSeed.map((review) => review.booking_id),
      },
    },
  });

  for (const review of reviewSeed) {
    const booking = await prisma.booking.findUnique({
      where: { booking_id: review.booking_id },
      select: { user_id: true },
    });

    if (!booking) {
      continue;
    }

    await prisma.review.create({
      data: {
        booking_id: review.booking_id,
        user_id: booking.user_id,
        rating: review.rating,
        comment: review.comment,
      },
    });
  }
  console.log('Reviews seeded.');

  await prisma.notification.upsert({
    where: { notification_id: 5001 },
    update: {
      recipient_user_id: customerA.user_id,
      booking_id: 2001,
      title: 'Booking request submitted',
      message: 'Rakesh Plumbing Works has received your booking request for Emergency Pipe Leak Repair.',
      type: 'booking_created',
      is_read: false,
      read_at: null,
    },
    create: {
      notification_id: 5001,
      recipient_user_id: customerA.user_id,
      booking_id: 2001,
      title: 'Booking request submitted',
      message: 'Rakesh Plumbing Works has received your booking request for Emergency Pipe Leak Repair.',
      type: 'booking_created',
      is_read: false,
    },
  });

  await prisma.notification.upsert({
    where: { notification_id: 5002 },
    update: {
      recipient_user_id: vendorA.vendor_id,
      booking_id: 2001,
      title: 'New booking request',
      message: 'Neha Kapoor requested Emergency Pipe Leak Repair for 26 Mar at 11:00 AM.',
      type: 'booking_created',
      is_read: false,
      read_at: null,
    },
    create: {
      notification_id: 5002,
      recipient_user_id: vendorA.vendor_id,
      booking_id: 2001,
      title: 'New booking request',
      message: 'Neha Kapoor requested Emergency Pipe Leak Repair for 26 Mar at 11:00 AM.',
      type: 'booking_created',
      is_read: false,
    },
  });

  await prisma.notification.upsert({
    where: { notification_id: 5003 },
    update: {
      recipient_user_id: customerB.user_id,
      booking_id: 2002,
      title: 'Booking Confirmed',
      message: 'FreshNest Home Care confirmed your booking for Deep Home Cleaning.',
      type: 'booking_status',
      is_read: true,
      read_at: new Date('2026-03-27T08:00:00.000Z'),
    },
    create: {
      notification_id: 5003,
      recipient_user_id: customerB.user_id,
      booking_id: 2002,
      title: 'Booking Confirmed',
      message: 'FreshNest Home Care confirmed your booking for Deep Home Cleaning.',
      type: 'booking_status',
      is_read: true,
      read_at: new Date('2026-03-27T08:00:00.000Z'),
    },
  });
  console.log('Notifications seeded.');

  await prisma.reel.upsert({
    where: { id: 3001 },
    update: {
      vendor_id: vendorA.vendor_id,
      video_url: 'https://example.com/reels/plumbing-demo.mp4',
      caption: 'Bathroom leak repair before and after',
      category_id: 1,
      thumbnail_url: 'https://example.com/reels/plumbing-thumb.jpg',
      created_at: new Date('2026-03-18T09:30:00.000Z'),
      expiry_date: new Date('2026-04-18T09:30:00.000Z'),
    },
    create: {
      id: 3001,
      vendor_id: vendorA.vendor_id,
      video_url: 'https://example.com/reels/plumbing-demo.mp4',
      caption: 'Bathroom leak repair before and after',
      category_id: 1,
      thumbnail_url: 'https://example.com/reels/plumbing-thumb.jpg',
      created_at: new Date('2026-03-18T09:30:00.000Z'),
      expiry_date: new Date('2026-04-18T09:30:00.000Z'),
    },
  });

  await prisma.reel.upsert({
    where: { id: 3002 },
    update: {
      vendor_id: vendorB.vendor_id,
      video_url: 'https://example.com/reels/electrical-demo.mp4',
      caption: 'Quick switchboard safety inspection',
      category_id: 2,
      thumbnail_url: 'https://example.com/reels/electrical-thumb.jpg',
      created_at: new Date('2026-03-17T07:00:00.000Z'),
      expiry_date: new Date('2026-04-17T07:00:00.000Z'),
    },
    create: {
      id: 3002,
      vendor_id: vendorB.vendor_id,
      video_url: 'https://example.com/reels/electrical-demo.mp4',
      caption: 'Quick switchboard safety inspection',
      category_id: 2,
      thumbnail_url: 'https://example.com/reels/electrical-thumb.jpg',
      created_at: new Date('2026-03-17T07:00:00.000Z'),
      expiry_date: new Date('2026-04-17T07:00:00.000Z'),
    },
  });

  await prisma.reel.upsert({
    where: { id: 3003 },
    update: {
      vendor_id: vendorC.vendor_id,
      video_url: 'https://example.com/reels/cleaning-demo.mp4',
      caption: 'Apartment deep clean transformation',
      category_id: 4,
      thumbnail_url: 'https://example.com/reels/cleaning-thumb.jpg',
      created_at: new Date('2026-03-16T11:15:00.000Z'),
      expiry_date: new Date('2026-04-16T11:15:00.000Z'),
    },
    create: {
      id: 3003,
      vendor_id: vendorC.vendor_id,
      video_url: 'https://example.com/reels/cleaning-demo.mp4',
      caption: 'Apartment deep clean transformation',
      category_id: 4,
      thumbnail_url: 'https://example.com/reels/cleaning-thumb.jpg',
      created_at: new Date('2026-03-16T11:15:00.000Z'),
      expiry_date: new Date('2026-04-16T11:15:00.000Z'),
    },
  });
  console.log('Reels seeded.');

  await prisma.payoutRequest.upsert({
    where: { payout_id: 4001 },
    update: {
      agent_id: agentA.agent_id,
      amount: 8500,
      account_number: '123456789012',
      ifsc_code: 'HDFC0001234',
      bank_name: 'HDFC Bank',
      status: 'pending',
    },
    create: {
      payout_id: 4001,
      agent_id: agentA.agent_id,
      amount: 8500,
      account_number: '123456789012',
      ifsc_code: 'HDFC0001234',
      bank_name: 'HDFC Bank',
      status: 'pending',
    },
  });

  await prisma.payoutRequest.upsert({
    where: { payout_id: 4002 },
    update: {
      agent_id: agentB.agent_id,
      amount: 4200,
      account_number: '234567890123',
      ifsc_code: 'ICIC0002345',
      bank_name: 'ICICI Bank',
      status: 'completed',
    },
    create: {
      payout_id: 4002,
      agent_id: agentB.agent_id,
      amount: 4200,
      account_number: '234567890123',
      ifsc_code: 'ICIC0002345',
      bank_name: 'ICICI Bank',
      status: 'completed',
    },
  });

  await prisma.payoutRequest.upsert({
    where: { payout_id: 4003 },
    update: {
      agent_id: agentA.agent_id,
      amount: 2650,
      account_number: '123456789012',
      ifsc_code: 'HDFC0001234',
      bank_name: 'HDFC Bank',
      status: 'rejected',
    },
    create: {
      payout_id: 4003,
      agent_id: agentA.agent_id,
      amount: 2650,
      account_number: '123456789012',
      ifsc_code: 'HDFC0001234',
      bank_name: 'HDFC Bank',
      status: 'rejected',
    },
  });
  console.log('Payout requests seeded.');

  console.log('Seeding completed successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
