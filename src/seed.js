import dotenv from "dotenv";
import { connectDB, getDb } from "./config/db.js";
import { initAuth, getAuthInstance } from "./config/auth.js";
import { Class } from "./models/Class.js";
import { ForumPost } from "./models/ForumPost.js";
import { Transaction } from "./models/Transaction.js";

dotenv.config();

const seed = async () => {
  try {
    await connectDB();
    await initAuth();

    const auth = getAuthInstance();
    const db = getDb();

    console.log("Clearing existing data...");
    await db.collection("user").deleteMany({});
    await db.collection("session").deleteMany({});
    await db.collection("account").deleteMany({});
    await Class.deleteMany({});
    await ForumPost.deleteMany({});
    await Transaction.deleteMany({});

    console.log("Creating admin user...");
    const adminResult = await auth.api.signUpEmail({
      body: {
        name: "Admin",
        email: "admin@ironpulse.com",
        password: "Password123",
        image: "https://i.pravatar.cc/150?img=12",
      },
    });

    await db.collection("user").updateOne(
      { _id: adminResult.user.id },
      { $set: { role: "admin", status: "active" } }
    );

    console.log("Creating trainer user...");
    const trainerResult = await auth.api.signUpEmail({
      body: {
        name: "Sarah Mitchell",
        email: "sarah@ironpulse.com",
        password: "Password123",
        image: "https://i.pravatar.cc/150?img=45",
      },
    });

    await db.collection("user").updateOne(
      { _id: trainerResult.user.id },
      { $set: { role: "trainer", status: "active", trainerApplicationStatus: "approved" } }
    );

    console.log("Creating regular user...");
    const userResult = await auth.api.signUpEmail({
      body: {
        name: "John Doe",
        email: "john@ironpulse.com",
        password: "Password123",
        image: "https://i.pravatar.cc/150?img=33",
      },
    });

    console.log("Creating classes...");
    const classes = [
      {
        name: "Power Yoga Flow",
        image: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800",
        category: "Yoga",
        difficulty: "Intermediate",
        duration: "60 min",
        schedule: "Mon, Wed, Fri - 7:00 AM",
        price: 25,
        description: "Energize your morning with a dynamic power yoga flow. This class combines strength, flexibility, and mindfulness to start your day right. Suitable for intermediate practitioners looking to deepen their practice.",
        trainerId: trainerResult.user.id,
        trainerName: "Sarah Mitchell",
        trainerImage: "https://i.pravatar.cc/150?img=45",
        status: "approved",
        bookingCount: 42,
      },
      {
        name: "HIIT Boot Camp",
        image: "https://images.unsplash.com/photo-1534258936925-c58bed479fcb?w=800",
        category: "Cardio",
        difficulty: "Advanced",
        duration: "45 min",
        schedule: "Tue, Thu - 6:00 PM",
        price: 30,
        description: "High-Intensity Interval Training that pushes your limits. Burn maximum calories in minimum time with a mix of cardio and strength exercises. Bring water and a towel!",
        trainerId: trainerResult.user.id,
        trainerName: "Sarah Mitchell",
        trainerImage: "https://i.pravatar.cc/150?img=45",
        status: "approved",
        bookingCount: 58,
      },
      {
        name: "Strength Training 101",
        image: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800",
        category: "Weights",
        difficulty: "Beginner",
        duration: "50 min",
        schedule: "Mon, Wed - 5:00 PM",
        price: 35,
        description: "Learn the fundamentals of strength training. Perfect for beginners who want to build a solid foundation with proper form and technique. Covers squats, deadlifts, presses, and more.",
        trainerId: trainerResult.user.id,
        trainerName: "Sarah Mitchell",
        trainerImage: "https://i.pravatar.cc/150?img=45",
        status: "approved",
        bookingCount: 35,
      },
      {
        name: "Spin & Burn",
        image: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800",
        category: "Cardio",
        difficulty: "Intermediate",
        duration: "40 min",
        schedule: "Sat - 8:00 AM",
        price: 20,
        description: "Indoor cycling class that will make you sweat! High-energy music and motivating instructors will push you through hills, sprints, and intervals. All fitness levels welcome.",
        trainerId: trainerResult.user.id,
        trainerName: "Sarah Mitchell",
        trainerImage: "https://i.pravatar.cc/150?img=45",
        status: "approved",
        bookingCount: 28,
      },
      {
        name: "Pilates Core",
        image: "https://images.unsplash.com/photo-1518611012118-696072aa579a?w=800",
        category: "Yoga",
        difficulty: "Beginner",
        duration: "55 min",
        schedule: "Tue, Thu - 9:00 AM",
        price: 28,
        description: "Strengthen your core and improve your posture with Pilates. This low-impact workout focuses on controlled movements, breathing, and alignment. Great for all fitness levels.",
        trainerId: trainerResult.user.id,
        trainerName: "Sarah Mitchell",
        trainerImage: "https://i.pravatar.cc/150?img=45",
        status: "approved",
        bookingCount: 31,
      },
      {
        name: "Boxing Fitness",
        image: "https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?w=800",
        category: "Cardio",
        difficulty: "Advanced",
        duration: "60 min",
        schedule: "Fri - 7:00 PM",
        price: 32,
        description: "Channel your inner fighter! This boxing-inspired fitness class combines punching combinations with footwork drills and conditioning. Gloves provided for beginners.",
        trainerId: trainerResult.user.id,
        trainerName: "Sarah Mitchell",
        trainerImage: "https://i.pravatar.cc/150?img=45",
        status: "approved",
        bookingCount: 45,
      },
      {
        name: "CrossFit WOD",
        image: "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=800",
        category: "Weights",
        difficulty: "Advanced",
        duration: "60 min",
        schedule: "Mon, Wed, Fri - 6:00 AM",
        price: 40,
        description: "Workout of the Day! Constantly varied functional movements performed at high intensity. Build strength, endurance, and community. Prior fitness experience recommended.",
        trainerId: trainerResult.user.id,
        trainerName: "Sarah Mitchell",
        trainerImage: "https://i.pravatar.cc/150?img=45",
        status: "approved",
        bookingCount: 52,
      },
      {
        name: "Meditation & Stretch",
        image: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800",
        category: "Yoga",
        difficulty: "Beginner",
        duration: "45 min",
        schedule: "Sun - 9:00 AM",
        price: 18,
        description: "Find your inner peace with guided meditation followed by deep stretching. Perfect for recovery days and stress relief. No experience necessary - just bring yourself.",
        trainerId: trainerResult.user.id,
        trainerName: "Sarah Mitchell",
        trainerImage: "https://i.pravatar.cc/150?img=45",
        status: "approved",
        bookingCount: 22,
      },
    ];

    await Class.insertMany(classes);

    console.log("Creating forum posts...");
    const posts = [
      {
        title: "5 Essential Tips for Beginner Weightlifters",
        image: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800",
        description: "Starting your weightlifting journey? Here are 5 essential tips every beginner should know:\n\n1. Master proper form before adding weight\n2. Start with compound movements (squats, deadlifts, bench press)\n3. Follow a structured program rather than random workouts\n4. Prioritize recovery - muscles grow during rest\n5. Track your progress to stay motivated\n\nRemember, consistency beats intensity. Show up regularly, and the results will follow!",
        authorId: trainerResult.user.id,
        authorName: "Sarah Mitchell",
        authorImage: "https://i.pravatar.cc/150?img=45",
        authorRole: "trainer",
        likeCount: 24,
        dislikeCount: 1,
      },
      {
        title: "The Science Behind HIIT Training",
        image: "https://images.unsplash.com/photo-1534258936925-c58bed479fcb?w=800",
        description: "High-Intensity Interval Training (HIIT) has taken the fitness world by storm, and for good reason. Research shows that HIIT can burn up to 30% more calories than other forms of exercise in the same amount of time.\n\nThe key is the afterburn effect - your body continues to burn calories for hours after the workout. Try 30 seconds of all-out effort followed by 30 seconds of rest, repeated for 15-20 minutes.\n\nAlways warm up properly and listen to your body!",
        authorId: trainerResult.user.id,
        authorName: "Sarah Mitchell",
        authorImage: "https://i.pravatar.cc/150?img=45",
        authorRole: "trainer",
        likeCount: 18,
        dislikeCount: 0,
      },
      {
        title: "Welcome to IronPulse Community!",
        image: "https://images.unsplash.com/photo-1540497077202-7c8a3999166f?w=800",
        description: "Welcome to IronPulse, your ultimate fitness community! We're thrilled to have you here.\n\nThis platform is designed to help you discover amazing fitness classes, connect with expert trainers, and be part of a supportive community. Whether you're into yoga, weightlifting, cardio, or just getting started, there's something for everyone.\n\nBrowse our classes, join the community forum, and start your fitness journey today!",
        authorId: adminResult.user.id,
        authorName: "Admin",
        authorImage: "https://i.pravatar.cc/150?img=12",
        authorRole: "admin",
        likeCount: 35,
        dislikeCount: 2,
      },
      {
        title: "Nutrition Guide: Fueling Your Workouts",
        image: "https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=800",
        description: "What you eat is just as important as how you train. Here's a quick guide to fueling your workouts:\n\nPre-workout: Complex carbs + lean protein (e.g., oatmeal with berries)\nPost-workout: Protein + simple carbs for recovery (e.g., protein shake with banana)\nHydration: Drink at least 2-3 liters of water daily\n\nRemember, everyone's nutritional needs are different. Listen to your body and adjust accordingly!",
        authorId: trainerResult.user.id,
        authorName: "Sarah Mitchell",
        authorImage: "https://i.pravatar.cc/150?img=45",
        authorRole: "trainer",
        likeCount: 29,
        dislikeCount: 0,
      },
    ];

    await ForumPost.insertMany(posts);

    console.log("\n=== Seed Complete ===");
    console.log("Admin: admin@ironpulse.com / Password123");
    console.log("Trainer: sarah@ironpulse.com / Password123");
    console.log("User: john@ironpulse.com / Password123");
    console.log("=====================\n");

    console.log("Summary:");
    console.log(`  Users: 3 (1 admin, 1 trainer, 1 user)`);
    console.log(`  Classes: ${classes.length}`);
    console.log(`  Forum Posts: ${posts.length}`);

    process.exit(0);
  } catch (error) {
    console.error("Seed error:", error.message);
    process.exit(1);
  }
};

seed();
