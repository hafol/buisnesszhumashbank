const fs = require('fs');
const html = fs.readFileSync('kurs_dump.html', 'utf8');

const searchTerms = ['Halyk', 'Lider', 'Мир', 'USD', 'EUR', 'KZT', 'Тел', 'Адрес', 'table', 'rates'];
console.log('--- Search Results ---');
searchTerms.forEach(term => {
    const index = html.indexOf(term);
    if (index !== -1) {
        console.log(`Found "${term}" at index ${index}. Snapshot: ${html.substring(index, index + 300).replace(/\n/g, ' ')}`);
    } else {
        console.log(`"${term}" not found.`);
    }
});
