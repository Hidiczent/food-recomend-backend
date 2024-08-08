const express = require('express');
const { loadExcelData, advancedSearch, addImageUrls } = require('../services/excelService');

const router = express.Router();
const filePath = 'data/data.xlsx';
const imageFolder = 'images';

// Load data from Excel file
const { sheet1, sheet2, sheet3 } = loadExcelData(filePath);

// ฟังก์ชันคำนวณคะแนนรวมของร้านอาหารแต่ละร้าน
const calculateRestaurantScores = (data) => {
  const restaurantScores = {};

  data.forEach(item => {
    Object.keys(item).forEach(key => {
      if (key.startsWith('ຮ້ານ')) {
        if (!restaurantScores[key]) {
          restaurantScores[key] = 0;
        }
        restaurantScores[key] += parseFloat(item['ຄະແນນ']) || 0;
      }
    });
  });

  return restaurantScores;
};

// Route to get top rated restaurants
router.get('/topRatedRestaurants', (req, res) => {
  try {
    const restaurantScores = calculateRestaurantScores(sheet1);

    // เรียงลำดับร้านอาหารตามคะแนนรวมจากมากไปน้อย
    const sortedRestaurants = Object.entries(restaurantScores)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3) // เลือกเพียง 3 ร้านที่มีคะแนนสูงสุด
      .map(entry => ({ restaurantName: entry[0], score: entry[1] }));

    res.json(sortedRestaurants);
  } catch (error) {
    console.error(error);
    res.status(500).send('Failed to load top rated restaurants');
  }
});

// Route to get data from sheet1 with optional filtering by categories and other conditions
router.get('/sheet1', (req, res) => {
  const categories = req.query.categories ? req.query.categories.split(',') : [];
  const conditions = { ...req.query };
  delete conditions.categories;
  console.log('Request query parameters:', req.query);

  let filteredData = advancedSearch(sheet1, conditions, categories);
  filteredData = addImageUrls(filteredData, imageFolder);
  res.json(filteredData);
});

// Route to get data from sheet3 for food details
router.get('/foodDetail', (req, res) => {
  const foodName = req.query.foodName;
  console.log(`Fetching details for food: ${foodName}`);
  
  const detail = sheet1.find(item => item['ລາຍການອາຫານ'] === foodName);
  if (detail) {
    console.log(`Found food details for: ${foodName}`);
    // Get restaurant details from sheet3
    const restaurantDetails = Object.keys(detail)
      .filter(key => key.startsWith('ຮ້ານ') && detail[key] === 1)
      .map(key => {
        const restaurantInfo = sheet3.find(item => item['ຊື່ຮ້ານ'] === key);
        return {
          restaurant: key,
          address: restaurantInfo ? restaurantInfo['address'] : 'N/A',
          maplink: restaurantInfo ? restaurantInfo['Maplink'] : 'N/A'
        };
      });

    res.json({
      ...detail,
      restaurantDetails
    });
  } else {
    console.error(`No details found for food: ${foodName}`);
    res.status(404).json({ error: 'No details found' });
  }
});

// Route to get menu items for a restaurant from sheet1
router.get('/restaurantMenu', (req, res) => {
  const restaurantName = req.query.restaurantName;
  console.log(`Fetching menu for restaurant: ${restaurantName}`);

  // Extract restaurant names from sheet1
  const restaurantNames = new Set();
  sheet1.forEach(item => {
    Object.keys(item).forEach(key => {
      if (key.startsWith('ຮ້ານ') && item[key] === 1) {
        restaurantNames.add(key);
      }
    });
  });

  console.log('Restaurant names in sheet1:', Array.from(restaurantNames));

  let foundRestaurant = false;

  // Use localeCompare for a more robust comparison with trimming and normalization
  Array.from(restaurantNames).forEach(name => {
    console.log(`Comparing "${name.trim()}" with "${restaurantName.trim()}"`);
    if (name.trim().normalize() === restaurantName.trim().normalize()) {
      foundRestaurant = true;
    }
  });

  if (!foundRestaurant) {
    console.error(`Restaurant not found: ${restaurantName}`);
    return res.status(404).json({ error: 'Restaurant not found' });
  }

  // Get menu items for the restaurant from sheet1
  const menuItems = sheet1.filter(item => {
    const restaurantKeys = Object.keys(item).filter(key => key.startsWith('ຮ້ານ') && item[key] === 1);
    return restaurantKeys.some(key => key.trim().normalize() === restaurantName.trim().normalize());
  });

  if (menuItems.length > 0) {
    console.log(`Found ${menuItems.length} menu items for restaurant: ${restaurantName}`);
    res.json(menuItems);
  } else {
    console.error(`No menu found for restaurant: ${restaurantName}`);
    res.status(404).json({ error: 'No menu found for this restaurant' });
  }
});

module.exports = router;
