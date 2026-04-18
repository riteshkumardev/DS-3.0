import API from './apiConfig';

/**
 * 📥 FULL SYSTEM BACKUP (JSON)
 * Data recovery aur server migration ke liye use hota hai.
 */
export const downloadFullBackup = () => API.get('/backup/download');

/**
 * 📊 EXCEL REPORT EXPORT
 * Analysis aur auditing ke liye database ko Excel format mein download karta hai.
 * Note: 'blob' response type zaroori hai binary file handle karne ke liye.
 */
export const exportBackupToExcel = () => API.get('/backup/excel', {
    responseType: 'blob' 
});

/**
 * 📤 FULL SYSTEM RESTORE
 * JSON backup file se database ko wapas restore karta hai.
 */
export const restoreSystemData = (backupData) => API.post('/backup/restore', { 
    backupFile: backupData 
});

/**
 * 📈 DATABASE STATISTICS
 * Backup se pehle data health aur record count check karne ke liye.
 */
export const getDatabaseStats = () => API.get('/backup/stats');