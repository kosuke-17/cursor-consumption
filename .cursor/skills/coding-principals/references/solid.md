# SOLID原則

オブジェクト指向設計の5つの基本原則。コードレビュー時に、これらの原則に基づいて設計の質を評価します。

## 1. Single Responsibility Principle (単一責任の原則)

**原則**: 1つのクラスや関数は1つの責務だけを持つべき

### チェック観点

- クラスや関数の説明に「と」が3回以上出てきたら怪しい
- 変更する理由が複数ある場合は責務が分離できていない可能性

### 違反例

```typescript
// ❌ 悪い例: ユーザー管理とメール送信の2つの責務を持つ
class UserManager {
  createUser(name: string, email: string): User {
    // ユーザー作成ロジック
    const user = new User(name, email);
    this.db.save(user);

    // メール送信ロジック（別の責務）
    const emailService = new EmailService();
    emailService.sendWelcomeEmail(email);
    return user;
  }
}
```

### 改善例

```typescript
// ✅ 良い例: 責務を分離
class UserManager {
  constructor(private readonly emailService: EmailService) {}

  createUser(name: string, email: string): User {
    const user = new User(name, email);
    this.db.save(user);
    return user;
  }
}

class UserRegistrationService {
  constructor(
    private readonly userManager: UserManager,
    private readonly emailService: EmailService
  ) {}

  registerUser(name: string, email: string): User {
    const user = this.userManager.createUser(name, email);
    this.emailService.sendWelcomeEmail(email);
    return user;
  }
}
```

## 2. Open/Closed Principle (開放閉鎖の原則)

**原則**: 拡張に対して開いており、修正に対して閉じているべき

### チェック観点

- if文やswitch文が増え続けている → 拡張性に問題
- 新しい機能追加のたびに既存コードを修正している

### 違反例

```typescript
// ❌ 悪い例: 新しい支払い方法を追加するたびに既存コードを修正
function processPayment(paymentType: string, amount: number): void {
  if (paymentType === "credit_card") {
    // クレジットカード処理
  } else if (paymentType === "paypal") {
    // PayPal処理
  } else if (paymentType === "bank_transfer") { // 追加のたびに修正が必要
    // 銀行振込処理
  }
}
```

### 改善例

```typescript
// ✅ 良い例: 拡張可能な設計
interface PaymentProcessor {
  process(amount: number): void;
}

class CreditCardProcessor implements PaymentProcessor {
  process(amount: number): void {
    // クレジットカード処理
  }
}

class PayPalProcessor implements PaymentProcessor {
  process(amount: number): void {
    // PayPal処理
  }
}

// 新しい支払い方法を追加しても既存コードを変更しない
class BankTransferProcessor implements PaymentProcessor {
  process(amount: number): void {
    // 銀行振込処理
  }
}
```

## 3. Liskov Substitution Principle (リスコフ置換の原則)

**原則**: 派生クラスは基底クラスと置き換え可能であるべき

### チェック観点

- サブクラスが基底クラスの契約を破っていないか
- サブクラスで例外が発生する可能性が高くなっていないか

### 違反例

```typescript
// ❌ 悪い例: サブクラスが基底クラスの期待を破る
class Rectangle {
  constructor(public width: number, public height: number) {}

  setWidth(width: number): void {
    this.width = width;
  }

  setHeight(height: number): void {
    this.height = height;
  }
}

class Square extends Rectangle {
  setWidth(width: number): void {
    this.width = width;
    this.height = width; // 正方形の特性
  }

  setHeight(height: number): void {
    this.width = height;
    this.height = height; // 正方形の特性
  }
}

// 問題: Rectangleを期待するコードでSquareを使うと予期しない動作
function testRectangle(rect: Rectangle): void {
  rect.setWidth(5);
  rect.setHeight(4);
  console.assert(rect.width === 5); // Squareの場合、heightも5になってしまう
}
```

### 改善例

```typescript
// ✅ 良い例: 共通のインターフェースを使用
interface Shape {
  area(): number;
}

class Rectangle implements Shape {
  constructor(private readonly width: number, private readonly height: number) {}

  area(): number {
    return this.width * this.height;
  }
}

class Square implements Shape {
  constructor(private readonly side: number) {}

  area(): number {
    return this.side ** 2;
  }
}
```

## 4. Interface Segregation Principle (インターフェース分離の原則)

**原則**: クライアントは使わないメソッドに依存すべきではない

### チェック観点

- インターフェースに未使用のメソッドがないか
- クラスが多くのメソッドを持ちすぎていないか

### 違反例

```typescript
// ❌ 悪い例: 使わないメソッドを実装する必要がある
interface Worker {
  work(): void;
  eat(): void;
  sleep(): void;
}

class Robot implements Worker {
  work(): void {
    // 動作する
  }

  eat(): void {
    throw new Error("Robots don't eat"); // ロボットは食べないのに実装が必要
  }

  sleep(): void {
    throw new Error("Robots don't sleep"); // ロボットは眠らないのに実装が必要
  }
}
```

### 改善例

```typescript
// ✅ 良い例: インターフェースを分離
interface Workable {
  work(): void;
}

interface Eatable {
  eat(): void;
}

interface Sleepable {
  sleep(): void;
}

class Human implements Workable, Eatable, Sleepable {
  work(): void {}
  eat(): void {}
  sleep(): void {}
}

class Robot implements Workable { // 必要なインターフェースのみ実装
  work(): void {}
}
```

## 5. Dependency Inversion Principle (依存性逆転の原則)

**原則**: 高レベルモジュールは低レベルモジュールに依存すべきではなく、両方とも抽象に依存すべき

### チェック観点

- 具象クラスに直接依存していないか
- 依存関係が逆転しているか（抽象に依存しているか）

### 違反例

```typescript
// ❌ 悪い例: 具象クラスに直接依存
class MySQLDatabase {
  save(data: unknown): void {
    // MySQL固有の実装
  }
}

class UserService {
  private readonly db = new MySQLDatabase(); // 具象クラスに依存

  createUser(userData: UserData): void {
    this.db.save(userData);
  }
}

// PostgreSQLに変更する場合、UserServiceを修正する必要がある
```

### 改善例

```typescript
// ✅ 良い例: 抽象に依存
interface Database {
  save(data: unknown): void;
}

class MySQLDatabase implements Database {
  save(data: unknown): void {
    // MySQL固有の実装
  }
}

class PostgreSQLDatabase implements Database {
  save(data: unknown): void {
    // PostgreSQL固有の実装
  }
}

class UserService {
  constructor(private readonly db: Database) {} // 抽象に依存

  createUser(userData: UserData): void {
    this.db.save(userData);
  }
}

// データベースを変更してもUserServiceは変更不要
```

## コードレビュー時のチェックポイント

1. **Single Responsibility**: クラスや関数の説明に「と」が3回以上出ていないか
2. **Open/Closed**: switch/if文が増え続けていないか、新しい機能追加で既存コードを修正していないか
3. **Liskov Substitution**: サブクラスが基底クラスの期待を破っていないか
4. **Interface Segregation**: 使わないメソッドを実装する必要がないか
5. **Dependency Inversion**: 具象クラスに直接依存していないか、抽象に依存しているか
