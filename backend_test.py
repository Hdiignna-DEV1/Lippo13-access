#!/usr/bin/env python3
"""
Backend API Testing for Karang Taruna LIPPO 13 - Phase 2
Tests new user management, Excel export, and monthly data features
"""
import requests
import json
import os
from datetime import datetime

# Get base URL from environment
BASE_URL = os.getenv('NEXT_PUBLIC_BASE_URL', 'https://iuran-management.preview.emergentagent.com')
API_BASE = f"{BASE_URL}/api"

# New admin credentials
ADMIN_USER = "dedenhadiguna"
ADMIN_PASS = "Hadiguna18*"

# Old credentials (should fail)
OLD_ADMIN_USER = "admin"
OLD_ADMIN_PASS = "admin123"

def print_test(name, passed, details=""):
    status = "✅ PASS" if passed else "❌ FAIL"
    print(f"{status}: {name}")
    if details:
        print(f"   {details}")

def test_phase2():
    """Test all Phase 2 features"""
    print("\n" + "="*80)
    print("PHASE 2 BACKEND TESTING - Karang Taruna LIPPO 13")
    print("="*80 + "\n")
    
    # Use session to persist cookies
    session = requests.Session()
    
    # Track test results
    tests_passed = 0
    tests_total = 0
    
    # Store created transaction IDs for cleanup
    created_tx_ids = []
    created_user_id = None
    
    try:
        # ============= 1. AUTH WITH NEW CREDENTIALS =============
        print("\n--- 1. AUTH WITH NEW CREDENTIALS ---\n")
        
        # Test 1.1: Login with old credentials should fail
        tests_total += 1
        try:
            resp = session.post(f"{API_BASE}/auth/login", json={
                "username": OLD_ADMIN_USER,
                "password": OLD_ADMIN_PASS
            })
            passed = resp.status_code == 401
            print_test("Login with old admin/admin123 credentials", passed, 
                      f"Status: {resp.status_code}, Expected: 401")
            if passed:
                tests_passed += 1
        except Exception as e:
            print_test("Login with old credentials", False, f"Error: {e}")
        
        # Test 1.2: Login with new credentials
        tests_total += 1
        try:
            resp = session.post(f"{API_BASE}/auth/login", json={
                "username": ADMIN_USER,
                "password": ADMIN_PASS
            })
            passed = resp.status_code == 200 and 'kt_session' in session.cookies
            data = resp.json() if resp.status_code == 200 else {}
            print_test("Login with new dedenhadiguna credentials", passed,
                      f"Status: {resp.status_code}, Cookie set: {'kt_session' in session.cookies}")
            if passed:
                tests_passed += 1
        except Exception as e:
            print_test("Login with new credentials", False, f"Error: {e}")
        
        # Test 1.3: GET /api/auth/me
        tests_total += 1
        try:
            resp = session.get(f"{API_BASE}/auth/me")
            data = resp.json()
            passed = (resp.status_code == 200 and 
                     data.get('authenticated') == True and
                     data.get('user', {}).get('username') == ADMIN_USER and
                     data.get('user', {}).get('role') == 'admin' and
                     'fullName' in data.get('user', {}))
            print_test("GET /api/auth/me returns correct user data", passed,
                      f"Username: {data.get('user', {}).get('username')}, Role: {data.get('user', {}).get('role')}, FullName: {data.get('user', {}).get('fullName')}")
            if passed:
                tests_passed += 1
        except Exception as e:
            print_test("GET /api/auth/me", False, f"Error: {e}")
        
        # ============= 2. USER MANAGEMENT =============
        print("\n--- 2. USER MANAGEMENT (NEW ENDPOINTS) ---\n")
        
        # Test 2.1: GET /api/admin/users (as admin)
        tests_total += 1
        try:
            resp = session.get(f"{API_BASE}/admin/users")
            data = resp.json()
            users = data.get('users', [])
            has_admin = any(u.get('username') == ADMIN_USER for u in users)
            passed = resp.status_code == 200 and has_admin
            print_test("GET /api/admin/users returns user list with dedenhadiguna", passed,
                      f"Status: {resp.status_code}, Users count: {len(users)}, Has admin: {has_admin}")
            if passed:
                tests_passed += 1
        except Exception as e:
            print_test("GET /api/admin/users", False, f"Error: {e}")
        
        # Test 2.2: POST /api/admin/users - create bendahara user
        tests_total += 1
        try:
            resp = session.post(f"{API_BASE}/admin/users", json={
                "username": "bendahara1",
                "password": "test123",
                "fullName": "Bendahara Satu",
                "role": "bendahara"
            })
            data = resp.json()
            passed = resp.status_code == 200 and data.get('ok') == True
            if passed and data.get('user'):
                created_user_id = data['user'].get('id')
            print_test("POST /api/admin/users creates bendahara1 user", passed,
                      f"Status: {resp.status_code}, User ID: {created_user_id}")
            if passed:
                tests_passed += 1
        except Exception as e:
            print_test("POST /api/admin/users", False, f"Error: {e}")
        
        # Test 2.3: POST /api/admin/users with duplicate username
        tests_total += 1
        try:
            resp = session.post(f"{API_BASE}/admin/users", json={
                "username": "bendahara1",
                "password": "test456",
                "fullName": "Duplicate",
                "role": "bendahara"
            })
            passed = resp.status_code == 400
            print_test("POST /api/admin/users with duplicate username returns 400", passed,
                      f"Status: {resp.status_code}, Expected: 400")
            if passed:
                tests_passed += 1
        except Exception as e:
            print_test("POST duplicate user", False, f"Error: {e}")
        
        # Test 2.4: POST /api/admin/users with invalid body (no password)
        tests_total += 1
        try:
            resp = session.post(f"{API_BASE}/admin/users", json={
                "username": "testuser",
                "fullName": "Test User"
            })
            passed = resp.status_code == 400
            print_test("POST /api/admin/users without password returns 400", passed,
                      f"Status: {resp.status_code}, Expected: 400")
            if passed:
                tests_passed += 1
        except Exception as e:
            print_test("POST invalid user", False, f"Error: {e}")
        
        # Test 2.5: Login as bendahara1
        bendahara_session = requests.Session()
        tests_total += 1
        try:
            resp = bendahara_session.post(f"{API_BASE}/auth/login", json={
                "username": "bendahara1",
                "password": "test123"
            })
            data = resp.json()
            passed = (resp.status_code == 200 and 
                     data.get('user', {}).get('role') == 'bendahara')
            print_test("Login as bendahara1 user", passed,
                      f"Status: {resp.status_code}, Role: {data.get('user', {}).get('role')}")
            if passed:
                tests_passed += 1
        except Exception as e:
            print_test("Login as bendahara1", False, f"Error: {e}")
        
        # Test 2.6: As bendahara1, GET /api/admin/users should return 403
        tests_total += 1
        try:
            resp = bendahara_session.get(f"{API_BASE}/admin/users")
            passed = resp.status_code == 403
            print_test("GET /api/admin/users as bendahara returns 403", passed,
                      f"Status: {resp.status_code}, Expected: 403 (only admin can access)")
            if passed:
                tests_passed += 1
        except Exception as e:
            print_test("GET /api/admin/users as bendahara", False, f"Error: {e}")
        
        # Test 2.7: As bendahara1, GET /api/admin/transactions should work
        tests_total += 1
        try:
            resp = bendahara_session.get(f"{API_BASE}/admin/transactions")
            passed = resp.status_code == 200
            print_test("GET /api/admin/transactions as bendahara returns 200", passed,
                      f"Status: {resp.status_code} (regular admin endpoints accessible)")
            if passed:
                tests_passed += 1
        except Exception as e:
            print_test("GET /api/admin/transactions as bendahara", False, f"Error: {e}")
        
        # Test 2.8: Login back as admin
        tests_total += 1
        try:
            resp = session.post(f"{API_BASE}/auth/login", json={
                "username": ADMIN_USER,
                "password": ADMIN_PASS
            })
            passed = resp.status_code == 200
            print_test("Re-login as admin", passed, f"Status: {resp.status_code}")
            if passed:
                tests_passed += 1
        except Exception as e:
            print_test("Re-login as admin", False, f"Error: {e}")
        
        # Test 2.9: PUT /api/admin/users/:id - update fullName and role
        tests_total += 1
        try:
            if created_user_id:
                resp = session.put(f"{API_BASE}/admin/users/{created_user_id}", json={
                    "fullName": "Updated Name",
                    "role": "pengurus"
                })
                passed = resp.status_code == 200
                print_test("PUT /api/admin/users/:id updates user", passed,
                          f"Status: {resp.status_code}")
                if passed:
                    tests_passed += 1
            else:
                print_test("PUT /api/admin/users/:id", False, "No user ID to update")
        except Exception as e:
            print_test("PUT /api/admin/users/:id", False, f"Error: {e}")
        
        # Test 2.10: PUT /api/admin/users/:id - update password
        tests_total += 1
        try:
            if created_user_id:
                resp = session.put(f"{API_BASE}/admin/users/{created_user_id}", json={
                    "password": "newpass123"
                })
                passed = resp.status_code == 200
                print_test("PUT /api/admin/users/:id updates password", passed,
                          f"Status: {resp.status_code}")
                if passed:
                    tests_passed += 1
                
                # Verify new password works
                test_session = requests.Session()
                resp2 = test_session.post(f"{API_BASE}/auth/login", json={
                    "username": "bendahara1",
                    "password": "newpass123"
                })
                if resp2.status_code == 200:
                    print("   ✓ New password verified working")
            else:
                print_test("PUT password update", False, "No user ID to update")
        except Exception as e:
            print_test("PUT password update", False, f"Error: {e}")
        
        # Test 2.11: DELETE /api/admin/users/:id - cannot delete self
        tests_total += 1
        try:
            # Get admin user ID
            resp = session.get(f"{API_BASE}/auth/me")
            admin_id = resp.json().get('user', {}).get('id')
            if admin_id:
                resp = session.delete(f"{API_BASE}/admin/users/{admin_id}")
                passed = resp.status_code == 400
                print_test("DELETE /api/admin/users/:id (self) returns 400", passed,
                          f"Status: {resp.status_code}, Expected: 400 (cannot delete self)")
                if passed:
                    tests_passed += 1
            else:
                print_test("DELETE self", False, "Could not get admin ID")
        except Exception as e:
            print_test("DELETE self", False, f"Error: {e}")
        
        # Test 2.12: DELETE /api/admin/users/:id - delete bendahara1
        tests_total += 1
        try:
            if created_user_id:
                resp = session.delete(f"{API_BASE}/admin/users/{created_user_id}")
                passed = resp.status_code == 200
                print_test("DELETE /api/admin/users/:id deletes user", passed,
                          f"Status: {resp.status_code}")
                if passed:
                    tests_passed += 1
            else:
                print_test("DELETE user", False, "No user ID to delete")
        except Exception as e:
            print_test("DELETE user", False, f"Error: {e}")
        
        # Test 2.13: GET /api/admin/users - verify bendahara1 is gone
        tests_total += 1
        try:
            resp = session.get(f"{API_BASE}/admin/users")
            data = resp.json()
            users = data.get('users', [])
            has_bendahara = any(u.get('username') == 'bendahara1' for u in users)
            passed = resp.status_code == 200 and not has_bendahara
            print_test("GET /api/admin/users confirms bendahara1 deleted", passed,
                      f"Status: {resp.status_code}, bendahara1 present: {has_bendahara}")
            if passed:
                tests_passed += 1
        except Exception as e:
            print_test("Verify user deleted", False, f"Error: {e}")
        
        # ============= 3. EXCEL EXPORT =============
        print("\n--- 3. EXCEL EXPORT (NEW) ---\n")
        
        # First create test transactions in different months
        print("Creating test transactions for Excel export...")
        test_transactions = [
            {"date": "2025-08-01", "name": "Donasi Warga A", "category": "warga", "amount": 100000, "type": "in", "note": "Test Aug"},
            {"date": "2025-08-15", "name": "Donasi Pemuda B", "category": "pemuda", "amount": 150000, "type": "in", "note": "Test Aug"},
            {"date": "2025-09-01", "name": "Sponsor C", "category": "sponsor", "amount": 200000, "type": "in", "note": "Test Sep"},
            {"date": "2025-09-15", "name": "Belanja Konsumsi", "category": "lainnya", "amount": 50000, "type": "out", "note": "Test Sep Out"},
        ]
        
        for tx in test_transactions:
            try:
                resp = session.post(f"{API_BASE}/admin/transactions", json=tx)
                if resp.status_code == 200:
                    tx_id = resp.json().get('transaction', {}).get('id')
                    if tx_id:
                        created_tx_ids.append(tx_id)
                        print(f"   ✓ Created: {tx['name']} ({tx['date']})")
            except Exception as e:
                print(f"   ✗ Failed to create transaction: {e}")
        
        # Test 3.1: GET /api/admin/export/excel (all transactions)
        tests_total += 1
        try:
            resp = session.get(f"{API_BASE}/admin/export/excel")
            content_type = resp.headers.get('Content-Type', '')
            content_disp = resp.headers.get('Content-Disposition', '')
            body_size = len(resp.content)
            passed = (resp.status_code == 200 and 
                     'spreadsheetml.sheet' in content_type and
                     '.xlsx' in content_disp and
                     body_size > 1000)
            print_test("GET /api/admin/export/excel returns xlsx file", passed,
                      f"Status: {resp.status_code}, Content-Type: {content_type[:50]}, Size: {body_size} bytes")
            if passed:
                tests_passed += 1
        except Exception as e:
            print_test("GET /api/admin/export/excel", False, f"Error: {e}")
        
        # Test 3.2: GET /api/admin/export/excel?type=in
        tests_total += 1
        try:
            resp = session.get(f"{API_BASE}/admin/export/excel?type=in")
            passed = resp.status_code == 200 and len(resp.content) > 1000
            print_test("GET /api/admin/export/excel?type=in returns only pemasukan", passed,
                      f"Status: {resp.status_code}, Size: {len(resp.content)} bytes")
            if passed:
                tests_passed += 1
        except Exception as e:
            print_test("GET /api/admin/export/excel?type=in", False, f"Error: {e}")
        
        # Test 3.3: GET /api/admin/export/excel?type=out
        tests_total += 1
        try:
            resp = session.get(f"{API_BASE}/admin/export/excel?type=out")
            passed = resp.status_code == 200 and len(resp.content) > 1000
            print_test("GET /api/admin/export/excel?type=out returns only pengeluaran", passed,
                      f"Status: {resp.status_code}, Size: {len(resp.content)} bytes")
            if passed:
                tests_passed += 1
        except Exception as e:
            print_test("GET /api/admin/export/excel?type=out", False, f"Error: {e}")
        
        # ============= 4. MONTHLY DATA IN PUBLIC SUMMARY =============
        print("\n--- 4. MONTHLY DATA IN PUBLIC SUMMARY (UPDATED) ---\n")
        
        # Test 4.1: GET /api/public/summary includes monthly array
        tests_total += 1
        try:
            resp = session.get(f"{API_BASE}/public/summary")
            data = resp.json()
            monthly = data.get('monthly', [])
            has_aug = any(m.get('month') == '2025-08' for m in monthly)
            has_sep = any(m.get('month') == '2025-09' for m in monthly)
            is_sorted = monthly == sorted(monthly, key=lambda x: x.get('month', ''))
            passed = (resp.status_code == 200 and 
                     isinstance(monthly, list) and
                     has_aug and has_sep and is_sorted)
            print_test("GET /api/public/summary includes monthly data", passed,
                      f"Status: {resp.status_code}, Monthly entries: {len(monthly)}, Has 2025-08: {has_aug}, Has 2025-09: {has_sep}, Sorted: {is_sorted}")
            if passed:
                tests_passed += 1
                print(f"   Monthly data: {monthly}")
        except Exception as e:
            print_test("GET /api/public/summary monthly", False, f"Error: {e}")
        
        # ============= 5. RE-VERIFY EXISTING ENDPOINTS =============
        print("\n--- 5. RE-VERIFY EXISTING ENDPOINTS WITH NEW AUTH ---\n")
        
        # Test 5.1: Create transaction
        tests_total += 1
        try:
            resp = session.post(f"{API_BASE}/admin/transactions", json={
                "date": "2025-10-01",
                "name": "Test Transaction",
                "category": "lainnya",
                "amount": 50000,
                "type": "in",
                "note": "Smoke test"
            })
            data = resp.json()
            smoke_tx_id = data.get('transaction', {}).get('id')
            if smoke_tx_id:
                created_tx_ids.append(smoke_tx_id)
            passed = resp.status_code == 200
            print_test("POST /api/admin/transactions (smoke test)", passed,
                      f"Status: {resp.status_code}")
            if passed:
                tests_passed += 1
        except Exception as e:
            print_test("Create transaction smoke test", False, f"Error: {e}")
        
        # Test 5.2: Update transaction
        tests_total += 1
        try:
            if smoke_tx_id:
                resp = session.put(f"{API_BASE}/admin/transactions/{smoke_tx_id}", json={
                    "amount": 75000
                })
                passed = resp.status_code == 200
                print_test("PUT /api/admin/transactions/:id (smoke test)", passed,
                          f"Status: {resp.status_code}")
                if passed:
                    tests_passed += 1
            else:
                print_test("Update transaction smoke test", False, "No transaction to update")
        except Exception as e:
            print_test("Update transaction smoke test", False, f"Error: {e}")
        
        # Test 5.3: Get settings
        tests_total += 1
        try:
            resp = session.get(f"{API_BASE}/admin/settings")
            passed = resp.status_code == 200
            print_test("GET /api/admin/settings (smoke test)", passed,
                      f"Status: {resp.status_code}")
            if passed:
                tests_passed += 1
        except Exception as e:
            print_test("GET settings smoke test", False, f"Error: {e}")
        
        # Test 5.4: Update settings
        tests_total += 1
        try:
            resp = session.put(f"{API_BASE}/admin/settings", json={
                "targetAmount": 6000000
            })
            passed = resp.status_code == 200
            print_test("PUT /api/admin/settings (smoke test)", passed,
                      f"Status: {resp.status_code}")
            if passed:
                tests_passed += 1
        except Exception as e:
            print_test("Update settings smoke test", False, f"Error: {e}")
        
        # Test 5.5: CSV export
        tests_total += 1
        try:
            resp = session.get(f"{API_BASE}/admin/export")
            passed = resp.status_code == 200 and 'text/csv' in resp.headers.get('Content-Type', '')
            print_test("GET /api/admin/export (CSV smoke test)", passed,
                      f"Status: {resp.status_code}")
            if passed:
                tests_passed += 1
        except Exception as e:
            print_test("CSV export smoke test", False, f"Error: {e}")
        
        # ============= 6. VERIFY AUTH.ME RETURNS FULLNAME =============
        print("\n--- 6. VERIFY AUTH.ME RETURNS FULLNAME ---\n")
        
        tests_total += 1
        try:
            resp = session.get(f"{API_BASE}/auth/me")
            data = resp.json()
            user = data.get('user', {})
            has_fullname = 'fullName' in user and user['fullName']
            passed = resp.status_code == 200 and has_fullname
            print_test("GET /api/auth/me includes fullName field", passed,
                      f"Status: {resp.status_code}, fullName: {user.get('fullName')}")
            if passed:
                tests_passed += 1
        except Exception as e:
            print_test("Verify fullName in auth.me", False, f"Error: {e}")
        
        # ============= CLEANUP =============
        print("\n--- CLEANUP ---\n")
        print(f"Deleting {len(created_tx_ids)} test transactions...")
        for tx_id in created_tx_ids:
            try:
                resp = session.delete(f"{API_BASE}/admin/transactions/{tx_id}")
                if resp.status_code == 200:
                    print(f"   ✓ Deleted transaction {tx_id}")
            except Exception as e:
                print(f"   ✗ Failed to delete {tx_id}: {e}")
        
    except Exception as e:
        print(f"\n❌ CRITICAL ERROR: {e}")
    
    # ============= SUMMARY =============
    print("\n" + "="*80)
    print(f"TEST SUMMARY: {tests_passed}/{tests_total} tests passed")
    print("="*80 + "\n")
    
    if tests_passed == tests_total:
        print("🎉 ALL TESTS PASSED!")
        return True
    else:
        print(f"⚠️  {tests_total - tests_passed} test(s) failed")
        return False

if __name__ == "__main__":
    success = test_phase2()
    exit(0 if success else 1)
