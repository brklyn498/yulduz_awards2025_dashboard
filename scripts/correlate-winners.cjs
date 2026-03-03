const fs = require('fs');
const Papa = require('papaparse');

const winners = [
    { index: 1, name: "Dilbar Urinboeva" },
    { index: 2, name: "Muhiddinova Iroda" },
    { index: 3, name: "Inobat Jumayeva" },
    { index: 4, name: "Kadirova Kamola" },
    { index: 5, name: "Qahhorova Malikaxon" },
    { index: 6, name: "Beknazarova Saida" },
    { index: 7, name: "Ibragimova Nodira" },
    { index: 8, name: "" },
    { index: 9, name: "Muhamediyeva Dildora" },
    { index: 10, name: "Orzugul Goyibova" },
    { index: 11, name: "Maftuna Akbar" },
    { index: 12, name: "Xojamuratova Malik" },
    { index: 13, name: "Axmadjonova Sug'diyona" },
    { index: 14, name: "" },
    { index: 15, name: "" }
];

const data = fs.readFileSync('data.csv', 'utf8');
const parsed = Papa.parse(data, { header: true, skipEmptyLines: true });

// Extract all categories
const categories = [...new Set(parsed.data.map(row => row[Object.keys(row)[8]]))].filter(Boolean).sort();

console.log("--- Official Categories Found ---");
categories.forEach(c => console.log(c));

console.log("\n--- Mapping Winners ---");

const results = winners.map(w => {
    if (!w.name) return { ...w, found: false, searchName: w.name };

    // Fuzzy search/Partial match
    const match = parsed.data.find(row => {
        const rowName = row[Object.keys(row)[1]] || "";
        return rowName.toLowerCase().includes(w.name.toLowerCase());
    });

    if (match) {
        return {
            ...w,
            found: true,
            fullName: match[Object.keys(match)[1]],
            actualCategory: match[Object.keys(match)[8]]
        };
    } else {
        return { ...w, found: false };
    }
});

results.forEach(r => {
    if (r.found) {
        console.log(`${r.index}. ${r.name} -> FOUND: ${r.fullName} | Category: ${r.actualCategory}`);
    } else if (r.name) {
        console.log(`${r.index}. ${r.name} -> NOT FOUND`);
    } else {
        console.log(`${r.index}. (Empty)`);
    }
});
