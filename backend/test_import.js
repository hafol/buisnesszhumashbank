try {
    const exchange = require('./src/routes/exchange');
    console.log('Exchange routes imported successfully');
} catch (err) {
    console.error('Import error:', err);
    process.exit(1);
}
