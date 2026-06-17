#!/usr/bin/env python3
"""
Backend API Test Suite for Karang Taruna Financial Management System
Tests all endpoints as specified in the review request
"""

import requests
import json
import base64
import sys

# Base URL from .env
BASE_URL = "https://5d99846b-e3f1-40f3-9124-c090ff3b595a.preview.emergentagent.com"
API_BASE = f"{BASE_URL}/api"

# Admin credentials
ADMIN_USERNAME = "admin"
ADMIN_PASSWORD = "admin123"

# Test results tracking
test_results = {
    "passed": 0,
    "failed": 0,
    "errors": []
}

def log_test(name, passed, details=""):
    """Log test result"""
    if passed:
        test_results["passed"] += 1
        print(f"✅ PASS: {name}")
        if details:
            print(f"   {details}")
    else:
        test_results["failed"] += 1
        test_results["errors"].append(f"{name}: {details}")
        print(f"❌ FAIL: {name}")
        print(f"   {details}")

def print_section(title):
    """Print section header"""
    print(f"\n{'='*80}")
    print(f"  {title}")
    print(f"{'='*80}\n")

def test_public_endpoints():
    """Test 1: PUBLIC endpoints (no auth)"""
    print_section("TEST 1: PUBLIC ENDPOINTS (NO AUTH)")
    
    try:
        # GET /api/public/summary
        print("Testing GET /api/public/summary...")
        resp = requests.get(f"{API_BASE}/public/summary", timeout=10)
        print(f"Status: {resp.status_code}")
        print(f"Response: {resp.text[:500]}")
        
        if resp.status_code == 200:
            data = resp.json()
            # Check required fields
            has_target = "target" in data and data["target"] == 6000000
            has_totalIn = "totalIn" in data
            has_byCategory = "byCategory" in data
            has_hasProposal = "hasProposal" in data
            
            if has_target and has_totalIn and has_byCategory and has_hasProposal:
                categories = data.get("byCategory", {})
                has_all_cats = all(cat in categories for cat in ["warga", "pemuda", "sponsor", "lainnya"])
                if has_all_cats:
                    log_test("GET /api/public/summary", True, 
                            f"target={data['target']}, totalIn={data['totalIn']}, hasProposal={data['hasProposal']}")
                else:
                    log_test("GET /api/public/summary", False, 
                            f"Missing categories. Got: {list(categories.keys())}")
            else:
                log_test("GET /api/public/summary", False, 
                        f"Missing required fields. Got: {list(data.keys())}")
        else:
            log_test("GET /api/public/summary", False, f"Expected 200, got {resp.status_code}")
    except Exception as e:
        log_test("GET /api/public/summary", False, f"Exception: {str(e)}")
    
    try:
        # GET /api/public/transactions
        print("\nTesting GET /api/public/transactions...")
        resp = requests.get(f"{API_BASE}/public/transactions", timeout=10)
        print(f"Status: {resp.status_code}")
        print(f"Response: {resp.text[:500]}")
        
        if resp.status_code == 200:
            data = resp.json()
            if "transactions" in data and isinstance(data["transactions"], list):
                log_test("GET /api/public/transactions", True, 
                        f"Returns transactions array (count: {len(data['transactions'])})")
            else:
                log_test("GET /api/public/transactions", False, 
                        f"Expected transactions array, got: {data}")
        else:
            log_test("GET /api/public/transactions", False, f"Expected 200, got {resp.status_code}")
    except Exception as e:
        log_test("GET /api/public/transactions", False, f"Exception: {str(e)}")
    
    try:
        # GET /api/public/proposal (should be 404 initially)
        print("\nTesting GET /api/public/proposal (expect 404)...")
        resp = requests.get(f"{API_BASE}/public/proposal", timeout=10)
        print(f"Status: {resp.status_code}")
        
        if resp.status_code == 404:
            log_test("GET /api/public/proposal (no proposal yet)", True, "Returns 404 as expected")
        else:
            log_test("GET /api/public/proposal (no proposal yet)", False, 
                    f"Expected 404, got {resp.status_code}")
    except Exception as e:
        log_test("GET /api/public/proposal (no proposal yet)", False, f"Exception: {str(e)}")

