const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const JURY_MANIFEST = path.join(__dirname, '../public/juries.json');
const RESULTS_DIR = path.join(__dirname, '../results_data');
const MAIN_DATA = path.join(__dirname, '../data.csv');

async function sync() {
    try {
        // 1. Sync Manifest
        console.log('Syncing manifest...');
        const manifest = fs.readFileSync(JURY_MANIFEST, 'utf8');
        execSync(`npx wrangler kv key put --binding=JURY_DATA manifest '${manifest}'`, { cwd: path.join(__dirname, '../worker') });

        // 2. Sync Main Data
        console.log('Syncing main data...');
        if (fs.existsSync(MAIN_DATA)) {
            execSync(`npx wrangler kv key put --binding=JURY_DATA main_data --path="${MAIN_DATA}"`, { cwd: path.join(__dirname, '../worker') });
        }

        // 3. Set Results Lock (default to true as requested)
        console.log('Setting results lock to true...');
        execSync(`npx wrangler kv key put --binding=JURY_DATA results_lock "true"`, { cwd: path.join(__dirname, '../worker') });

        // 4. Sync Each Jury CSV
        const juryFiles = JSON.parse(manifest);
        for (const name of juryFiles) {
            console.log(`Syncing jury: ${name}...`);
            const filePath = path.join(RESULTS_DIR, `Yulduz_Awards_Selected_${name}.csv`);
            if (fs.existsSync(filePath)) {
                // We use file flag for larger content
                execSync(`npx wrangler kv key put --binding=JURY_DATA "jury:${name}" --path="${filePath}"`, { cwd: path.join(__dirname, '../worker') });
            } else {
                console.warn(`File not found: ${filePath}`);
            }
        }

        console.log('✅ Sync complete!');
    } catch (err) {
        console.error('❌ Sync failed:', err.message);
    }
}

sync();
