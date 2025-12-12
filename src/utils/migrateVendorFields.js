require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

const uri = process.env.MONGO_URI || 'mongodb+srv://sagarwankhade425_db_user:VEwqfP8kKL060xME@crm12.yaa8wom.mongodb.net/?appName=crm12';

async function migrateVendorFields() {
  try {
    await mongoose.connect(uri);
    console.log('Connected to MongoDB');

    const vendors = await User.find({ role: 'vendor' });
    console.log(`Found ${vendors.length} vendors to migrate`);

    let migrated = 0;
    let skipped = 0;

    for (const vendor of vendors) {
      let needsUpdate = false;
      const updateData = {};

      // Migrate username
      if (!vendor.username && vendor.profile?.username) {
        updateData.username = vendor.profile.username;
        needsUpdate = true;
      }

      // Migrate mobileNumber
      if (!vendor.mobileNumber) {
        const mobile = vendor.profile?.mobileNumber || vendor.profile?.phone || vendor.profile?.mobile;
        if (mobile) {
          updateData.mobileNumber = mobile;
          needsUpdate = true;
        }
      }

      // Migrate whatsappNumber
      if (!vendor.whatsappNumber && vendor.profile?.whatsappNumber) {
        updateData.whatsappNumber = vendor.profile.whatsappNumber;
        needsUpdate = true;
      }

      // Migrate businessName
      if (!vendor.businessName && vendor.profile?.businessName) {
        updateData.businessName = vendor.profile.businessName;
        needsUpdate = true;
      }

      // Migrate businessAddress
      if (!vendor.businessAddress) {
        const address = vendor.profile?.businessAddress || vendor.profile?.address;
        if (address) {
          updateData.businessAddress = address;
          needsUpdate = true;
        }
      }

      // Migrate businessCity
      if (!vendor.businessCity) {
        const city = vendor.profile?.businessCity || vendor.profile?.city;
        if (city) {
          updateData.businessCity = city;
          needsUpdate = true;
        }
      }

      if (needsUpdate) {
        await User.findByIdAndUpdate(vendor._id, updateData);
        console.log(`✓ Migrated vendor: ${vendor.email}`);
        migrated++;
      } else {
        skipped++;
      }
    }

    console.log(`\nMigration complete!`);
    console.log(`- Migrated: ${migrated} vendors`);
    console.log(`- Skipped: ${skipped} vendors (no profile data to migrate)`);

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

migrateVendorFields();

