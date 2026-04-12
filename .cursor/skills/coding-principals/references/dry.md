# DRY原則 (Don't Repeat Yourself)

**原則**: 同じ情報やロジックを繰り返し書かない

重複コードは技術的負債の種。変更時に複数箇所を修正する必要があり、バグの温床となります。

## チェック観点

- 同じロジックが複数箇所に存在していないか
- コピペされたコードがないか
- 似たような処理が繰り返されていないか

## 違反例

### 例1: 重複した計算ロジック

```typescript
// ❌ 悪い例: 同じ計算が複数箇所に
function calculateTotalPrice(items: Item[]): number {
  let total = 0;
  for (const item of items) {
    let price = item.price * (1 + item.taxRate);
    if (item.isDiscountApplicable) {
      price = price * 0.9;
    }
    total += price;
  }
  return total;
}

function generateInvoice(items: Item[]): Invoice {
  let total = 0;
  for (const item of items) {
    let price = item.price * (1 + item.taxRate); // 重複
    if (item.isDiscountApplicable) {
      price = price * 0.9; // 重複
    }
    total += price;
  }
  return new Invoice(total);
}
```

### 例2: 重複したバリデーション

```typescript
// ❌ 悪い例: 同じバリデーションが複数箇所に
function createUser(name: string, email: string): void {
  if (!name || name.length < 3) {
    throw new Error("Name must be at least 3 characters");
  }
  if (!email || !email.includes("@")) {
    throw new Error("Invalid email format");
  }
  // ...
}

function updateUser(userId: string, name: string, email: string): void {
  if (!name || name.length < 3) { // 重複
    throw new Error("Name must be at least 3 characters");
  }
  if (!email || !email.includes("@")) { // 重複
    throw new Error("Invalid email format");
  }
  // ...
}
```

## 改善例

### 例1の改善: 共通ロジックを関数に抽出

```typescript
// ✅ 良い例: 共通ロジックを関数に抽出
function calculateItemPrice(item: Item): number {
  let price = item.price * (1 + item.taxRate);
  if (item.isDiscountApplicable) {
    price = price * 0.9;
  }
  return price;
}

function calculateTotalPrice(items: Item[]): number {
  return items.reduce((total, item) => total + calculateItemPrice(item), 0);
}

function generateInvoice(items: Item[]): Invoice {
  const total = calculateTotalPrice(items);
  return new Invoice(total);
}
```

### 例2の改善: バリデーション関数を作成

```typescript
// ✅ 良い例: バリデーション関数を作成
function validateName(name: string): void {
  if (!name || name.length < 3) {
    throw new Error("Name must be at least 3 characters");
  }
}

function validateEmail(email: string): void {
  if (!email || !email.includes("@")) {
    throw new Error("Invalid email format");
  }
}

function createUser(name: string, email: string): void {
  validateName(name);
  validateEmail(email);
  // ...
}

function updateUser(userId: string, name: string, email: string): void {
  validateName(name);
  validateEmail(email);
  // ...
}
```

### より高度な例: 高階関数でバリデーションを共通化

```typescript
// ✅ 良い例: 高階関数でバリデーションを共通化
function withUserValidation<T extends (name: string, email: string, ...args: any[]) => any>(
  fn: T
): T {
  return function (name: string, email: string, ...args: any[]) {
    if (!name || name.length < 3) {
      throw new Error("Name must be at least 3 characters");
    }
    if (!email || !email.includes("@")) {
      throw new Error("Invalid email format");
    }
    return fn(name, email, ...args);
  } as T;
}

const createUser = withUserValidation((name: string, email: string) => {
  // ...
});

const updateUser = withUserValidation((name: string, email: string, userId: string) => {
  // ...
});
```

## よくある違反パターン

### 1. マジックナンバーの重複

```typescript
// ❌ 悪い例
if (user.age >= 18) { // 18が複数箇所に
  // ...
}
if (person.age >= 18) { // 重複
  // ...
}

// ✅ 良い例
const ADULT_AGE = 18;
if (user.age >= ADULT_AGE) {
  // ...
}
```

### 2. 文字列リテラルの重複

```typescript
// ❌ 悪い例
if (status === "active") { // "active"が複数箇所に
  // ...
}
if (user.status === "active") { // 重複
  // ...
}

// ✅ 良い例
enum UserStatus {
  ACTIVE = "active",
  INACTIVE = "inactive",
  SUSPENDED = "suspended",
}

if (status === UserStatus.ACTIVE) {
  // ...
}
```

### 3. 設定値の重複

```typescript
// ❌ 悪い例: 設定値がコードに散在
function connectToDb(): void {
  const host = "localhost";
  const port = 5432;
  // ...
}

function backupDb(): void {
  const host = "localhost"; // 重複
  const port = 5432; // 重複
  // ...
}

// ✅ 良い例: 設定を一元管理
interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
}

const config: DatabaseConfig = {
  host: "localhost",
  port: 5432,
  database: "mydb",
};

function connectToDb(config: DatabaseConfig): void {
  // ...
}

function backupDb(config: DatabaseConfig): void {
  // ...
}
```

## コードレビュー時のチェックポイント

1. **重複ロジック**: 同じ計算や処理が複数箇所にないか
2. **コピペコード**: コピー&ペーストされたコードがないか
3. **マジックナンバー**: 数値や文字列リテラルが重複していないか
4. **設定の散在**: 設定値がコードに直接書かれていないか
5. **類似パターン**: 似たような処理が繰り返されていないか

## 注意点

DRY原則は重要ですが、過度に適用すると以下の問題が発生する可能性があります：

- **過度な抽象化**: 実際には異なる要件なのに無理に共通化する
- **結合度の増加**: 共通化により予期しない依存関係が生まれる
- **可読性の低下**: 共通化によりコードの流れが追いにくくなる

**判断基準**:
- 変更時に複数箇所を修正する必要がある → DRYを適用
- 将来的に異なる変更が必要になる可能性が高い → 分離を検討
- 現時点で同じだが、将来的に異なる可能性が高い → YAGNI原則も考慮
