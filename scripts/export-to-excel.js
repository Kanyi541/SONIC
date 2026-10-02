// This script exports old Firestore documents to Excel files and stores them in Firebase Storage
// instead of deleting them. It is designed to be run in a secure server environment (like a GitHub Action).

const admin = require('firebase-admin');
const XLSX = require('xlsx');
const { Storage } = require('@google-cloud/storage');

// Initialize Firebase Admin SDK
try {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET
  });
} catch (error) {
  if (!/already exists/u.test(error.message)) {
    console.error('Firebase admin initialization error', error.stack);
    process.exit(1);
  }
}

const db = admin.firestore();
const storage = new Storage();
const bucket = storage.bucket(process.env.FIREBASE_STORAGE_BUCKET);

/**
 * Converts Firestore document data to flat object for Excel export
 * @param {object} docData The document data from Firestore
 * @returns {object} Flattened object suitable for Excel
 */
function flattenDocData(docData) {
  const flattened = {};
  
  function flatten(obj, prefix = '') {
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const value = obj[key];
        const newKey = prefix ? `${prefix}.${key}` : key;
        
        if (value && typeof value === 'object' && value.toDate) {
          // Handle Firestore Timestamp
          flattened[newKey] = value.toDate().toISOString();
        } else if (value && typeof value === 'object' && !Array.isArray(value)) {
          // Recursively flatten nested objects
          flatten(value, newKey);
        } else if (Array.isArray(value)) {
          // Convert arrays to string representation
          flattened[newKey] = JSON.stringify(value);
        } else {
          flattened[newKey] = value;
        }
      }
    }
  }
  
  flatten(docData);
  return flattened;
}

/**
 * Creates an Excel file from an array of documents
 * @param {Array} documents Array of document data
 * @param {string} sheetName Name of the Excel sheet
 * @returns {Buffer} Excel file buffer
 */
function createExcelFile(documents, sheetName) {
  const flattenedDocs = documents.map(doc => flattenDocData(doc));
  const worksheet = XLSX.utils.json_to_sheet(flattenedDocs);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
}

/**
 * Uploads Excel file to Firebase Storage
 * @param {Buffer} fileBuffer The Excel file buffer
 * @param {string} fileName The name for the file in storage
 * @returns {Promise<string>} The public URL of the uploaded file
 */
async function uploadToStorage(fileBuffer, fileName) {
  const file = bucket.file(`exports/${fileName}`);
  const stream = file.createWriteStream({
    metadata: {
      contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    },
  });

  return new Promise((resolve, reject) => {
    stream.on('error', reject);
    stream.on('finish', async () => {
      try {
        await file.makePublic();
        const [url] = await file.getSignedUrl({
          action: 'read',
          expires: Date.now() + 365 * 24 * 60 * 60 * 1000, // 1 year
        });
        resolve(url);
      } catch (error) {
        reject(error);
      }
    });
    stream.end(fileBuffer);
  });
}

/**
 * Exports documents to Excel and uploads to storage
 * @param {FirebaseFirestore.Query} query The Firestore query for documents to export
 * @param {string} collectionName The original collection name
 * @param {string} timestampField The field name for date-based filtering
 * @param {number} daysOld Export documents older than this many days
 */