def test_auth_flow():
    """Test 2: AUTH flow"""
    print_section("TEST 2: AUTH FLOW")
    
    session = requests.Session()
    
    try:
        # POST /api/auth/login with WRONG password
        print("Testing POST /api/auth/login with WRONG password...")
        resp = session.post(f"{API_BASE}/auth/login", 
                           json={"username": ADMIN_USERNAME, "password": "wrongpassword"},
                           timeout=10)
        print(f"Status: {resp.status_code}")
        print(f"Response: {resp.text[:500]}")
        
        if resp.status_code == 401:
            log_test("POST /api/auth/login (wrong password)", True, "Returns 401 as expected")
        else:
            log_test("POST /api/auth/login (wrong password)", False, 
                    f"Expected 401, got {resp.status_code}")
    except Exception as e:
        log_test("POST /api/auth/login (wrong password)", False, f"Exception: {str(e)}")
    
    try:
        # POST /api/auth/login with CORRECT credentials
        print("\nTesting POST /api/auth/login with correct credentials...")
        resp = session.post(f"{API_BASE}/auth/login", 
                           json={"username": ADMIN_USERNAME, "password": ADMIN_PASSWORD},
                           timeout=10)
        print(f"Status: {resp.status_code}")
        print(f"Response: {resp.text[:500]}")
        print(f"Cookies: {session.cookies.get_dict()}")
        
        if resp.status_code == 200:
            data = resp.json()
            has_cookie = "kt_session" in session.cookies
            if data.get("ok") and has_cookie:
                log_test("POST /api/auth/login (correct credentials)", True, 
                        f"Login successful, cookie set: {has_cookie}")
            else:
                log_test("POST /api/auth/login (correct credentials)", False, 
                        f"Login response ok={data.get('ok')}, cookie={has_cookie}")
        else:
            log_test("POST /api/auth/login (correct credentials)", False, 
                    f"Expected 200, got {resp.status_code}")
    except Exception as e:
        log_test("POST /api/auth/login (correct credentials)", False, f"Exception: {str(e)}")
    
    try:
        # GET /api/auth/me with cookie
        print("\nTesting GET /api/auth/me with cookie...")
        resp = session.get(f"{API_BASE}/auth/me", timeout=10)
        print(f"Status: {resp.status_code}")
        print(f"Response: {resp.text[:500]}")
        
        if resp.status_code == 200:
            data = resp.json()
            if data.get("authenticated") and data.get("user", {}).get("username") == ADMIN_USERNAME:
                log_test("GET /api/auth/me (with cookie)", True, 
                        f"authenticated={data['authenticated']}, username={data['user']['username']}")
            else:
                log_test("GET /api/auth/me (with cookie)", False, 
                        f"Expected authenticated=true, username=admin. Got: {data}")
        else:
            log_test("GET /api/auth/me (with cookie)", False, f"Expected 200, got {resp.status_code}")
    except Exception as e:
        log_test("GET /api/auth/me (with cookie)", False, f"Exception: {str(e)}")
    
    try:
        # GET /api/admin/transactions WITHOUT cookie (new session)
        print("\nTesting GET /api/admin/transactions WITHOUT cookie...")
        no_auth_session = requests.Session()
        resp = no_auth_session.get(f"{API_BASE}/admin/transactions", timeout=10)
        print(f"Status: {resp.status_code}")
        print(f"Response: {resp.text[:500]}")
        
        if resp.status_code == 401:
            log_test("GET /api/admin/transactions (no auth)", True, "Returns 401 as expected")
        else:
            log_test("GET /api/admin/transactions (no auth)", False, 
                    f"Expected 401, got {resp.status_code}")
    except Exception as e:
        log_test("GET /api/admin/transactions (no auth)", False, f"Exception: {str(e)}")
    
    return session

