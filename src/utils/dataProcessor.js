import Papa from 'papaparse';

const cyrillicToLatinMap = {
    'А': 'A', 'Б': 'B', 'В': 'V', 'Г': 'G', 'Д': 'D', 'Е': 'E', 'Ё': 'Yo', 'Ж': 'J',
    'З': 'Z', 'И': 'I', 'Й': 'Y', 'К': 'K', 'Л': 'L', 'М': 'M', 'Н': 'N', 'О': 'O',
    'П': 'P', 'Р': 'R', 'С': 'S', 'Т': 'T', 'У': 'U', 'Ф': 'F', 'Х': 'X', 'Ц': 'Ts',
    'Ч': 'Ch', 'Ш': 'Sh', 'Ъ': '', 'Ь': '', 'Э': 'E', 'Ю': 'Yu', 'Я': 'Ya',
    'Ў': 'O', 'Қ': 'Q', 'Ғ': 'G', 'Ҳ': 'H',
    'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'yo', 'ж': 'j',
    'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm', 'н': 'n', 'о': 'o',
    'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u', 'ф': 'f', 'х': 'x', 'ц': 'ts',
    'ч': 'ch', 'ш': 'sh', 'ъ': '', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya',
    'ў': 'o', 'қ': 'q', 'ғ': 'g', 'ҳ': 'h'
};

const NORMALIZE_NAME = (name) => {
    if (!name) return '';
    return name.split('').map(char => {
        return cyrillicToLatinMap[char] || char;
    }).join('');
};

const NORMALIZE_REGION = (val) => {
    if (!val) return 'Nomaʼlum';
    const s = val.toLowerCase().trim();
    const normS = NORMALIZE_NAME(s);
    if (normS.includes('toshkent sh') || normS === 'toshkent' || normS === 'tashkent') return 'Toshkent shahri';
    if (normS.includes('toshkent vil')) return 'Toshkent viloyati';
    if (normS.includes('andijon')) return 'Andijon viloyati';
    if (normS.includes('farg')) return 'Fargʻona viloyati';
    if (normS.includes('namangan')) return 'Namangan viloyati';
    if (normS.includes('buxoro')) return 'Buxoro viloyati';
    if (normS.includes('navoiy')) return 'Navoiy viloyati';
    if (normS.includes('samarqand')) return 'Samarqand viloyati';
    if (normS.includes('qashqadaryo')) return 'Qashqadaryo viloyati';
    if (normS.includes('surxondaryo')) return 'Surxondaryo viloyati';
    if (normS.includes('jizzax')) return 'Jizzax viloyati';
    if (normS.includes('sirdaryo')) return 'Sirdaryo viloyati';
    if (normS.includes('xorazm')) return 'Xorazm viloyati';
    if (normS.includes('qoraqalpog') || normS.includes('nukus')) return 'Qoraqalpogʻiston';
    return val; // Fallback to raw if not matched but trimmed
};

export const processData = (csvString) => {
    const result = Papa.parse(csvString, {
        header: true,
        skipEmptyLines: 'greedy',
        dynamicTyping: false,
    });

    // Find keys dynamically to ignore trailing spaces
    const findKey = (row, partial) => {
        const key = Object.keys(row).find(k => k.trim().startsWith(partial));
        return key ? (row[key] || '').trim() : '';
    };

    // Filter out empty rows or non-contestant rows
    const rawData = result.data.filter(row => {
        const name = findKey(row, '1. To‘liq ism');
        const nameLower = (name || '').trim().toLowerCase();
        return name && name.trim() !== '' && nameLower !== 'тест' && nameLower !== 'd' && nameLower !== 'test';
    });

    const data = rawData.map((row, index) => {
        const rawRegion = findKey(row, '3. Yashash joyingiz') || '';
        const birthDateStr = findKey(row, '2. Tug‘ilgan sanangiz');
        const files = findKey(row, '12. Loyihaga doir fayllar');
        const name = findKey(row, '1. To‘liq ism');

        // Age calculation
        let age = null;
        if (birthDateStr) {
            const birthDate = new Date(birthDateStr);
            if (!isNaN(birthDate)) {
                const today = new Date();
                age = today.getFullYear() - birthDate.getFullYear();
                const m = today.getMonth() - birthDate.getMonth();
                if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
                    age--;
                }
            }
        }

        return {
            ...row,
            id: index,
            name: name,
            normalized_name: NORMALIZE_NAME(name),
            age: age,
            region: NORMALIZE_REGION(rawRegion),
            raw_region: rawRegion,
            occupation: findKey(row, '5. Hozirgi faoliyatingiz'),
            category: findKey(row, '8. Siz qaysi nominatsiya'),
            experience: findKey(row, '6. AT yo‘nalishidagi tajribangiz'),
            field: findKey(row, '7. Qaysi AT yo‘nalishida'),
            purpose: findKey(row, '9. Ushbu tanlovda ishtirok etishdan maqsadingiz'),
            project_info: findKey(row, '10. Taqdim etayotgan loyihangiz'),
            benefit: findKey(row, '11. Loyihangizning yangiligi'),
            files: files,
            hasFiles: !!(files && files.trim().length > 5), // Basic check for URL or path
            phone: findKey(row, '4. Telefon raqamingiz'),
        };
    });

    // Helper to count occurrences
    const countBy = (arr, key) => {
        return arr.reduce((acc, curr) => {
            const val = curr[key] || 'Nomaʼlum';
            acc[val] = (acc[val] || 0) + 1;
            return acc;
        }, {});
    };

    const getUnique = (arr, key) => {
        return [...new Set(arr.map(item => item[key]))].filter(Boolean).sort();
    };

    const regionCounts = countBy(data, 'region');

    return {
        totalParticipants: data.length,
        regions: Object.entries(regionCounts).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value),
        activities: Object.entries(countBy(data, 'occupation')).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value),
        fields: Object.entries(countBy(data, 'field')).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value),
        nominations: Object.entries(countBy(data, 'category')).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value),
        filterOptions: {
            regions: getUnique(data, 'region'),
            occupations: getUnique(data, 'occupation'),
            categories: getUnique(data, 'category'),
        },
        raw: data
    };
};
