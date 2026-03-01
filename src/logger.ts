/**
 * Logger — Structured logging with levels, categories, and export
 */
export interface LogEntry { level: string; category: string; message: string; data?: any; timestamp: number; }

export class Logger {
    private entries: LogEntry[] = [];
    private maxEntries: number;
    private minLevel: number;
    private category: string;
    private static LEVELS: Record<string, number> = { debug: 0, info: 1, warn: 2, error: 3, fatal: 4 };

    constructor(category: string = 'app', maxEntries: number = 1000, minLevel: string = 'debug') {
        this.category = category; this.maxEntries = maxEntries; this.minLevel = Logger.LEVELS[minLevel] || 0;
    }

    /** Create a child logger with a sub-category */
    child(subCategory: string): Logger {
        const child = new Logger(`${this.category}.${subCategory}`, this.maxEntries);
        child.entries = this.entries; // share entries
        return child;
    }

    debug(message: string, data?: any): void { this.log('debug', message, data); }
    info(message: string, data?: any): void { this.log('info', message, data); }
    warn(message: string, data?: any): void { this.log('warn', message, data); }
    error(message: string, data?: any): void { this.log('error', message, data); }
    fatal(message: string, data?: any): void { this.log('fatal', message, data); }

    private log(level: string, message: string, data?: any): void {
        if ((Logger.LEVELS[level] || 0) < this.minLevel) return;
        const entry: LogEntry = { level, category: this.category, message, data, timestamp: Date.now() };
        this.entries.push(entry);
        if (this.entries.length > this.maxEntries) this.entries.shift();

        const color = { debug: '#9CA3AF', info: '#3B82F6', warn: '#F59E0B', error: '#EF4444', fatal: '#DC2626' }[level] || '#6B7280';
        console.log(`%c[${level.toUpperCase()}] %c${this.category}%c ${message}`, `color:${color};font-weight:bold`, 'color:#6B7280', 'color:inherit', data || '');
    }

    /** Get all log entries */
    getEntries(): LogEntry[] { return [...this.entries]; }

    /** Filter by level */
    filterByLevel(level: string): LogEntry[] { return this.entries.filter((e) => e.level === level); }

    /** Filter by category */
    filterByCategory(category: string): LogEntry[] { return this.entries.filter((e) => e.category.startsWith(category)); }

    /** Filter by time range */
    filterByTime(startMs: number, endMs: number = Date.now()): LogEntry[] {
        return this.entries.filter((e) => e.timestamp >= startMs && e.timestamp <= endMs);
    }

    /** Search entries */
    search(query: string): LogEntry[] {
        const q = query.toLowerCase();
        return this.entries.filter((e) => e.message.toLowerCase().includes(q) || JSON.stringify(e.data || '').toLowerCase().includes(q));
    }

    /** Export as JSON */
    exportJSON(): string { return JSON.stringify(this.entries, null, 2); }

    /** Save to storage */
    async save(key: string = '__logs__'): Promise<void> { await chrome.storage.local.set({ [key]: this.entries.slice(-500) }); }

    /** Load from storage */
    async load(key: string = '__logs__'): Promise<void> {
        const result = await chrome.storage.local.get(key);
        if (result[key]) this.entries = result[key];
    }

    /** Clear all entries */
    clear(): void { this.entries = []; }

    /** Get error count since timestamp */
    errorCount(sinceMs?: number): number {
        const since = sinceMs || 0;
        return this.entries.filter((e) => (e.level === 'error' || e.level === 'fatal') && e.timestamp >= since).length;
    }
}