def test_admin_transactions_crud(session):
    """Test 3: ADMIN TRANSACTIONS CRUD (with cookie)"""
    print_section("TEST 3: ADMIN TRANSACTIONS CRUD")
    
    created_ids = []
    
    try:
        # POST transaction 1: type=in, category=warga
        print("Testing POST /api/admin/transactions (warga)...")
        tx1_data = {
            "date": "2025-08-01",
            "name": "RT 03 Minggu 1",
            "category": "warga",
            "amount": 50000,
            "note": "contoh pemasukan warga",
            "type": "in"
        }
        resp = session.post(f"{API_BASE}/admin/transactions", json=tx1_data, timeout=10)
        print(f"Status: {resp.status_code}")
        print(f"Response: {resp.text[:500]}")
        
        if resp.status_code == 200:
            data = resp.json()
            if data.get("ok") and data.get("transaction", {}).get("id"):
                tx1_id = data["transaction"]["id"]
                created_ids.append(tx1_id)
                log_test("POST /api/admin/transactions (warga)", True, f"Created tx id={tx1_id}")
            else:
                log_test("POST /api/admin/transactions (warga)", False, f"Missing id in response: {data}")
        else:
            log_test("POST /api/admin/transactions (warga)", False, 
                    f"Expected 200, got {resp.status_code}: {resp.text}")
    except Exception as e:
        log_test("POST /api/admin/transactions (warga)", False, f"Exception: {str(e)}")
    
    try:
        # POST transaction 2: type=in, category=pemuda
        print("\nTesting POST /api/admin/transactions (pemuda)...")
        tx2_data = {
            "date": "2025-08-02",
            "name": "Iuran Pemuda",
            "category": "pemuda",
            "amount": 100000,
            "note": "iuran bulanan",
            "type": "in"
        }
        resp = session.post(f"{API_BASE}/admin/transactions", json=tx2_data, timeout=10)
        print(f"Status: {resp.status_code}")
        
        if resp.status_code == 200:
            data = resp.json()
            if data.get("ok") and data.get("transaction", {}).get("id"):
                tx2_id = data["transaction"]["id"]
                created_ids.append(tx2_id)
                log_test("POST /api/admin/transactions (pemuda)", True, f"Created tx id={tx2_id}")
            else:
                log_test("POST /api/admin/transactions (pemuda)", False, f"Missing id in response")
        else:
            log_test("POST /api/admin/transactions (pemuda)", False, f"Expected 200, got {resp.status_code}")
    except Exception as e:
        log_test("POST /api/admin/transactions (pemuda)", False, f"Exception: {str(e)}")
    
    try:
        # POST transaction 3: type=in, category=sponsor
        print("\nTesting POST /api/admin/transactions (sponsor)...")
        tx3_data = {
            "date": "2025-08-03",
            "name": "Sponsor PT ABC",
            "category": "sponsor",
            "amount": 500000,
            "note": "sponsor utama",
            "type": "in"
        }
        resp = session.post(f"{API_BASE}/admin/transactions", json=tx3_data, timeout=10)
        print(f"Status: {resp.status_code}")
        
        if resp.status_code == 200:
            data = resp.json()
            if data.get("ok") and data.get("transaction", {}).get("id"):
                tx3_id = data["transaction"]["id"]
                created_ids.append(tx3_id)
                log_test("POST /api/admin/transactions (sponsor)", True, f"Created tx id={tx3_id}")
            else:
                log_test("POST /api/admin/transactions (sponsor)", False, f"Missing id in response")
        else:
            log_test("POST /api/admin/transactions (sponsor)", False, f"Expected 200, got {resp.status_code}")
    except Exception as e:
        log_test("POST /api/admin/transactions (sponsor)", False, f"Exception: {str(e)}")
    
    try:
        # POST transaction 4: type=out, category=lainnya
        print("\nTesting POST /api/admin/transactions (pengeluaran)...")
        tx4_data = {
            "date": "2025-08-04",
            "name": "Beli bendera",
            "category": "lainnya",
            "amount": 25000,
            "note": "bendera merah putih",
            "type": "out"
        }
        resp = session.post(f"{API_BASE}/admin/transactions", json=tx4_data, timeout=10)
        print(f"Status: {resp.status_code}")
        
        if resp.status_code == 200:
            data = resp.json()
            if data.get("ok") and data.get("transaction", {}).get("id"):
                tx4_id = data["transaction"]["id"]
                created_ids.append(tx4_id)
                log_test("POST /api/admin/transactions (pengeluaran)", True, f"Created tx id={tx4_id}")
            else:
                log_test("POST /api/admin/transactions (pengeluaran)", False, f"Missing id in response")
        else:
            log_test("POST /api/admin/transactions (pengeluaran)", False, f"Expected 200, got {resp.status_code}")
    except Exception as e:
        log_test("POST /api/admin/transactions (pengeluaran)", False, f"Exception: {str(e)}")
    
    try:
        # GET /api/admin/transactions - should have 4 transactions
        print("\nTesting GET /api/admin/transactions (expect 4 transactions)...")
        resp = session.get(f"{API_BASE}/admin/transactions", timeout=10)
        print(f"Status: {resp.status_code}")
        
        if resp.status_code == 200:
            data = resp.json()
            tx_count = len(data.get("transactions", []))
            if tx_count == 4:
                log_test("GET /api/admin/transactions (count)", True, f"Found {tx_count} transactions")
            else:
                log_test("GET /api/admin/transactions (count)", False, 
                        f"Expected 4 transactions, got {tx_count}")
        else:
            log_test("GET /api/admin/transactions (count)", False, f"Expected 200, got {resp.status_code}")
    except Exception as e:
        log_test("GET /api/admin/transactions (count)", False, f"Exception: {str(e)}")
    
    # PUT - update first transaction
    if created_ids:
        try:
            print(f"\nTesting PUT /api/admin/transactions/{created_ids[0]}...")
            update_data = {
                "amount": 75000,
                "note": "updated note"
            }
            resp = session.put(f"{API_BASE}/admin/transactions/{created_ids[0]}", 
                             json=update_data, timeout=10)
            print(f"Status: {resp.status_code}")
            print(f"Response: {resp.text[:500]}")
            
            if resp.status_code == 200:
                data = resp.json()
                if data.get("ok"):
                    log_test("PUT /api/admin/transactions", True, f"Updated tx {created_ids[0]}")
                else:
                    log_test("PUT /api/admin/transactions", False, f"Response not ok: {data}")
            else:
                log_test("PUT /api/admin/transactions", False, 
                        f"Expected 200, got {resp.status_code}: {resp.text}")
        except Exception as e:
            log_test("PUT /api/admin/transactions", False, f"Exception: {str(e)}")
    
    # DELETE - delete last transaction
    if created_ids:
        try:
            print(f"\nTesting DELETE /api/admin/transactions/{created_ids[-1]}...")
            resp = session.delete(f"{API_BASE}/admin/transactions/{created_ids[-1]}", timeout=10)
            print(f"Status: {resp.status_code}")
            print(f"Response: {resp.text[:500]}")
            
            if resp.status_code == 200:
                data = resp.json()
                if data.get("ok"):
                    log_test("DELETE /api/admin/transactions", True, f"Deleted tx {created_ids[-1]}")
                    created_ids.pop()  # Remove from list
                else:
                    log_test("DELETE /api/admin/transactions", False, f"Response not ok: {data}")
            else:
                log_test("DELETE /api/admin/transactions", False, 
                        f"Expected 200, got {resp.status_code}: {resp.text}")
        except Exception as e:
            log_test("DELETE /api/admin/transactions", False, f"Exception: {str(e)}")
    
    try:
        # Verify GET /api/public/summary reflects updated totals
        print("\nTesting GET /api/public/summary (verify updated totals)...")
        resp = requests.get(f"{API_BASE}/public/summary", timeout=10)
        print(f"Status: {resp.status_code}")
        
        if resp.status_code == 200:
            data = resp.json()
            # After updates: warga=75000, pemuda=100000, sponsor=500000, out=25000
            # Total in = 675000, total out = 25000, balance = 650000
            expected_totalIn = 675000
            expected_totalOut = 25000
            expected_balance = 650000
            
            totalIn = data.get("totalIn", 0)
            totalOut = data.get("totalOut", 0)
            balance = data.get("balance", 0)
            
            if totalIn == expected_totalIn and totalOut == expected_totalOut and balance == expected_balance:
                log_test("GET /api/public/summary (updated totals)", True, 
                        f"totalIn={totalIn}, totalOut={totalOut}, balance={balance}")
            else:
                log_test("GET /api/public/summary (updated totals)", False, 
                        f"Expected totalIn={expected_totalIn}, totalOut={expected_totalOut}, balance={expected_balance}. "
                        f"Got totalIn={totalIn}, totalOut={totalOut}, balance={balance}")
        else:
            log_test("GET /api/public/summary (updated totals)", False, 
                    f"Expected 200, got {resp.status_code}")
    except Exception as e:
        log_test("GET /api/public/summary (updated totals)", False, f"Exception: {str(e)}")
    
    return session

