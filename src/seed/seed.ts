import connectDB from '../lib/mongodb';
import { Question } from '../models/Question';
import { seedQuestions } from './questions';

async function seed() {
  try {
    console.log('🌱 Starting database seeding...');

    // Connect to MongoDB
    await connectDB();

    // Clear existing questions
    const deleteResult = await Question.deleteMany({});
    console.log(`🗑️  Deleted ${deleteResult.deletedCount} existing questions`);

    // Insert seed questions
    const insertResult = await Question.insertMany(seedQuestions);
    console.log(`✅ Inserted ${insertResult.length} questions`);

    // Show distribution by difficulty
    const distribution = await Question.aggregate([
      {
        $group: {
          _id: '$difficulty',
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    console.log('\n Questions by difficulty:');
    distribution.forEach((item) => {
      console.log(`   Difficulty ${item._id}: ${item.count} questions`);
    });

    console.log('\n Seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error(' Seeding failed:', error);
    process.exit(1);
  }
}

seed();