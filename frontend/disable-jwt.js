const fs = require('fs');
const path = 'C:/Program Files/ONLYOFFICE/DocumentServer/config/local.json';
try {
    let data = fs.readFileSync(path, 'utf8');
    data = data.replace(/"inbox":\s*true/g, '"inbox": false');
    data = data.replace(/"outbox":\s*true/g, '"outbox": false');
    data = data.replace(/"browser":\s*true/g, '"browser": false');
    fs.writeFileSync(path, data);
    console.log("JWT Disabled Successfully.");
} catch (e) {
    console.error("Failed to disable JWT: ", e);
}
