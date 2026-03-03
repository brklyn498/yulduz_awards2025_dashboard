const fs = require('fs');
const Papa = require('papaparse');

const winnersList = [
    "Dilbar Urinboeva",
    "Muhiddinova Iroda",
    "Inobat Jumayeva",
    "Kadirova Kamola",
    "Qahhorova Malikaxon",
    "Saida Beknazarova",
    "Ibrogimova Nodira",
    "Muhamediyeva Dildora",
    "Orzugul Goyibova",
    "Maftuna Akbar",
    "Xojamuratova Malika",
    "Axmadjonova Sug'diyona"
];

const data = fs.readFileSync('data.csv', 'utf8');
const parsed = Papa.parse(data, { header: true, skipEmptyLines: true });

const results = winnersList.map(name => {
    const match = parsed.data.find(row => {
        const rowName = (row[Object.keys(row)[1]] || "").trim();
        return rowName.toLowerCase().includes(name.toLowerCase());
    });

    if (match) {
        return {
            searchName: name,
            fullName: match[Object.keys(match)[1]],
            job: match[Object.keys(match)[5]],
            nomination: match[Object.keys(match)[8]],
            projectInfo: match[Object.keys(match)[10]],
            benefits: match[Object.keys(match)[11]]
        };
    }
    return { searchName: name, notFound: true };
});

results.forEach(r => {
    console.log(`--- WINNER: ${r.searchName} ---`);
    if (r.notFound) {
        console.log("NOT FOUND IN CSV");
    } else {
        console.log(`FullName: ${r.fullName}`);
        console.log(`Nomination: ${r.nomination}`);
        console.log(`Project Info: ${r.projectInfo}`);
        console.log(`Benefits: ${r.benefits}`);
    }
    console.log("\n");
});
