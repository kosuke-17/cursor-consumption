# 関心の分離 (Separation of Concerns)

**原則**: 異なる関心（責務）を分離し、それぞれを独立して管理する

UI、状態、ドメインロジック、インフラを分離することで、コードの保守性とテスタビリティが向上します。

## チェック観点

- UI、状態、ドメインロジック、インフラが適切に分離されているか
- 表示、入力、検証、通信が分離されているか
- 各レイヤーが独立してテストできるか

## レイヤー分離の例

### 典型的なレイヤー構造

```
UI層 (Presentation)
  ↓
アプリケーション層 (Application/Use Case)
  ↓
ドメイン層 (Domain)
  ↓
インフラ層 (Infrastructure)
```

## 違反例

### 例1: すべてが1つのクラスに

```typescript
// ❌ 悪い例: すべての関心が1つのクラスに
class UserManager {
  private db = new MySQLDatabase();   // インフラ層
  private cache = new RedisCache();   // インフラ層

  async createUser(name: string, email: string): Promise<User> {
    // バリデーション（ドメイン層）
    if (!name || name.length < 3) throw new Error("Name must be at least 3 characters");
    if (!email || !email.includes("@")) throw new Error("Invalid email format");

    // ビジネスロジック（ドメイン層）
    const user = new User(name, email);
    user.generateId();
    user.setCreatedAt();

    // データベース操作（インフラ層）
    await this.db.save(user);

    // キャッシュ操作（インフラ層）
    await this.cache.set(`user:${user.id}`, user);

    // 通知送信（インフラ層）
    const emailService = new EmailService();
    await emailService.sendWelcomeEmail(email);

    // ログ出力（インフラ層）
    console.log(`User created: ${user.id}`);

    return user;
  }
}
```

### 例2: UIとビジネスロジックの混在

```typescript
// ❌ 悪い例: UIとビジネスロジックが混在
class UserForm {
  private nameInput = new TextInput();
  private emailInput = new TextInput();

  handleSubmit(): void {
    const name = this.nameInput.getValue();
    const email = this.emailInput.getValue();

    // バリデーション（UI層に属さない）
    if (!name || name.length < 3) {
      this.showError("Name must be at least 3 characters");
      return;
    }
    if (!email || !email.includes("@")) {
      this.showError("Invalid email format");
      return;
    }

    // ビジネスロジック（UI層に属さない）
    const user = new User(name, email);

    // データベース操作（UI層に属さない）
    const db = new MySQLDatabase();
    db.save(user);

    this.showSuccess("User created successfully");
  }
}
```

## 改善例

### 例1の改善: レイヤーを分離

```typescript
// ✅ 良い例: レイヤーを分離

// ドメイン層
class User {
  readonly id: string;
  readonly createdAt: Date;

  constructor(readonly name: string, readonly email: string) {
    this.id = crypto.randomUUID();
    this.createdAt = new Date();
  }
}

// ドメイン層: バリデーション
class UserValidator {
  static validateName(name: string): void {
    if (!name || name.length < 3) throw new Error("Name must be at least 3 characters");
  }

  static validateEmail(email: string): void {
    if (!email || !email.includes("@")) throw new Error("Invalid email format");
  }
}

// アプリケーション層: ユースケース
class CreateUserUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly emailService: EmailService
  ) {}

  async execute(name: string, email: string): Promise<User> {
    UserValidator.validateName(name);
    UserValidator.validateEmail(email);

    const user = new User(name, email);
    await this.userRepository.save(user);
    await this.emailService.sendWelcomeEmail(email);
    return user;
  }
}

// インフラ層: リポジトリ
class UserRepository {
  constructor(private readonly db: Database, private readonly cache: Cache) {}

  async save(user: User): Promise<void> {
    await this.db.save(user);
    await this.cache.set(`user:${user.id}`, user);
  }
}

// インフラ層: データベース
class MySQLDatabase implements Database {
  async save(entity: unknown): Promise<void> {
    // データベース操作
  }
}
```

### 例2の改善: UIとビジネスロジックを分離

```typescript
// ✅ 良い例: UIとビジネスロジックを分離

// UI層
class UserForm {
  constructor(private readonly createUserUseCase: CreateUserUseCase) {}

  private nameInput = new TextInput();
  private emailInput = new TextInput();

  async handleSubmit(): Promise<void> {
    const name = this.nameInput.getValue();
    const email = this.emailInput.getValue();

    try {
      await this.createUserUseCase.execute(name, email);
      this.showSuccess("User created successfully");
    } catch (e) {
      this.showError(e instanceof Error ? e.message : "Unknown error");
    }
  }
}

// アプリケーション層: ユースケース（UI層から独立）
class CreateUserUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly emailService: EmailService
  ) {}

  async execute(name: string, email: string): Promise<User> {
    UserValidator.validateName(name);
    UserValidator.validateEmail(email);

    const user = new User(name, email);
    await this.userRepository.save(user);
    await this.emailService.sendWelcomeEmail(email);
    return user;
  }
}
```

