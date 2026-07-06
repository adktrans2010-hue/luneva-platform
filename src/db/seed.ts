import "dotenv/config";

import { db } from "./index";
import { reviews } from "./schema";
import { reviews as seedReviews } from "../../data/reviews";

async function seed() {
  console.log("🌱 Seeding database...");

  await db.delete(reviews);

  await db.insert(reviews).values(
    seedReviews.map((review) => ({
      name: review.name,
      age: review.age,
      text: review.text,
      image: review.image,
      published: true,
    }))
  );

  console.log(`✅ Added ${seedReviews.length} reviews`);
}

seed()
  .then(() => {
    console.log("✅ Seed finished");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Seed failed");
    console.error(error);
    process.exit(1);
  });