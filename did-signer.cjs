const fs = require("fs");
const crypto = require("crypto");

const keyPath = "/data/data/com.termux/files/home/.keys/did-root.pem";

const file = process.argv[2];

if (!file) {
  console.log("usage: node did-signer.cjs file.json");
  process.exit(1);
}

const data = JSON.parse(fs.readFileSync(file));

// proof kivétel
let proof = data.proof || {};
delete data.proof;

// canonical JSON
const payload = JSON.stringify(data);

// SHA256 hash
const hash = crypto.createHash("sha256").update(payload).digest("hex");

// privát kulcs
const privateKey = fs.readFileSync(keyPath);

// Ed25519 aláírás
const signature = crypto.sign(null, Buffer.from(payload), privateKey);

// proof objektum
proof = {
  type: "Ed25519Signature2020",
  created: new Date().toISOString(),
  verificationMethod: "did:web:identity.nvo987.us#owner",
  proofPurpose: "assertionMethod",
  proofValue: signature.toString("base64"),
  sha256: hash
};

// proof vissza
data.proof = proof;

// mentés
fs.writeFileSync(file, JSON.stringify(data, null, 2));

console.log("Signed:", file);
console.log("SHA256:", hash);
