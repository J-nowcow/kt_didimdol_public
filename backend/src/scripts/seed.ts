import { PrismaClient } from '@prisma/client';
import { MongoService } from '../services/MongoService';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();
const mongoService = new MongoService();

async function seedDatabase() {
  try {
    logger.info('🌱 Starting database seeding...');

    // 1. 사용자 데이터 생성
    const users = await createUsers();
    logger.info(`✅ Created ${users.length} users`);

    // 2. 인수인계서 템플릿 생성
    const templates = await createTemplates();
    logger.info(`✅ Created ${templates.length} templates`);

    // 3. 샘플 인수인계서 생성
    const handovers = await createSampleHandovers(users);
    logger.info(`✅ Created ${handovers.length} sample handovers`);

    // 4. 댓글 데이터 생성
    const comments = await createComments(handovers, users);
    logger.info(`✅ Created ${comments.length} comments`);

    // 5. 공유 데이터 생성
    const shares = await createShares(handovers, users);
    logger.info(`✅ Created ${shares.length} shares`);

    logger.info('🎉 Database seeding completed successfully!');
  } catch (error) {
    logger.error('❌ Database seeding failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

async function createUsers() {
  const users = [
    {
      username: 'admin',
      email: 'admin@didimdol.com',
      fullName: '시스템 관리자',
      department: 'IT',
      position: '시스템 관리자'
    },
    {
      username: 'honggildong',
      email: 'hong@didimdol.com',
      fullName: '홍길동',
      department: '개발팀',
      position: '시니어 개발자'
    },
    {
      username: 'kimcheolsu',
      email: 'kim@didimdol.com',
      fullName: '김철수',
      department: '기획팀',
      position: '프로덕트 매니저'
    },
    {
      username: 'leeyoungmi',
      email: 'lee@didimdol.com',
      fullName: '이영미',
      department: '디자인팀',
      position: 'UI/UX 디자이너'
    },
    {
      username: 'parkminsu',
      email: 'park@didimdol.com',
      fullName: '박민수',
      department: '개발팀',
      position: '주니어 개발자'
    }
  ];

  const createdUsers = [];
  for (const userData of users) {
    const user = await prisma.user.upsert({
      where: { email: userData.email },
      update: userData,
      create: userData
    });
    createdUsers.push(user);
  }

  return createdUsers;
}

async function createTemplates() {
  const templates = [
    {
      name: '기본 인수인계서 템플릿',
      description: '표준 인수인계서 작성 템플릿',
      category: 'general',
      templateContent: {
        sections: [
          {
            id: 'overview',
            title: '업무 개요',
            placeholder: '업무의 전체적인 개요를 작성하세요',
            required: true,
            type: 'text'
          },
          {
            id: 'responsibilities',
            title: '주요 업무',
            placeholder: '담당하고 있는 주요 업무를 작성하세요',
            required: true,
            type: 'list'
          },
          {
            id: 'procedures',
            title: '업무 절차',
            placeholder: '업무 수행 절차를 작성하세요',
            required: true,
            type: 'text'
          },
          {
            id: 'contacts',
            title: '관련 연락처',
            placeholder: '관련자들의 연락처를 작성하세요',
            required: false,
            type: 'text'
          }
        ]
      },
      createdBy: 1,
      isPublic: true
    },
    {
      name: '개발팀 인수인계서 템플릿',
      description: '개발팀 전용 인수인계서 템플릿',
      category: 'development',
      templateContent: {
        sections: [
          {
            id: 'project_overview',
            title: '프로젝트 개요',
            placeholder: '프로젝트의 전체적인 개요를 작성하세요',
            required: true,
            type: 'text'
          },
          {
            id: 'tech_stack',
            title: '기술 스택',
            placeholder: '사용된 기술 스택을 작성하세요',
            required: true,
            type: 'list'
          },
          {
            id: 'code_structure',
            title: '코드 구조',
            placeholder: '코드 구조 및 아키텍처를 설명하세요',
            required: true,
            type: 'text'
          },
          {
            id: 'deployment',
            title: '배포 정보',
            placeholder: '배포 관련 정보를 작성하세요',
            required: true,
            type: 'text'
          }
        ]
      },
      createdBy: 1,
      isPublic: true
    }
  ];

  const createdTemplates = [];
  for (const templateData of templates) {
    const template = await mongoService.createTemplate(templateData);
    createdTemplates.push(template);
  }

  return createdTemplates;
}

async function createSampleHandovers(users: any[]) {
  const handovers = [
    {
      title: '프론트엔드 개발 인수인계서',
      authorId: users[1].id, // 홍길동
      status: 'completed',
      priority: 'high',
      category: '개발',
      tags: ['React', 'TypeScript', '프론트엔드'],
      content: {
        sections: [
          {
            id: 'overview',
            title: '업무 개요',
            content: '디딤돌 프로젝트의 프론트엔드 개발 업무를 담당하고 있습니다.',
            order: 1,
            type: 'text'
          },
          {
            id: 'responsibilities',
            title: '주요 업무',
            content: 'React 기반 컴포넌트 개발, TypeScript 타입 정의, 상태 관리',
            order: 2,
            type: 'list'
          },
          {
            id: 'procedures',
            title: '업무 절차',
            content: '요구사항 분석 → 컴포넌트 설계 → 개발 → 테스트 → 배포',
            order: 3,
            type: 'text'
          }
        ],
        attachments: [],
        metadata: {
          totalSections: 3,
          wordCount: 150,
          lastModifiedSection: 'procedures'
        }
      }
    },
    {
      title: '백엔드 API 개발 인수인계서',
      authorId: users[4].id, // 박민수
      status: 'in_progress',
      priority: 'medium',
      category: '개발',
      tags: ['Node.js', 'Express', '백엔드'],
      content: {
        sections: [
          {
            id: 'overview',
            title: '업무 개요',
            content: '디딤돌 프로젝트의 백엔드 API 개발 업무를 담당하고 있습니다.',
            order: 1,
            type: 'text'
          },
          {
            id: 'responsibilities',
            title: '주요 업무',
            content: 'RESTful API 개발, 데이터베이스 설계, 인증 시스템 구현',
            order: 2,
            type: 'list'
          }
        ],
        attachments: [],
        metadata: {
          totalSections: 2,
          wordCount: 80,
          lastModifiedSection: 'responsibilities'
        }
      }
    },
    {
      title: 'UI/UX 디자인 인수인계서',
      authorId: users[3].id, // 이영미
      status: 'draft',
      priority: 'low',
      category: '디자인',
      tags: ['Figma', 'UI/UX', '디자인'],
      content: {
        sections: [
          {
            id: 'overview',
            title: '업무 개요',
            content: '디딤돌 프로젝트의 UI/UX 디자인 업무를 담당하고 있습니다.',
            order: 1,
            type: 'text'
          }
        ],
        attachments: [],
        metadata: {
          totalSections: 1,
          wordCount: 30,
          lastModifiedSection: 'overview'
        }
      }
    }
  ];

  const createdHandovers = [];
  for (const handoverData of handovers) {
    // PostgreSQL에 메타데이터 저장
    const mongoId = `mongo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const handover = await prisma.handoverDocument.create({
      data: {
        title: handoverData.title,
        authorId: handoverData.authorId,
        status: handoverData.status,
        priority: handoverData.priority,
        category: handoverData.category,
        tags: handoverData.tags,
        mongoId
      }
    });

    // MongoDB에 본문 저장
    await mongoService.createContent({
      documentId: handover.id,
      version: 1,
      content: handoverData.content,
      createdBy: handoverData.authorId
    });

    createdHandovers.push(handover);
  }

  return createdHandovers;
}

async function createComments(handovers: any[], users: any[]) {
  const comments = [
    {
      documentId: handovers[0].id,
      authorId: users[2].id, // 김철수
      content: '프론트엔드 개발 관련해서 질문이 있습니다. React 버전은 몇을 사용하시나요?',
      parentCommentId: null
    },
    {
      documentId: handovers[0].id,
      authorId: users[1].id, // 홍길동
      content: 'React 18을 사용하고 있습니다. 추가 질문이 있으시면 언제든지 연락주세요!',
      parentCommentId: 1
    },
    {
      documentId: handovers[1].id,
      authorId: users[3].id, // 이영미
      content: '백엔드 API 개발 잘하고 계시네요! 디자인 관련해서도 협업할 기회가 있으면 좋겠습니다.',
      parentCommentId: null
    }
  ];

  const createdComments = [];
  for (const commentData of comments) {
    const comment = await prisma.handoverComment.create({
      data: commentData
    });
    createdComments.push(comment);
  }

  return createdComments;
}

async function createShares(handovers: any[], users: any[]) {
  const shares = [
    {
      documentId: handovers[0].id,
      sharedWithUserId: users[2].id, // 김철수
      permissionLevel: 'read',
      sharedBy: handovers[0].authorId
    },
    {
      documentId: handovers[1].id,
      sharedWithUserId: users[3].id, // 이영미
      permissionLevel: 'write',
      sharedBy: handovers[1].authorId
    }
  ];

  const createdShares = [];
  for (const shareData of shares) {
    const share = await prisma.handoverShare.create({
      data: shareData
    });
    createdShares.push(share);
  }

  return createdShares;
}

// 스크립트 실행
if (require.main === module) {
  seedDatabase()
    .then(() => {
      logger.info('✅ Seeding completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('❌ Seeding failed:', error);
      process.exit(1);
    });
}

export { seedDatabase };
