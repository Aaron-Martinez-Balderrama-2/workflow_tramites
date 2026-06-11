const { MongoClient } = require('mongodb');

async function main() {
    const client = new MongoClient('mongodb://localhost:27017');
    await client.connect();
    const db = client.db('workflow_db');
    const user = await db.collection('usuarios').findOne({}, {sort: {_id: -1}});
    console.log("Email: " + user.email + " Password: " + user.password);
    await client.close();
}
main();
