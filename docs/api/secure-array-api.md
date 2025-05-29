# SecureArray API Reference

## Constructor

### `fArray<T>(initialData?, options?)`

Creates a new SecureArray instance.

**Parameters:**

-   `initialData?: T[]` - Initial array data
-   `options?: SecureArrayOptions` - Configuration options

**Returns:** `SecureArray<T>`

**Example:**

```javascript
const arr = fArray(["a", "b", "c"]);
const emptyArr = fArray();
const configuredArr = fArray([], { encryptionKey: "key" });
```

## Core Array Methods

### `get(index: number): T | undefined`

Gets an element at the specified index.

**Parameters:**

-   `index: number` - The index to retrieve

**Returns:** `T | undefined` - The element or undefined if not found

**Example:**

```javascript
const arr = fArray(["a", "b", "c"]);
console.log(arr.get(1)); // 'b'
console.log(arr.get(10)); // undefined
```

### `set(index: number, value: T): void`

Sets an element at the specified index.

**Parameters:**

-   `index: number` - The index to set
-   `value: T` - The value to set

**Throws:** Error if array is read-only or frozen

**Example:**

```javascript
const arr = fArray(["a", "b", "c"]);
arr.set(1, "modified");
console.log(arr.get(1)); // 'modified'
```

### `push(value: T): number`

Adds an element to the end of the array.

**Parameters:**

-   `value: T` - The value to add

**Returns:** `number` - The new length of the array

**Example:**

```javascript
const arr = fArray(["a", "b"]);
const newLength = arr.push("c");
console.log(newLength); // 3
```

### `pop(): T | undefined`

Removes and returns the last element.

**Returns:** `T | undefined` - The removed element or undefined if empty

**Example:**

```javascript
const arr = fArray(["a", "b", "c"]);
const last = arr.pop();
console.log(last); // 'c'
console.log(arr.length); // 2
```

### `shift(): T | undefined`

Removes and returns the first element.

**Returns:** `T | undefined` - The removed element or undefined if empty

**Example:**

```javascript
const arr = fArray(["a", "b", "c"]);
const first = arr.shift();
console.log(first); // 'a'
console.log(arr.toArray()); // ['b', 'c']
```

### `unshift(value: T): number`

Adds an element to the beginning of the array.

**Parameters:**

-   `value: T` - The value to add

**Returns:** `number` - The new length of the array

**Example:**

```javascript
const arr = fArray(["b", "c"]);
const newLength = arr.unshift("a");
console.log(arr.toArray()); // ['a', 'b', 'c']
```

### `splice(start: number, deleteCount?: number, ...items: T[]): T[]`

Changes the array by removing/adding elements.

**Parameters:**

-   `start: number` - Start index
-   `deleteCount?: number` - Number of elements to remove
-   `...items: T[]` - Items to add

**Returns:** `T[]` - Array of removed elements

**Example:**

```javascript
const arr = fArray(["a", "b", "c", "d"]);
const removed = arr.splice(1, 2, "x", "y");
console.log(removed); // ['b', 'c']
console.log(arr.toArray()); // ['a', 'x', 'y', 'd']
```

### `slice(start?: number, end?: number): T[]`

Returns a shallow copy of a portion of the array.

**Parameters:**

-   `start?: number` - Start index (default: 0)
-   `end?: number` - End index (default: length)

**Returns:** `T[]` - New array with selected elements

**Example:**

```javascript
const arr = fArray(["a", "b", "c", "d"]);
console.log(arr.slice(1, 3)); // ['b', 'c']
console.log(arr.slice(-2)); // ['c', 'd']
```

## Search and Filter Methods

### `indexOf(searchElement: T, fromIndex?: number): number`

Returns the first index of the element.

**Parameters:**

-   `searchElement: T` - Element to search for
-   `fromIndex?: number` - Start search index

**Returns:** `number` - Index of element or -1 if not found

**Example:**

```javascript
const arr = fArray(["a", "b", "c", "b"]);
console.log(arr.indexOf("b")); // 1
console.log(arr.indexOf("b", 2)); // 3
```

### `includes(searchElement: T, fromIndex?: number): boolean`

Checks if array contains the element.

**Parameters:**

-   `searchElement: T` - Element to search for
-   `fromIndex?: number` - Start search index

**Returns:** `boolean` - True if found, false otherwise

**Example:**

