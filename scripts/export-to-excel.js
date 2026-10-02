// This script exports old Firestore documents to Excel files and stores them in GitHub Releases
// instead of deleting them. It is designed to be run in a secure server environment (like a GitHub Action).

const admin = require('firebase-admin');
const XLSX = require('xlsx');
const { Octokit } = require('@octokit/rest');

// Initialize Firebase Admin SDK
try {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
} catch (error) {
  if (!/already exists/u.test(error.message)) {
    console.error('Firebase admin initialization error', error.stack);
    process.exit(1);
  }
}

const db = admin.firestore();

// Initialize GitHub client
const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});

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
 * Uploads Excel file to GitHub Releases
 * @param {Buffer} fileBuffer The Excel file buffer
 * @param {string} fileName The name for the file
 * @returns {Promise<string>} The download URL of the uploaded file
 */
async function uploadToGitHubRelease(fileBuffer, fileName) {
  const owner = process.env.GITHUB_REPOSITORY_OWNER || 'Kanyi541';
  const repo = process.env.GITHUB_REPOSITORY_NAME || 'SONIC';
  const releaseTag = `data-export-${new Date().toISOString().split('T')[0]}`;

  try {
    // Check if release exists
    let release;
    try {
      release = await octokit.rest.repos.getReleaseByTag({
        owner,
        repo,
        tag: releaseTag,
      });
      console.log(`Found existing release: ${releaseTag}`);
    } catch (error) {
      // Release doesn't exist, create it
      console.log(`Creating new release: ${releaseTag}`);
      release = await octokit.rest.repos.createRelease({
        owner,
        repo,
        tag_name: releaseTag,
        name: `Data Export - ${new Date().toISOString().split('T')[0]}`,
        body: `Automated data export for ${new Date().toISOString().split('T')[0]}`,
        draft: false,
        prerelease: false,
      });
    }

    // Upload the file as a release asset
    console.log(`Uploading ${fileName} to GitHub Release...`);
    const uploadResponse = await octokit.rest.repos.uploadReleaseAsset({
      owner,
      repo,
      release_id: release.data.id,
      name: fileName,
      data: fileBuffer,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Length': fileBuffer.length,
      },
    });

    console.log(`✓ File uploaded successfully: ${uploadResponse.data.browser_download_url}`);
    return uploadResponse.data.browser_download_url;
  } catch (error) {
    console.error('Error uploading to GitHub Release:', error);
    throw error;
  }
}

/**
 * Exports documents to Excel and uploads to GitHub Releases
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
    
    // Upload to GitHub Releases
    const fileUrl = await uploadToGitHubRelease(excelBuffer, fileName);
    
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
      status: 'completed',
      storageType: 'github-releases'
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
      status: 'failed',
      storageType: 'github-releases'
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

  console.log("Excel files are stored in GitHub Releases (free storage).");
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
