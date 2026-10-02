# models/

One file per DB entity. Each function maps 1:1 to an alias in php-bridge/api.php.

## Contract

Every model function:

- Takes plain arguments (no req, no res)
- Returns the raw bridge response: { rows?, affected?, id? }
- Never throws HTTP errors. Callers decide the status code.
- Never writes SQL. The SQL lives in php-bridge/api.php.

## user.js

| Function | Alias | Returns |
|---|---|---|
| userById(id) | userById | { rows: [user] } |
| userByEmail(email) | userByEmail | { rows: [user] } |
| createUser(email, passwordHash) | createUser | { id } (both args nullable for OAuth) |
| allClients() | allClients | { rows: [users] } |

## purchase.js

| Function | Alias |
|---|---|
| purchaseOf(userId) | purchaseOf (returns .rows[0] or undefined) |
| markPaid(userId, ref) | markPaid |
| resetDownload(userId) | resetDownload |
| setDownloaded(userId) | setDownloaded |

## checkout.js

| Function | Alias |
|---|---|
| newCheckout(checkoutId, userId) | newCheckout |
| userByCheckout(checkoutId) | userByCheckout (returns .rows[0]) |

## token.js

| Function | Alias |
|---|---|
| newToken(userId, hash) | newToken |
| clearTokens(userId) | clearTokens |
| useToken(userId, hash) | useToken (atomic; returns affected) |

## audit.js

| Function | Alias |
|---|---|
| audit(adminId, targetId, action) | audit |

## oauth.js

| Function | Alias |
|---|---|
| findByProvider(provider, providerUserId) | oauthByProvider |
| linkAccount(userId, provider, providerUserId, email, displayName, avatarUrl) | oauthLink |
| listForUser(userId) | oauthListForUser |

## Adding a query

1. Add alias + prepared SQL to php-bridge/api.php (owner)
2. Add wrapper function in the relevant model
3. Call from a controller

Never call db() directly from a controller. Always go through a model.