```javascript
const arr = fArray(["a", "b", "c"]);
console.log(arr.includes("b")); // true
console.log(arr.includes("d")); // false
```

### `find(predicate: (value: T, index: number) => boolean): T | undefined`

Returns the first element that satisfies the predicate.

**Parameters:**

-   `predicate: (value: T, index: number) => boolean` - Test function

**Returns:** `T | undefined` - Found element or undefined

**Example:**

```javascript
const arr = fArray([1, 2, 3, 4, 5]);
const found = arr.find((x) => x > 3);
console.log(found); // 4
```

### `filter(predicate: (value: T, index: number) => boolean): T[]`

Returns elements that satisfy the predicate.

**Parameters:**

-   `predicate: (value: T, index: number) => boolean` - Test function

**Returns:** `T[]` - Array of matching elements

**Example:**

```javascript
const arr = fArray([1, 2, 3, 4, 5]);
const evens = arr.filter((x) => x % 2 === 0);
console.log(evens); // [2, 4]
```

## Transformation Methods

### `map<U>(callback: (value: T, index: number) => U): U[]`

Creates a new array with transformed elements.

**Parameters:**

-   `callback: (value: T, index: number) => U` - Transform function

**Returns:** `U[]` - New array with transformed elements

**Example:**

```javascript
const arr = fArray([1, 2, 3]);
const doubled = arr.map((x) => x * 2);
console.log(doubled); // [2, 4, 6]
```

### `reduce<U>(callback: (acc: U, value: T, index: number) => U, initialValue: U): U`

Reduces the array to a single value.

**Parameters:**

-   `callback: (acc: U, value: T, index: number) => U` - Reducer function
-   `initialValue: U` - Initial accumulator value

**Returns:** `U` - Final accumulated value

**Example:**

```javascript
const arr = fArray([1, 2, 3, 4]);
const sum = arr.reduce((acc, val) => acc + val, 0);
console.log(sum); // 10
```

### `forEach(callback: (value: T, index: number) => void): void`

Executes a function for each element.

**Parameters:**

-   `callback: (value: T, index: number) => void` - Function to execute

**Example:**

```javascript
const arr = fArray(["a", "b", "c"]);
arr.forEach((value, index) => {
    console.log(`${index}: ${value}`);
});
// 0: a
// 1: b
// 2: c
```

## Utility Methods

### `sort(compareFn?: (a: T, b: T) => number): void`

Sorts the array in place.

**Parameters:**

-   `compareFn?: (a: T, b: T) => number` - Compare function

**Example:**

```javascript
const arr = fArray([3, 1, 4, 1, 5]);
arr.sort(); // Alphabetical sort
console.log(arr.toArray()); // [1, 1, 3, 4, 5]

const nums = fArray([3, 1, 4, 1, 5]);
nums.sort((a, b) => b - a); // Descending
console.log(nums.toArray()); // [5, 4, 3, 1, 1]
```

### `reverse(): void`

Reverses the array in place.

**Example:**

```javascript
const arr = fArray(["a", "b", "c"]);
arr.reverse();
console.log(arr.toArray()); // ['c', 'b', 'a']
```

### `join(separator?: string): string`

Joins all elements into a string.

**Parameters:**

-   `separator?: string` - Separator string (default: ',')

**Returns:** `string` - Joined string

**Example:**

```javascript
const arr = fArray(["a", "b", "c"]);
console.log(arr.join()); // 'a,b,c'
console.log(arr.join(" | ")); // 'a | b | c'
```

## Advanced Methods

### `unique(): SecureArray<T>`

Returns a new SecureArray with unique elements.

**Returns:** `SecureArray<T>` - New array with duplicates removed

**Example:**

```javascript
const arr = fArray([1, 2, 2, 3, 3, 3]);
const unique = arr.unique();
console.log(unique.toArray()); // [1, 2, 3]
```

### `min(): T | undefined`

Returns the minimum element.

**Returns:** `T | undefined` - Minimum element or undefined if empty

**Example:**

```javascript
const arr = fArray([3, 1, 4, 1, 5]);
console.log(arr.min()); // 1
```

### `max(): T | undefined`

Returns the maximum element.

**Returns:** `T | undefined` - Maximum element or undefined if empty

**Example:**

```javascript
const arr = fArray([3, 1, 4, 1, 5]);
console.log(arr.max()); // 5
```

### `shuffle(): void`

