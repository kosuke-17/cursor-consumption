# YAGNI原則 (You Aren't Gonna Need It)

**原則**: 将来の自分を過信しない。今必要ない機能は実装しない

将来必要になるかもしれない機能を先回りして実装すると、コードが複雑になり、保守コストが増えます。実際に必要になったときに実装する方が、より良い設計になることが多いです。

## チェック観点

- 現在使われていない機能を実装していないか
- 「将来必要になるかも」という理由で過度な抽象化をしていないか
- 実際の要件よりも多くの機能を実装していないか

## 違反例

### 例1: 将来の拡張性を想定した過剰設計

```typescript
// ❌ 悪い例: 将来の拡張性を想定した過剰な抽象化
interface DataSource<T> {
  read(): T;
  write(data: T): void;
}

interface CacheStrategy {
  get(key: string): Buffer | null;
  set(key: string, value: Buffer): void;
}

class LRUCacheStrategy implements CacheStrategy {
  // LRUキャッシュの実装（今は使わない）
  get(key: string): Buffer | null { return null; }
  set(key: string, value: Buffer): void {}
}

class RedisCacheStrategy implements CacheStrategy {
  // Redisキャッシュの実装（今は使わない）
  get(key: string): Buffer | null { return null; }
  set(key: string, value: Buffer): void {}
}

class DataService<T> {
  constructor(
    private readonly source: DataSource<T>,
    private readonly cache?: CacheStrategy // 今はキャッシュ不要なのに実装
  ) {}

  getData(): T {
    // 複雑なキャッシュロジック（今は不要）
    if (this.cache) {
      const cached = this.cache.get("data");
      if (cached) return this.deserialize(cached);
    }

    const data = this.source.read();

    if (this.cache) {
      this.cache.set("data", this.serialize(data));
    }

    return data;
  }

  private serialize(data: T): Buffer { return Buffer.from(""); } // 今は不要
  private deserialize(data: Buffer): T { return {} as T; } // 今は不要
}

// 実際には単にデータを読み込むだけなのに...
```

### 例2: 将来の機能を想定した過剰な実装

```typescript
// ❌ 悪い例: 将来の機能を想定した実装
class UserService {
  private users: Map<string, User> = new Map();
  // 将来の機能を想定した実装
  private auditLog: AuditEntry[] = [];
  private permissions: Map<string, string[]> = new Map();
  private roles: Map<string, string> = new Map();
  private notifications: Notification[] = [];

  createUser(name: string, email: string): User {
    const user = new User(name, email);
    this.users.set(user.id, user);

    // 将来必要になるかもしれない機能
    this.auditLog.push({ action: "user_created", userId: user.id, timestamp: new Date() });

    // 将来必要になるかもしれない機能
    this.permissions.set(user.id, ["read"]);

    // 将来必要になるかもしれない機能
    this.notifications.push({ type: "user_created", userId: user.id });

    return user;
  }

  // 将来必要になるかもしれないメソッド
  assignRole(userId: string, role: string): void {
    // 実装済みだが使われていない
  }

  sendNotification(userId: string, message: string): void {
    // 実装済みだが使われていない
  }
}
```

### 例3: 将来の変更を想定した過剰な柔軟性

```typescript
// ❌ 悪い例: 将来の変更を想定した過剰な柔軟性
interface DatabaseConfig {
  type: string;        // 将来postgresqlに変更するかも
  host: string;
  port: number;
  ssl?: boolean;       // 将来必要になるかも
  poolSize?: number;   // 将来必要になるかも
  timeout?: number;    // 将来必要になるかも
}

interface CacheConfig {
  enabled: boolean;    // 将来必要になるかも
  type?: string;       // 将来必要になるかも
  ttl?: number;        // 将来必要になるかも
}

class ConfigManager {
  private config = {
    database: { type: "mysql", host: "localhost", port: 3306, ssl: false, poolSize: 10, timeout: 30 },
    cache: { enabled: false, type: "redis", ttl: 3600 },
    logging: { level: "INFO", format: "json", output: "file" },
  };

  getDatabaseConfig(): { host: string; port: number } {
    // 実際にはhostとportだけ使うのに複雑な設定読み込みロジック
    return { host: this.config.database.host, port: this.config.database.port };
  }
}
```

## 改善例

### 例1の改善: 必要最小限の実装

