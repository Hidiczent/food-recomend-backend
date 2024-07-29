const xlsx = require('xlsx');
const path = require('path');

// Load Excel data from the given file path
const loadExcelData = (filePath) => {
  const workbook = xlsx.readFile(filePath);
  const sheet1 = xlsx.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
  const sheet2 = xlsx.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[1]]);
  const sheet3 = xlsx.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[2]]);

  return { sheet1, sheet2, sheet3 };
};

// Advanced search function to filter data based on multiple conditions including categories
const advancedSearch = (data, conditions, categories) => {
  const filteredData = data.filter(item => {
    const conditionsMet = Object.keys(conditions).every(key => {
      if (key in item) {
        if (typeof item[key] === 'string') {
          return item[key].includes(conditions[key]);
        } else {
          return item[key] == conditions[key];
        }
      }
      return false;
    });

    const categoriesMet = categories.every(category => item[category] && item[category] === 1);

    return conditionsMet && categoriesMet;
  });

  return filteredData;
};

// Add image URL to data
const addImageUrls = (data, imageFolder) => {
  return data.map(item => {
    const imageName = item['ລາຍການອາຫານ'] + '.jpg';
    const imagePath = path.join(imageFolder, imageName);
    return { ...item, imageUrl: `/images/${imageName}` };
  });
};

module.exports = {
  loadExcelData,
  advancedSearch,
  addImageUrls,
};
