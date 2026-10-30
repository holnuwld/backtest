const fs = require('fs');
const indicatorsCode = fs.readFileSync('js/indicators.js', 'utf8');
const lines = indicatorsCode.split('\n');
const cases = lines.filter(l => l.includes('case "')).map(l => l.trim());
console.log('Supported transforms in IndicatorEngine:');
console.log(cases);
