const fetch = require('node-fetch');
const fs = require('fs');

async function run() {
    try {
        const url = 'https://m.kurs.kz/';
        console.log('Fetching mobile', url);
        const res = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1'
            }
        });
        const html = await res.text();
        fs.writeFileSync('kurs_mobile_dump.html', html);
        console.log('Successfully dumped Mobile HTML to kurs_mobile_dump.html.');

        // Let's also try to find the actual data endpoint by looking at the HTML
        if (html.includes('api/')) {
            console.log('Found potential API mentions in HTML');
        }
    } catch (err) {
        console.error('Error:', err.message);
    }
}
run();
