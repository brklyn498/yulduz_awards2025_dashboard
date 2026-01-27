const fs = require('fs');
const path = require('path');
const Papa = require('papaparse');

const dir = 'results_data';
const files = fs.readdirSync(dir).filter(f => f.startsWith('Zarina Lukmanova') && f.endsWith('.csv'));
const targetFile = path.join(dir, 'Yulduz_Awards_Selected_Zarina_Lukmanova.csv');

console.log(`Consolidating ${files.length} files...`);

const uniqueEntries = new Map(); // name -> row

files.forEach(file => {
    const content = fs.readFileSync(path.join(dir, file), 'utf8');
    const parsed = Papa.parse(content, {
        header: true,
        skipEmptyLines: 'greedy',
        delimiter: ';',
        transformHeader: h => h.trim()
    });

    parsed.data.forEach(row => {
        const nameKey = Object.keys(row).find(k => k.trim().startsWith('Ism sharifi'));
        if (nameKey && row[nameKey]) {
            const name = row[nameKey].trim();
            // Scores are consistent, so first occurrence is fine
            if (!uniqueEntries.has(name)) {
                uniqueEntries.set(name, row);
            }
        }
    });
});

const finalData = Array.from(uniqueEntries.values());
const csv = Papa.unparse(finalData, { delimiter: ';' });

fs.writeFileSync(targetFile, csv);
console.log(`✅ Consolidated ${finalData.length} unique entries into: ${targetFile}`);

// Cleanup original fragments
files.forEach(file => {
    fs.unlinkSync(path.join(dir, file));
    console.log(`  - Deleted fragment: ${file}`);
});