def test_admin_settings(session):
    """Test 4: ADMIN SETTINGS"""
    print_section("TEST 4: ADMIN SETTINGS")
    
    try:
        # GET /api/admin/settings
        print("Testing GET /api/admin/settings...")
        resp = session.get(f"{API_BASE}/admin/settings", timeout=10)
        print(f"Status: {resp.status_code}")
        print(f"Response: {resp.text[:500]}")
        
        if resp.status_code == 200:
            data = resp.json()
            has_fields = all(k in data for k in ["targetAmount", "organizationName", "eventName"])
            if has_fields:
                log_test("GET /api/admin/settings", True, 
                        f"targetAmount={data['targetAmount']}, org={data['organizationName']}")
            else:
                log_test("GET /api/admin/settings", False, f"Missing required fields: {list(data.keys())}")
        else:
            log_test("GET /api/admin/settings", False, f"Expected 200, got {resp.status_code}")
    except Exception as e:
        log_test("GET /api/admin/settings", False, f"Exception: {str(e)}")
    
    try:
        # PUT /api/admin/settings - update target
        print("\nTesting PUT /api/admin/settings (update target)...")
        update_data = {"targetAmount": 10000000}
        resp = session.put(f"{API_BASE}/admin/settings", json=update_data, timeout=10)
        print(f"Status: {resp.status_code}")
        print(f"Response: {resp.text[:500]}")
        
        if resp.status_code == 200:
            data = resp.json()
            if data.get("ok"):
                log_test("PUT /api/admin/settings", True, "Updated targetAmount to 10000000")
            else:
                log_test("PUT /api/admin/settings", False, f"Response not ok: {data}")
        else:
            log_test("PUT /api/admin/settings", False, f"Expected 200, got {resp.status_code}")
    except Exception as e:
        log_test("PUT /api/admin/settings", False, f"Exception: {str(e)}")
    
    try:
        # Verify GET /api/public/summary returns updated target
        print("\nTesting GET /api/public/summary (verify updated target)...")
        resp = requests.get(f"{API_BASE}/public/summary", timeout=10)
        print(f"Status: {resp.status_code}")
        
        if resp.status_code == 200:
            data = resp.json()
            if data.get("target") == 10000000:
                log_test("GET /api/public/summary (updated target)", True, 
                        f"target={data['target']}")
            else:
                log_test("GET /api/public/summary (updated target)", False, 
                        f"Expected target=10000000, got {data.get('target')}")
        else:
            log_test("GET /api/public/summary (updated target)", False, 
                    f"Expected 200, got {resp.status_code}")
    except Exception as e:
        log_test("GET /api/public/summary (updated target)", False, f"Exception: {str(e)}")
    
    return session

