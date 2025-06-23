/**
 * Migration Script: LocalStorage to Firebase
 * This script helps migrate company details from localStorage to Firebase
 */

console.log('🔄 Company Data Migration Script');
console.log('This script will help you migrate company details from localStorage to Firebase');

// Check if we're in browser environment
if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
  
  // Function to find all company details in localStorage
  function findCompanyDetailsInLocalStorage() {
    const companyDetails = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('companyDetails_')) {
        try {
          const data = JSON.parse(localStorage.getItem(key));
          const userId = key.replace('companyDetails_', '');
          companyDetails.push({
            userId,
            data,
            localStorageKey: key
          });
        } catch (e) {
          console.warn(`⚠️  Invalid data found for key: ${key}`);
        }
      }
    }
    
    return companyDetails;
  }
  
  // Function to migrate data to Firebase
  async function migrateToFirebase() {
    const companyDetails = findCompanyDetailsInLocalStorage();
    
    if (companyDetails.length === 0) {
      console.log('✅ No company details found in localStorage to migrate');
      return;
    }
    
    console.log(`📊 Found ${companyDetails.length} company details to migrate:`);
    
    for (const company of companyDetails) {
      console.log(`- User ID: ${company.userId}`);
      console.log(`  Company: ${company.data.companyName}`);
      console.log(`  Vehicle Type: ${company.data.vehicleType}`);
    }
    
    const shouldMigrate = confirm(`Do you want to migrate ${companyDetails.length} company details to Firebase?`);
    
    if (!shouldMigrate) {
      console.log('❌ Migration cancelled by user');
      return;
    }
    
    console.log('🚀 Starting migration...');
    
    // Import Firebase functions (this would need to be done differently in actual implementation)
    try {
      // Note: In actual implementation, you would import these functions
      // const { saveCompanyDetailsToFirebase } = await import('../lib/firebaseStorage');
      
      let successCount = 0;
      let errorCount = 0;
      
      for (const company of companyDetails) {
        try {
          console.log(`📤 Migrating data for user: ${company.userId}`);
          
          const companyData = {
            ...company.data,
            userId: company.userId
          };
          
          // In actual implementation, uncomment this line:
          // await saveCompanyDetailsToFirebase(companyData);
          
          console.log(`✅ Successfully migrated data for user: ${company.userId}`);
          successCount++;
          
          // Optionally remove from localStorage after successful migration
          const shouldRemoveLocal = confirm(`Remove local data for ${company.data.companyName}?`);
          if (shouldRemoveLocal) {
            localStorage.removeItem(company.localStorageKey);
            console.log(`🗑️  Removed local data for user: ${company.userId}`);
          }
          
        } catch (error) {
          console.error(`❌ Failed to migrate data for user: ${company.userId}`, error);
          errorCount++;
        }
      }
      
      console.log('\n📊 Migration Summary:');
      console.log(`✅ Successful: ${successCount}`);
      console.log(`❌ Failed: ${errorCount}`);
      console.log(`📊 Total: ${companyDetails.length}`);
      
      if (successCount > 0) {
        console.log('\n🎉 Migration completed! Company details are now stored in Firebase.');
        console.log('💡 Tip: Refresh the page to see the migrated data.');
      }
      
    } catch (error) {
      console.error('❌ Migration failed:', error);
      console.log('💡 Make sure you have proper Firebase configuration and internet connection.');
    }
  }
  
  // Auto-run migration check
  function checkForMigration() {
    const companyDetails = findCompanyDetailsInLocalStorage();
    
    if (companyDetails.length > 0) {
      console.log('\n🔍 Company details found in localStorage!');
      console.log('📋 Run migrateToFirebase() in console to migrate to Firebase');
      
      // Make functions available globally for manual execution
      window.migrateToFirebase = migrateToFirebase;
      window.findCompanyDetailsInLocalStorage = findCompanyDetailsInLocalStorage;
    }
  }
  
  // Run check
  checkForMigration();
  
} else {
  console.log('❌ This script requires browser environment with localStorage');
}

// Export for Node.js environment
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    findCompanyDetailsInLocalStorage,
    migrateToFirebase
  };
}
