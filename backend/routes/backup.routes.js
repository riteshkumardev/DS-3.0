import express from "express";
import mongoose from "mongoose";

const router = express.Router();

/**
 * @desc    Export All Collections (Backup)
 * @route   GET /api/backup/export-all
 */
router.get("/export-all", async (req, res) => {
  try {
    const db = mongoose.connection.db;
    
    // Sabhi collections ki list fetch karein
    const collections = await db.listCollections().toArray();
    
    let backupData = {
      project: "Daharasakti",
      exportedAt: new Date().toISOString(),
      collections: {}
    };

    // Har collection ke andar ka data nikaalein
    for (let collection of collections) {
      const name = collection.name;
      
      // MongoDB ki internal collections ko skip karein
      if (name.startsWith('system.')) continue;
      
      const data = await db.collection(name).find({}).toArray();
      backupData.collections[name] = data;
    }

    // Filename setting: Backup_YYYY-MM-DD.json
    const dateStr = new Date().toISOString().split('T')[0];
    const fileName = `Daharasakti_Backup_${dateStr}.json`;

    // Response Headers set karein taaki browser ise download kare
    res.setHeader("Content-disposition", `attachment; filename=${fileName}`);
    res.setHeader("Content-type", "application/json");

    // Prettified JSON bhejein (Indentation: 2)
    return res.status(200).send(JSON.stringify(backupData, null, 2));

  } catch (error) {
    console.error("Backup Export Error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Export failed", 
      error: error.message 
    });
  }
});

/**
 * @desc    Restore All Collections (Import)
 * @route   POST /api/backup/restore
 */
router.post("/restore", async (req, res) => {
  try {
    const { collections } = req.body;

    if (!collections || Object.keys(collections).length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid Backup File: No data found." 
      });
    }

    const db = mongoose.connection.db;

    // Har collection ko loop karke restore karein
    for (const [name, data] of Object.entries(collections)) {
      if (Array.isArray(data) && data.length > 0) {
        
        // Purana data delete karein (Overwrite Logic)
        await db.collection(name).deleteMany({});
        
        // Naya data insert karein
        await db.collection(name).insertMany(data);
        console.log(`✅ Restored ${data.length} records to ${name}`);
      }
    }

    res.status(200).json({ 
      success: true, 
      message: "Database restored successfully! All collections updated. ✅" 
    });

  } catch (error) {
    console.error("Database Restore Error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Restore failed", 
      error: error.message 
    });
  }
});

export default router;