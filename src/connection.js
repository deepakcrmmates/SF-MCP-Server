import jsforce from "jsforce";
import fs from "fs";
import crypto from "crypto";

let connection = null;

export const API_VERSION = process.env.SF_API_VERSION || "59.0";

export async function getConnection() {
  if (connection) return connection;

  const loginUrl = process.env.SF_LOGIN_URL || "https://login.salesforce.com";

  // ── JWT Bearer Flow ──────────────────────────────────────────────────────
  if (process.env.SF_CLIENT_ID && process.env.SF_PRIVATE_KEY_PATH) {
    const privateKey = fs.readFileSync(process.env.SF_PRIVATE_KEY_PATH, "utf8");
    const assertion  = buildJwt(
      process.env.SF_CLIENT_ID,
      process.env.SF_USERNAME,
      loginUrl,
      privateKey
    );

    // Use jsforce v1 OAuth2 token endpoint directly
    const conn = new jsforce.Connection({ loginUrl, version: API_VERSION });
    const tokenUrl = `${loginUrl}/services/oauth2/token`;
    const params   = new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    });
    const resp = await fetch(tokenUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
    });
    const token = await resp.json();
    if (!token.access_token) throw new Error(`JWT auth failed: ${JSON.stringify(token)}`);

    conn.initialize({ accessToken: token.access_token, instanceUrl: token.instance_url });
    connection = conn;
    console.error("✅ Salesforce connected via JWT Bearer Flow");
    return connection;
  }

  // ── Username/Password Flow ────────────────────────────────────────────────
  if (process.env.SF_USERNAME && process.env.SF_PASSWORD) {
    connection = new jsforce.Connection({ loginUrl, version: API_VERSION });
    const password = process.env.SF_PASSWORD + (process.env.SF_SECURITY_TOKEN || "");
    await connection.login(process.env.SF_USERNAME, password);
    console.error(`✅ Salesforce connected as ${process.env.SF_USERNAME}`);
    return connection;
  }

  throw new Error(
    "No Salesforce credentials found. Set SF_USERNAME + SF_PASSWORD (+ SF_SECURITY_TOKEN) in .env"
  );
}

export function resetConnection() {
  connection = null;
}

// ── JWT builder (RS256) ───────────────────────────────────────────────────────
function buildJwt(clientId, username, audience, privateKey) {
  const header  = b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const now     = Math.floor(Date.now() / 1000);
  const payload = b64url(JSON.stringify({
    iss: clientId,
    sub: username,
    aud: audience,
    exp: now + 300,
  }));
  const signing = `${header}.${payload}`;
  const sign    = crypto.createSign("SHA256");
  sign.update(signing);
  const sig = sign.sign(privateKey, "base64url");
  return `${signing}.${sig}`;
}

function b64url(str) {
  return Buffer.from(str).toString("base64url");
}
