const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const RESULTS_DIR = path.join(__dirname, '../results_data');
const MAIN_DATA = path.join(__dirname, '../data.csv');

async function sync() {
    try {
        // 1. Discover Juries
        console.log('Discovering juries...');
        const files = fs.readdirSync(RESULTS_DIR);
        const juryNames = files
            .filter(f => f.startsWith('Yulduz_Awards_Selected_') && f.endsWith('.csv'))
            .map(f => f.replace('Yulduz_Awards_Selected_', '').replace('.csv', ''));

        console.log(`Found juries: ${juryNames.join(', ')}`);

        // 2. Sync Juries Manifest
        console.log('Syncing manifest...');
        const manifest = JSON.stringify(juryNames);
        execSync(`npx wrangler kv key put --binding=JURY_DATA manifest '${manifest}' --remote`, { cwd: path.join(__dirname, '../worker') });

        // 3. Sync Main Data
        console.log('Syncing main data...');
        if (fs.existsSync(MAIN_DATA)) {
            execSync(`npx wrangler kv key put --binding=JURY_DATA main_data --path="${MAIN_DATA}" --remote`, { cwd: path.join(__dirname, '../worker') });
        } else {
            console.error('❌ Main data.csv not found!');
        }

        // 4. Set Results Lock
        console.log('Setting results lock to true...');
        execSync(`npx wrangler kv key put --binding=JURY_DATA results_lock "true" --remote`, { cwd: path.join(__dirname, '../worker') });

        // 5. Sync Each Jury CSV
        for (const name of juryNames) {
            console.log(`Syncing jury scores: ${name}...`);
            const filePath = path.join(RESULTS_DIR, `Yulduz_Awards_Selected_${name}.csv`);
            execSync(`npx wrangler kv key put --binding=JURY_DATA "jury:${name}" --path="${filePath}" --remote`, { cwd: path.join(__dirname, '../worker') });
        }

        console.log('✅ Sync complete!');
    } catch (err) {
        console.error('❌ Sync failed:', err.message);
    }
}

sync();
