import Papa from 'papaparse';

export const processJuryData = (csvString) => {
    const result = Papa.parse(csvString, {
        header: true,
        skipEmptyLines: 'greedy',
        delimiter: ';', // Jury CSV uses semicolon
        dynamicTyping: false,
    });

    const findKey = (row, partial) => {
        const key = Object.keys(row).find(k => k.trim().startsWith(partial));
        return key ? (row[key] || '').trim() : '';
    };

    return result.data.map(row => {
        return {
            name: findKey(row, 'Ism sharifi'),
            score: parseFloat(findKey(row, 'Ball (Scoring)')) || 0,
            category: findKey(row, 'Nominatsiyasi'),
        };
    });
};

export const aggregateAllScores = (juryDataFiles, allContestants) => {
    // juryDataFiles: Array of { jurorName, data: [ { name, score, category }, ... ] }
    const resultsMap = new Map();

    // Initialize with all contestants
    allContestants.forEach(c => {
        resultsMap.set(c.name, {
            ...c,
            juries: {}, // { "Juror Name": Score }
            cumulativeScore: 0,
            hasScored: false
        });
    });

    // Aggregate scores
    const jurorNames = [];
    juryDataFiles.forEach(jury => {
        jurorNames.push(jury.jurorName);
        jury.data.forEach(entry => {
            const contestant = resultsMap.get(entry.name);
            if (contestant) {
                const score = entry.score;
                // Keep the highest score if duplicate entries exist for the same juror
                if (!contestant.juries[jury.jurorName] || score > contestant.juries[jury.jurorName]) {
                    contestant.juries[jury.jurorName] = score;
                }
                if (score > 0) contestant.hasScored = true;
            }
        });
    });

    // Calculate final cumulative scores from aggregated juror data
    const finalResults = Array.from(resultsMap.values())
        .map(c => {
            const scores = Object.values(c.juries);
            const sum = scores.reduce((acc, s) => acc + s, 0);
            const count5 = scores.filter(s => s === 5).length;
            const count4 = scores.filter(s => s === 4).length;
            return {
                ...c,
                cumulativeScore: sum,
                scoreDetails: { count5, count4 }
            };
        })
        .filter(c => c.hasScored)
        .sort((a, b) => {
            // 1. Primary: Total Score
            if (b.cumulativeScore !== a.cumulativeScore) {
                return b.cumulativeScore - a.cumulativeScore;
            }
            // 2. Secondary: Count of 5s
            if (b.scoreDetails.count5 !== a.scoreDetails.count5) {
                return b.scoreDetails.count5 - a.scoreDetails.count5;
            }
            // 3. Tertiary: Count of 4s
            if (b.scoreDetails.count4 !== a.scoreDetails.count4) {
                return b.scoreDetails.count4 - a.scoreDetails.count4;
            }
            // 4. Final: Alphabetical
            return a.name.localeCompare(b.name);
        });

    return {
        results: finalResults,
        jurorNames
    };
};
