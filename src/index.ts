/**
 * chrome-devtools-logger
 * Structured logging for Chrome Extensions with levels, categories, filtering, and log viewer
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  FATAL = 4
}

export interface LogEntry {
  id: string;
  timestamp: number;
  level: LogLevel;
  category: string;
  message: string;
  data?: unknown;
  stack?: string;
}

export interface LoggerConfig {
  minLevel: LogLevel;
  categories: Record<string, boolean>;
  enableRemote: boolean;
  maxEntries: number;
  persistToStorage: boolean;
  remoteEndpoint?: string;
}

type LogListener = (entry: LogEntry) => void;

export class ChromeLogger {
  private config: LoggerConfig;
  private entries: LogEntry[] = [];
  private listeners: Set<LogListener> = new Set();
  private idCounter = 0;

  constructor(config: Partial<LoggerConfig> = {}) {
    this.config = {
      minLevel: LogLevel.DEBUG,
      categories: {},
      enableRemote: false,
      maxEntries: 1000,
      persistToStorage: false,
      ...config
    };
  }

  private generateId(): string {
    return `log_${Date.now()}_${++this.idCounter}`;
  }

  private shouldLog(level: LogLevel, category: string): boolean {
    if (level < this.config.minLevel) return false;
    if (this.config.categories[category] === false) return false;
    return true;
  }

  private createEntry(level: LogLevel, category: string, message: string, data?: unknown): LogEntry {
    const entry: LogEntry = {
      id: this.generateId(),
      timestamp: Date.now(),
      level,
      category,
      message,
      data
    };

    if (level >= LogLevel.ERROR) {
      entry.stack = new Error().stack;
    }

    return entry;
  }

  private addEntry(entry: LogEntry): void {
    this.entries.push(entry);
    
    if (this.entries.length > this.config.maxEntries) {
      this.entries = this.entries.slice(-this.config.maxEntries);
    }

    this.notifyListeners(entry);
    this.persistIfNeeded(entry);
    this.sendRemoteIfNeeded(entry);
  }

  private notifyListeners(entry: LogEntry): void {
    this.listeners.forEach(listener => {
      try {
        listener(entry);
      } catch (e) {
        console.error('Log listener error:', e);
      }
    });
  }

  private async persistIfNeeded(entry: LogEntry): Promise<void> {
    if (!this.config.persistToStorage) return;
    
    try {
      const key = 'logger_entries';
      const stored = await chrome.storage.local.get(key);
      const entries: LogEntry[] = stored[key] || [];
      entries.push(entry);
      
      const trimmed = entries.slice(-this.config.maxEntries);
      await chrome.storage.local.set({ [key]: trimmed });
    } catch (e) {
      console.error('Failed to persist log:', e);
    }
  }

  private async sendRemoteIfNeeded(entry: LogEntry): Promise<void> {
    if (!this.config.enableRemote || !this.config.remoteEndpoint) return;

    try {
      await fetch(this.config.remoteEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entry)
      });
    } catch (e) {
      console.error('Failed to send remote log:', e);
    }
  }

  debug(category: string, message: string, data?: unknown): void {
    if (this.shouldLog(LogLevel.DEBUG, category)) {
      this.addEntry(this.createEntry(LogLevel.DEBUG, category, message, data));
    }
  }

  info(category: string, message: string, data?: unknown): void {
    if (this.shouldLog(LogLevel.INFO, category)) {
      this.addEntry(this.createEntry(LogLevel.INFO, category, message, data));
    }
  }

  warn(category: string, message: string, data?: unknown): void {
    if (this.shouldLog(LogLevel.WARN, category)) {
      this.addEntry(this.createEntry(LogLevel.WARN, category, message, data));
    }
  }

  error(category: string, message: string, data?: unknown): void {
    if (this.shouldLog(LogLevel.ERROR, category)) {
      this.addEntry(this.createEntry(LogLevel.ERROR, category, message, data));
    }
  }

  fatal(category: string, message: string, data?: unknown): void {
    if (this.shouldLog(LogLevel.FATAL, category)) {
      this.addEntry(this.createEntry(LogLevel.FATAL, category, message, data));
    }
  }

  getEntries(filter?: {
    level?: LogLevel;
    category?: string;
    since?: number;
    limit?: number;
  }): LogEntry[] {
    let result = [...this.entries];

    if (filter?.level !== undefined) {
      result = result.filter(e => e.level >= filter.level!);
    }

    if (filter?.category) {
      result = result.filter(e => e.category === filter.category);
    }

    if (filter?.since) {
      result = result.filter(e => e.timestamp >= filter.since!);
    }

    if (filter?.limit) {
      result = result.slice(-filter.limit);
    }

    return result;
  }

  clear(): void {
    this.entries = [];
  }

  subscribe(listener: LogListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  setLevel(level: LogLevel): void {
    this.config.minLevel = level;
  }

  setCategory(category: string, enabled: boolean): void {
    this.config.categories[category] = enabled;
  }

  exportJSON(): string {
    return JSON.stringify(this.entries, null, 2);
  }

  exportCSV(): string {
    const headers = 'id,timestamp,level,category,message,data\n';
    const rows = this.entries.map(e => 
      `"${e.id}","${e.timestamp}","${LogLevel[e.level]}","${e.category}","${e.message.replace(/"/g, '""')}","${JSON.stringify(e.data).replace(/"/g, '""')}"`
    ).join('\n');
    return headers + rows;
  }
}

export class LogViewerPanel {
  private logger: ChromeLogger;
  private container: HTMLElement | null = null;

  constructor(logger: ChromeLogger) {
    this.logger = logger;
  }

  render(containerId: string): void {
    this.container = document.getElementById(containerId);
    if (!this.container) return;

    this.container.innerHTML = `
      <div class="log-viewer">
        <div class="log-toolbar">
          <select id="log-level-filter">
            <option value="0">DEBUG</option>
            <option value="1" selected>INFO</option>
            <option value="2">WARN</option>
            <option value="3">ERROR</option>
          </select>
          <input type="text" id="log-category-filter" placeholder="Category filter">
          <button id="log-clear">Clear</button>
          <button id="log-export">Export</button>
        </div>
        <div class="log-entries" id="log-entries"></div>
      </div>
    `;

    this.setupEventListeners();
    this.subscribeToLogs();
  }

  private setupEventListeners(): void {
    const levelFilter = document.getElementById('log-level-filter') as HTMLSelectElement;
    const categoryFilter = document.getElementById('log-category-filter') as HTMLInputElement;
    const clearBtn = document.getElementById('log-clear');
    const exportBtn = document.getElementById('log-export');

    levelFilter?.addEventListener('change', () => {
      this.refreshLogs();
    });

    categoryFilter?.addEventListener('input', () => {
      this.refreshLogs();
    });

    clearBtn?.addEventListener('click', () => {
      this.logger.clear();
      this.refreshLogs();
    });

    exportBtn?.addEventListener('click', () => {
      const json = this.logger.exportJSON();
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `logs_${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    });
  }

  private subscribeToLogs(): void {
    this.logger.subscribe(() => {
      this.refreshLogs();
    });
  }

  private refreshLogs(): void {
    const levelFilter = document.getElementById('log-level-filter') as HTMLSelectElement;
    const categoryFilter = document.getElementById('log-category-filter') as HTMLInputElement;
    const entriesContainer = document.getElementById('log-entries');

    if (!entriesContainer) return;

    const entries = this.logger.getEntries({
      level: parseInt(levelFilter?.value || '1'),
      category: categoryFilter?.value || undefined,
      limit: 100
    });

    entriesContainer.innerHTML = entries.map(entry => `
      <div class="log-entry log-${LogLevel[entry.level].toLowerCase()}">
        <span class="log-time">${new Date(entry.timestamp).toLocaleTimeString()}</span>
        <span class="log-level">${LogLevel[entry.level]}</span>
        <span class="log-category">${entry.category}</span>
        <span class="log-message">${entry.message}</span>
        ${entry.data ? `<pre class="log-data">${JSON.stringify(entry.data, null, 2)}</pre>` : ''}
      </div>
    `).join('');
  }
}

export function createLogger(config?: Partial<LoggerConfig>): ChromeLogger {
  return new ChromeLogger(config);
}
