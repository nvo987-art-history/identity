import { jwtVerify, importJWK } from "jose";

const DID_URL = "https://identity.nvo987.us/.well-known/did.json";
const JWT_URL = "https://identity.nvo987.us/credentials/researcher-v1.jwt";

function base58ToBytes(base58) {
  const alphabet =
    "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";

  let num = BigInt(0);
  for (let char of base58) {
    num = num * BigInt(58) + BigInt(alphabet.indexOf(char));
  }

  const bytes = [];
  while (num > 0) {
    bytes.unshift(Number(num % BigInt(256)));
    num = num / BigInt(256);
  }

  return Uint8Array.from(bytes);
}

function multibaseToJwk(multibaseKey) {
  const base58 = multibaseKey.slice(1); // remove leading 'z'
  let bytes = base58ToBytes(base58);

  // remove multicodec prefix (0xed01 for Ed25519)
  bytes = bytes.slice(2);

  const x = Buffer.from(bytes)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  return {
    kty: "OKP",
    crv: "Ed25519",
    alg: "EdDSA",
    x
  };
}

async function main() {
  try {
    console.log("Fetching DID document...");
    const didRes = await fetch(DID_URL);
    const did = await didRes.json();

    const vm = did.verificationMethod[0];
    const jwk = multibaseToJwk(vm.publicKeyMultibase);

    console.log("Importing public key...");
    const publicKey = await importJWK(jwk, "EdDSA");

    console.log("Fetching JWT...");
    const jwtRes = await fetch(JWT_URL);
    const jwt = await jwtRes.text();

    console.log("Verifying...");
    const { payload } = await jwtVerify(jwt, publicKey);

    console.log("✅ VALID SIGNATURE");
    console.log(payload);

  } catch (err) {
    console.error("❌ VERIFICATION FAILED");
    console.error(err);
  }
}

main();
