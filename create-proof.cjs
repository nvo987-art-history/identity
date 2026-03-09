const fs = require('fs');
const crypto = require('crypto');

const did = 'did:web:identity.nvo987.us';

const payload = {
  issuer: did,
  statement: 'This DID controls this domain.',
  issuedAt: new Date().toISOString()
};

const data = Buffer.from(JSON.stringify(payload));

const privateKey = crypto.createPrivateKey(
  fs.readFileSync(process.env.HOME + '/keys/did-root.pem')
);

const signature = crypto.sign(null, data, privateKey).toString('base64');

const document = {
  ...payload,
  proof: {
    type: 'Ed25519Signature2020',
    created: new Date().toISOString(),
    verificationMethod: 'did:web:identity.nvo987.us#owner',
    proofPurpose: 'assertionMethod',
    proofValue: signature
  }
};

fs.writeFileSync(
  'signed-proof.json',
  JSON.stringify(document, null, 2)
);

console.log('signed-proof.json created');


