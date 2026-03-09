import fs from "fs";
import { SignJWT, importPKCS8 } from "jose";

const did = "did:web:identity.nvo987.us";
const origin = "https://identity.nvo987.us";

const privateKeyPem = fs.readFileSync(
  process.env.HOME + "/.keys/did-root.pem",
  "utf8"
);

const privateKey = await importPKCS8(privateKeyPem, "EdDSA");

const payload = {
  "@context": ["https://www.w3.org/2018/credentials/v1"],
  type: ["VerifiableCredential", "DomainLinkageCredential"],
  issuer: did,
  issuanceDate: new Date().toISOString(),
  credentialSubject: {
    id: did,
    origin: origin
  }
};

const jws = await new SignJWT(payload)
  .setProtectedHeader({
    alg: "EdDSA",
    kid: did + "#owner"
  })
  .sign(privateKey);

const didConfig = {
  "@context": "https://identity.foundation/.well-known/did-configuration/v1",
  linked_dids: [jws]
};

fs.mkdirSync("./.well-known", { recursive: true });

fs.writeFileSync(
  "./.well-known/did-configuration.json",
  JSON.stringify(didConfig, null, 2)
);

console.log("OK");
