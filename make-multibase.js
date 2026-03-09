const bs58 = require('bs58').default;

const pubHex = "0526e35647ef8cf056c845d73090d2f74ec67e2b2ab447ba30644ffaaffafcb5";

// ed01 prefix hozzáadása
const prefixed = "ed01" + pubHex;

const bytes = Buffer.from(prefixed, "hex");
const encoded = bs58.encode(bytes);

console.log("publicKeyMultibase:");
console.log("z" + encoded);
