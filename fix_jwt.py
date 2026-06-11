import json

file_path = r"C:\Program Files\ONLYOFFICE\DocumentServer\config\local.json"

try:
    with open(file_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    data["services"]["CoAuthoring"]["token"]["enable"]["request"]["inbox"] = False
    data["services"]["CoAuthoring"]["token"]["enable"]["request"]["outbox"] = False
    data["services"]["CoAuthoring"]["token"]["enable"]["browser"] = False

    with open(file_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2)

    print("SUCCESS")
except Exception as e:
    print(f"FAILED: {e}")
