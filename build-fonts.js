import fs from 'fs';
import https from 'https';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const fontUrl = 'https://raw.githubusercontent.com/google/fonts/main/apache/tinos/Tinos-Regular.ttf';
const fontBoldUrl = 'https://raw.githubusercontent.com/google/fonts/main/apache/tinos/Tinos-Bold.ttf';

const downloadFile = (url, dest) => {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(dest);
        https.get(url, (response) => {
            response.pipe(file);
            file.on('finish', () => {
                file.close();
                resolve(dest);
            });
        }).on('error', (err) => {
            fs.unlink(dest, () => { });
            reject(err);
        });
    });
};

async function buildVfs() {
    console.log('Downloading fonts...');
    const regPath = path.join(__dirname, 'Tinos-Regular.ttf');
    const boldPath = path.join(__dirname, 'Tinos-Bold.ttf');

    await downloadFile(fontUrl, regPath);
    await downloadFile(fontBoldUrl, boldPath);

    console.log('Generating vfs...');
    const regBase64 = fs.readFileSync(regPath).toString('base64');
    const boldBase64 = fs.readFileSync(boldPath).toString('base64');

    const vfsData = {
        'TimesNewRoman-Regular.ttf': regBase64,
        'TimesNewRoman-Bold.ttf': boldBase64
    };

    const vfsContent = `export const pdfFonts = ${JSON.stringify(vfsData, null, 2)};`;

    fs.writeFileSync(path.join(__dirname, 'src', 'vfs_fonts.ts'), vfsContent);
    console.log('vfs_fonts.ts generated successfully.');

    fs.unlinkSync(regPath);
    fs.unlinkSync(boldPath);
}

buildVfs().catch(console.error);
