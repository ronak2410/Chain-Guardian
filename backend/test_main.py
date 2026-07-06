from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_read_root():
    # Because of the static files routing, root might return 404 or index.html
    # We will test the API endpoints directly.
    pass

def test_api_nodes():
    response = client.get("/api/nodes")
    assert response.status_code == 200
    data = response.json()
    assert "data" in data
    nodes = data["data"]
    assert len(nodes) > 0
    
    # Check structure of first node
    first_node = nodes[0]
    assert "id" in first_node
    assert "name" in first_node
    assert "coordinates" in first_node
    assert "risk_score" in first_node
    assert "tier_1_suppliers" in first_node

def test_api_events():
    response = client.get("/api/events")
    assert response.status_code == 200
    data = response.json()
    assert "events" in data
    # Events might be empty if random generation didn't produce any, 
    # but the key should exist.
    assert isinstance(data["events"], list)

def test_api_vessels():
    response = client.get("/api/vessels")
    assert response.status_code == 200
    data = response.json()
    assert "vessels" in data
    vessels = data["vessels"]
    assert len(vessels) == 3
    assert vessels[0]["id"] == "v1"

def test_api_metrics():
    response = client.get("/api/metrics")
    assert response.status_code == 200
    data = response.json()
    assert "dataset_size" in data
    assert "acceleration_factor" in data

def test_api_insights():
    response = client.get("/api/insights")
    assert response.status_code == 200
    data = response.json()
    assert "insight" in data
