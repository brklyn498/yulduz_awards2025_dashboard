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
            const sum = Object.values(c.juries).reduce((acc, s) => acc + s, 0);
            return { ...c, cumulativeScore: sum };
        })
        .filter(c => c.hasScored)
        .sort((a, b) => b.cumulativeScore - a.cumulativeScore || a.name.localeCompare(b.name));

    return {
        results: finalResults,
        jurorNames
    };
};
