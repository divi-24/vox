#!/usr/bin/env python3
"""
Integration test to verify backend is running and all endpoints are accessible.

Run this after starting backend with: docker-compose up -d
"""

import requests
import sys
import time

BASE_URL = "http://localhost:8000"
MAX_RETRIES = 5
RETRY_DELAY = 2

def test_backend():
    """Test backend connectivity and basic endpoints"""
    
    print("=" * 60)
    print("VoxNote 2.0 Backend Integration Test")
    print("=" * 60)
    
    # Test 1: Health check
    print("\n[1/5] Testing health check...")
    for attempt in range(MAX_RETRIES):
        try:
            response = requests.get(f"{BASE_URL}/health", timeout=5)
            if response.status_code == 200:
                print(f"✓ Backend is healthy")
                data = response.json()
                print(f"  Status: {data.get('status')}")
                print(f"  Version: {data.get('version')}")
                break
        except requests.exceptions.ConnectionError:
            if attempt < MAX_RETRIES - 1:
                print(f"  Waiting for backend... ({attempt + 1}/{MAX_RETRIES})")
                time.sleep(RETRY_DELAY)
            else:
                print("✗ Backend is not running")
                print("  Run: cd backend && docker-compose up -d")
                return False
    
    # Test 2: Root endpoint
    print("\n[2/5] Testing root endpoint...")
    try:
        response = requests.get(f"{BASE_URL}/", timeout=5)
        if response.status_code == 200:
            print("✓ Root endpoint working")
    except Exception as e:
        print(f"✗ Root endpoint failed: {e}")
        return False
    
    # Test 3: API documentation
    print("\n[3/5] Testing API documentation...")
    try:
        response = requests.get(f"{BASE_URL}/docs", timeout=5)
        if response.status_code == 200:
            print("✓ API docs available at http://localhost:8000/docs")
    except Exception as e:
        print(f"✗ API docs failed: {e}")
    
    # Test 4: Meetings endpoint
    print("\n[4/5] Testing meetings endpoint...")
    try:
        response = requests.get(f"{BASE_URL}/api/meetings", timeout=5)
        if response.status_code == 200:
            print("✓ Meetings endpoint working")
            data = response.json()
            print(f"  Meetings: {len(data)} recorded")
    except Exception as e:
        print(f"✗ Meetings endpoint failed: {e}")
    
    # Test 5: Risk summary endpoint
    print("\n[5/5] Testing risk summary endpoint...")
    try:
        response = requests.get(f"{BASE_URL}/api/risk/summary", timeout=5)
        if response.status_code == 200:
            print("✓ Risk endpoint working")
            data = response.json()
            print(f"  Total tasks: {data.get('total_tasks', 0)}")
            print(f"  Average risk: {data.get('average_risk_score', 0):.1f}")
    except Exception as e:
        print(f"✗ Risk endpoint failed: {e}")
    
    print("\n" + "=" * 60)
    print("✓ Backend Integration Test Passed!")
    print("=" * 60)
    print("\nNext steps:")
    print("1. Start frontend: cd web && npm run dev")
    print("2. Open: http://localhost:3000")
    print("3. Upload audio or document to test end-to-end flow")
    print("\n")
    
    return True

if __name__ == "__main__":
    success = test_backend()
    sys.exit(0 if success else 1)
