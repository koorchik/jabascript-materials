import crypto from "crypto";

const { publicKey, privateKey } = crypto.generateKeyPairSync("rsa", {
  modulusLength: 2048,
});

const message = "This is a secret message";

const signature = crypto.sign("sha256", Buffer.from(message), {
  key: privateKey,
});

console.log("Signature:", signature.toString("base64"));

const isVerified = crypto.verify(
  "sha256",
  Buffer.from(message),
  {
    key: publicKey,
  },
  signature
);

console.log("Signature verified:", isVerified);
