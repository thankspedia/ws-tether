
 Asynchronous-Context-RPC
================================================================================


# ws-tether

`ws-tether` is a lightweight Node.js module designed to maintain persistent
WebSocket connections. It provides automatic reconnection capabilities and
utility functions to simplify the management of WebSocket connections in your
applications.

----

This module is developed as a subproject within the **[Thankspedia.js]
[thankspedia]** framework. Its primary goal is to simplify WebSocket-based
communication by providing reliable, easy-to-manage persistent connections. The
functionality offered by this module is aligned with Thankspedia.js's philosophy
of creating structured, robust, and maintainable Node.js applications.

For comprehensive guidance, usage examples, and more context about how this
module integrates with the broader framework, please refer to the official
documentation of **[Thankspedia.js][thankspedia]**.

[thankspedia]:                       https://github.com/thankspedia/
[react-rerenderers]:                 https://github.com/thankspedia/react-rerenderers/
[asynchronous-context]:              https://github.com/thankspedia/asynchronous-context/
[asynchronous-context-rpc]:          https://github.com/thankspedia/asynchronous-context-rpc/
[prevent-undefined]:                 https://github.com/thankspedia/prevent-undefined/
[fold-args]:                         https://github.com/thankspedia/fold-args/
[runtime-typesafety]:                https://github.com/thankspedia/runtime-typesafety/
[database-postgresql-query-builder]: https://github.com/thankspedia/database-postgresql-query-builder/
[vanilla-schema-validator]:          https://github.com/thankspedia/vanilla-schema-validator/
[sql-named-parameters]:              https://github.com/thankspedia/sql-named-parameters/
[sqlmacro]:                          https://github.com/thankspedia/sqlmacro/
[mixin-prototypes]:                  https://github.com/thankspedia/mixin-prototypes/
[authentication-context]:            https://github.com/thankspedia/authentication-context/
[database-postgresql-context]:       https://github.com/thankspedia/database-postgresql-context/
[crypto-web-token]:                  https://github.com/thankspedia/crypto-web-token/
[randomcat]:                         https://github.com/thankspedia/randomcat/
[beep]:                              https://github.com/thankspedia/beep/


## Features

- **Persistent Connections**: Automatically handles reconnections to ensure continuous communication.
- **Utility Functions**: Includes helper methods for common WebSocket operations.
- **Modular Design**: Structured with separate modules for reconnection logic (`ws-reconnector.mjs`), utilities (`ws-utils.mjs`), and core functionality (`ws-tether.mjs`).
- **Example Implementation**: An `example` directory is provided to demonstrate usage.

## Installation

You can install `ws-tether` using npm:


```bash
npm install ws-tether
```


## Usage

Here's a basic example of how to use `ws-tether`:


```javascript
import { createWebSocketConnection } from 'ws-tether';

const ws = createWebSocketConnection('wss://example.com/socket');

ws.on('open', () => {
  console.log('WebSocket connection established.');
});

ws.on('message', (message) => {
  console.log('Received:', message);
});

ws.on('close', () => {
  console.log('WebSocket connection closed. Attempting to reconnect...');
});
```


For more detailed examples, refer to the `example` directory in the repository.

## API Reference

The API reference is currently under development and will be provided in future updates.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

---

For more information and updates, visit the [ws-tether GitHub repository](https://github.com/thankspedia/ws-tether).



