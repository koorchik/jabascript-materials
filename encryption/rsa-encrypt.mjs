import crypto from "crypto";

const { publicKey, privateKey } = crypto.generateKeyPairSync("rsa", {
  modulusLength: 2048,
});

const data = "This is a secret message";

const encryptedData = crypto.publicEncrypt(publicKey, Buffer.from(data));

console.log("Encrypted data:", encryptedData.toString("base64"));

const decryptedData = crypto.privateDecrypt(privateKey, encryptedData);

console.log("Decrypted data:", decryptedData.toString());