## 関心の分離パターン

### 1. 表示 / 入力 / 検証 / 通信

```typescript
// ✅ 良い例: 関心を分離

// 表示層
class UserView {
  render(user: User): void {
    console.log(`Name: ${user.name}`);
    console.log(`Email: ${user.email}`);
  }
}

// 入力層
class UserInput {
  getName(): string {
    return prompt("Enter name:") ?? "";
  }

  getEmail(): string {
    return prompt("Enter email:") ?? "";
  }
}

// 検証層
class UserValidator {
  static validate(name: string, email: string): void {
    if (!name || name.length < 3) throw new Error("Invalid name");
    if (!email || !email.includes("@")) throw new Error("Invalid email");
  }
}

// 通信層
class UserService {
  constructor(private readonly repository: UserRepository) {}

  async createUser(name: string, email: string): Promise<User> {
    UserValidator.validate(name, email);
    const user = new User(name, email);
    return this.repository.save(user);
  }
}
```

### 2. 状態管理の分離

```typescript
// ✅ 良い例: 状態管理を分離

// 状態管理層
class UserState {
  users: User[] = [];
  loading = false;
  error: string | null = null;

  setLoading(loading: boolean): void {
    this.loading = loading;
  }

  setError(error: string | null): void {
    this.error = error;
  }

  addUser(user: User): void {
    this.users = [...this.users, user];
  }
}

// ビジネスロジック層
class UserService {
  constructor(private readonly repository: UserRepository) {}

  async createUser(name: string, email: string): Promise<User> {
    const user = new User(name, email);
    return this.repository.save(user);
  }
}

// UI層
class UserComponent {
  constructor(
    private readonly state: UserState,
    private readonly service: UserService
  ) {}

  async handleCreate(name: string, email: string): Promise<void> {
    this.state.setLoading(true);
    try {
      const user = await this.service.createUser(name, email);
      this.state.addUser(user);
    } catch (e) {
      this.state.setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      this.state.setLoading(false);
    }
  }
}
```

## よくある違反パターン

### 1. ビジネスロジックとインフラの混在

```typescript
// ❌ 悪い例
class OrderService {
  async processOrder(order: Order): Promise<void> {
    // ビジネスロジック
    const total = order.items.reduce((sum, item) => sum + item.price, 0);

    // インフラ（データベース操作）
    const db = new MySQLDatabase();
    await db.save(order);

    // インフラ（メール送信）
    const emailService = new EmailService();
    await emailService.send(order.customer.email, `Order total: ${total}`);
  }
}

// ✅ 良い例
class OrderService {
  constructor(
    private readonly repository: OrderRepository,
    private readonly emailService: EmailService
  ) {}

  async processOrder(order: Order): Promise<void> {
    const total = this.calculateTotal(order);
    order.total = total;
    await this.repository.save(order);
    await this.emailService.sendConfirmation(order);
  }

  private calculateTotal(order: Order): number {
    return order.items.reduce((sum, item) => sum + item.price, 0);
  }
}
```

### 2. バリデーションの散在

```typescript
// ❌ 悪い例: バリデーションが各所に散在
class UserForm {
  submit(): void {
    if (!this.name) throw new Error("Name required"); // UI層にバリデーション
  }
}

class UserService {
  create(name: string): void {
    if (!name) throw new Error("Name required"); // サービス層にもバリデーション
  }
}

// ✅ 良い例: バリデーションを1箇所に
class UserValidator {
  static validateName(name: string): void {
    if (!name) throw new Error("Name required");
    if (name.length < 3) throw new Error("Name must be at least 3 characters");
  }
}

class UserForm {
  submit(): void {
    UserValidator.validateName(this.name);
  }
}

class UserService {
  create(name: string): void {
    UserValidator.validateName(name);
  }
}
```

## コードレビュー時のチェックポイント

1. **レイヤー分離**: UI、アプリケーション、ドメイン、インフラが分離されているか
2. **依存関係**: 上位レイヤーが下位レイヤーに依存しているか（逆転していないか）
3. **独立性**: 各レイヤーが独立してテストできるか
4. **責務の明確化**: 各クラスが単一の責務を持っているか
5. **関心の混在**: 異なる関心が1つのクラスに混在していないか

## レイヤー別の責務

### UI層 (Presentation Layer)
- ユーザーインターフェースの表示
- ユーザー入力の受け取り
- UIの状態管理

### アプリケーション層 (Application Layer)
- ユースケースの実装
- トランザクション管理
- レイヤー間の調整

### ドメイン層 (Domain Layer)
- ビジネスロジック
- ドメインモデル
- ビジネスルール

### インフラ層 (Infrastructure Layer)
- データベースアクセス
- 外部API呼び出し
- ファイル操作
- メール送信

## 依存関係のルール

- **上位レイヤーは下位レイヤーに依存できる**
- **下位レイヤーは上位レイヤーに依存してはいけない**
- **同じレイヤー内での依存は可能**
- **抽象に依存し、具象に依存しない**（Dependency Inversion）
