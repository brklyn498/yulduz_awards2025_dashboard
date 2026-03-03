const fs = require('fs');
const path = require('path');
const Papa = require('papaparse');

const dir = 'results_data';
const inputFile = 'Ummatoy Yuldosheva.csv';
const targetFile = path.join(dir, 'Yulduz_Awards_Selected_Ummatoy_Yuldosheva.csv');

console.log(`Consolidating ${inputFile}...`);

const content = fs.readFileSync(path.join(dir, inputFile), 'utf8');
const parsed = Papa.parse(content, {
    header: true,
    skipEmptyLines: 'greedy',
    delimiter: ';',
    transformHeader: h => h.trim()
});

const uniqueEntries = new Map(); // name -> row

parsed.data.forEach(row => {
    const nameKey = Object.keys(row).find(k => k.trim().startsWith('Ism sharifi'));
    if (nameKey && row[nameKey]) {
        const name = row[nameKey].trim();
        if (!uniqueEntries.has(name)) {
            uniqueEntries.set(name, row);
        }
    }
});

const finalData = Array.from(uniqueEntries.values());
const csv = Papa.unparse(finalData, { delimiter: ';' });

fs.writeFileSync(targetFile, csv);
console.log(`✅ Consolidated ${finalData.length} unique entries into: ${targetFile}`);

// Cleanup original file
fs.unlinkSync(path.join(dir, inputFile));
console.log(`  - Deleted original: ${inputFile}`);
