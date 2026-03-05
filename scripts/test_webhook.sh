#!/bin/bash
# Script de test des webhooks DEV

NGROK_URL="https://radially-lank-christiana.ngrok-free.dev"
TOKEN="local-dev-token-123"

echo "🧪 Test des webhooks DEV"
echo "=========================="
echo ""

# Test 1: Webhook bids/insert
echo "1️⃣  Test webhook /api/v1/webhooks/bids/insert"
echo "--------------------------------------------"
curl -X POST "${NGROK_URL}/api/v1/webhooks/bids/insert" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${TOKEN}" \
  -d '{
    "record": {
      "id": "test-bid-id-'$(date +%s)'",
      "auction_id": "test-auction-id",
      "type": "prebid",
      "price": 100.0
    }
  }' \
  -w "\nHTTP Status: %{http_code}\n" \
  -s

echo ""
echo ""

# Test 2: Webhook auctions/insert
echo "2️⃣  Test webhook /api/v1/webhooks/auctions/insert"
echo "--------------------------------------------"
curl -X POST "${NGROK_URL}/api/v1/webhooks/auctions/insert" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${TOKEN}" \
  -d '{
    "record": {
      "id": "test-auction-id-'$(date +%s)'",
      "type": "japanese",
      "title": "Test Auction"
    }
  }' \
  -w "\nHTTP Status: %{http_code}\n" \
  -s

echo ""
echo ""

# Test 3: Webhook auctions/update
echo "3️⃣  Test webhook /api/v1/webhooks/auctions/update"
echo "--------------------------------------------"
curl -X POST "${NGROK_URL}/api/v1/webhooks/auctions/update" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${TOKEN}" \
  -d '{
    "record": {
      "id": "test-auction-id",
      "type": "dutch",
      "title": "Updated Test Auction"
    },
    "old_record": {
      "id": "test-auction-id",
      "type": "dutch",
      "title": "Test Auction"
    }
  }' \
  -w "\nHTTP Status: %{http_code}\n" \
  -s

echo ""
echo ""
echo "✅ Tests terminés"
echo ""
echo "💡 Vérifiez les logs de votre serveur Nuxt pour voir si les webhooks ont été reçus"

