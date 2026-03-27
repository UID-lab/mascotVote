import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { google } from "googleapis";
import fs from "fs";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 4000;
const SPREADSHEET_ID =
  process.env.SPREADSHEET_ID ||
  "1htUg12zfrRszYrJBbeS71aSAAp16v3X6qsDeeW6A9sw";
const SHEET_NAME = process.env.SHEET_NAME || null;
const SHEETS_DISABLED = process.env.SHEETS_DISABLED === "true";

const defaultMascots = [
  { id: "mascot1", name: "Mascot 1" },
  { id: "mascot2", name: "Mascot 2" },
  { id: "mascot3", name: "Mascot 3" },
  { id: "mascot4", name: "Mascot 4" },
  { id: "mascot5", name: "Mascot 5" }
];

const memStore = new Map(defaultMascots.map((m) => [m.id, 0]));

async function getSheetsClient() {
  const auth = new google.auth.GoogleAuth({
    scopes: ["https://www.googleapis.com/auth/spreadsheets"]
  });
  const client = await auth.getClient();
  return google.sheets({ version: "v4", auth: client });
}

function normalizeName(idOrName) {
  return idOrName;
}

let SHEET_TITLE_CACHE = null;
async function getSheetTitle() {
  if (SHEET_NAME) return SHEET_NAME;
  if (SHEET_TITLE_CACHE) return SHEET_TITLE_CACHE;
  const sheets = await getSheetsClient();
  const meta = await sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID });
  const title =
    (meta.data.sheets && meta.data.sheets[0] && meta.data.sheets[0].properties && meta.data.sheets[0].properties.title) ||
    "Sheet1";
  SHEET_TITLE_CACHE = title;
  return title;
}

async function getVotesFromSheets() {
  const sheets = await getSheetsClient();
  const title = await getSheetTitle();
  const range = `${title}!A2:B`;
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range
  });
  const rows = res.data.values || [];
  const votes = {};
  for (const row of rows) {
    const name = (row[0] || "").trim();
    const count = Number(row[1] || 0);
    if (name) votes[name] = count;
  }
  return votes;
}

async function setVoteInSheets(mascotId) {
  const sheets = await getSheetsClient();
  const title = await getSheetTitle();
  const range = `${title}!A2:B`;
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range
  });
  const rows = res.data.values || [];
  const names = rows.map((r) => (r[0] || "").trim());
  const idx = names.findIndex((n) => n === mascotId);
  if (idx === -1) {
    const newRow = [[mascotId, 1]];
    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: `${title}!A:B`,
      valueInputOption: "RAW",
      requestBody: { values: newRow }
    });
  } else {
    const current = Number(rows[idx][1] || 0);
    const newCount = current + 1;
    const updateRange = `${title}!B${idx + 2}`;
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: updateRange,
      valueInputOption: "RAW",
      requestBody: { values: [[newCount]] }
    });
  }
  const updated = await getVotesFromSheets();
  return updated;
}

app.get("/api/votes", async (req, res) => {
  try {
    if (SHEETS_DISABLED) {
      const out = {};
      for (const [k, v] of memStore.entries()) out[k] = v;
      return res.json(out);
    }
    const votes = await getVotesFromSheets();
    return res.json(votes);
  } catch (e) {
    return res.status(500).json({ error: e && e.message ? e.message : "Failed to fetch votes" });
  }
});

app.post("/api/vote", async (req, res) => {
  try {
    const { mascotId } = req.body || {};
    if (!mascotId) return res.status(400).json({ error: "mascotId required" });
    if (SHEETS_DISABLED) {
      const key = normalizeName(mascotId);
      const curr = memStore.get(key) || 0;
      memStore.set(key, curr + 1);
      const out = {};
      for (const [k, v] of memStore.entries()) out[k] = v;
      return res.json(out);
    }
    const updated = await setVoteInSheets(normalizeName(mascotId));
    return res.json(updated);
  } catch (e) {
    return res.status(500).json({ error: e && e.message ? e.message : "Failed to cast vote" });
  }
});

app.get("/api/health", async (req, res) => {
  try {
    const authPath = process.env.GOOGLE_APPLICATION_CREDENTIALS || "";
    const authConfigured = Boolean(authPath && fs.existsSync(authPath));
    const sheetTitle = SHEETS_DISABLED ? null : await getSheetTitle();
    return res.json({
      sheetsDisabled: SHEETS_DISABLED,
      spreadsheetId: SPREADSHEET_ID,
      resolvedSheetName: sheetTitle,
      authConfigured
    });
  } catch (e) {
    return res.status(500).json({ error: e && e.message ? e.message : "Health check failed" });
  }
});

function start(port, retries = 10) {
  const server = app.listen(port, () => {
    console.log(`Server listening on ${port}`);
  });
  server.on("error", (err) => {
    if (err && err.code === "EADDRINUSE" && retries > 0) {
      const next = Number(port) + 1;
      start(next, retries - 1);
    } else {
      throw err;
    }
  });
}

start(PORT);
