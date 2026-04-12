# 可読性最優先原則

**原則**: コードは人間が読むもの。可読性を最優先にする

名前が設計の8割。コメントよりコードで語る。驚き最小の原則（Least Surprise）を守る。

## チェック観点

- これは「説明なしで読めるか？」
- 半年後の自分はキレないか？
- 名前が適切か（変数名、関数名、クラス名）
- コメントが必要なほど複雑になっていないか

## 命名規則

### 良い命名の例

```typescript
// ✅ 良い例: 意図が明確
function calculateTotalPrice(items: Item[]): number {
  let total = 0;
  for (const item of items) {
    const price = item.isDiscountApplicable ? item.price * 0.9 : item.price;
    total += price;
  }
  return total;
}

// ✅ 良い例: ブール値は is / has / can で始める
function isValidEmail(email: string): boolean {
  return email.includes("@") && email.split("@")[1].includes(".");
}

function hasPermission(user: User, action: string): boolean {
  return user.permissions.includes(action);
}

// ✅ 良い例: 動詞で始める関数名
function createUser(name: string, email: string): User { /* ... */ }
function validateInput(data: unknown): void { /* ... */ }
function sendNotification(message: string): void { /* ... */ }
```

### 悪い命名の例

```typescript
// ❌ 悪い例: 意図が不明確
function calc(items: any[]): number { // calcって何？
  let t = 0;
  for (const i of items) {
    const p = i.d ? i.p * 0.9 : i.p; // d, pって何？
    t += p;
  }
  return t;
}

// ❌ 悪い例: 略語が多すぎる
function usrMgr(): void {} // userManagerの方が明確
function dbConn(): void {} // databaseConnectionの方が明確

// ❌ 悪い例: 意味のない名前
function process(data: unknown): void {} // processって何をするの？
function handle(request: Request): void {} // handleって何をするの？
```

## コードで語る

### コメントよりコードで語る

```typescript
// ❌ 悪い例: コメントで説明が必要
function calculate(x: number, y: number): number {
  // xがyより大きい場合、xからyを引く
  if (x > y) {
    return x - y;
  }
  // そうでない場合、0を返す
  return 0;
}

// ✅ 良い例: コードで語る
function calculateDifference(larger: number, smaller: number): number {
  if (larger > smaller) {
    return larger - smaller;
  }
  return 0;
}

// さらに良い例: 関数名で意図を明確に
function subtractIfLarger(larger: number, smaller: number): number {
  return larger > smaller ? larger - smaller : 0;
}
```

### マジックナンバーを避ける

```typescript
// ❌ 悪い例: マジックナンバー
function isAdult(age: number): boolean {
  return age >= 18; // 18って何？
}

function calculateDiscount(price: number): number {
  return price * 0.9; // 0.9って何？
}

// ✅ 良い例: 定数で意味を明確に
const ADULT_AGE = 18;
const DISCOUNT_RATE = 0.9;

function isAdult(age: number): boolean {
  return age >= ADULT_AGE;
}

function calculateDiscount(price: number): number {
  return price * DISCOUNT_RATE;
}
```

## 驚き最小の原則 (Least Surprise)

### 期待通りの動作をする

```typescript
// ❌ 悪い例: 予期しない動作
function getUserName(user: User): string {
  // ユーザー名がない場合、IDを返す（驚き！）
  if (!user.name) {
    return String(user.id);
  }
  return user.name;
}

// ✅ 良い例: 期待通りの動作
function getUserName(user: User): string | null {
  return user.name ?? null; // nullの場合はnullを返す（期待通り）
}

function getUserNameOrId(user: User): string {
  // 関数名で意図を明確に
  return user.name ?? String(user.id);
}
```

### 副作用を明確にする

```typescript
// ❌ 悪い例: 予期しない副作用
function calculateTotal(items: Item[]): number {
  let total = 0;
  for (const item of items) {
    total += item.price;
    item.processed = true; // 驚き！副作用がある
  }
  return total;
}

// ✅ 良い例: 副作用を明確に
function calculateTotal(items: Item[]): number {
  return items.reduce((total, item) => total + item.price, 0);
}

function markItemsAsProcessed(items: Item[]): void {
  for (const item of items) {
    item.processed = true;
  }
}

// 使用例
const total = calculateTotal(items);
markItemsAsProcessed(items);
```

## 関数の長さと複雑さ

### 短く、単一の責務を持つ関数