Randomly shuffles the array in place.

**Example:**

```javascript
const arr = fArray([1, 2, 3, 4, 5]);
arr.shuffle();
console.log(arr.toArray()); // [3, 1, 5, 2, 4] (random order)
```

### `compact(): void`

Removes falsy values (null, undefined, empty strings).

**Example:**

```javascript
const arr = fArray([1, null, 2, undefined, 3, "", 4]);
arr.compact();
console.log(arr.toArray()); // [1, 2, 3, 4]
```

## Security Methods

### `setEncryptionKey(key: string): void`

Sets the encryption key for the array.

**Parameters:**

-   `key: string` - Encryption key

**Example:**

```javascript
const arr = fArray(["sensitive", "data"]);
arr.setEncryptionKey("my-secret-key");
```

### `encryptAll(): void`

Encrypts all elements in the array.

**Example:**

```javascript
const arr = fArray(["secret1", "secret2"]);
arr.setEncryptionKey("key");
arr.encryptAll();
```

### `getEncryptionStatus(): EncryptionStatus`

Gets the current encryption status.

**Returns:** `EncryptionStatus` - Encryption status object

**Example:**

```javascript
const arr = fArray(["data"]);
arr.setEncryptionKey("key");
const status = arr.getEncryptionStatus();
console.log(status);
// {
//   isInitialized: true,
//   hasEncryptionKey: true,
//   algorithm: "AES-256-CTR-HMAC"
// }
```

## State Management

### `makeReadOnly(): void`

Makes the array read-only.

**Example:**

```javascript
const arr = fArray(["data"]);
arr.makeReadOnly();
// arr.push('new'); // Throws error
```

### `makeWritable(): void`

Makes the array writable again.

**Example:**

```javascript
const arr = fArray(["data"]);
arr.makeReadOnly();
arr.makeWritable();
arr.push("new"); // Works
```

### `freeze(): void`

Freezes the array (immutable).

**Example:**

```javascript
const arr = fArray(["data"]);
arr.freeze();
// arr.push('new'); // Throws error
```

### `unfreeze(): void`

Unfreezes the array.

**Example:**

```javascript
const arr = fArray(["data"]);
arr.freeze();
arr.unfreeze();
arr.push("new"); // Works
```

## Snapshot Management

### `createSnapshot(): string`

Creates a snapshot of the current array state.

**Returns:** `string` - Snapshot ID

**Example:**

```javascript
const arr = fArray(["v1", "data"]);
const snapshotId = arr.createSnapshot();
```

### `restoreFromSnapshot(snapshotId: string): void`

Restores the array from a snapshot.

**Parameters:**

-   `snapshotId: string` - Snapshot ID to restore

**Example:**

```javascript
const arr = fArray(["original"]);
const id = arr.createSnapshot();
arr.push("modified");
arr.restoreFromSnapshot(id);
console.log(arr.toArray()); // ['original']
```

### `listSnapshots(): string[]`

Lists all available snapshot IDs.

**Returns:** `string[]` - Array of snapshot IDs

**Example:**

```javascript
const arr = fArray(["data"]);
const id1 = arr.createSnapshot();
const id2 = arr.createSnapshot();
console.log(arr.listSnapshots()); // [id1, id2]
```

### `deleteSnapshot(snapshotId: string): void`

Deletes a snapshot.

**Parameters:**

-   `snapshotId: string` - Snapshot ID to delete

**Example:**

```javascript
const arr = fArray(["data"]);
const id = arr.createSnapshot();
arr.deleteSnapshot(id);
```

## Event System

### `on(event: string, listener: Function): void`

Adds an event listener.

**Parameters:**

-   `event: string` - Event name
-   `listener: Function` - Event handler

**Example:**

```javascript
const arr = fArray(["data"]);
arr.on("push", (data) => {
    console.log("Item pushed:", data);
});
```

### `off(event: string, listener?: Function): void`

Removes an event listener.

**Parameters:**

-   `event: string` - Event name
-   `listener?: Function` - Specific listener to remove

**Example:**

```javascript
const arr = fArray(["data"]);
const handler = (data) => console.log(data);
arr.on("push", handler);
arr.off("push", handler);
```

### `once(event: string, listener: Function): void`

Adds a one-time event listener.

**Parameters:**

-   `event: string` - Event name
-   `listener: Function` - Event handler

**Example:**

