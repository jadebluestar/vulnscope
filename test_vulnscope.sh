#!/bin/bash

echo "=== VulnScope Test Script ==="

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

# Test 1: Register
echo -e "\n${GREEN}1. Testing Registration...${NC}"
REGISTER_RESP=$(curl -s -X POST http://localhost:5000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123","name":"Tester"}')
echo $REGISTER_RESP | python3 -m json.tool

# Test 2: Login
echo -e "\n${GREEN}2. Testing Login...${NC}"
LOGIN_RESP=$(curl -s -X POST http://localhost:5000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}')
TOKEN=$(echo $LOGIN_RESP | python3 -c "import sys, json; print(json.load(sys.stdin).get('token', ''))")
echo $LOGIN_RESP | python3 -m json.tool

if [ -z "$TOKEN" ]; then
    echo -e "${RED}Failed to get token!${NC}"
    exit 1
fi

# Test 3: Start Scan
echo -e "\n${GREEN}3. Starting Scan...${NC}"
SCAN_RESP=$(curl -s -X POST http://localhost:5000/scans \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"targetUrl":"https://scanme.nmap.org"}')
SCAN_ID=$(echo $SCAN_RESP | python3 -c "import sys, json; print(json.load(sys.stdin).get('id', ''))")
echo $SCAN_RESP | python3 -m json.tool

# Test 4: Check progress (poll for 30 seconds)
echo -e "\n${GREEN}4. Monitoring Scan Progress (30 seconds max)...${NC}"
for i in {1..15}; do
    sleep 2
    PROGRESS=$(curl -s http://localhost:5000/scans/$SCAN_ID/pipeline \
      -H "Authorization: Bearer $TOKEN" | python3 -c "import sys, json; print(json.load(sys.stdin).get('progress', 0))")
    STATUS=$(curl -s http://localhost:5000/scans/$SCAN_ID/pipeline \
      -H "Authorization: Bearer $TOKEN" | python3 -c "import sys, json; print(json.load(sys.stdin).get('status', 'unknown'))")
    echo "Progress: $PROGRESS% | Status: $STATUS"
    if [ "$STATUS" == "done" ]; then
        break
    fi
done

# Test 5: Download Report
echo -e "\n${GREEN}5. Downloading PDF Report...${NC}"
curl -s http://localhost:5000/reports/$SCAN_ID \
  -H "Authorization: Bearer $TOKEN" \
  --output test_report.pdf
if [ -f test_report.pdf ]; then
    echo "✅ Report saved as test_report.pdf ($(du -h test_report.pdf | cut -f1))"
else
    echo -e "${RED}Failed to download report${NC}"
fi

# Test 6: Dashboard Data
echo -e "\n${GREEN}6. Fetching Dashboard Data...${NC}"
curl -s http://localhost:5000/dashboard/bootstrap \
  -H "Authorization: Bearer $TOKEN" | python3 -c "import sys, json; d=json.load(sys.stdin); print(f'Total Scans: {d[\"stats\"][\"totalScans\"]}\nTotal Vulns: {d[\"stats\"][\"totalVulns\"]}\nCritical Vulns: {d[\"stats\"][\"criticalVulns\"]}')"

echo -e "\n${GREEN}=== Testing Complete ===${NC}"
