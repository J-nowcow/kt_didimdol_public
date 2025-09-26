import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // 테스트 사용자 생성
  const testUser = await prisma.user.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      username: 'testuser',
      email: 'test@example.com',
      fullName: '테스트 사용자',
      department: '개발팀',
      position: '개발자',
      isActive: true,
    },
  });

  console.log('✅ Test user created:', testUser);

  // 추가 테스트 사용자들
  const users = [
    {
      id: 2,
      username: 'admin',
      email: 'admin@example.com',
      fullName: '관리자',
      department: 'IT팀',
      position: '시스템 관리자',
    },
    {
      id: 3,
      username: 'manager',
      email: 'manager@example.com',
      fullName: '매니저',
      department: '개발팀',
      position: '팀장',
    },
  ];

  for (const userData of users) {
    await prisma.user.upsert({
      where: { id: userData.id },
      update: {},
      create: userData,
    });
  }

  console.log('✅ All users created successfully');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
