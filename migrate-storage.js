// const admin = require('firebase-admin');

// // Initialize both projects
// const sourceApp = admin.initializeApp({
//   credential: admin.credential.cert(require('./source-key.json')),
//   storageBucket: 'super-resolution-evaluat-70ac4.firebasestorage.app' // Updated!
// }, 'source');

// const destApp = admin.initializeApp({
//   credential: admin.credential.cert(require('./dest-key.json')),
//   storageBucket: 'magic-scan-user-studies.firebasestorage.app' // Updated!
// }, 'dest');

// const sourceBucket = sourceApp.storage().bucket();
// const destBucket = destApp.storage().bucket();

// async function copyAllFiles() {
//   console.log('Getting list of files from source...');
  
//   const [files] = await sourceBucket.getFiles();
//   console.log(`Found ${files.length} files to copy`);
  
//   if (files.length === 0) {
//     console.log('✅ No files to migrate!');
//     return;
//   }
  
//   let count = 0;
//   for (const file of files) {
//     console.log(`Copying: ${file.name}`);
//     await sourceBucket.file(file.name).copy(destBucket.file(file.name));
//     count++;
    
//     if (count % 10 === 0) {
//       console.log(`Progress: ${count}/${files.length}`);
//     }
//   }
  
//   console.log(`✅ Done! Copied ${count} files`);
// }

// copyAllFiles().catch(console.error);

const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');
const os = require('os');

// Initialize both projects
const sourceApp = admin.initializeApp({
  credential: admin.credential.cert(require('./source-key.json')),
  storageBucket: 'super-resolution-evaluat-70ac4.firebasestorage.app'
}, 'source');

const destApp = admin.initializeApp({
  credential: admin.credential.cert(require('./dest-key.json')),
  storageBucket: 'magic-scan-user-studies.firebasestorage.app'
}, 'dest');

const sourceBucket = sourceApp.storage().bucket();
const destBucket = destApp.storage().bucket();

async function copyAllFiles() {
  console.log('Getting list of files from source...');
  
  const [files] = await sourceBucket.getFiles();
  console.log(`Found ${files.length} files to copy\n`);
  
  if (files.length === 0) {
    console.log('✅ No files to migrate!');
    return;
  }
  
  const tempDir = path.join(os.tmpdir(), 'firebase-storage-migration');
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }
  
  let count = 0;
  let errors = 0;
  
  for (const file of files) {
    try {
      console.log(`[${count + 1}/${files.length}] Copying: ${file.name}`);
      
      // Download to temp file
      const tempFile = path.join(tempDir, `temp_${count}`);
      await file.download({ destination: tempFile });
      
      // Get only safe metadata (contentType)
      const metadata = {};
      if (file.metadata.contentType) {
        metadata.contentType = file.metadata.contentType;
      }
      
      // Upload to destination with clean metadata
      await destBucket.upload(tempFile, {
        destination: file.name,
        metadata: metadata
      });
      
      // Delete temp file
      fs.unlinkSync(tempFile);
      
      count++;
      
      if (count % 10 === 0) {
        console.log(`✅ Progress: ${count}/${files.length}`);
      }
    } catch (error) {
      errors++;
      console.error(`❌ Error copying ${file.name}:`, error.message);
    }
  }
  
  // Cleanup
  try {
    fs.rmSync(tempDir, { recursive: true, force: true });
  } catch (e) {
    // Ignore cleanup errors
  }
  
  console.log(`\n🎉 Done! Successfully copied ${count}/${files.length} files`);
  if (errors > 0) {
    console.log(`⚠️  ${errors} files had errors`);
  }
}

copyAllFiles().catch(console.error);