import requests
import json

url = 'http://localhost:5000/analyze/nutrients'
data = {
    'mealLogs': [
        {
            'foodItems': [
                {'name': 'Test Food', 'protein': 10, 'iron': 2, 'vitaminA': 100}
            ]
        }
    ],
    'userProfile': {
        'gender': 'male',
        'age': 25,
        'activityLevel': 'moderate'
    }
}

try:
    response = requests.post(url, json=data)
    print(f"Status Code: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
except Exception as e:
    print(f"Error: {str(e)}")
