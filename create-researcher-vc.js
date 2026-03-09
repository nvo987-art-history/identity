import { SignJWT, importPKCS8 } from 'jose'
import fs from 'fs'

const privateKeyPem = fs.readFileSync(
  '/data/data/com.termux/files/home/.keys/did-root.pem',
  'utf8'
)

const privateKey = await importPKCS8(privateKeyPem, 'EdDSA')

const now = Math.floor(Date.now() / 1000)

const payload = {
  iss: 'did:web:identity.nvo987.us',
  sub: 'did:web:identity.nvo987.us',
  nbf: now,
  vc: {
    "@context": [
      "https://www.w3.org/2018/credentials/v1"
    ],
    "type": [
      "VerifiableCredential",
      "ResearcherCredential"
    ],
    "credentialSubject": {
      "id": "did:web:identity.nvo987.us",
      "sameAs": [
        "https://orcid.org/0009-0007-4628-1871",
        "https://isni.org/isni/0000000529640885",
        "https://www.wikidata.org/wiki/Q137675227",
        "https://nvo987.us",
        "https://mastodon.social/@nvo987",
        "https://bluesky.nvo987.us",
        "https://identity.nvo987.us",
        "https://identity.nvo987.us/research/color-generative-principle",
        "https://knowledge.nvo987.us"
      ]
    }
  }
}

const jwt = await new SignJWT(payload)
  .setProtectedHeader({
    alg: 'EdDSA',
    kid: 'did:web:identity.nvo987.us#owner'
  })
  .sign(privateKey)

fs.mkdirSync('./credentials', { recursive: true })
fs.writeFileSync('./credentials/researcher-v1.jwt', jwt)

console.log('✅ Researcher VC created:')
console.log(jwt)
