# chrome-devtools-logger — Structured Logging
> **Built by [Zovo](https://zovo.one)** | `npm i chrome-devtools-logger`

Log levels (debug/info/warn/error/fatal), categories, child loggers, colored output, filtering, search, and persistence.

```typescript
import { Logger } from 'chrome-devtools-logger';
const log = new Logger('api', 500, 'info');
const auth = log.child('auth');
auth.info('Token refreshed', { expiresIn: 3600 });
auth.error('Login failed', { code: 401 });
const errors = log.filterByLevel('error');
```
MIT License
