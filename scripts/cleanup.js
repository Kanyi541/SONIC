
// This script archives old Firestore documents to a new 'archives' collection within Firestore and then deletes them.
// It is designed to be run in a secure server environment (like a GitHub Action).

const admin = require('firebase-admin');
const zlib = require('zlib');

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

/**
 * Compresses a JSON object using gzip.
 * @param {object} jsonData The JSON object to compress.
 * @returns {Promise<Buffer>} A promise that resolves with the compressed data buffer.
 */
function compressData(jsonData) {
    return new Promise((resolve, reject) => {
        zlib.gzip(JSON.stringify(jsonData), (err, buffer) => {
            if (err) return reject(err);
            resolve(buffer);
        });
    });
}

/**
 * Fetches documents older than 30 days, archives them to the 'archives' collection, and then deletes them from the source collection.
 * @param {string} collectionName The name of the collection to process.
 * @param {string} timestampField The name of the field containing the creation timestamp.
 */
async function archiveOldDocuments(collectionName, timestampField) {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const oldDocsQuery = db.collection(collectionName).where(timestampField, '<', thirtyDaysAgo);

  try {
    const snapshot = await oldDocsQuery.get();
    if (snapshot.empty) {
      console.log(`No old documents to archive in '${collectionName}'.`);
      return;
    }

    const batch = db.batch();
    const archiveCollection = db.collection('archives');

    for (const doc of snapshot.docs) {
        const docData = doc.data();
        const compressedData = await compressData(docData);
        
        // Create a new document in the 'archives' collection
        const archiveDocRef = archiveCollection.doc();
        batch.set(archiveDocRef, {
            originalId: doc.id,
            collectionName: collectionName,
            data: compressedData,
            archivedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        // Delete the original document
        batch.delete(doc.ref);
    }
    
    await batch.commit();
    console.log(`Successfully archived and deleted ${snapshot.size} old documents from '${collectionName}'.`);

  } catch (error) {
    console.error(`Error processing old documents from ${collectionName}:`, error);
  }
}

async function runArchival() {
    console.log('Starting Firestore archival process...');
    await archiveOldDocuments('bookings', 'createdAt');
    await archiveOldDocuments('valuations', 'valuedAt');
    console.log('Firestore archival process finished.');
}

async function logUsage() {
  console.log("\nChecking usage statistics...");
  try {
    const collections = ["bookings", "valuations", "insurers", "valuers", "staff", "archives"];
    for (const col of collections) {
      const snap = await db.collection(col).get();
      console.log(`Firestore - ${col} collection documents count: ${snap.size}`);
    }
  } catch (error) {
    console.error('Error counting Firestore documents:', error);
  }

  try {
    const { Storage } = require('@google-cloud/storage');
    const storage = new Storage();
    const bucketName = process.env.FIREBASE_STORAGE_BUCKET;
    
    if (!bucketName) {
      console.log('FIREBASE_STORAGE_BUCKET environment variable not set. Skipping storage usage check.');
      return;
    }

    const [files] = await storage.bucket(bucketName).getFiles();
    let totalSize = files.reduce((acc, file) => acc + (Number(file.metadata.size) || 0), 0);
    console.log(`Firebase Storage - Total usage: ${(totalSize / (1024 * 1024)).toFixed(2)} MB`);
  } catch (error) {
     console.error('Error calculating Firebase Storage usage:', error);
  }
}

runArchival().then(() => logUsage());
