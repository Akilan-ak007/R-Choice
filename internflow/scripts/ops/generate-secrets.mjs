import { randomBytes } from "node:crypto";

function generateSecret(size = 32) {
  return randomBytes(size).toString("base64url");
}

console.log("AUTH_SECRET=" + generateSecret());
console.log("CRON_SECRET=" + generateSecret());
