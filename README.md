# loud-array

A loud array that can broadcast changes. It is 100% API compatible
with ordinary arrays.

```typescript
import { La } from "loud-array"

const la = new La(1, 2, 3)

la.hear((event)=>{
  console.log("Cleared?", event.cleared)
  console.log("Removed:", event.removed, "at:", event.removedAt)
  console.log("Inserted:", event.inserted, "at:", event.insertedAt)
})

la.push(4, 5, 6)
// Cleared? false
// Removed: [] at:-1
// Inserted: [4, 5, 6] at:3

la.pop()
// Cleared? false
// Removed: [6] at:5
// Inserted: [] at:-1

la.reverse()
// Cleared? true
// Removed: [] at:-1
// Inserted: [5, 4, 3, 2, 1] at:0
```
