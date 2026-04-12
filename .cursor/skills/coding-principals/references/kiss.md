# KISS原則 (Keep It Simple, Stupid)

**原則**: シンプルで理解しやすいコードを書く

賢いコードより、読めるコード。特にAI時代は「一瞬で複雑なコードは書ける」ので、KISSの価値が爆上がりしています。

## チェック観点

- コードを説明なしで読めるか
- 半年後の自分は理解できるか
- 過度に複雑な実装になっていないか
- シンプルな解決策で済むのに複雑な方法を使っていないか

## 違反例

### 例1: 過度に複雑な実装

```typescript
// ❌ 悪い例: 過度に複雑
function calculateTotal(items: Item[]): number {
  return items
    .filter((x) => x.isActive)
    .map((x) => x.price * x.quantity * (1 + x.taxRate))
    .reduce((acc, val) => acc + val, 0);
}
// ↑ 一行で書けるが、意図が読み取りにくい
```

### 例2: 過度な抽象化

```typescript
// ❌ 悪い例: シンプルな処理を過度に抽象化
interface Processor<T> {
  process(item: T): T;
}

abstract class Validator<T> {
  abstract validate(item: T): boolean;
}

abstract class Transformer<T> {
  abstract transform(item: T): T;
}

class Pipeline<T> {
  constructor(private readonly processors: Processor<T>[]) {}

  execute(item: T): T {
    return this.processors.reduce((result, processor) => processor.process(result), item);
  }
}

// シンプルな処理なのに複雑な構造
const pipeline = new Pipeline([new MyValidator(), new MyTransformer()]);
const result = pipeline.execute(data);
```

### 例3: 過度に凝った実装

```typescript
// ❌ 悪い例: シンプルな処理を複雑に
class UserManager {
  private cache: Map<string, User> = new Map();
  private observers: Observer[] = [];
  private strategy: Strategy | null = null;

  getUser(userId: string): User {
    if (this.cache.has(userId)) {
      return this.cache.get(userId)!;
    }

    const user = this.fetchUser(userId);
    this.cache.set(userId, user);
    this.notifyObservers("user_fetched", user);
    return user;
  }

  private notifyObservers(event: string, data: unknown): void {
    for (const observer of this.observers) {
      observer.onEvent(event, data);
    }
  }
}

// 単にユーザーを取得するだけなのに複雑すぎる
```

## 改善例

### 例1の改善: シンプルな実装

```typescript
// ✅ 良い例: シンプルで読みやすい
function calculateTotal(items: Item[]): number {
  let total = 0;
  for (const item of items) {
    if (!item.isActive) continue;
    const price = item.price * item.quantity * (1 + item.taxRate);
    total += price;
  }
  return total;
}
```

### 例2の改善: 必要最小限の実装

```typescript
// ✅ 良い例: シンプルな関数で十分
function validateAndTransform(data: Data): Data {
  if (!isValid(data)) {
    throw new Error("Invalid data");
  }
  return transform(data);
}

const result = validateAndTransform(data);
```

### 例3の改善: 必要に応じてシンプルに

```typescript
// ✅ 良い例: 必要最小限の実装
class UserManager {
  private cache: Map<string, User> = new Map();

  getUser(userId: string): User {
    if (this.cache.has(userId)) {
      return this.cache.get(userId)!;
    }

    const user = this.fetchUser(userId);
    this.cache.set(userId, user);
    return user;
  }
}
```

## よくある違反パターン

### 1. 過度なデザインパターンの使用

```typescript
// ❌ 悪い例: シンプルな処理にデザインパターンを適用
interface Strategy {
  process(data: number): number;
}

class AddStrategy implements Strategy {
  process(data: number): number {
    return data + 1;
  }
}

class StrategyContext {
  constructor(private readonly strategy: Strategy) {}
  execute(data: number): number {
    return this.strategy.process(data);
  }
}

// 単に +1 するだけなのに...
const result = new StrategyContext(new AddStrategy()).execute(5);

// ✅ 良い例: シンプルに
const result = 5 + 1;
```

### 2. 過度なジェネリクスや型パラメータ

```typescript
// ❌ 悪い例: シンプルな処理に過度な型パラメータ
class Mapper<T, R> {
  constructor(private readonly fn: (item: T) => R) {}

  map(items: T[]): R[] {
    return items.map(this.fn);
  }
}

const mapper = new Mapper<number, number>((x) => x * 2);
const result = mapper.map([1, 2, 3]);

// ✅ 良い例: シンプルに
const result = [1, 2, 3].map((x) => x * 2);
```

### 3. 過度なメタプログラミング

```typescript
// ❌ 悪い例: シンプルな処理に複雑なデコレータを使用
function logMethod(target: object, key: string, descriptor: PropertyDescriptor) {
  const original = descriptor.value;
  descriptor.value = function (...args: unknown[]) {
    console.log(`Calling ${key}`);
    return original.apply(this, args);
  };
  return descriptor;
}

class MyClass {
  @logMethod
  doSomething(): string {
    return "done";
  }
}

// ✅ 良い例: シンプルに
class MyClass {
  doSomething(): string {
    console.log("Calling doSomething");
    return "done";
  }
}
```

## コードレビュー時のチェックポイント

1. **可読性**: コードを説明なしで読めるか
2. **複雑さ**: シンプルな解決策で済むのに複雑な方法を使っていないか
3. **過度な抽象化**: 必要以上に抽象化していないか
4. **過度なパターン**: デザインパターンを過度に使用していないか
5. **理解のしやすさ**: 半年後の自分が理解できるか

## 判断基準

以下の場合はシンプルさを優先：

- **一度だけ使う処理**: 複雑な抽象化は不要
- **明確な要件**: 将来の拡張性が不明確な場合はシンプルに
- **チームの理解度**: チーム全体が理解できるレベルを維持

以下の場合は複雑さを許容：

- **複数箇所で使用**: 共通化により複雑さが正当化される
- **明確な将来の拡張性**: 将来の変更が明確に予測できる
- **パフォーマンス要件**: パフォーマンスが重要な場合は最適化を優先

## KISSと他の原則のバランス

- **KISS vs DRY**: 重複を排除するが、過度な抽象化は避ける
- **KISS vs YAGNI**: シンプルさを優先し、将来の機能への過度な準備を避ける
- **KISS vs SOLID**: 原則を守りつつ、シンプルな実装を心がける