def test_proposal_upload(session):
    """Test 5: PROPOSAL UPLOAD"""
    print_section("TEST 5: PROPOSAL UPLOAD/DOWNLOAD/DELETE")
    
    # Create a minimal base64 PDF (just a header for testing)
    fake_pdf_base64 = "JVBERi0xLjQKJeLjz9MKMyAwIG9iago8PC9UeXBlL1BhZ2UvUGFyZW50IDIgMCBSL01lZGlhQm94WzAgMCA2MTIgNzkyXS9Db250ZW50cyA0IDAgUj4+CmVuZG9iago0IDAgb2JqCjw8L0xlbmd0aCA0ND4+CnN0cmVhbQpCVAovRjEgMTIgVGYKNzIgNzIwIFRkCihUZXN0IFByb3Bvc2FsKSBUagpFVAplbmRzdHJlYW0KZW5kb2JqCjEgMCBvYmoKPDwvVHlwZS9DYXRhbG9nL1BhZ2VzIDIgMCBSPj4KZW5kb2JqCjIgMCBvYmoKPDwvVHlwZS9QYWdlcy9LaWRzWzMgMCBSXS9Db3VudCAxPj4KZW5kb2JqCnhyZWYKMCA1CjAwMDAwMDAwMDAgNjU1MzUgZiAKMDAwMDAwMDE4OSAwMDAwMCBuIAowMDAwMDAwMjM4IDAwMDAwIG4gCjAwMDAwMDAwMTUgMDAwMDAgbiAKMDAwMDAwMDEwMCAwMDAwMCBuIAp0cmFpbGVyCjw8L1NpemUgNS9Sb290IDEgMCBSPj4Kc3RhcnR4cmVmCjI5NQolJUVPRgo="
    
    try:
        # POST /api/admin/settings/proposal
        print("Testing POST /api/admin/settings/proposal...")
        proposal_data = {
            "fileBase64": fake_pdf_base64,
            "fileName": "proposal-test.pdf",
            "mimeType": "application/pdf"
        }
        resp = session.post(f"{API_BASE}/admin/settings/proposal", json=proposal_data, timeout=10)
        print(f"Status: {resp.status_code}")
        print(f"Response: {resp.text[:500]}")
        
        if resp.status_code == 200:
            data = resp.json()
            if data.get("ok"):
                log_test("POST /api/admin/settings/proposal", True, "Proposal uploaded")
            else:
                log_test("POST /api/admin/settings/proposal", False, f"Response not ok: {data}")
        else:
            log_test("POST /api/admin/settings/proposal", False, 
                    f"Expected 200, got {resp.status_code}: {resp.text}")
    except Exception as e:
        log_test("POST /api/admin/settings/proposal", False, f"Exception: {str(e)}")
    
    try:
        # GET /api/public/proposal - should return PDF
        print("\nTesting GET /api/public/proposal (expect 200 with PDF)...")
        resp = requests.get(f"{API_BASE}/public/proposal", timeout=10)
        print(f"Status: {resp.status_code}")
        print(f"Content-Type: {resp.headers.get('Content-Type')}")
        print(f"Content-Disposition: {resp.headers.get('Content-Disposition')}")
        
        if resp.status_code == 200:
            content_type = resp.headers.get('Content-Type', '')
            content_disp = resp.headers.get('Content-Disposition', '')
            
            if 'application/pdf' in content_type and 'attachment' in content_disp:
                log_test("GET /api/public/proposal (with file)", True, 
                        f"PDF returned with correct headers")
            else:
                log_test("GET /api/public/proposal (with file)", False, 
                        f"Content-Type={content_type}, Content-Disposition={content_disp}")
        else:
            log_test("GET /api/public/proposal (with file)", False, 
                    f"Expected 200, got {resp.status_code}")
    except Exception as e:
        log_test("GET /api/public/proposal (with file)", False, f"Exception: {str(e)}")
    
    try:
        # DELETE /api/admin/settings/proposal
        print("\nTesting DELETE /api/admin/settings/proposal...")
        resp = session.delete(f"{API_BASE}/admin/settings/proposal", timeout=10)
        print(f"Status: {resp.status_code}")
        print(f"Response: {resp.text[:500]}")
        
        if resp.status_code == 200:
            data = resp.json()
            if data.get("ok"):
                log_test("DELETE /api/admin/settings/proposal", True, "Proposal deleted")
            else:
                log_test("DELETE /api/admin/settings/proposal", False, f"Response not ok: {data}")
        else:
            log_test("DELETE /api/admin/settings/proposal", False, 
                    f"Expected 200, got {resp.status_code}")
    except Exception as e:
        log_test("DELETE /api/admin/settings/proposal", False, f"Exception: {str(e)}")
    
    try:
        # GET /api/public/proposal - should be 404 now
        print("\nTesting GET /api/public/proposal (expect 404 after delete)...")
        resp = requests.get(f"{API_BASE}/public/proposal", timeout=10)
        print(f"Status: {resp.status_code}")
        
        if resp.status_code == 404:
            log_test("GET /api/public/proposal (after delete)", True, "Returns 404 as expected")
        else:
            log_test("GET /api/public/proposal (after delete)", False, 
                    f"Expected 404, got {resp.status_code}")
    except Exception as e:
        log_test("GET /api/public/proposal (after delete)", False, f"Exception: {str(e)}")
    
    return session

