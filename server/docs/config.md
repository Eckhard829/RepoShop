# config/

Everything that touches the outside world at boot.

## env.js

Loads server/.env (regardless of cwd) and exports a typed object. The only file
that calls process.env directly. New env var? Add it here first.

## db.js

The PHP bridge client. Single export:

    db(queryAlias, paramsArray) -> Promise<{ rows?, affected?, id? }>

- POSTs { q, p } as JSON to PHP_BRIDGE_URL
- Sends header X-Api-Key: BRIDGE_KEY
- Throws Error with .status on non-2xx

Never write SQL in Node. Add an alias to php-bridge/api.php and call it here.

Example in a model:

    const { db } = require('../config/db');
    const userById = (id) => db('userById', [id]);
    // .rows[0] is the user

## constants.js

Non-configurable values:

- COOKIE_NAME   the JWT cookie name ('t')
- JWT_TTL       cookie lifetime ('8h')
- sha256(s)     hash helper for download tokens

## Rule

Any module that needs config imports from here. No process.env outside env.js.