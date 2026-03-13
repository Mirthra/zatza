/**
 * One-time script to authorize YouTube access and save a refresh token to .env
 *
 * Run with: npx tsx scripts/get-youtube-token.ts
 */
import "dotenv/config";
import fs from "fs";
import http from "http";
import path from "path";
import { fileURLToPath } from "url";
import { google } from "googleapis";
import open from "open";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const clientFile = path.join(__dirname, "../oauth-client.json");

if (!fs.existsSync(clientFile)) {
  console.error("oauth-client.json not found in backend/");
  process.exit(1);
}

const { installed } = JSON.parse(fs.readFileSync(clientFile, "utf8"));

const oauth2Client = new google.auth.OAuth2(
  installed.client_id,
  installed.client_secret,
  "http://localhost:4242/callback"
);

const SCOPES = ["https://www.googleapis.com/auth/youtube.readonly"];

const authUrl = oauth2Client.generateAuthUrl({
  access_type: "offline",
  scope: SCOPES,
  prompt: "consent", // force refresh_token to be returned
});

// Start a temporary local server to capture the OAuth redirect
const server = http.createServer(async (req, res) => {
  if (!req.url?.startsWith("/callback")) return;

  const code = new URL(req.url, "http://localhost:4242").searchParams.get("code");

  if (!code) {
    res.writeHead(400);
    res.end("No code received.");
    return;
  }

  res.writeHead(200, { "Content-Type": "text/html" });
  res.end("<h2>Authorization successful! You can close this tab.</h2>");

  server.close();

  const { tokens } = await oauth2Client.getToken(code);

  if (!tokens.refresh_token) {
    console.error(
      "\nNo refresh token received. Try revoking access at " +
      "https://myaccount.google.com/permissions and running this script again."
    );
    process.exit(1);
  }

  // Append YOUTUBE_REFRESH_TOKEN to .env
  const envPath = path.join(__dirname, "../.env");
  const existing = fs.readFileSync(envPath, "utf8");

  if (existing.includes("YOUTUBE_REFRESH_TOKEN=")) {
    fs.writeFileSync(
      envPath,
      existing.replace(
        /YOUTUBE_REFRESH_TOKEN=.*/,
        `YOUTUBE_REFRESH_TOKEN=${tokens.refresh_token}`
      )
    );
  } else {
    fs.appendFileSync(envPath, `\nYOUTUBE_REFRESH_TOKEN=${tokens.refresh_token}\n`);
  }

  console.log("\nYOUTUBE_REFRESH_TOKEN saved to .env");
  console.log("You can now run: npx tsx scripts/sync-youtube-subscriptions.ts");
  process.exit(0);
});

server.listen(4242, () => {
  console.log("Opening browser for YouTube authorization...");
  console.log("If it doesn't open automatically, visit:\n", authUrl);
  open(authUrl);
});
