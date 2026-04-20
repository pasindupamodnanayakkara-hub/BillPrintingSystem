/**
 * Service for interacting with Google Drive AppDataFolder
 */

const BACKUP_FILENAME = 'backup.studio.enc';

/**
 * Uploads or updates the encrypted backup file in the hidden appDataFolder
 */
export const uploadEncryptedBackup = async (accessToken, base64Data) => {
  try {
    // 1. Search for existing backup file in appDataFolder
    const searchResponse = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=name='${BACKUP_FILENAME}'&spaces=appDataFolder`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );
    const searchData = await searchResponse.json();
    
    const fileMetadata = {
      name: BACKUP_FILENAME,
      parents: ['appDataFolder'],
    };

    const boundary = 'foo_bar_baz';
    const delimiter = `\r\n--${boundary}\r\n`;
    const closeDelimiter = `\r\n--${boundary}--`;

    const body = 
      delimiter +
      'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
      JSON.stringify(fileMetadata) +
      delimiter +
      'Content-Type: text/plain\r\n\r\n' +
      base64Data +
      closeDelimiter;

    let url = 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart';
    let method = 'POST';

    if (searchData.files && searchData.files.length > 0) {
      // Update existing file
      const fileId = searchData.files[0].id;
      url = `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=multipart`;
      method = 'PATCH';
    }

    const response = await fetch(url, {
      method,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body,
    });

    return await response.json();
  } catch (error) {
    console.error('Error uploading to Google Drive:', error);
    throw error;
  }
};

/**
 * Downloads the encrypted backup file from the hidden appDataFolder
 */
export const downloadEncryptedBackup = async (accessToken) => {
  try {
    const searchResponse = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=name='${BACKUP_FILENAME}'&spaces=appDataFolder`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );
    const searchData = await searchResponse.json();
    
    if (!searchData.files || searchData.files.length === 0) {
      return null;
    }

    const fileId = searchData.files[0].id;
    const downloadResponse = await fetch(
      `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    return await downloadResponse.text();
  } catch (error) {
    console.error('Error downloading from Google Drive:', error);
    throw error;
  }
};

/**
 * Fetches user profile information from Google
 */
export const getUserInfo = async (accessToken) => {
  try {
    const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    return await response.json();
  } catch (error) {
    console.error('Error fetching user info:', error);
    throw error;
  }
};