def test_csv_export(session):
    """Test 6: CSV EXPORT"""
    print_section("TEST 6: CSV EXPORT")
    
    try:
        # GET /api/admin/export (all transactions)
        print("Testing GET /api/admin/export (all)...")
        resp = session.get(f"{API_BASE}/admin/export", timeout=10)
        print(f"Status: {resp.status_code}")
        print(f"Content-Type: {resp.headers.get('Content-Type')}")
        print(f"Content-Disposition: {resp.headers.get('Content-Disposition')}")
        print(f"Response preview: {resp.text[:200]}")
        
        if resp.status_code == 200:
            content_type = resp.headers.get('Content-Type', '')
            csv_text = resp.text
            
            # Check for BOM
            has_bom = csv_text.startswith('\ufeff')
            # Check for CSV headers
            has_headers = 'Tanggal' in csv_text and 'Nama' in csv_text and 'Kategori' in csv_text
            
            if 'text/csv' in content_type and has_bom and has_headers:
                log_test("GET /api/admin/export (all)", True, 
                        f"CSV with BOM and headers returned")
            else:
                log_test("GET /api/admin/export (all)", False, 
                        f"Content-Type={content_type}, has_bom={has_bom}, has_headers={has_headers}")
        else:
            log_test("GET /api/admin/export (all)", False, f"Expected 200, got {resp.status_code}")
    except Exception as e:
        log_test("GET /api/admin/export (all)", False, f"Exception: {str(e)}")
    
    try:
        # GET /api/admin/export?type=in
        print("\nTesting GET /api/admin/export?type=in...")
        resp = session.get(f"{API_BASE}/admin/export?type=in", timeout=10)
        print(f"Status: {resp.status_code}")
        
        if resp.status_code == 200:
            csv_text = resp.text
            # Should only have "Pemasukan" rows
            has_pemasukan = 'Pemasukan' in csv_text
            has_pengeluaran = 'Pengeluaran' in csv_text
            
            if has_pemasukan and not has_pengeluaran:
                log_test("GET /api/admin/export?type=in", True, "Only pemasukan rows returned")
            else:
                log_test("GET /api/admin/export?type=in", False, 
                        f"has_pemasukan={has_pemasukan}, has_pengeluaran={has_pengeluaran}")
        else:
            log_test("GET /api/admin/export?type=in", False, f"Expected 200, got {resp.status_code}")
    except Exception as e:
        log_test("GET /api/admin/export?type=in", False, f"Exception: {str(e)}")
    
    try:
        # GET /api/admin/export?type=out
        print("\nTesting GET /api/admin/export?type=out...")
        resp = session.get(f"{API_BASE}/admin/export?type=out", timeout=10)
        print(f"Status: {resp.status_code}")
        
        if resp.status_code == 200:
            csv_text = resp.text
            # Should only have "Pengeluaran" rows
            has_pemasukan = 'Pemasukan' in csv_text
            has_pengeluaran = 'Pengeluaran' in csv_text
            
            if has_pengeluaran and not has_pemasukan:
                log_test("GET /api/admin/export?type=out", True, "Only pengeluaran rows returned")
            else:
                log_test("GET /api/admin/export?type=out", False, 
                        f"has_pemasukan={has_pemasukan}, has_pengeluaran={has_pengeluaran}")
        else:
            log_test("GET /api/admin/export?type=out", False, f"Expected 200, got {resp.status_code}")
    except Exception as e:
        log_test("GET /api/admin/export?type=out", False, f"Exception: {str(e)}")
    
    return session

