const fs = require('fs');
const path = require('path');
const Papa = require('papaparse');

const dir = 'results_data';
const file = 'Ummatoy Yuldosheva.csv';
const filePath = path.join(dir, file);

console.log(`Analyzing ${file}...\n`);

const content = fs.readFileSync(filePath, 'utf8');
const parsed = Papa.parse(content, {
    header: true,
    skipEmptyLines: 'greedy',
    delimiter: ';',
    transformHeader: h => h.trim()
});

const entries = {}; // name -> [{ score, row }]
let totalRows = 0;

parsed.data.forEach((row, index) => {
    totalRows++;
    const nameKey = Object.keys(row).find(k => k.trim().startsWith('Ism sharifi'));
    const scoreKey = Object.keys(row).find(k => k.trim().startsWith('Ball (Scoring)'));

    if (nameKey && row[nameKey]) {
        const name = row[nameKey].trim();
        const score = parseFloat(row[scoreKey]) || 0;

        if (!entries[name]) entries[name] = [];
        entries[name].push({ score, index });
    }
});

console.log(`Total Rows Sent: ${totalRows}`);
console.log(`Unique Contestants: ${Object.keys(entries).length}`);

console.log('\n--- Duplicate Check ---');
let duplicatesCount = 0;

for (const [name, occurrences] of Object.entries(entries)) {
    if (occurrences.length > 1) {
        duplicatesCount++;
        console.log(`\n⚠️ Duplicate: ${name}`);
        occurrences.forEach(o => {
            console.log(`  - Row: ${o.index + 1} | Score: ${o.score}`);
        });
    }
}

if (duplicatesCount === 0) {
    console.log('\n✅ No duplicates found.');
} else {
    console.log(`\n⚠️ Found ${duplicatesCount} duplicates.`);
}
