import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });
dotenv.config();

const required = [
  "DATABASE_URL",
  "AUTH_SECRET",
  "AUTH_TRUST_HOST",
  "AUTH_URL",
  "CLOUDINARY_CLOUD_NAME",
  "CLOUDINARY_API_KEY",
  "CLOUDINARY_API_SECRET",
  "CRON_SECRET",
];

const recommended = [
  "APP_ENV",
  "NEXT_PUBLIC_APP_ENV",
];

const optional = [
  "FIREBASE_SERVICE_ACCOUNT_KEY",
];

function collectMissing(keys) {
  return keys.filter((key) => !process.env[key] || `${process.env[key]}`.trim().length === 0);
}

const missingRequired = collectMissing(required);
const missingRecommended = collectMissing(recommended);
const missingOptional = collectMissing(optional);

if (missingRequired.length > 0) {
  console.error("Missing required environment variables:");
  for (const key of missingRequired) {
    console.error(`- ${key}`);
  }
  process.exitCode = 1;
} else {
  console.log("Required environment variables are configured.");
}

if (missingRecommended.length > 0) {
  console.log("Missing recommended environment variables:");
  for (const key of missingRecommended) {
    console.log(`- ${key}`);
  }
  console.log("These improve observability and environment labeling, but they are not required for a free/open-source launch.");
}

if (missingOptional.length > 0) {
  console.log("Missing optional environment variables:");
  for (const key of missingOptional) {
    console.log(`- ${key}`);
  }
  console.log("These power optional integrations such as Firebase.");
}