def test_logout(session):
    """Test 7: LOGOUT"""
    print_section("TEST 7: LOGOUT")
    
    try:
        # POST /api/auth/logout
        print("Testing POST /api/auth/logout...")
        resp = session.post(f"{API_BASE}/auth/logout", timeout=10)
        print(f"Status: {resp.status_code}")
        print(f"Response: {resp.text[:500]}")
        print(f"Cookies after logout: {session.cookies.get_dict()}")
        
        if resp.status_code == 200:
            data = resp.json()
            # Check if cookie is cleared (empty or expired)
            cookie_cleared = session.cookies.get('kt_session') is None or session.cookies.get('kt_session') == ''
            
            if data.get("ok"):
                log_test("POST /api/auth/logout", True, f"Logout successful, cookie_cleared={cookie_cleared}")
            else:
                log_test("POST /api/auth/logout", False, f"Response not ok: {data}")
        else:
            log_test("POST /api/auth/logout", False, f"Expected 200, got {resp.status_code}")
    except Exception as e:
        log_test("POST /api/auth/logout", False, f"Exception: {str(e)}")
    
    try:
        # GET /api/auth/me - should return authenticated=false
        print("\nTesting GET /api/auth/me (after logout)...")
        resp = session.get(f"{API_BASE}/auth/me", timeout=10)
        print(f"Status: {resp.status_code}")
        print(f"Response: {resp.text[:500]}")
        
        if resp.status_code == 200:
            data = resp.json()
            if data.get("authenticated") == False:
                log_test("GET /api/auth/me (after logout)", True, "authenticated=false")
            else:
                log_test("GET /api/auth/me (after logout)", False, 
                        f"Expected authenticated=false, got {data}")
        else:
            log_test("GET /api/auth/me (after logout)", False, f"Expected 200, got {resp.status_code}")
    except Exception as e:
        log_test("GET /api/auth/me (after logout)", False, f"Exception: {str(e)}")
    
    try:
        # GET /api/admin/transactions - should return 401
        print("\nTesting GET /api/admin/transactions (after logout)...")
        resp = session.get(f"{API_BASE}/admin/transactions", timeout=10)
        print(f"Status: {resp.status_code}")
        
        if resp.status_code == 401:
            log_test("GET /api/admin/transactions (after logout)", True, "Returns 401 as expected")
        else:
            log_test("GET /api/admin/transactions (after logout)", False, 
                    f"Expected 401, got {resp.status_code}")
    except Exception as e:
        log_test("GET /api/admin/transactions (after logout)", False, f"Exception: {str(e)}")

