import crypto from "crypto";

const data = "This is a secret message";

// Generate a random 256-bit (32 bytes) key for AES
const key = crypto.randomBytes(32); // AES-256
const iv = crypto.randomBytes(16); // Initialization vector

console.log("AES Key:", key.toString("hex"));
console.log("IV:", iv.toString("hex"));

// Encrypt the data
const cipher = crypto.createCipheriv("aes-256-cbc", key, iv);
let encryptedData = cipher.update(data, "utf8", "hex");
encryptedData += cipher.final("hex");

console.log("Encrypted data:", encryptedData);

// Decrypt the data
const decipher = crypto.createDecipheriv("aes-256-cbc", key, iv);
let decryptedData = decipher.update(encryptedData, "hex", "utf8");
decryptedData += decipher.final("utf8");

console.log("Decrypted data:", decryptedData);
