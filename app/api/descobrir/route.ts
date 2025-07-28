import { google } from 'googleapis';
import { NextResponse } from 'next/server';

// Links reais das equipas da NewPlan
const TEAM_PAGES: Record<string, string> = {
  Aura: 'https://teamaura.carrd.co',
  Kyra: 'https://teamkyra.carrd.co',
  Nymara: 'https://teamnymara.carrd.co',
  Skura: 'https://teamskura.carrd.co',
};

const SHEET_ID = '1CZ0XmD3LPRHHXYPR5FOeJbaUfSaRkNi-Hexs3gdnalk';
const SHEET_NAME = 'Dados dos Membros';

export async function GET() {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_CLIENT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  const sheets = google.sheets({ version: 'v4', auth });

  // Lê dados atuais da folha
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: `${SHEET_NAME}!D2:D`, // Coluna D = equipa atribuída
  });

  const rows = res.data.values || [];
  const last3 = rows.slice(-3).map(r => r[0]); // últimas 3 equipas

  const teams = ['Aura', 'Kyra', 'Nymara', 'Skura'];
  const available = teams.filter(t => !last3.includes(t));
  const nextTeam = available[0] || teams[Math.floor(Math.random() * 4)];

  // Regista a nova linha (só coluna D com equipa)
  const now = new Date().toLocaleString('pt-PT');
  await sheets.spreadsheets.values.append({
    spreadsheetId: SHEET_ID,
    range: `${SHEET_NAME}!A:D`,
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [[now, '', '', nextTeam]], // A = data/hora, B = nome (vazio), D = equipa
    },
  });

  return NextResponse.redirect(TEAM_PAGES[nextTeam], 302);
}
