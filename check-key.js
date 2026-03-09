import fs from "fs";
import bs58 from "bs58";
import crypto from "crypto";

const expected = "z6MkeoNUc26pZxNwVnjTZY5R1SW3zF7Uu6F2eNq8kBz2qbHW";

const pem = fs.readFileSync(process.env.HOME + "/.keys/did-root.pem", "utf8");

// PEM → DER
const der = Buffer.from(
  pem
    .replace("-----BEGIN PRIVATE KEY-----", "")
    .replace("-----END PRIVATE KEY-----", "")
    .replace(/\n/g, ""),
  "base64"
);

// PKCS8 Ed25519 seed az utolsó 32 byte
const seed = der.slice(-32);

// privát kulcs objektum
const privateKey = crypto.createPrivateKey({
  key: der,
  format: "der",
  type: "pkcs8"
});

// publikus kulcs generálása
const publicKey = crypto.createPublicKey(privateKey);
const publicKeyBytes = publicKey.export({
  format: "der",
  type: "spki"
}).slice(-32);

// multicodec prefix
const prefixed = Buffer.concat([
  Buffer.from([0xed, 0x01]),
  publicKeyBytes
]);

const multibase = "z" + bs58.encode(prefixed);

console.log("Generált:", multibase);
console.log("Elvárt :", expected);
console.log("Egyezik:", multibase === expected);
