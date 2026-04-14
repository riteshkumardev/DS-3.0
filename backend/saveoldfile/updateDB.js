// Database connection setup (Optional if running directly in Mongosh)
// db = db.getSiblingDB('your_database_name'); 

db.sales.updateMany({}, [
  {
    $set: {
      goods: {
        $map: {
          input: "$goods",
          as: "g",
          in: {
            $mergeObjects: [
              "$$g",
              {
                hsn: {
                  $switch: {
                    branches: [
                      // 1. CORN GRIT (Includes 3mm and other variations)
                      { 
                        case: { $regexMatch: { input: "$$g.product", regex: /CORN GRIT|TUKDI|GREET/i } }, 
                        then: "11031300" 
                      },
                      // 2. CORN FLOUR
                      { 
                        case: { $regexMatch: { input: "$$g.product", regex: /CORN FLOUR/i } }, 
                        then: "11021000" 
                      },
                      // 3. CATTLE FEED / BRAN
                      { 
                        case: { $regexMatch: { input: "$$g.product", regex: /CATTLE FEED|BRAN/i } }, 
                        then: "2309" 
                      },
                      // 4. RICE GRIT
                      { 
                        case: { $regexMatch: { input: "$$g.product", regex: /RICE GRIT/i } }, 
                        then: "11031900" 
                      },
                      // 5. RICE FLOUR
                      { 
                        case: { $regexMatch: { input: "$$g.product", regex: /RICE FLOUR|AATARICE/i } }, 
                        then: "11021000" 
                      },
                      // 6. BROKEN / KHUDDI
                      { 
                        case: { $regexMatch: { input: "$$g.product", regex: /BROKEN|KHUDDI/i } }, 
                        then: "10064000" 
                      },
                      // 7. PACKING / BAG
                      { 
                        case: { $regexMatch: { input: "$$g.product", regex: /PACKING|BAG/i } }, 
                        then: "3923" 
                      },
                      // 8. PURE CORN (Exactly "CORN")
                      { 
                        case: { $regexMatch: { input: "$$g.product", regex: /^CORN$/i } }, 
                        then: "10051900" 
                      }
                    ],
                    // Agar koi match na kare toh ye default HSN jayega
                    default: "1008" 
                  }
                }
              }
            ]
          }
        }
      }
    }
  }
]);

print("HSN Codes updated successfully for all products!");