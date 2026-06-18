const fs = require('fs');
let html = fs.readFileSync('MANUAL_DE_USUARIO_COMPLETO.html', 'utf8');

const regex = /<img src="\.\/docs\/images\/([^"]+)" alt="([^"]*)">/g;

html = html.replace(regex, (match, filename, altText) => {
    try {
        const img = fs.readFileSync('docs/images/' + filename);
        return '<img src="data:image/png;base64,' + img.toString('base64') + '" alt="' + altText + '">';
    } catch (e) {
        console.error("Error embedding " + filename, e);
        return match;
    }
});

html = '<div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto;">' + html + '</div>';

fs.writeFileSync('MANUAL_DE_USUARIO_COMPLETO.html', html);
console.log('Done!');
