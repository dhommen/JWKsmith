import forge from 'node-forge';
import { importX509, exportJWK } from 'jose';

function detectAlgFromCert(cert, kty) {
  if (kty === 'RSA') return 'RS256';
  if (kty === 'EC') {
    try {
      const name = cert.publicKey?.ecparams?.name || cert.publicKey?.curve?.name;
      if (!name) return 'ES256';
      const n = String(name).toLowerCase();
      if (n.includes('384')) return 'ES384';
      if (n.includes('521') || n.includes('512')) return 'ES512';
      return 'ES256';
    } catch {
      return 'ES256';
    }
  }
  return undefined;
}

export function p12ToJwks(p12Buffer, password = '', { kid = 'key-1' } = {}) {
  const p12Asn1 = forge.asn1.fromDer(forge.util.createBuffer(p12Buffer));
  const p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, password);

  // Find certificates
  const bags = p12.getBags({ bagType: forge.pki.oids.certBag });
  const certBags = bags[forge.pki.oids.certBag] || [];
  if (!certBags.length) {
    throw new Error('No certificates found in P12');
  }

  // Choose first certificate (could be improved to pick end-entity)
  const cert = certBags[0].cert;

  // Convert the certificate itself to PEM for importX509
  const certPem = forge.pki.certificateToPem(cert);

  return importX509(certPem)
    .then(async (key) => {
      const jwk = await exportJWK(key);
      jwk.kid = kid;
      jwk.use = 'sig';
      jwk.alg = detectAlgFromCert(cert, jwk.kty) || jwk.alg;

      // Build x5c (base64 DER of the certificate)
      const x509b64 = forge.util.encode64(
        forge.asn1.toDer(forge.pki.certificateToAsn1(cert)).getBytes()
      );
      const x5c = [x509b64];
      return { keys: [{ ...jwk, x5c }] };
    });
}
