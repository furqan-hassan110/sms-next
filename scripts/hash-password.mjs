import bcrypt from "bcryptjs";

const password = "admin123"; // change if needed
const hash = await bcrypt.hash(password, 10);

console.log("Plain:", password);
console.log("Hash:", hash);
