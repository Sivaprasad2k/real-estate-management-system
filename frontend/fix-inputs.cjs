const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(function (file) {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            results = results.concat(walk(file));
        } else {
            if (file.endsWith('.jsx')) results.push(file);
        }
    });
    return results;
}

const files = walk('c:/Users/SIVAPRASAD/OneDrive/Documents/Mini Project/realestate/frontend/src');

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');

    // add text-black to all inputs
    content = content.replace(/(<input[^>]*className="[^"]*)/g, '$1 text-black bg-white');
    content = content.replace(/(<textarea[^>]*className="[^"]*)/g, '$1 text-black bg-white');
    content = content.replace(/(<select[^>]*className="[^"]*)/g, '$1 text-black bg-white');

    // clean up any duplicate text-black bg-white if they happen
    content = content.replace(/text-black bg-white text-black bg-white/g, 'text-black bg-white');
    content = content.replace(/text-black text-black/g, 'text-black');
    content = content.replace(/bg-white bg-white/g, 'bg-white');
    // clean up old text colors inside inputs like text-white
    content = content.replace(/(<input[^>]*className="[^"]*)text-white([^"]*")/g, '$1$2');
    content = content.replace(/(<textarea[^>]*className="[^"]*)text-white([^"]*")/g, '$1$2');
    content = content.replace(/(<select[^>]*className="[^"]*)text-white([^"]*")/g, '$1$2');

    fs.writeFileSync(file, content, 'utf8');
});
