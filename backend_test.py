#!/usr/bin/env python3
"""
Backend API Testing for Holistic Coaching App
Testing specific endpoints as requested in Arabic review request
"""

import requests
import json
import sys
from datetime import datetime

# Backend URL from frontend/.env
BACKEND_URL = "https://yazo-theme.preview.emergentagent.com/api"

# Test credentials
COACH_EMAIL = "mohamed@coach.com"
COACH_PASSWORD = "coach123"
TRAINEE_EMAIL = "trainee@test.com"
TRAINEE_PASSWORD = "trainee123"

class APITester:
    def __init__(self):
        self.session = requests.Session()
        self.coach_token = None
        self.trainee_token = None
        
    def log(self, message):
        print(f"[{datetime.now().strftime('%H:%M:%S')}] {message}")
        
    def test_login(self, email, password, role="coach"):
        """Test user login and return token"""
        self.log(f"Testing login for {email}")
        
        try:
            response = self.session.post(
                f"{BACKEND_URL}/auth/login",
                json={"email": email, "password": password},
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code == 200:
                data = response.json()
                token = data.get("access_token")
                user = data.get("user", {})
                self.log(f"✅ Login successful for {email} (Role: {user.get('role', 'unknown')})")
                return token
            else:
                self.log(f"❌ Login failed for {email}: {response.status_code} - {response.text}")
                return None
                
        except Exception as e:
            self.log(f"❌ Login error for {email}: {str(e)}")
            return None
    
    def test_endpoint(self, method, endpoint, token=None, data=None, expected_status=200):
        """Generic endpoint testing"""
        url = f"{BACKEND_URL}{endpoint}"
        headers = {"Content-Type": "application/json"}
        
        if token:
            headers["Authorization"] = f"Bearer {token}"
            
        self.log(f"Testing {method} {endpoint}")
        
        try:
            if method.upper() == "GET":
                response = self.session.get(url, headers=headers)
            elif method.upper() == "POST":
                response = self.session.post(url, json=data, headers=headers)
            elif method.upper() == "PUT":
                response = self.session.put(url, json=data, headers=headers)
            else:
                self.log(f"❌ Unsupported method: {method}")
                return False
                
            self.log(f"Response: {response.status_code}")
            
            if response.status_code == expected_status:
                try:
                    response_data = response.json()
                    self.log(f"✅ {endpoint} - Success")
                    self.log(f"Response data: {json.dumps(response_data, indent=2, ensure_ascii=False)}")
                    return True
                except:
                    self.log(f"✅ {endpoint} - Success (non-JSON response)")
                    return True
            else:
                self.log(f"❌ {endpoint} - Failed: {response.status_code}")
                self.log(f"Error: {response.text}")
                return False
                
        except Exception as e:
            self.log(f"❌ {endpoint} - Exception: {str(e)}")
            return False
    
    def run_tests(self):
        """Run all requested tests"""
        self.log("=" * 60)
        self.log("Starting Backend API Tests for Holistic Coaching App")
        self.log("=" * 60)
        
        # Step 1: Login as coach
        self.log("\n1. Testing Coach Login")
        self.coach_token = self.test_login(COACH_EMAIL, COACH_PASSWORD, "coach")
        
        if not self.coach_token:
            self.log("❌ Cannot proceed without coach token")
            return False
            
        # Step 2: Test sessions stats endpoint
        self.log("\n2. Testing Sessions Stats Endpoint")
        stats_success = self.test_endpoint("GET", "/sessions/stats", self.coach_token)
        
        # Step 3: Test my-sessions endpoint  
        self.log("\n3. Testing My Sessions Endpoint")
        sessions_success = self.test_endpoint("GET", "/sessions/my-sessions", self.coach_token)
        
        # Step 4: Test unread messages count
        self.log("\n4. Testing Unread Messages Count Endpoint")
        messages_success = self.test_endpoint("GET", "/messages/unread-count", self.coach_token)
        
        # Step 5: Test trainee login (additional verification)
        self.log("\n5. Testing Trainee Login (Additional Verification)")
        self.trainee_token = self.test_login(TRAINEE_EMAIL, TRAINEE_PASSWORD, "trainee")
        trainee_login_success = self.trainee_token is not None
        
        # Step 6: Test trainee unread messages
        trainee_messages_success = False
        if self.trainee_token:
            self.log("\n6. Testing Trainee Unread Messages")
            trainee_messages_success = self.test_endpoint("GET", "/messages/unread-count", self.trainee_token)
        
        # Optional: Test session creation (only if we have confirmed bookings)
        self.log("\n7. Testing Session Creation (Optional)")
        self.log("Note: Skipping session creation as per request - no confirmed bookings needed")
        
        # Summary
        self.log("\n" + "=" * 60)
        self.log("TEST SUMMARY")
        self.log("=" * 60)
        
        results = {
            "Coach Login": self.coach_token is not None,
            "Sessions Stats": stats_success,
            "My Sessions": sessions_success, 
            "Coach Unread Messages": messages_success,
            "Trainee Login": trainee_login_success,
            "Trainee Unread Messages": trainee_messages_success
        }
        
        all_passed = True
        for test_name, passed in results.items():
            status = "✅ PASS" if passed else "❌ FAIL"
            self.log(f"{test_name}: {status}")
            if not passed:
                all_passed = False
                
        self.log("\n" + "=" * 60)
        if all_passed:
            self.log("🎉 ALL TESTS PASSED!")
        else:
            self.log("⚠️  SOME TESTS FAILED - Check logs above")
        self.log("=" * 60)
        
        return all_passed

def main():
    """Main test runner"""
    tester = APITester()
    success = tester.run_tests()
    sys.exit(0 if success else 1)

if __name__ == "__main__":
    main()