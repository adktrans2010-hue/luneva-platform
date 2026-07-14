import "dotenv/config";

import { db } from "./index";
import { reviews } from "./schema";
import { reviews as seedReviews } from "../../data/reviews";

const reviewDateStart = new Date("2022-01-01T10:00:00+03:00").getTime();
const reviewDateEnd = new Date().getTime();

function seededRandom(index: number) {
  const x = Math.sin(index + 1) * 10000;
  return x - Math.floor(x);
}

function createRandomReviewDate(index: number) {
  const timestamp =
    reviewDateStart + Math.floor(seededRandom(index) * (reviewDateEnd - reviewDateStart));

  return new Date(timestamp);
}

async function seed() {
  console.log("🌱 Seeding database...");

  await db.delete(reviews);

  await db.insert(reviews).values(
    seedReviews.map((review, index) => ({
      name: review.name,
      age: review.age,
      text: review.text,
      image: review.image,
      published: true,
      createdAt: createRandomReviewDate(index),
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
