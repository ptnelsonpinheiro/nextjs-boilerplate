import { google } from "googleapis";
import { NextResponse } from "next/server";

// ID do Google Sheet e nome da aba
const SPREADSHEET_ID = "1CZ0XmD3LPRHHXYPR5FOeJbaUfSaRkNi-Hexs3gdnalk";
const SHEET_NAME = "Dados dos Membros";

// Páginas místicas 🌀
const teamUrls: Record<string, string> = {
  Aura: "https://teamaura.carrd.co",
  Kyra: "https://teamkyra.carrd.co",
  Nymara: "https://teamnymara.carrd.co",
  Skura: "https://teamskura.carrd.co",
};

let teamCycle = ["Aura", "Kyra", "Nymara", "Skura"];

// Autenticação com Google
async function getSheetsClient() {
  const auth = new google.auth.GoogleAuth({
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
  const authClient = await auth.getClient();
  return google.sheets({ version: "v4", auth: authClient });
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const nome = searchParams.get("nome") || "Anónimo";
  const sheets = await getSheetsClient();

  // Vai buscar as entradas anteriores
  const read = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET_NAME}!D2:D`,
  });

  const values = read.data.values || [];
  const ultimas = values.slice(-3).map((r) => r[0]);
  const restantes = teamCycle.filter((t) => !ultimas.includes(t));
  const equipa = restantes.length ? restantes[0] : teamCycle[0];

  // Atualiza o ciclo
  teamCycle = teamCycle.filter((t) => t !== equipa);
  if (teamCycle.length === 0) teamCycle = ["Aura", "Kyra", "Nymara", "Skura"];

  // Guarda no Google Sheets
  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET_NAME}!A:D`,
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: [[new Date().toISOString(), nome, "", equipa]],
    },
  });

  // Redirecionamento imediato
  const redirectUrl = teamUrls[equipa] || teamUrls["Aura"];
  return NextResponse.redirect(redirectUrl, 302);
}