```javascript
const arr = fArray(["data"]);
arr.once("clear", () => {
    console.log("Array cleared!");
});
```

## Serialization

### `serialize(options?: SerializationOptions): string`

Serializes the array to a string.

**Parameters:**

-   `options?: SerializationOptions` - Serialization options

**Returns:** `string` - Serialized data

**Example:**

```javascript
const arr = fArray(["data1", "data2"]);
const serialized = arr.serialize({
    includeMetadata: true,
    compression: true,
});
```

### `exportData(format: 'json' | 'csv' | 'xml' | 'yaml'): string`

Exports array data in specified format.

**Parameters:**

-   `format: 'json' | 'csv' | 'xml' | 'yaml'` - Export format

**Returns:** `string` - Exported data

**Example:**

```javascript
const arr = fArray(["a", "b", "c"]);
const csv = arr.exportData("csv");
console.log(csv);
// Index,Value,Type
// 0,"a",string
// 1,"b",string
// 2,"c",string
```

## Statistics and Monitoring

### `getStats(): ArrayStats`

Gets comprehensive array statistics.

**Returns:** `ArrayStats` - Statistics object

**Example:**

```javascript
const arr = fArray(["data1", "data2"]);
const stats = arr.getStats();
console.log(stats);
// {
//   length: 2,
//   memoryUsage: 156,
//   totalAccesses: 0,
//   secureElements: 0,
//   lastModified: 1748480356504,
//   version: 1,
//   createdAt: 1748480356500,
//   isReadOnly: false,
//   isFrozen: false
// }
```

### `validateIntegrity(): boolean`

Validates the integrity of the array.

**Returns:** `boolean` - True if integrity is valid

**Example:**

```javascript
const arr = fArray(["data"]);
const isValid = arr.validateIntegrity();
console.log(isValid); // true
```

## Utility Methods

### `toArray(): T[]`

Converts SecureArray to regular array.

**Returns:** `T[]` - Regular JavaScript array

**Example:**

```javascript
const arr = fArray(["a", "b", "c"]);
const regular = arr.toArray();
console.log(regular); // ['a', 'b', 'c']
```

### `clear(): void`

Removes all elements from the array.

**Example:**

```javascript
const arr = fArray(["a", "b", "c"]);
arr.clear();
console.log(arr.length); // 0
```

### `destroy(): void`

Destroys the array and cleans up resources.

**Example:**

```javascript
const arr = fArray(["sensitive", "data"]);
arr.destroy(); // Secure cleanup
```

## Properties

### `length: number` (readonly)

Gets the number of elements in the array.

**Example:**

```javascript
const arr = fArray(["a", "b", "c"]);
console.log(arr.length); // 3
```

### `id: string` (readonly)

Gets the unique identifier of the array.

**Example:**

```javascript
const arr = fArray(["data"]);
console.log(arr.id); // "f.arr.-416c727142646a335a42-..."
```

### `isReadOnly: boolean` (readonly)

Checks if the array is read-only.

**Example:**

```javascript
const arr = fArray(["data"]);
console.log(arr.isReadOnly); // false
arr.makeReadOnly();
console.log(arr.isReadOnly); // true
```

### `isFrozen: boolean` (readonly)

Checks if the array is frozen.

**Example:**

```javascript
const arr = fArray(["data"]);
console.log(arr.isFrozen); // false
arr.freeze();
console.log(arr.isFrozen); // true
```

## Types

### `SecureArrayOptions`

Configuration options for SecureArray.

```typescript
interface SecureArrayOptions {
    readOnly?: boolean;
    autoDestroy?: boolean;
    encryptionKey?: string;
    maxMemory?: number;
    gcThreshold?: number;
    enableMemoryTracking?: boolean;
    autoCleanup?: boolean;
    maxLength?: number;
    maxSize?: number;
    enableIndexValidation?: boolean;
    enableTypeValidation?: boolean;
}
```

### `EncryptionStatus`

Encryption status information.

```typescript
interface EncryptionStatus {
    isInitialized: boolean;
    hasEncryptionKey: boolean;
    algorithm: string;
}
```

### `ArrayStats`

Array statistics information.

```typescript
interface ArrayStats {
    length: number;
    memoryUsage: number;
    totalAccesses: number;
    secureElements: number;
    lastModified: number;
    version: number;
    createdAt: number;
    isReadOnly: boolean;
    isFrozen: boolean;
}
```

