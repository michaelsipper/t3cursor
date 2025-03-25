import dbConnect from "./lib/mongodb";
import User from "./models/User";

const createTestUser = async () => {
  try {
    await dbConnect();

    const testUser = new User({
      name: "Michael Sipper",
      age: 22,
      location: "San Francisco, CA",
      bannerUrl: "https://example.com/banner.jpg",
      profilePicUrl: "https://example.com/profile.jpg",
      photos: [
        "https://example.com/photo1.jpg",
        "https://example.com/photo2.jpg",
      ],
      prompts: [
        {
          title: "A perfect night looks like...",
          description: "Impromptu rooftop gatherings, vinyl records, and conversations that last until sunrise",
        },
        {
          title: "Best spontaneous decision...",
          description: "Booking a one-way flight to Tokyo, ended up staying for a month",
        },
      ],
      reliabilityScore: 95,
      friendsCount: 37,
    });

    await testUser.save();
    console.log("✅ Test user added successfully!");
    process.exit();
  } catch (error) {
    console.error("❌ Error adding test user:", error);
    process.exit(1);
  }
};

createTestUser();
