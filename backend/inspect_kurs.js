const cheerio = require('cheerio');
const fs = require('fs');

async function analyze() {
    try {
        const html = fs.readFileSync('kurs_dump.html', 'utf8');
        const $ = cheerio.load(html);

        console.log('--- Analyzing Tables ---');
        $('table').each((i, table) => {
            console.log(`Table ${i}: class="${$(table).attr('class')}" id="${$(table).attr('id')}"`);
        });

        const offices = [];
        // Kurs.kz often uses a specific table for rates
        $('tr').each((i, row) => {
            const cells = $(row).find('td');
            if (cells.length >= 5) {
                const name = $(cells[0]).text().trim();
                const usdBuy = $(cells[1]).text().trim();
                const usdSell = $(cells[2]).text().trim();

                if (name && !isNaN(parseFloat(usdBuy))) {
                    offices.push({ name, usdBuy, usdSell });
                }
            }
        });

        console.log('\n--- Found Offices ---');
        console.log('Total:', offices.length);
        offices.slice(0, 3).forEach((o, i) => {
            console.log(`${i + 1}. ${o.name} | Buy: ${o.usdBuy} | Sell: ${o.usdSell}`);
        });

        // Search for addresses
        console.log('\n--- Searching for addresses ---');
        $('*').each((i, el) => {
            const text = $(el).text();
            if (text.includes('ул.') || text.includes('пр.') || text.includes('мкр.')) {
                if (text.length < 100 && $(el).children().length === 0) {
                    console.log('Potential address tag:', $(el).prop('tagName'), 'Class:', $(el).attr('class'), 'Text:', text.trim());
                    return false; // stop after first
                }
            }
        });

    } catch (err) {
        console.error('Error:', err.message);
    }
}
analyze();
