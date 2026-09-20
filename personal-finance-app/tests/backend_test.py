"""Smoke tests for Personal Finance backend at http://localhost:8090"""
import pytest
import requests
import uuid
from datetime import date

BASE = "http://localhost:8090"


@pytest.fixture(scope="session")
def demo_token():
    r = requests.post(f"{BASE}/api/auth/login",
                      json={"email": "demo@finance.id", "password": "Demo1234!"})
    assert r.status_code == 200
    body = r.json()
    assert body["success"] is True
    assert "token" in body["data"]
    return body["data"]["token"]


@pytest.fixture(scope="session")
def demo_headers(demo_token):
    return {"Authorization": f"Bearer {demo_token}", "Content-Type": "application/json"}


@pytest.fixture(scope="session")
def new_user():
    email = f"test_{uuid.uuid4().hex[:8]}@finance.id"
    r = requests.post(f"{BASE}/api/auth/register",
                      json={"email": email, "password": "Passw0rd!", "fullName": "Test User", "baseCurrency": "IDR"})
    assert r.status_code in (200, 201), r.text
    body = r.json()
    assert body["success"] is True
    token = body["data"]["token"]
    return {"email": email, "token": token, "headers": {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}}


# --- Auth ---
class TestAuth:
    def test_login_success(self, demo_token):
        assert demo_token

    def test_login_wrong_password(self):
        r = requests.post(f"{BASE}/api/auth/login",
                          json={"email": "demo@finance.id", "password": "wrong"})
        assert r.status_code == 401
        body = r.json()
        assert body["success"] is False
        assert body["code"] == "INVALID_CREDENTIALS"

    def test_accounts_without_token(self):
        r = requests.get(f"{BASE}/api/accounts")
        assert r.status_code == 401


