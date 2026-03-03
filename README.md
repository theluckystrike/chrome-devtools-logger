# chrome-devtools-logger

[![npm version](https://img.shields.io/npm/v/chrome-devtools-logger)](https://npmjs.com/package/chrome-devtools-logger)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)
[![Chrome Web Extension](https://img.shields.io/badge/Chrome-Web%20Extension-orange.svg)](https://developer.chrome.com/docs/extensions/)
[![CI Status](https://github.com/theluckystrike/chrome-devtools-logger/actions/workflows/ci.yml/badge.svg)](https://github.com/theluckystrike/chrome-devtools-logger/actions)
[![Discord](https://img.shields.io/badge/Discord-Zovo-blueviolet.svg?logo=discord)](https://discord.gg/zovo)
[![Website](https://img.shields.io/badge/Website-zovo.one-blue)](https://zovo.one)
[![GitHub Stars](https://img.shields.io/github/stars/theluckystrike/chrome-devtools-logger?style=social)](https://github.com/theluckystrike/chrome-devtools-logger)

> Logger for Chrome DevTools extensions.

**chrome-devtools-logger** provides structured logging for Chrome DevTools extensions. Part of the Zovo Chrome extension utilities.

Part of the [Zovo](https://zovo.one) developer tools family.

## Features

- ✅ **Structured Logging** - Log with levels
- ✅ **DevTools Integration** - Output to DevTools console
- ✅ **Timestamps** - Include timestamps
- ✅ **TypeScript Support** - Full type definitions included

## Installation

```bash
npm install chrome-devtools-logger
```

## Usage

```javascript
import { logger } from 'chrome-devtools-logger';

logger.log('Debug info');
logger.info('Information');
logger.warn('Warning');
logger.error('Error');
```

## Contributing

Contributions are welcome! Please follow these steps:

1. **Fork** the repository
2. **Create** a feature branch: `git checkout -b feature/logger-feature`
3. **Make** your changes
4. **Test** your changes: `npm test`
5. **Commit** your changes: `git commit -m 'Add new feature'`
6. **Push** to the branch: `git push origin feature/logger-feature`
7. **Submit** a Pull Request

## See Also

### Related Zovo Repositories

- [chrome-perf-monitor](https://github.com/theluckystrike/chrome-perf-monitor) - Performance monitoring
- [chrome-extension-starter-mv3](https://github.com/theluckystrike/chrome-extension-starter-mv3) - Extension template

### Zovo Chrome Extensions

- [Zovo Tab Manager](https://chrome.google.com/webstore/detail/zovo-tab-manager) - Manage tabs efficiently
- [Zovo Focus](https://chrome.google.com/webstore/detail/zovo-focus) - Block distractions

Visit [zovo.one](https://zovo.one) for more information.

## License

MIT — [Zovo](https://zovo.one)
