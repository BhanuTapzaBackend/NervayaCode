/**
 * Seeds a completed, worst-case sleep assessment for the payment-bypass test
 * customer so the recommendation page deterministically renders the full
 * three-support package (SUPPLEMENT + THERAPY + GUIDED_AUDIO).
 *
 * Why this is needed: `calculateSleepAssessment` scores each answer by its
 * OPTION INDEX, and only the ALL_THREE segment marks all three services 'High'
 * — which is what puts THERAPY in the bundle and therefore routes
 * "Start My Sleep Plan" through the therapist modal. Answering via the UI the
 * way `e2e/helpers/assessment.ts` does picks index 0 everywhere, which scores
 * NO_DOMAIN and shows no package at all. So we pick the LAST option per
 * question here instead of driving the form.
 *
 * Only the test customer's own response is touched.
 * Run: npx tsx --env-file=.env e2e/scripts/seed-worst-case-assessment.ts
 */
import connectDB from '../../src/lib/db/mongodb';
import User from '../../src/lib/models/user.model';
import SleepAssessmentQuestion from '../../src/lib/models/sleepAssessmentQuestion.model';
import SleepAssessmentResponse from '../../src/lib/models/sleepAssessmentResponse.model';

const TEST_CUSTOMER_PHONE = '+918888888888';

async function main() {
  await connectDB();

  const user = await User.findOne({ phone: TEST_CUSTOMER_PHONE }).select('_id').lean();
  if (!user) {
    throw new Error(`Test customer ${TEST_CUSTOMER_PHONE} not found. Run scripts/seed-test-logins.ts first.`);
  }

  const questions = await SleepAssessmentQuestion.find({ isActive: true }).sort({ order: 1 }).lean();
  if (questions.length === 0) throw new Error('No active sleep assessment questions in this database.');

  // Last option = highest index = worst score in every domain -> ALL_THREE.
  const answers = questions.map((q) => {
    const last = q.options[q.options.length - 1];
    const value = last?.value ?? 'Automated worst-case answer.';
    return {
      questionId: q._id,
      answer: q.questionType === 'multiple_choice' ? [value] : value,
    };
  });

  await SleepAssessmentResponse.deleteMany({ userId: user._id });
  await SleepAssessmentResponse.create({ userId: user._id, answers, completedAt: new Date() });

  console.log(`Seeded worst-case assessment (${answers.length} answers) for ${TEST_CUSTOMER_PHONE}.`);
  process.exit(0);
}

main().catch((e) => {
  console.error('Failed:', e.message);
  process.exit(1);
});
