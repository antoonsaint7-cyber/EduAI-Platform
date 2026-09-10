const crypto = require('node:crypto');
const { query, withTransaction, close } = require('../src/db');
const { hashPassword } = require('../src/auth');

const SCHOOL_SUBJECTS = ['الرياضيات', 'العلوم', 'اللغة العربية', 'اللغة الإنجليزية', 'التاريخ'];
const SKILLS = [
  { subject: 'الرياضيات', topics: ['الجمع', 'الطرح', 'الضرب', 'القسمة', 'الكسور'] },
  { subject: 'العلوم', topics: ['الفيزياء', 'الكيمياء', 'الأحياء', 'البيئة'] },
  { subject: 'اللغة العربية', topics: ['النحو', 'الصرف', 'الإملاء', 'الفهم', 'الكتابة'] }
];

const SAMPLE_LESSONS = [
  {
    title: 'مقدمة إلى الجمع',
    subject: 'الرياضيات',
    level: 'الصف الأول',
    content: 'الجمع هو عملية إضافة عددين أو أكثر معاً للحصول على النتيجة.',
    objectives: ['فهم عملية الجمع', 'إجراء عمليات جمع بسيطة']
  },
  {
    title: 'الخلية الحية',
    subject: 'العلوم',
    level: 'الصف الثالث',
    content: 'الخلية هي الوحدة الأساسية للحياة وتحتوي على جميع الكائنات الحية.',
    objectives: ['فهم تركيب الخلية', 'معرفة وظائف الأجزاء']
  },
  {
    title: 'قواعد النحو الأساسية',
    subject: 'اللغة العربية',
    level: 'الصف الثاني',
    content: 'النحو يدرس قواعد اللغة العربية وطريقة تركيب الجمل.',
    objectives: ['تعلم أساسيات النحو', 'تطبيق القواعد بشكل صحيح']
  }
];

const SAMPLE_QUESTIONS = [
  {
    type: 'mcq',
    question: 'ما هو ناتج 5 + 3؟',
    options: ['7', '8', '9', '10'],
    answer_index: 1,
    explanation: 'عندما نضيف 5 و 3 معاً نحصل على 8',
    difficulty: 60
  },
  {
    type: 'mcq',
    question: 'ما هو ناتج 10 - 4؟',
    options: ['5', '6', '7', '8'],
    answer_index: 1,
    explanation: 'عندما نطرح 4 من 10 نحصل على 6',
    difficulty: 50
  },
  {
    type: 'true_false',
    question: 'الخلية هي الوحدة الأساسية للحياة',
    answer: true,
    explanation: 'صحيح، الخلية هي أصغر وحدة حية تستطيع القيام بجميع العمليات الحيوية',
    difficulty: 40
  }
];

