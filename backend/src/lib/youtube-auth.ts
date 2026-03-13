/**
 * Creates an authenticated YouTube OAuth2 client.
 * In production (Railway): reads credentials from environment variables.
 * In development: falls back to oauth-client.json if env vars are absent.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { google } from "googleapis";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function getClientCredentials(): { clientId: string; clientSecret: string } {
  // Production: credentials come from env vars
  if (process.env.YOUTUBE_CLIENT_ID && process.env.YOUTUBE_CLIENT_SECRET) {
    return {
      clientId: process.env.YOUTUBE_CLIENT_ID,
      clientSecret: process.env.YOUTUBE_CLIENT_SECRET,
    };
  }

  // Development: fall back to oauth-client.json
  const clientFile = path.join(__dirname, "../../oauth-client.json");
  if (fs.existsSync(clientFile)) {
    const { installed } = JSON.parse(fs.readFileSync(clientFile, "utf8"));
    return { clientId: installed.client_id, clientSecret: installed.client_secret };
  }

  throw new Error(
    "YouTube credentials missing. Set YOUTUBE_CLIENT_ID and YOUTUBE_CLIENT_SECRET env vars."
  );
}

export function createYouTubeClient() {
  const { clientId, clientSecret } = getClientCredentials();

  const oauth2Client = new google.auth.OAuth2(
    clientId,
    clientSecret,
    "http://localhost:4242/callback"
  );

  oauth2Client.setCredentials({
    refresh_token: process.env.YOUTUBE_REFRESH_TOKEN,
  });

  return google.youtube({ version: "v3", auth: oauth2Client });
}
