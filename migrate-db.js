const admin = require('firebase-admin');

// Initialize source project
const sourceApp = admin.initializeApp({
  credential: admin.credential.cert(require('./source-key.json'))
}, 'source');

// Initialize destination project  
const destApp = admin.initializeApp({
  credential: admin.credential.cert(require('./dest-key.json'))
}, 'dest');

const sourceDb = sourceApp.firestore();
const destDb = destApp.firestore();

async function migrateCollection(collectionName) {
  console.log(`Migrating ${collectionName}...`);
  
  const snapshot = await sourceDb.collection(collectionName).get();
  console.log(`Found ${snapshot.docs.length} documents`);
  
  let batch = destDb.batch();
  let count = 0;
  let batchCount = 0;
  
  for (const doc of snapshot.docs) {
    const docRef = destDb.collection(collectionName).doc(doc.id);
    batch.set(docRef, doc.data());
    count++;
    batchCount++;
    
    if (batchCount === 500) {
      await batch.commit();
      console.log(`Committed ${count} documents...`);
      batch = destDb.batch();
      batchCount = 0;
    }
  }
  
  if (batchCount > 0) {
    await batch.commit();
  }
  
  console.log(`✓ Completed ${collectionName}: ${count} documents`);
}

async function migrateAll() {
  // List all your collections here
  const collections = [
    'dev-demo-click-accuracy-test',
    'dev-demo-html-input',
    'dev-demo-html-track',
    'dev-super-resolution-study',
    'dev-super-resolution-study-final',
    'dev-test-audio',
    'dev-tutorial-advanced-react',
    'metadata',
    'prod-super-resolution-study',
    'prod-super-resolution-study-final',
    'prod-super-resolution-study-final-1',
    'prod-super-resolution-study-final-2',
    'prod-test-audio',
    'prod-test-library',
    'user-management'
  ];
  
  for (const collection of collections) {
    await migrateCollection(collection);
  }
  
  console.log('🎉 All done!');
}

migrateAll().catch(console.error);