async function seed() {
  try {
    console.log('🌱 Starting database seeding...');

    // 1. Create School Tenant
    console.log('📚 Creating school tenant...');
    const tenantRes = await query(
      'INSERT INTO tenants(name) VALUES($1) RETURNING id',
      ['مدرسة EduAI التجريبية']
    );
    const tenantId = tenantRes.rows[0].id;
    console.log(`✓ Tenant created: ${tenantId}`);

    // 2. Create Users (Teachers and Students)
    console.log('👥 Creating users...');
    const users = [];

    // Create Teachers
    for (let i = 1; i <= 3; i++) {
      const email = `teacher${i}@school.test`;
      const passwordHash = await hashPassword('TestPass123!');
      const res = await query(
        `INSERT INTO users(tenant_id, email, password_hash, role, name, email_verified_at, mfa_enabled)
         VALUES($1, $2, $3, $4, $5, now(), false) RETURNING id, email, role, name`,
        [tenantId, email, passwordHash, 'teacher', `معلم ${i}`, email]
      );
      users.push(res.rows[0]);
      console.log(`✓ Teacher created: ${res.rows[0].name}`);
    }

    // Create Students
    for (let i = 1; i <= 10; i++) {
      const email = `student${i}@school.test`;
      const passwordHash = await hashPassword('TestPass123!');
      const res = await query(
        `INSERT INTO users(tenant_id, email, password_hash, role, name, email_verified_at, mfa_enabled)
         VALUES($1, $2, $3, $4, $5, now(), false) RETURNING id, email, role, name`,
        [tenantId, email, passwordHash, 'student', `طالب ${i}`]
      );
      users.push(res.rows[0]);
      console.log(`✓ Student created: ${res.rows[0].name}`);
    }

    const teachers = users.filter(u => u.role === 'teacher');
    const students = users.filter(u => u.role === 'student');

    // 3. Create Lessons
    console.log('📖 Creating lessons...');
    const lessons = [];
    for (const sample of SAMPLE_LESSONS) {
      const res = await query(
        `INSERT INTO lessons(tenant_id, title, subject, level, content, status, created_by)
         VALUES($1, $2, $3, $4, $5, $6, $7) RETURNING id, title, subject`,
        [
          tenantId,
          sample.title,
          sample.subject,
          sample.level,
          sample.content,
          'published',
          teachers[0].id
        ]
      );
      lessons.push(res.rows[0]);
      console.log(`✓ Lesson created: ${res.rows[0].title}`);
    }

    // 4. Create Assessments
    console.log('📝 Creating assessments...');
    for (const lesson of lessons) {
      const relevantQuestions = SAMPLE_QUESTIONS.filter(q => {
        if (lesson.subject === 'الرياضيات') return q.question.includes('ناتج');
        if (lesson.subject === 'العلوم') return q.question.includes('الخلية');
        return true;
      });

      const res = await query(
        `INSERT INTO assessments(lesson_id, tenant_id, questions, created_by)
         VALUES($1, $2, $3, $4) RETURNING id`,
        [
          lesson.id,
          tenantId,
          JSON.stringify(relevantQuestions),
          teachers[0].id
        ]
      );
      console.log(`✓ Assessment created for lesson: ${lesson.title}`);
    }

    // 5. Create Student Progress
    console.log('📊 Creating student progress...');
    for (let i = 0; i < students.length; i++) {
      for (let j = 0; j < lessons.length; j++) {
        const mastery = Math.floor(Math.random() * 100);
        const score = Math.floor(Math.random() * 100);
        await query(
          `INSERT INTO progress(tenant_id, student_id, lesson_id, mastery, last_score, attempts)
           VALUES($1, $2, $3, $4, $5, $6)
           ON CONFLICT(student_id, lesson_id) DO UPDATE SET mastery=$4, last_score=$5`,
          [tenantId, students[i].id, lessons[j].id, mastery, score, Math.floor(Math.random() * 5) + 1]
        );
      }
      console.log(`✓ Progress created for student: ${students[i].name}`);
    }

    // 6. Create Topic Mastery Records
    console.log('🎯 Creating topic mastery...');
    for (const student of students) {
      for (const skill of SKILLS) {
        for (const topic of skill.topics) {
          const mastery = Math.floor(Math.random() * 100);
          await query(
            `INSERT INTO topic_mastery(tenant_id, student_id, subject, topic, mastery, evidence_count)
             VALUES($1, $2, $3, $4, $5, $6)
             ON CONFLICT(student_id, subject, topic) DO UPDATE SET mastery=$5`,
            [tenantId, student.id, skill.subject, topic, mastery, Math.floor(Math.random() * 10) + 1]
          );
        }
      }
      console.log(`✓ Topic mastery created for: ${student.name}`);
    }

    // 7. Create Subscription Plans (should already exist)
    console.log('💳 Verifying subscription plans...');
    const plans = await query('SELECT COUNT(*) as count FROM subscription_plans');
    if (plans.rows[0].count === 0) {
      await query(
        `INSERT INTO subscription_plans(id, name, monthly_ai_limit, max_students, max_teachers, stripe_price_id)
         VALUES
         ('free', 'Free', 50, 25, 2, NULL),
         ('teacher', 'Teacher', 1000, 200, 10, NULL),
         ('school', 'School', 10000, 5000, 500, NULL),
         ('enterprise', 'Enterprise', 100000, 999999, 999999, NULL)`
      );
      console.log('✓ Subscription plans created');
    } else {
      console.log('✓ Subscription plans already exist');
    }

    // 8. Create a Subscription for the School
    console.log('📋 Creating subscription...');
    await query(
      `INSERT INTO subscriptions(tenant_id, plan_id, status, current_period_start, current_period_end)
       VALUES($1, $2, $3, now(), now() + interval '30 days')
       ON CONFLICT(tenant_id) DO NOTHING`,
      [tenantId, 'school', 'active']
    );
    console.log('✓ Subscription created');

    console.log('\n✅ Database seeding completed successfully!');
    console.log('\n📊 Seeded Data Summary:');
    console.log(`  • 1 School Tenant`);
    console.log(`  • 3 Teachers`);
    console.log(`  • 10 Students`);
    console.log(`  • 3 Lessons`);
    console.log(`  • 3 Assessments`);
    console.log(`  • 30 Student Progress Records`);
    console.log(`  • ${SKILLS.reduce((sum, s) => sum + s.topics.length, 0) * 10} Topic Mastery Records`);
    console.log(`  • 4 Subscription Plans`);
    console.log(`  • 1 School Subscription`);
    console.log('\n🔑 Test Credentials:');
    console.log('  Teacher: teacher1@school.test / TestPass123!');
    console.log('  Student: student1@school.test / TestPass123!');

  } catch (error) {
    console.error('❌ Seeding error:', error);
    process.exitCode = 1;
  } finally {
    await close();
  }
}

seed();