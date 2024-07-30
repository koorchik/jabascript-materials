import crypto from "crypto";

// Generate ECC key pair
const { publicKey, privateKey } = crypto.generateKeyPairSync("ec", {
  namedCurve: "P-256", // Options: 'P-256', 'P-384', 'P-521', etc.
});

const message = "This is a secret message";

const signature = crypto.sign("sha256", Buffer.from(message), {
  key: privateKey,
  dsaEncoding: "der", // Encoding format, can be 'der' or 'ieee-p1363'
});

console.log("Signature:", signature.toString("base64"));

// Verify the signature
const isVerified = crypto.verify(
  "sha256",
  Buffer.from(message),
  {
    key: publicKey,
    dsaEncoding: "der",
  },
  signature
);

console.log("Signature verified:", isVerified);
