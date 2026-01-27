const fs = require('fs');
const path = require('path');
const Papa = require('papaparse');

const dir = 'results_data';
const files = fs.readdirSync(dir).filter(f => f.startsWith('Барнохон Атрыкходжаева') && f.endsWith('.csv'));

console.log(`Analyzing ${files.length} files for Barnoxon...\n`);

const entries = {}; // name -> [{ score, file }]

files.forEach(file => {
    const content = fs.readFileSync(path.join(dir, file), 'utf8');
    const parsed = Papa.parse(content, {
        header: true,
        skipEmptyLines: 'greedy',
        delimiter: ';'
    });

    parsed.data.forEach(row => {
        const nameKey = Object.keys(row).find(k => k.trim().startsWith('Ism sharifi'));
        const scoreKey = Object.keys(row).find(k => k.trim().startsWith('Ball (Scoring)'));

        if (nameKey) {
            const name = row[nameKey].trim();
            const score = parseFloat(row[scoreKey]) || 0;
            if (!entries[name]) entries[name] = [];
            entries[name].push({ score, file });
        }
    });
});

console.log('--- Duplicate Check ---');
let duplicatesCount = 0;
for (const [name, occurrences] of Object.entries(entries)) {
    if (occurrences.length > 1) {
        duplicatesCount++;
        console.log(`\nName: ${name}`);
        occurrences.forEach(o => {
            console.log(`  - File: ${o.file} | Score: ${o.score}`);
        });
    }
}

if (duplicatesCount === 0) {
    console.log('\n✅ No duplicates found! All names are unique across all files.');
} else {
    console.log(`\n⚠️ Found ${duplicatesCount} names with multiple entries.`);
}

console.log(`\nTotal unique contestants found: ${Object.keys(entries).length}`);
