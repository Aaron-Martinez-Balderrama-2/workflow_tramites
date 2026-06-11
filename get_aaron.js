const { MongoClient } = require('mongodb');

async function main() {
    const client = new MongoClient('mongodb://localhost:27017');
    await client.connect();
    const db = client.db('test');
    const user = await db.collection('usuarios').findOne({nombre: /aaron8/i});
    console.log("Email: " + user?.email + " Password: " + user?.password);
    await client.close();
}
main();