```typescript
// ❌ 悪い例: 長すぎる関数
function processOrder(order: Order): Order {
  // バリデーション
  if (!order.items.length) throw new Error("Order must have items");
  if (!order.customer) throw new Error("Order must have customer");

  // 価格計算
  let total = 0;
  for (const item of order.items) {
    let price = item.price * item.quantity;
    if (item.isDiscountApplicable) price *= 0.9;
    total += price;
  }

  // 在庫チェック
  for (const item of order.items) {
    if (item.stock < item.quantity) {
      throw new Error(`Insufficient stock for ${item.name}`);
    }
  }

  // 在庫更新
  for (const item of order.items) {
    item.stock -= item.quantity;
  }

  // 注文保存
  order.total = total;
  order.status = "confirmed";
  order.save();

  // 通知送信
  sendEmail(order.customer.email, `Order ${order.id} confirmed`);

  return order;
}

// ✅ 良い例: 責務を分離
function validateOrder(order: Order): void {
  if (!order.items.length) throw new Error("Order must have items");
  if (!order.customer) throw new Error("Order must have customer");
}

function calculateOrderTotal(order: Order): number {
  return order.items.reduce((total, item) => {
    const price = item.price * item.quantity;
    return total + (item.isDiscountApplicable ? price * 0.9 : price);
  }, 0);
}

function checkStock(order: Order): void {
  for (const item of order.items) {
    if (item.stock < item.quantity) {
      throw new Error(`Insufficient stock for ${item.name}`);
    }
  }
}

function updateStock(order: Order): void {
  for (const item of order.items) {
    item.stock -= item.quantity;
  }
}

function saveOrder(order: Order, total: number): void {
  order.total = total;
  order.status = "confirmed";
  order.save();
}

function processOrder(order: Order): Order {
  validateOrder(order);
  const total = calculateOrderTotal(order);
  checkStock(order);
  updateStock(order);
  saveOrder(order, total);
  sendOrderConfirmation(order);
  return order;
}
```

## コードの構造

### 早期リターンでネストを減らす

```typescript
// ❌ 悪い例: 深いネスト
function processUser(user: User | null): Result | null {
  if (user) {
    if (user.isActive) {
      if (user.hasPermission("write")) {
        return user.process();
      } else {
        return null;
      }
    } else {
      return null;
    }
  } else {
    return null;
  }
}

// ✅ 良い例: 早期リターン
function processUser(user: User | null): Result | null {
  if (!user) return null;
  if (!user.isActive) return null;
  if (!user.hasPermission("write")) return null;
  return user.process();
}
```

### ガード句で条件を明確に

```typescript
// ❌ 悪い例: 複雑な条件
function canAccess(user: User | null, resource: Resource | null): boolean {
  if (user && user.isActive && user.hasPermission("read") && resource && resource.isPublic || user?.isAdmin) {
    return true;
  }
  return false;
}

// ✅ 良い例: ガード句で明確に
function canAccess(user: User | null, resource: Resource | null): boolean {
  if (!user || !user.isActive) return false;
  if (user.isAdmin) return true;
  if (!resource) return false;
  if (resource.isPublic) return true;
  return user.hasPermission("read");
}
```

## コードレビュー時のチェックポイント

1. **命名**: 変数名、関数名、クラス名が適切か
2. **可読性**: 説明なしで読めるか
3. **コメント**: コメントが必要なほど複雑になっていないか
4. **驚き最小**: 予期しない動作をしていないか
5. **関数の長さ**: 関数が長すぎないか、単一の責務を持っているか
6. **ネスト**: 深いネストになっていないか
7. **マジックナンバー**: 意味のない数値や文字列がないか

## 命名のベストプラクティス

### 変数名

- **名詞**: `user`, `order`, `totalPrice`
- **ブール値**: `isActive`, `hasPermission`, `canEdit`
- **コレクション**: `users`, `orders`, `items` (複数形)

### 関数名

- **動詞で始める**: `createUser`, `validateInput`, `sendEmail`
- **意図を明確に**: `calculateTotal` ではなく `calculateOrderTotal`
- **副作用を明確に**: `getUser` (副作用なし) vs `updateUser` (副作用あり)

### クラス名

- **名詞**: `User`, `Order`, `PaymentProcessor`
- **単数形**: `User` であり `Users` ではない
- **抽象クラス/インターフェース**: `BaseUser`, `IProcessor`

## 可読性の判断基準

以下の質問に「はい」と答えられるか：

1. コードを読むだけで何をしているか理解できるか？
2. 変数名や関数名から意図が明確か？
3. コメントなしで理解できるか？
4. 半年後の自分が理解できるか？
5. チームメンバーが理解できるか？
