
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

runCleanup();
