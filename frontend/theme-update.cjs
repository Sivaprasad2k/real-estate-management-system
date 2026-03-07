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

    // replacements for brand
    content = content.replace(/bg-indigo-([1-9]00)/g, 'bg-brand-$1');
    content = content.replace(/text-indigo-([1-9]00)/g, 'text-brand-$1');
    content = content.replace(/border-indigo-([1-9]00)/g, 'border-brand-$1');
    content = content.replace(/ring-indigo-([1-9]00)/g, 'ring-brand-$1');
    content = content.replace(/from-indigo-([1-9]00)/g, 'from-brand-$1');
    content = content.replace(/to-indigo-([1-9]00)/g, 'to-brand-$1');

    // Make backgrounds dark
    content = content.replace(/bg-gray-100/g, 'bg-dark');
    content = content.replace(/bg-gray-50/g, 'bg-[#121212]');
    content = content.replace(/bg-white/g, 'bg-dark-card');

    // Make text light
    content = content.replace(/text-gray-900/g, 'text-white');
    content = content.replace(/text-gray-800/g, 'text-gray-200');
    content = content.replace(/text-gray-700/g, 'text-gray-300');
    content = content.replace(/text-gray-600/g, 'text-gray-400');
    content = content.replace(/text-gray-500/g, 'text-gray-400');

    // Darken borders
    content = content.replace(/border-gray-200/g, 'border-dark-border');
    content = content.replace(/border-gray-300/g, 'border-dark-border');
    content = content.replace(/border-gray-100/g, 'border-dark-border');

    // Title change
    content = content.replace(/>RealEstate</g, '>Real Estate Hub<');

    fs.writeFileSync(file, content, 'utf8');
});
