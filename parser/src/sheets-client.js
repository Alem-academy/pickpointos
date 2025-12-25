import { google } from 'googleapis';

export const getSheetsClient = async () => {
    const auth = new google.auth.GoogleAuth({
        keyFile: process.env.GOOGLE_APPLICATION_CREDENTIALS,
        scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });

    const client = await auth.getClient();
    const sheets = google.sheets({ version: 'v4', auth: client });

    return sheets;
};

export const getSheetData = async (spreadsheetId, range) => {
    const sheets = await getSheetsClient();
    const response = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range,
    });
    return response.data.values;
};
