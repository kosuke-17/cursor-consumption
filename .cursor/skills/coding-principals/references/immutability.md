# 不変性・副作用の管理

**原則**: データの不変性を保ち、副作用を明確に管理する

不変性（Immutability）と純粋関数（Pure Function）により、コードの予測可能性とテスタビリティが向上します。「どこで世界が汚れるのか」を明確にします。

## チェック観点

- データが不変（immutable）か、変更可能（mutable）かが明確か
- 副作用が適切に分離されているか
- 純粋関数と副作用のある関数が区別されているか

## 不変性 (Immutability)

### 不変オブジェクトの利点

- **予測可能性**: オブジェクトが変更されないため、予期しない変更がない
- **スレッドセーフ**: 複数の処理から安全にアクセスできる
- **デバッグしやすい**: 状態が変わらないため、問題の原因を特定しやすい

### 違反例

```typescript
// ❌ 悪い例: 可変オブジェクトが予期せず変更される
class ShoppingCart {
  items: Item[] = [];

  addItem(item: Item): void {
    this.items.push(item);
  }

  calculateTotal(): number {
    return this.items.reduce((sum, item) => sum + item.price, 0);
  }
}

// 問題: 外部から直接変更可能
const cart = new ShoppingCart();
cart.addItem(new Item(100));
cart.items.push(new Item(200)); // 予期しない変更
const total = cart.calculateTotal(); // 予期しない結果

// ❌ 悪い例: 配列が予期せず変更される
function processItems(items: Item[]): number {
  const total = items.reduce((sum, item) => sum + item.price, 0);
  items.length = 0; // 副作用: 元の配列を破壊
  return total;
}

const items = [new Item(100), new Item(200)];
const total = processItems(items);
// itemsは空になっている（予期しない変更）
```

### 改善例

```typescript
// ✅ 良い例: 不変オブジェクトを使用
interface Item {
  readonly name: string;
  readonly price: number;
}

class ShoppingCart {
  private readonly items: readonly Item[];

  constructor(items: readonly Item[] = []) {
    this.items = items;
  }

  addItem(item: Item): ShoppingCart {
    // 新しいオブジェクトを返す（元のオブジェクトは変更しない）
    return new ShoppingCart([...this.items, item]);
  }

  calculateTotal(): number {
    return this.items.reduce((sum, item) => sum + item.price, 0);
  }
}

// 使用例
let cart = new ShoppingCart();
cart = cart.addItem({ name: "Apple", price: 100 });
cart = cart.addItem({ name: "Banana", price: 200 });
const total = cart.calculateTotal();

// ✅ 良い例: 元の配列を変更しない
function processItems(items: readonly Item[]): number {
  // 元の配列を変更せず、新しい値を返す
  return items.reduce((sum, item) => sum + item.price, 0);
}

const items: Item[] = [{ name: "Apple", price: 100 }, { name: "Banana", price: 200 }];
const result = processItems(items);
// itemsは変更されていない
```

## 純粋関数 (Pure Function)

### 純粋関数の特徴

- **同じ入力に対して常に同じ出力を返す**
- **副作用がない**（グローバル変数の変更、ファイルの読み書き、ネットワーク通信など）

### 違反例

```typescript
// ❌ 悪い例: 副作用がある関数
let counter = 0;

function incrementCounter(): number {
  counter += 1; // 副作用: グローバル変数を変更
  return counter;
}

// 同じ呼び出しでも結果が異なる
const result1 = incrementCounter(); // 1
const result2 = incrementCounter(); // 2（異なる結果）

// ❌ 悪い例: 外部状態に依存
function calculateTotal(items: Item[]): number {
  const taxRate = getTaxRateFromDatabase(); // 外部状態に依存
  return items.reduce((sum, item) => sum + item.price * (1 + taxRate), 0);
}

// ❌ 悪い例: 副作用がある（ログ出力、ファイル操作など）
function processOrder(order: Order): number {
  const total = order.items.reduce((sum, item) => sum + item.price, 0);
  console.log(`Processing order: ${total}`); // 副作用: ログ出力
  saveToFile(order); // 副作用: ファイル操作
  return total;
}
```

### 改善例

```typescript
// ✅ 良い例: 純粋関数
function increment(value: number): number {
  return value + 1; // 副作用なし、同じ入力に対して同じ出力
}

const result1 = increment(0); // 1
const result2 = increment(0); // 1（同じ結果）

// ✅ 良い例: 外部状態を引数として受け取る
function calculateTotal(items: readonly Item[], taxRate: number): number {
  // 外部状態に依存せず、引数として受け取る
  return items.reduce((sum, item) => sum + item.price * (1 + taxRate), 0);
}

// ✅ 良い例: 副作用を分離
function calculateOrderTotal(order: Order): number {
  // 純粋関数: 計算のみ
  return order.items.reduce((sum, item) => sum + item.price, 0);
}

function processOrder(order: Order): number {
  // 副作用のある関数: 計算と副作用を分離
  const total = calculateOrderTotal(order);
  console.log(`Processing order: ${total}`);
  saveToFile(order);
  return total;
}
```

## 副作用の隔離

### 副作用を明確に分離