# --- Full account/transfer/portfolio flow for new user ---
class TestNewUserFlow:
    state = {}

    def test_create_bank_account(self, new_user):
        r = requests.post(f"{BASE}/api/accounts",
                          json={"name": "Bank A", "category": "BANK", "currency": "IDR"},
                          headers=new_user["headers"])
        assert r.status_code in (200, 201), r.text
        body = r.json()
        assert body["success"] is True
        self.state["bank_id"] = body["data"]["id"]

    def test_opening_balance(self, new_user):
        r = requests.post(f"{BASE}/api/transactions",
                          json={"transactionDate": str(date.today()),
                                "type": "OPENING_BALANCE",
                                "accountId": self.state["bank_id"],
                                "grossAmount": 1000000},
                          headers=new_user["headers"])
        assert r.status_code in (200, 201), r.text
        assert r.json()["success"] is True

    def test_create_rdn_account(self, new_user):
        r = requests.post(f"{BASE}/api/accounts",
                          json={"name": "RDN A", "category": "RDN", "currency": "IDR"},
                          headers=new_user["headers"])
        assert r.status_code in (200, 201), r.text
        self.state["rdn_id"] = r.json()["data"]["id"]

    def test_transfer(self, new_user):
        r = requests.post(f"{BASE}/api/transactions",
                          json={"transactionDate": str(date.today()),
                                "type": "TRANSFER",
                                "accountId": self.state["bank_id"],
                                "destinationAccountId": self.state["rdn_id"],
                                "grossAmount": 400000},
                          headers=new_user["headers"])
        assert r.status_code in (200, 201), r.text
        assert r.json()["success"] is True

    def test_balance_sheet_balanced(self, new_user):
        r = requests.get(f"{BASE}/api/reports/balance-sheet", headers=new_user["headers"])
        assert r.status_code == 200
        data = r.json()["data"]
        assert data["balanced"] is True
        # equity == totalAssets - totalLiabilities
        eq = float(data["equity"])
        ta = float(data["totalAssets"])
        tl = float(data["totalLiabilities"])
        assert abs(eq - (ta - tl)) < 0.01
        # transfer did not change equity -> equity should equal 1000000
        assert abs(eq - 1000000) < 0.01

    # -- investments --
    def test_create_asset(self, new_user):
        r = requests.post(f"{BASE}/api/assets",
                          json={"code": f"TST{uuid.uuid4().hex[:4].upper()}",
                                "name": "Test Asset",
                                "assetType": "STOCK",
                                "currency": "IDR",
                                "quantityUnit": "SHARE",
                                "currentPrice": 1200},
                          headers=new_user["headers"])
        assert r.status_code in (200, 201), r.text
        self.state["asset_id"] = r.json()["data"]["id"]

    def test_buy_investment(self, new_user):
        r = requests.post(f"{BASE}/api/transactions",
                          json={"transactionDate": str(date.today()),
                                "type": "BUY_INVESTMENT",
                                "accountId": self.state["rdn_id"],
                                "assetId": self.state["asset_id"],
                                "quantity": 100,
                                "quantityUnit": "SHARE",
                                "unitPrice": 1000,
                                "grossAmount": 100000},
                          headers=new_user["headers"])
        assert r.status_code in (200, 201), r.text
        assert r.json()["success"] is True

    def test_portfolio_after_buy(self, new_user):
        r = requests.get(f"{BASE}/api/portfolio", headers=new_user["headers"])
        assert r.status_code == 200
        data = r.json()["data"]
        items = data.get("positions", [])
        found = None
        for it in items:
            if it.get("id") == self.state["asset_id"]:
                found = it; break
        assert found is not None, f"holding not found in {data}"
        assert abs(float(found["marketValue"]) - 120000) < 0.01
        assert abs(float(found["totalCost"]) - 100000) < 0.01
        assert abs(float(found["unrealizedPl"]) - 20000) < 0.01

    def test_sell_investment(self, new_user):
        r = requests.post(f"{BASE}/api/transactions",
                          json={"transactionDate": str(date.today()),
                                "type": "SELL_INVESTMENT",
                                "accountId": self.state["rdn_id"],
                                "assetId": self.state["asset_id"],
                                "quantity": 40,
                                "quantityUnit": "SHARE",
                                "unitPrice": 1500,
                                "grossAmount": 60000},
                          headers=new_user["headers"])
        assert r.status_code in (200, 201), r.text
        body = r.json()
        assert body["success"] is True
        tx = body["data"]["transaction"]
        assert float(tx["costBasis"]) == 40000.00
        assert float(tx["realizedPl"]) == 20000.00
        journal = body["data"]["journalEntries"]
        debits = sum(float(j.get("debit", 0)) for j in journal)
        credits = sum(float(j.get("credit", 0)) for j in journal)
        assert abs(debits - credits) < 0.01
        self.state["sell_id"] = tx["id"]

    def test_lots_partial(self, new_user):
        r = requests.get(f"{BASE}/api/portfolio/lots", headers=new_user["headers"])
        assert r.status_code == 200
        lots = r.json()["data"]
        our = [l for l in lots if l.get("assetId") == self.state["asset_id"] or l.get("asset", {}).get("id") == self.state["asset_id"]]
        assert our, "no lots"
        lot = our[0]
        assert abs(float(lot["remainingQuantity"]) - 60) < 0.01
        assert lot["status"] == "PARTIAL"

    # -- validation --
    def test_sell_insufficient_stock(self, new_user):
        r = requests.post(f"{BASE}/api/transactions",
                          json={"transactionDate": str(date.today()),
                                "type": "SELL_INVESTMENT",
                                "accountId": self.state["rdn_id"],
                                "assetId": self.state["asset_id"],
                                "quantity": 1000,
                                "quantityUnit": "SHARE",
                                "unitPrice": 1500,
                                "grossAmount": 1500000},
                          headers=new_user["headers"])
        assert r.status_code == 400
        assert r.json()["code"] == "INSUFFICIENT_STOCK"

    def test_transfer_missing_destination(self, new_user):
        r = requests.post(f"{BASE}/api/transactions",
                          json={"transactionDate": str(date.today()),
                                "type": "TRANSFER",
                                "accountId": self.state["bank_id"],
                                "grossAmount": 100},
                          headers=new_user["headers"])
        assert r.status_code == 400
        assert r.json()["code"] == "DESTINATION_REQUIRED"

    def test_transaction_not_found(self, new_user):
        r = requests.get(f"{BASE}/api/transactions/999999", headers=new_user["headers"])
        assert r.status_code == 404
        assert r.json()["code"] == "NOT_FOUND"

    # -- void sell --
    def test_void_sell(self, new_user):
        r = requests.delete(f"{BASE}/api/transactions/{self.state['sell_id']}", headers=new_user["headers"])
        assert r.status_code in (200, 204), r.text
        # detail
        r2 = requests.get(f"{BASE}/api/transactions/{self.state['sell_id']}", headers=new_user["headers"])
        assert r2.status_code == 200
        d = r2.json()["data"]
        assert d["transaction"]["status"] == "VOID"
        assert d.get("journalEntries", []) == []
        # lots restored
        rl = requests.get(f"{BASE}/api/portfolio/lots", headers=new_user["headers"])
        lots = rl.json()["data"]
        our = [l for l in lots if l.get("assetId") == self.state["asset_id"] or l.get("asset", {}).get("id") == self.state["asset_id"]]
        assert abs(float(our[0]["remainingQuantity"]) - 100) < 0.01


# --- Demo user reports ---
class TestDemoReports:
    @pytest.mark.parametrize("path", [
        "/api/dashboard",
        "/api/reports/income-expense",
        "/api/reports/cash-flow",
        "/api/reports/net-worth",
        "/api/bonds/coupons",
        "/api/transactions?page=0&size=5",
    ])
    def test_endpoint(self, demo_headers, path):
        r = requests.get(f"{BASE}{path}", headers=demo_headers)
        assert r.status_code == 200, f"{path}: {r.status_code} {r.text[:200]}"
        assert r.json()["success"] is True

    def test_budgets_current_period(self, demo_headers):
        period = date.today().strftime("%Y-%m")
        r = requests.get(f"{BASE}/api/budgets?period={period}", headers=demo_headers)
        assert r.status_code == 200
        assert r.json()["success"] is True

    def test_csv_export(self, demo_headers):
        r = requests.get(f"{BASE}/api/transactions/export", headers=demo_headers)
        assert r.status_code == 200
        assert "text/csv" in r.headers.get("Content-Type", "")
        # header row exists
        first_line = r.text.split("\n")[0]
        assert "," in first_line and len(first_line) > 0
