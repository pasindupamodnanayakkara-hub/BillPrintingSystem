/**
 * Service for interacting with Google Sheets API
 */

const SCOPES = 'https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive.file';

/**
 * Appends a bill to a Google Sheet named "Studio_Bills_Backup".
 * If the sheet doesn't exist, it creates one.
 */
export const backupToSheets = async (accessToken, billData) => {
  try {
    // 1. Search for an existing spreadsheet named "Studio_Bills_Backup"
    const searchResponse = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=name='Studio_Bills_Backup' and mimeType='application/vnd.google-apps.spreadsheet' and trashed=false`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );
    const searchData = await searchResponse.json();
    
    let spreadsheetId;
    
    if (searchData.files && searchData.files.length > 0) {
      spreadsheetId = searchData.files[0].id;
    } else {
      // 2. Create a new spreadsheet if not found
      const createResponse = await fetch(
        'https://sheets.googleapis.com/v4/spreadsheets',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            properties: { title: 'Studio_Bills_Backup' },
          }),
        }
      );
      const createData = await createResponse.json();
      spreadsheetId = createData.spreadsheetId;

      // 3. Add Headers to the new sheet
      await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Sheet1!A1:G1?valueInputOption=RAW`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            values: [['Timestamp', 'Invoice #', 'Date', 'Client', 'Subtotal', 'Tax', 'Total']],
          }),
        }
      );
    }

    // 4. Append the current bill data
    const row = [
      new Date().toLocaleString(),
      billData.invoiceNumber,
      billData.invoiceDate,
      billData.clientName,
      billData.subtotal,
      billData.taxAmount,
      billData.total,
    ];

    const appendResponse = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Sheet1!A1:append?valueInputOption=USER_ENTERED`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          values: [row],
        }),
      }
    );

    return await appendResponse.json();
  } catch (error) {
    console.error('Error backing up to Google Sheets:', error);
    throw error;
  }
};
