const path = require("path");
const fs = require('fs');

function updateJsonLocaleFields(lang, fields) {
    let pathdir = path.resolve(process.cwd(), "./locales");
    fs.readFile(pathdir + `\\${lang}.json`, 'utf8', function readFileCallback(err, data) {

        if (err) {
            console.log(err);
        } else {
            let obj = JSON.parse(data);

            Object.keys(fields).forEach((key) => {
                obj[key] = fields[key]
            });

            fs.writeFile(pathdir + `\\${lang}.json`, JSON.stringify(obj), 'utf8', (err) => {
                if (err) console.log(err);
            });
        }
    });
}

module.exports = {
    updateJsonLocaleFields: updateJsonLocaleFields
}