```typescript
// ✅ 良い例: 副作用を分離

// 純粋関数: 計算のみ
function validateUser(name: string, email: string): { isValid: boolean; error: string } {
  if (!name || name.length < 3) return { isValid: false, error: "Name must be at least 3 characters" };
  if (!email || !email.includes("@")) return { isValid: false, error: "Invalid email format" };
  return { isValid: true, error: "" };
}

function createUserDomain(name: string, email: string): User {
  // 純粋関数: ドメインオブジェクトの作成
  return new User(name, email);
}

// 副作用のある関数: 副作用を明確に
async function saveUser(user: User, repository: UserRepository): Promise<User> {
  // 副作用: データベースへの保存
  return repository.save(user);
}

async function sendWelcomeEmail(user: User, emailService: EmailService): Promise<void> {
  // 副作用: メール送信
  await emailService.send(user.email, "Welcome!");
}

// ユースケース: 純粋関数と副作用を組み合わせ
async function createUserUseCase(
  name: string,
  email: string,
  repository: UserRepository,
  emailService: EmailService
): Promise<User> {
  // 1. バリデーション（純粋関数）
  const { isValid, error } = validateUser(name, email);
  if (!isValid) throw new Error(error);

  // 2. ドメインオブジェクトの作成（純粋関数）
  const user = createUserDomain(name, email);

  // 3. 副作用: 保存
  const savedUser = await saveUser(user, repository);

  // 4. 副作用: メール送信
  await sendWelcomeEmail(savedUser, emailService);

  return savedUser;
}
```

## よくある違反パターン

### 1. グローバル状態の変更

```typescript
// ❌ 悪い例: グローバル状態を変更
const config = { debug: false };

function toggleDebug(): void {
  config.debug = !config.debug; // 副作用
}

// ✅ 良い例: 状態を明示的に管理
interface Config {
  readonly debug: boolean;
}

function withDebug(config: Config, debug: boolean): Config {
  return { ...config, debug }; // 新しいオブジェクトを返す
}

const config: Config = { debug: false };
const debugConfig = withDebug(config, true);
```

### 2. 引数の変更

```typescript
// ❌ 悪い例: 引数を変更
function processItems(items: Item[]): number {
  items.sort((a, b) => a.price - b.price); // 副作用: 引数を変更
  return items.reduce((sum, item) => sum + item.price, 0);
}

const items = [{ name: "B", price: 200 }, { name: "A", price: 100 }];
const total = processItems(items);
// itemsがソートされている（予期しない変更）

// ✅ 良い例: 引数を変更しない
function processItems(items: readonly Item[]): number {
  const sorted = [...items].sort((a, b) => a.price - b.price); // 新しい配列を作成
  return sorted.reduce((sum, item) => sum + item.price, 0);
}

const items = [{ name: "B", price: 200 }, { name: "A", price: 100 }];
const total = processItems(items);
// itemsは変更されていない
```

### 3. 副作用の混在

```typescript
// ❌ 悪い例: 計算と副作用が混在
async function calculateAndSaveTotal(items: readonly Item[]): Promise<number> {
  const total = items.reduce((sum, item) => sum + item.price, 0);
  await saveToDatabase(total); // 副作用が混在
  return total;
}

// ✅ 良い例: 計算と副作用を分離
function calculateTotal(items: readonly Item[]): number {
  // 純粋関数: 計算のみ
  return items.reduce((sum, item) => sum + item.price, 0);
}

async function saveTotal(total: number, repository: Repository): Promise<void> {
  // 副作用: 保存のみ
  await repository.save(total);
}

// 使用例
const total = calculateTotal(items);
await saveTotal(total, repository);
```

## コードレビュー時のチェックポイント

1. **不変性**: オブジェクトが不変か、変更可能かが明確か
2. **純粋関数**: 副作用のない純粋関数が適切に使用されているか
3. **副作用の分離**: 副作用が適切に分離されているか
4. **状態の管理**: 状態の変更が明確か、予期しない変更がないか
5. **グローバル状態**: グローバル状態への依存がないか

## TypeScriptでの不変性の実装

### readonly とReadonly<T>

```typescript
interface User {
  readonly name: string;
  readonly email: string;
}

const user: User = { name: "Alice", email: "alice@example.com" };
// user.name = "Bob"; // エラー: 読み取り専用プロパティ

// ネストしたオブジェクトも不変に
type DeepReadonly<T> = { readonly [K in keyof T]: DeepReadonly<T[K]> };
```

### readonly 配列

```typescript
// readonly配列は変更不可
const items: readonly Item[] = [{ name: "Apple", price: 100 }];
// items.push(...); // エラー: pushは存在しない

// 新しい配列を作成
const newItems = [...items, { name: "Banana", price: 200 }];
```

### スプレッド構文によるコピー

```typescript
// オブジェクトのコピー
function updateUser(user: User, updates: Partial<User>): User {
  return { ...user, ...updates }; // 元のオブジェクトを変更しない
}

// 配列のコピー
function addItem(items: readonly Item[], item: Item): Item[] {
  return [...items, item]; // 元の配列を変更しない
}
```

## 副作用の管理パターン

### 1. 副作用を関数の最後に配置

```typescript
async function processOrder(order: Order): Promise<number> {
  // 1. 計算（純粋関数）
  const total = calculateTotal(order);

  // 2. 副作用を最後に
  await saveOrder(order);
  await sendNotification(order);

  return total;
}
```

### 2. 副作用を明示的にマーク

```typescript
// 命名規則で副作用を明確に
function calculateTotal(order: Order): number { /* 純粋関数 */ return 0; }
async function saveOrder(order: Order): Promise<void> { /* 副作用あり */ }
async function sendNotification(order: Order): Promise<void> { /* 副作用あり */ }
```

### 3. 副作用を別のレイヤーに分離

```typescript
// ドメイン層: 純粋関数
function calculateTotal(order: Order): number {
  return order.items.reduce((sum, item) => sum + item.price, 0);
}

// インフラ層: 副作用
class OrderRepository {
  async save(order: Order): Promise<void> {
    // データベースへの保存
  }
}
```
