// TODO: Think through adding a "everything" event
// for eg reverse, which necessarily changes every element
// or for sort, etc

export interface LaEvent<T> {
  cleared:boolean
  removed:T[]
  removedAt:number
  inserted:T[]
  insertedAt:number
}

interface Event<T> {
  cleared?:boolean
  removed?:T[]
  removedAt?:number
  inserted?:T[]
  insertedAt?:number
}

type LaEar<T> = (event:LaEvent<T>)=>void

const ears = Symbol("ears")
const proxy = Symbol("proxy")

export class La<T> extends Array<T> {

  private [ears] = new Set<LaEar<T>>();
  private [proxy]:this

  constructor(...elements:T[]) {
    super(...elements)
    const a = this
    const r = new Proxy(this, {
      set:(target: La<T>, p: string | symbol, newValue: any, receiver: any): boolean => {
        const n = Number(p)
        if (Number.isNaN(n)) {
          (a as any)[p] = newValue
          return true
        }
        const old = (a as any)[p];
        (a as any)[p] = newValue
        a.fire({
          removed:[old as T], 
          removedAt:n,
          inserted:[newValue as T],
          insertedAt:n,
        })
        return true
      }
    })
    this[proxy] = r as this
    return r
  }

  private fire(input:Event<T>) {
    const event = {
      cleared: input.cleared ?? false,
      removed: input.removed ?? [],
      removedAt: input.removedAt ?? -1,
      inserted: input.inserted ?? [],
      insertedAt: input.insertedAt ?? -1
    }
    this[ears].forEach(f => f(event))
  }

  listen = (ear:LaEar<T>) => {
    this[ears].add(ear)
    ear({
      cleared:false,
      removed:[],
      removedAt:-1,
      inserted:this,
      insertedAt:0
    })
  }

  stopListening = (ear:LaEar<T>) => {
    this[ears].delete(ear)
  }

  private normalize(index:number):number {
    const len = this.length
    if (index < -len) return 0
    return index < 0 ? len + index : index
  }

  readonly copyWithin = (target:number, start:number, end?:number):this => {
    const len = this.length
    start = this.normalize(start)
    end = end === undefined ? len : this.normalize(end)
    if (end <= start) {
      return this[proxy] // nothing to copy
    }
    target = this.normalize(target)
    if (target >= len) {
      return this[proxy] // nothing to copy
    }
    if ((target > start) && (target + end - start >= len)) {
      end -= len - (target + end - start)
    }
    const inserted = this.slice(start, end)
    const removed  = this.slice(target, target + end - start)
    super.copyWithin(target, start, end)
    this.fire({removed, removedAt:target, inserted, insertedAt:target})
    return this[proxy]
  }

  readonly fill = (value:T, start?:number, end?:number):this => {
    const len = this.length
    start = (start === undefined) ? 0 : this.normalize(start)
    if (start >= len) {
      return this[proxy] // nothing to fill
    }
    end = (end === undefined) ? len : this.normalize(end)
    if (end <= start) {
      return this[proxy] // nothing to fill
    }
    if (end > len) {
      end = len
    }
    const removed = this.slice(start, end)
    super.fill(value, start, end)
    const inserted = this.slice(start, end)
    this.fire({removed, removedAt:start, inserted, insertedAt:start})
    return this[proxy]
  }

  readonly pop = () => {
    const len = this.length;
    const r = super.pop()
    if (len > 0) {
      this.fire({removed:[r!], removedAt:len - 1})
    }
    return r;
  }

  readonly push = (...elements:T[]):number => {
    if (elements.length === 0) return this.length
    const index = this.length
    const r = super.push(...elements)
    this.fire({inserted:elements, insertedAt:index})
    return r;
  }

  readonly reverse = ():this => {
    super.reverse()
    this.fire({cleared:true, inserted:this, insertedAt:0})
    return this[proxy]
  }

  readonly shift = ():T|undefined => {
    const r = super.shift()
    if (r !== undefined) {
      this.fire({removed:[r], removedAt:0})
    }
    return r
  }

  readonly sort = (f?:(a:T,b:T)=>number):this => {
    super.sort(f)
    this.fire({cleared:true, inserted:this, insertedAt:0})
    return this[proxy]
  }

  // TODO: Slightly incompatible with Array, whose splice accepts no
  // arguments, in which case nothing happens. See MDN
  readonly splice = (start: number, deleteCount?: number, ...items: T[]):this => {
    start = this.normalize(start)
    if (start >= this.length) {
      this.push(...items)
      return this[proxy]
    }
    if (deleteCount === undefined) {
      if (items.length === 0) {
        deleteCount = this.length - start
      } else {
        deleteCount = 0
      }
    }
    if (deleteCount > 0) {
      const removed = this.slice(start, start + deleteCount)
      super.splice(start, deleteCount, ...items)
      if (items.length > 0) {
        this.fire({removed, removedAt:start, inserted:items, insertedAt:start})
      } else {
        this.fire({removed, removedAt:start})
      }
      return this[proxy]
    } else {
      super.splice(start, deleteCount, ...items)
      this.fire({inserted:items, insertedAt:start})
      return this[proxy]
    }
  }

  readonly toReversed = ():this => {
    const result = new La(...this)
    result.reverse()
    return result as this
  }

  readonly toSorted = (f?:(a:T,b:T)=>number):this => {
    const result = new La(...this)
    result.sort(f)
    return result as this
  }

  readonly toSpliced = (start:number, deleteCount?:number, ...items:T[]):T[] => {
    const result = new La(...this)
    result.splice(start, deleteCount, ...items)
    return result as this
  }

  readonly unshift = (...items:T[]):number => {
    if (items.length === 0) return this.length
    super.unshift(...items)
    this.fire({inserted:items, insertedAt:0})
    return this.length
  }

  readonly with = (i:number, v:T):this => {
    const result = new La(...this)
    if (i < 0) i = this.length + i
    if ((i < 0) || (i >= this.length)) {
      throw new RangeError(`0 <= ${i} < ${this.length}`)
    }
    result[i] = v
    return result as this
  }
}
