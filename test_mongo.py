from pymongo import MongoClient

client = MongoClient('mongodb://localhost:27017/')
db = client['test']
users = db['usuario']

aaron = users.find_one({"email": "aaron5admin@gmail.com"})
conor = users.find_one({"email": "conortrab1@gmail.com"})

print("Aaron EmpresaId:", aaron.get("empresaId") if aaron else "Not found")
print("Conor EmpresaId:", conor.get("empresaId") if conor else "Not found")