```typescript
// ✅ 良い例: 必要最小限の実装
class DataService<T> {
  constructor(private readonly source: DataSource<T>) {}

  getData(): T {
    return this.source.read();
  }
}

// シンプルで明確。必要になったらキャッシュを追加する
```

### 例2の改善: 実際に必要な機能のみ

```typescript
// ✅ 良い例: 実際に必要な機能のみ実装
class UserService {
  private users: Map<string, User> = new Map();

  createUser(name: string, email: string): User {
    const user = new User(name, email);
    this.users.set(user.id, user);
    return user;
  }
}

// 必要になったときに機能を追加する
// その時点でより良い設計ができる
```

### 例3の改善: シンプルな設定

```typescript
// ✅ 良い例: シンプルな設定
class ConfigManager {
  private readonly dbHost = "localhost";
  private readonly dbPort = 3306;

  getDatabaseConfig(): { host: string; port: number } {
    return { host: this.dbHost, port: this.dbPort };
  }
}

// 必要になったときに設定項目を追加する
```

## よくある違反パターン

### 1. 「将来必要になるかも」という理由での実装

```typescript
// ❌ 悪い例
class PaymentProcessor {
  private paymentMethods = {
    creditCard: new CreditCardProcessor(),
    paypal: new PayPalProcessor(),       // 今は使わない
    bankTransfer: new BankTransferProcessor(), // 今は使わない
  };
}

// ✅ 良い例
class PaymentProcessor {
  private paymentMethod = new CreditCardProcessor();
}

// 必要になったときに追加する
```

### 2. 過度な設定オプション

```typescript
// ❌ 悪い例: 将来の拡張を想定した過度なオプション
interface EmailConfig {
  smtpHost?: string;
  smtpPort?: number;
  useTls?: boolean;
  useSsl?: boolean;      // 今は使わない
  authMethod?: string;   // 今は使わない
  retryCount?: number;   // 今は使わない
  timeout?: number;      // 今は使わない
}

class EmailService {
  constructor(private readonly config: EmailConfig) {}
}

// ✅ 良い例: 必要最小限の設定
class EmailService {
  constructor(
    private readonly smtpHost = "smtp.gmail.com",
    private readonly smtpPort = 587,
    private readonly useTls = true
  ) {}
}
```

### 3. 将来の機能を想定したインターフェース

```typescript
// ❌ 悪い例: 将来の機能を想定したメソッド
interface UserRepository {
  getUser(userId: string): User;
  getUsersByRole(role: string): User[];       // 今は使わない
  getUsersByPermission(perm: string): User[]; // 今は使わない
  searchUsers(query: string): User[];         // 今は使わない
}

// ✅ 良い例: 必要なメソッドのみ
interface UserRepository {
  getUser(userId: string): User;
}

// 必要になったときにメソッドを追加する
```

## コードレビュー時のチェックポイント

1. **未使用の機能**: 実装されているが使われていない機能がないか
2. **過度な抽象化**: 「将来必要になるかも」という理由での抽象化がないか
3. **過度な設定**: 使われていない設定項目がないか
4. **予測的な実装**: 実際の要件よりも多くの機能を実装していないか
5. **複雑さの増加**: YAGNI違反によりコードが複雑になっていないか

## YAGNIと他の原則のバランス

- **YAGNI vs DRY**: 重複を排除するが、将来の拡張性を想定した過度な抽象化は避ける
- **YAGNI vs KISS**: シンプルさを優先し、将来の機能への過度な準備を避ける
- **YAGNI vs SOLID**: 原則を守りつつ、必要最小限の実装を心がける

## 判断基準

以下の場合はYAGNIを適用：

- **明確な要件がない**: 将来必要になるか不明確
- **実装コストが高い**: 実装に時間がかかるが、今は不要
- **複雑さが増す**: 実装によりコードが複雑になる

以下の場合は将来の機能を考慮：

- **明確な要件がある**: 近い将来に必要になることが確定している
- **実装コストが低い**: 簡単に実装できる
- **設計の一貫性**: 将来の機能を考慮することで設計が一貫する

## 実装のタイミング

1. **今必要**: 今すぐ実装する
2. **近い将来必要**: 設計を考慮するが、実装は必要になったとき
3. **遠い将来必要かも**: 実装しない（必要になったときに実装）
