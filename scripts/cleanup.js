
// This script is designed to be run in a secure server environment (like a GitHub Action), not in a browser.
// It uses the Firebase Admin SDK to delete old documents from Firestore.

const admin = require('firebase-admin');

try {
  // This environment variable will be populated by the GitHub secret.
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);

  // Initialize the Firebase Admin SDK.
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
 * Deletes documents from a specified collection that are older than 30 days.
 * @param {string} collectionName The name of the collection to clean up.
 * @param {string} timestampField The name of the field containing the creation timestamp.
 */
async function deleteOldDocuments(collectionName, timestampField) {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const oldDocsQuery = db.collection(collectionName).where(timestampField, '<', thirtyDaysAgo);

  try {
    const snapshot = await oldDocsQuery.get();
    if (snapshot.empty) {
      console.log(`No old documents to delete in '${collectionName}'.`);
      return;
    }

    const batch = db.batch();
    snapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });

    await batch.commit();
    console.log(`Successfully deleted ${snapshot.size} old documents from '${collectionName}'.`);
  } catch (error) {
    console.error(`Error deleting old documents from ${collectionName}:`, error);
  }
}

async function runCleanup() {
    console.log('Starting Firestore cleanup...');
    // Clean up bookings collection
    await deleteOldDocuments('bookings', 'createdAt');
    // Clean up valuations collection
    await deleteOldDocuments('valuations', 'valuedAt');
    console.log('Firestore cleanup finished.');
}

async function logUsage() {
  console.log("\nChecking usage statistics...");

  try {
    // Count docs in collections
    const bookingsSnap = await db.collection("bookings").get();
    console.log(`Firestore - Bookings collection documents count: ${bookingsSnap.size}`);

    const valuationsSnap = await db.collection("valuations").get();
    console.log(`Firestore - Valuations collection documents count: ${valuationsSnap.size}`);

    const insurersSnap = await db.collection("insurers").get();
    console.log(`Firestore - Insurers collection documents count: ${insurersSnap.size}`);

    const valuersSnap = await db.collection("valuers").get();
    console.log(`Firestore - Valuers collection documents count: ${valuersSnap.size}`);
  } catch (error) {
    console.error('Error counting Firestore documents:', error);
  }

  try {
    // Check Storage usage
    const { Storage } = require('@google-cloud/storage');
    const storage = new Storage();
    const bucketName = process.env.FIREBASE_STORAGE_BUCKET;
    
    if (!bucketName) {
      console.log('FIREBASE_STORAGE_BUCKET environment variable not set. Skipping storage usage check.');
      return;
    }

    const [files] = await storage.bucket(bucketName).getFiles();

    let totalSize = 0;
    files.forEach(file => totalSize += file.metadata.size ? Number(file.metadata.size) : 0);

    console.log(`Firebase Storage - Total usage: ${(totalSize / (1024 * 1024)).toFixed(2)} MB`);
  } catch (error) {
     console.error('Error calculating Firebase Storage usage:', error);
  }
}


runCleanup().then(() => logUsage());