def print_summary():
    """Print test summary"""
    print_section("TEST SUMMARY")
    print(f"Total Tests: {test_results['passed'] + test_results['failed']}")
    print(f"✅ Passed: {test_results['passed']}")
    print(f"❌ Failed: {test_results['failed']}")
    
    if test_results['errors']:
        print("\n❌ FAILED TESTS:")
        for error in test_results['errors']:
            print(f"  - {error}")
    
    print("\n" + "="*80)
    
    if test_results['failed'] == 0:
        print("🎉 ALL TESTS PASSED!")
        return 0
    else:
        print("⚠️  SOME TESTS FAILED")
        return 1

def main():
    """Main test runner"""
    print("="*80)
    print("  KARANG TARUNA FINANCIAL MANAGEMENT SYSTEM - BACKEND API TESTS")
    print("="*80)
    print(f"Base URL: {BASE_URL}")
    print(f"API Base: {API_BASE}")
    print("="*80)
    
    # Run all tests in sequence
    test_public_endpoints()
    session = test_auth_flow()
    session = test_admin_transactions_crud(session)
    session = test_admin_settings(session)
    session = test_proposal_upload(session)
    session = test_csv_export(session)
    test_logout(session)
    
    # Print summary
    exit_code = print_summary()
    sys.exit(exit_code)

if __name__ == "__main__":
    main()