async function exportToExcel(query, collectionName, timestampField, daysOld = 30) {
  try {
    const snapshot = await query.get();
    if (snapshot.empty) {
      console.log(`No documents to export in '${collectionName}' based on the provided query.`);
      return;
    }

    const documents = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Create Excel file
    const excelBuffer = createExcelFile(documents, collectionName);
    
    // Generate filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `${collectionName}_export_${timestamp}.xlsx`;
    
    // Upload to storage
    const fileUrl = await uploadToStorage(excelBuffer, fileName);
    
    console.log(`Successfully exported ${snapshot.size} documents from '${collectionName}' to Excel.`);
    console.log(`File URL: ${fileUrl}`);
    
    // Create export record in Firestore
    const exportRecord = {
      collectionName,
      documentCount: snapshot.size,
      fileUrl,
      fileName,
      exportedAt: admin.firestore.FieldValue.serverTimestamp(),
      daysOld,
      status: 'completed'
    };
    
    await db.collection('exports').add(exportRecord);
    console.log(`Export record saved to Firestore.`);

  } catch (error) {
    console.error(`Error exporting documents from ${collectionName}:`, error);
    
    // Log failed export
    await db.collection('exports').add({
      collectionName,
      error: error.message,
      exportedAt: admin.firestore.FieldValue.serverTimestamp(),
      status: 'failed'
    });
  }
}

/**
 * Exports documents older than specified days
 * @param {string} collectionName The name of the collection to process
 * @param {string} timestampField The name of the field containing the creation timestamp
 * @param {number} daysOld Export documents older than this many days
 */
async function exportOldDocuments(collectionName, timestampField, daysOld = 30) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);
  
  const oldDocsQuery = db.collection(collectionName).where(timestampField, '<', cutoffDate);
  console.log(`Exporting documents in '${collectionName}' older than ${daysOld} days (${cutoffDate.toISOString()}).`);
  await exportToExcel(oldDocsQuery, collectionName, timestampField, daysOld);
}

/**
 * Exports rejected bookings to Excel
 */
async function exportRejectedBookings() {
  const rejectedQuery = db.collection('bookings').where('status', '==', 'Rejected');
  console.log("Exporting rejected bookings...");
  await exportToExcel(rejectedQuery, 'bookings', 'createdAt', 0);
}

/**
 * Main export function
 */
async function runExport() {
  console.log('Starting Excel export process...');
  
  // Export old documents (older than 30 days)
  await exportOldDocuments('bookings', 'createdAt', 30);
  await exportOldDocuments('valuations', 'valuedAt', 30);
  
  // Export rejected bookings (all rejected bookings)
  await exportRejectedBookings();
  
  console.log('Excel export process finished.');
}

/**
 * Export ALL current data (for testing or manual backup)
 */
async function exportAllData() {
  console.log('Starting FULL export of all current data...');
  
  // Export all current bookings (regardless of age)
  const allBookingsQuery = db.collection('bookings');
  await exportToExcel(allBookingsQuery, 'bookings', 'createdAt', 0);
  
  // Export all current valuations (regardless of age)
  const allValuationsQuery = db.collection('valuations');
  await exportToExcel(allValuationsQuery, 'valuations', 'valuedAt', 0);
  
  console.log('Full export process finished.');
}

/**
 * Logs usage statistics
 */
async function logUsage() {
  console.log("\nChecking usage statistics...");
  try {
    const collections = ["bookings", "valuations", "insurers", "valuers", "staff", "exports"];
    for (const col of collections) {
      const snap = await db.collection(col).get();
      console.log(`Firestore - ${col} collection documents count: ${snap.size}`);
    }
  } catch (error) {
    console.error('Error counting Firestore documents:', error);
  }

  try {
    const [files] = await bucket.getFiles({ prefix: 'exports/' });
    let totalSize = files.reduce((acc, file) => acc + (Number(file.metadata.size) || 0), 0);
    console.log(`Firebase Storage - Export files count: ${files.length}`);
    console.log(`Firebase Storage - Total export size: ${(totalSize / (1024 * 1024)).toFixed(2)} MB`);
  } catch (error) {
    console.error('Error calculating Firebase Storage usage:', error);
  }
}

// Run the export process
const exportMode = process.env.EXPORT_MODE || 'scheduled';

if (exportMode === 'full') {
  exportAllData().then(() => logUsage()).catch(error => {
    console.error('Full export process failed:', error);
    process.exit(1);
  });
} else {
  runExport().then(() => logUsage()).catch(error => {
    console.error('Export process failed:', error);
    process.exit(1);
  });
}
