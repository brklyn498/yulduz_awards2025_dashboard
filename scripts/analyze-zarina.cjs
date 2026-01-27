const fs = require('fs');
const path = require('path');
const Papa = require('papaparse');

const dir = 'results_data';
const files = fs.readdirSync(dir).filter(f => f.startsWith('Zarina Lukmanova') && f.endsWith('.csv'));

console.log(`Analyzing ${files.length} files for Zarina Lukmanova...\n`);

const entries = {}; // name -> [{ score, file }]

files.forEach(file => {
    const content = fs.readFileSync(path.join(dir, file), 'utf8');
    const parsed = Papa.parse(content, {
        header: true,
        skipEmptyLines: 'greedy',
        delimiter: ';',
        transformHeader: h => h.trim() // Trim headers to avoid issues
    });

    parsed.data.forEach(row => {
        const nameKey = Object.keys(row).find(k => k.trim().startsWith('Ism sharifi'));
        const scoreKey = Object.keys(row).find(k => k.trim().startsWith('Ball (Scoring)'));

        if (nameKey && row[nameKey]) {
            const name = row[nameKey].trim();
            const score = parseFloat(row[scoreKey]) || 0;
            if (!entries[name]) entries[name] = [];
            entries[name].push({ score, file });
        }
    });
});

console.log('--- File Stats ---');
files.forEach(f => {
    let count = 0;
    const content = fs.readFileSync(path.join(dir, f), 'utf8');
    const parsed = Papa.parse(content, { header: true, delimiter: ';' });
    console.log(`File: ${f}, Rows: ${parsed.data.length}`);
});


console.log('\n--- Duplicate Check ---');
let duplicatesCount = 0;
let inconsistencies = 0;

for (const [name, occurrences] of Object.entries(entries)) {
    if (occurrences.length > 1) {
        duplicatesCount++;
        const firstScore = occurrences[0].score;
        const isConsistent = occurrences.every(o => o.score === firstScore);

        if (!isConsistent) {
            inconsistencies++;
            console.log(`\n❌ Inconsistency for: ${name}`);
            occurrences.forEach(o => {
                console.log(`  - File: ${o.file} | Score: ${o.score}`);
            });
        }
    }
}

if (duplicatesCount === 0) {
    console.log('\n✅ No duplicates found. Files contain distinct contestants.');
} else {
    console.log(`\n⚠️ Found ${duplicatesCount} names appearing in multiple files.`);
    if (inconsistencies === 0) {
        console.log('✅ All duplicates have consistent scores.');
    } else {
        console.log(`❌ Found ${inconsistencies} inconsistent scoring events.`);
    }
}

console.log(`\nTotal unique contestants found: ${Object.keys(entries).length}`);
