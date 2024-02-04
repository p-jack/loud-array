import { La, LaEvent } from "./index"

// I want matchers that treat La and Array as indistinguishable,
// but that's more work than I want to do.
function same(received:any[], expected:any[]) {
  const r = JSON.stringify(received)
  const e = JSON.stringify(expected)
  expect(r).toStrictEqual(e)
}

describe("La", ()=>{
  let la = new La<string>()
  let events:LaEvent<string>[] = []
  let ear = (event:LaEvent<string>) => {
    events.push(event)
  }
  beforeEach(() => {
    la = new La("A", "B", "C")
    la.listen(ear)
    events = []
  })
  test("length", () => {
    expect(la.length).toBe(3)
  })
  test("instanceof", () => {
    expect(la instanceof Array).toBe(true)
    expect(la instanceof La).toBe(true)
  })
  test("isArray", () => {
    expect(Array.isArray(la)).toBe(true)
  })
  test("[]", () => {
    expect(la[0]).toBe("A")
    expect(la[1]).toBe("B")
    expect(la[2]).toBe("C")
    expect(la[-1]).toBeUndefined()
    expect(la[4]).toBeUndefined()
    la[0] = "Z"
    expect(la[0]).toBe("Z")
    same(events, [
      { cleared:false, removed:["A"], removedAt:0, inserted:["Z"], insertedAt:0},
    ])
  })
  test("iterator", () => {
    const a:string[] = []
    la.forEach(x => a.push(x))
    expect(a).toStrictEqual(["A", "B", "C"])
  })
  test("adding ear triggers add event", ()=>{
    const e:LaEvent<string>[] = []
    la.listen((event:LaEvent<string>)=>{
      e.push(event)
    })
    expect(e.length).toBe(1)
    expect(e[0]).toMatchObject({
      cleared:false,
      removed:[],
      removedAt:-1,
      inserted:la,
      insertedAt:0,
    })
  })
  describe("push", () => {
    test("one or more", () => {
      const r = la.push("Z")
      expect(r).toBe(4)
      same(la, ["A", "B", "C", "Z"])
      same(events, [
        {cleared:false, removed:[], removedAt:-1, inserted:["Z"], insertedAt:3}
      ])
    })
    test("none", () => {
      const r = la.push()
      expect(r).toBe(3)
      same(la, ["A", "B", "C"])
      same(events, [])
    })
  })
  test("pop", () => {
    const z = la.pop()
    expect(z).toBe("C")
    expect([...la]).toStrictEqual(["A", "B"])
    expect(events.length).toBe(1)
    same(events, [
      {cleared:false, removed:["C"], removedAt:2, inserted:[], insertedAt:-1}
    ])
})
  test("no events sent to removed ear", () => {
    la.stopListening(ear)
    la.pop()
    la.push("Q")
    same(events, [])
  })  
  test("concat", () => {
    const a:string[] = la.concat(["D"], ["E"])
    expect(a).toBeInstanceOf(La)
    expect([...a]).toStrictEqual(["A", "B", "C", "D", "E"])
    expect([...la]).toStrictEqual(["A", "B", "C"])
    expect(events.length).toBe(0)
  })
  describe("copyWithin", () => {
    // paranoid about all the edge cases here, so ensuring that La behaves
    // exactly the same as a plain array (but with events)
    let a:string[] = []
    beforeEach(() => {
      a = ["A", "B", "C", "D", "E", "F"]
      la.push("D", "E", "F")
      events = []
    })
    afterEach(() => {
      expect([...a]).toStrictEqual([...la])
    })
    test("simple case", () => {
      a.copyWithin(1, 3, 5)
      const r = la.copyWithin(1, 3, 5)
      expect(r === la).toBe(true)
      same(events, [
        {cleared:false, removed:["B", "C"], removedAt:1, inserted:["D", "E"], insertedAt:1}
      ])
    })
    test("negative start", () => {
      a.copyWithin(1, -3, 5)
      const r = la.copyWithin(1, -3, 5)
      expect(r === la).toBe(true)
      same(events, [
        {cleared:false, removed:["B", "C"], removedAt:1, inserted:["D", "E"], insertedAt:1}
      ])
    })
    test("VERY negative start", () => {
      a.copyWithin(4, -7, 2)
      const r = la.copyWithin(4, -7, 2)
      expect(r === la).toBe(true)
      same(events, [
        {cleared:false, removed:["E", "F"], removedAt:4, inserted:["A", "B"], insertedAt:4}
      ])
    })
    test("negative end", () => {
      a.copyWithin(0, 3, -1)
      const r = la.copyWithin(0, 3, -1)
      expect(r === la).toBe(true)
      same(events, [
        {cleared:false, removed:["A", "B"], removedAt:0, inserted:["D", "E"], insertedAt:0}
      ])
    })
    test("VERY negative end", () => {
      a.copyWithin(5, 0, -7)
      const r = la.copyWithin(5, 0, -7)
      expect(r === la).toBe(true)
      same(events, [])
    })
    test("undefined end", () => {
      a.copyWithin(0, 4)
      const r = la.copyWithin(0, 4)
      expect(r === la).toBe(true)
      same(events, [
        {cleared:false, removed:["A", "B"], removedAt:0, inserted:["E", "F"], insertedAt:0}
      ])
    })
    test("negative target", () => {
      a.copyWithin(-2, 0, 2)
      const r = la.copyWithin(-2, 0, 2)
      expect(r === la).toBe(true)
      same(events, [
        {cleared:false, removed:["E", "F"], removedAt:4, inserted:["A", "B"], insertedAt:4}
      ])
    })
    test("VERY negative target", () => {
      a.copyWithin(-7, 4, 6)
      const r = la.copyWithin(-7, 4, 6)
      expect(r === la).toBe(true)
      same(events, [
        {cleared:false, removed:["A", "B"], removedAt:0, inserted:["E", "F"], insertedAt:0}
      ])
    })
    test("big target", () => {
      a.copyWithin(8, 0, 2)
      const r = la.copyWithin(8, 0, 2)
      expect(r === la).toBe(true)
      same(events, [])
    })
  })
  describe("fill", () => {
    test("simple case", () => {
      const r = la.fill("Z", -4, -1)
      expect(r === la).toBe(true)
      same(events, [
        {cleared:false, removed:["A", "B"], removedAt:0, inserted:["Z", "Z"], insertedAt:0}
      ])
    })
    test("no bounds", () => {
      const r = la.fill("Z")
      expect(r).toBe(la)
      same(events, [
        {cleared:false, removed:["A", "B", "C"], removedAt:0, inserted:["Z", "Z", "Z"], insertedAt:0}
      ])
    })
    test("start too high", () => {
      const r = la.fill("Z", 6)
      expect(r).toBe(la)
      same(events, [])
    })
    test("end too low", () => {
      const r = la.fill("Z", 2, 2)
      expect(r).toBe(la)
      same(events, [])
    })
    test("end too high", () => {
      const r = la.fill("Z", 0, 6)
      expect(r).toBe(la)
      same(events, [
        {cleared:false, removed:["A", "B", "C"], removedAt:0, inserted:["Z", "Z", "Z"], insertedAt:0}
      ])
    })
  })
  test("filter", () => {
    const r = la.filter(x => x === "B")
    expect(r).toBeInstanceOf(La)
    same(r, ["B"])
  })
  test("flat", () => {
    const la = new La<any>("1", 2, ["3", 4])
    const r = la.flat()
    expect(r).toBeInstanceOf(La)
    same(r, ["1", 2, "3", 4])
  })
  test("flatMap", () => {
    const la = new La<any>(1, 2, 1)
    const r = la.flatMap(x => (x === 2 ? [2, 2] : 1))
    expect(r).toBeInstanceOf(La)
    same(r, [1, 2, 2, 1])
  })
  test("map", () => {
    const la = new La(1, 2, 3)
    const r = la.map(x => x * 2)
    expect(r).toBeInstanceOf(La)
    same(r, [2, 4, 6])
  })
  test("stringify", () => {
    expect(JSON.stringify(la)).toBe(`["A","B","C"]`)
  })
  test("reverse", () => {
    la.reverse()
    same(la, ["C", "B", "A"])
    same(events, [
      {cleared:true, removed:[], removedAt:-1, inserted:["C", "B", "A"], insertedAt:0}
    ])
  })
  test("shift", () => {
    const r = la.shift()
    expect(r).toBe("A")
    same(events, [
      {cleared:false, removed:["A"], removedAt:0, inserted:[], insertedAt:-1}
    ])
  })
  test("slice", () => {
    la.push("D", "E", "F")
    const r = la.slice(1, 3)
    expect(r).toBeInstanceOf(La)
    same(r, ["B", "C"])
  })
  test("sort", () => {
    la.push("Z", "P", "Q")
    events = []
    const r = la.sort()
    expect(r === la).toBe(true)
    same(la, ["A", "B", "C", "P", "Q", "Z"])
    same(events, [
      {cleared:true, removed:[], removedAt:-1, inserted:["A", "B", "C", "P", "Q", "Z"], insertedAt:0}
    ])
  })
  describe("splice", () => {
    // paranoid about all the edge cases here, so ensuring that La behaves
    // exactly the same as a plain array (but with events)
    let a:string[] = []
    beforeEach(() => {
      a = ["A", "B", "C", "D", "E", "F"]
      la.push("D", "E", "F")
      events = []
    })
    afterEach(() => {
      expect([...a]).toStrictEqual([...la])
    })
    test("replace", () => {
      a.splice(0, 3, "a", "b", "c")
      const r = la.splice(0, 3, "a", "b", "c")
      expect(r === la).toBe(true)
      same(la, ["a", "b", "c", "D", "E", "F"])
      same(events, [
        {cleared:false, removed:["A", "B", "C"], removedAt:0, inserted:["a", "b", "c"], insertedAt:0}
      ])
    })
    test("insert only", () => {
      a.splice(1, -100, "P", "Q")
      const r = la.splice(1, 0, "P", "Q")
      expect(r === la).toBe(true)
      same(la, ["A", "P", "Q", "B", "C", "D", "E", "F"])
      same(events, [
        {cleared:false, removed:[], removedAt:-1, inserted:["P", "Q"], insertedAt:1}
      ])
    })
    test("delete only", () => {
      a.splice(2, 3)
      const r = la.splice(2, 3)
      expect(r === la).toBe(true)
      same(la, ["A", "B", "F"])
      same(events, [
        {cleared:false, removed:["C", "D", "E"], removedAt:2, inserted:[], insertedAt:-1}
      ])
    })
    test("start too high", () => {
      a.splice(10, 0, "G", "H", "I")
      const r = la.splice(10, 0, "G", "H", "I")
      expect(r === la).toBe(true)
      same(la, ["A", "B", "C", "D", "E", "F", "G", "H", "I"])
      same(events, [
        {cleared:false, removed:[], removedAt:-1, inserted:["G", "H", "I"], insertedAt:6}
      ])
    })
    test("deleteCount omitted", () => {
      const c = Array.prototype.splice as any as (s:number,d:number|undefined,x:string)=>string[]
      c.call(a, 0, undefined, "Q")
      const r = la.splice(0, undefined, "Q")
      expect(r === la).toBe(true)
      same(la, ["Q", "A", "B", "C", "D", "E", "F"])
      same(events, [
        {cleared:false, removed:[], removedAt:-1, inserted:["Q"], insertedAt:0}
      ])
    })
    test("deleteCount and items omitted", () => {
      a.splice(0)
      const r = la.splice(0)
      expect(r === la).toBe(true)
      same(la, [])
      same(events, [
        {cleared:false, removed:["A", "B", "C", "D", "E", "F"], removedAt:0, inserted:[], insertedAt:-1}
      ])
    })
  })
  test("toReversed", () => {
    const r = la.toReversed()
    expect(r).toBeInstanceOf(La)
    same(r, ["C", "B", "A"])
    same(events, [])
  })
  test("toSorted", () => {
    const r = la.toSorted((a,b)=>b.localeCompare(a))
    expect(r).toBeInstanceOf(La)
    same(r, ["C", "B", "A"])
    same(events, [])
  })
  test("toSpliced", () => {
    const r = la.toSpliced(0, 3, "a", "b", "c")
    expect(r).toBeInstanceOf(La)
    same(r, ["a", "b", "c"])
    same(events, [])
  })
  describe("unshift", () => {
    test("one or more elements", () => {
      const r = la.unshift("1", "2", "3")
      expect(r).toBe(6)
      same(la, ["1", "2", "3", "A", "B", "C"])
      same(events, [
        {cleared:false, removed:[], removedAt:-1, inserted:["1", "2", "3"], insertedAt:0}
      ])
    })
    test("no elements", () => {
      const r = la.unshift()
      expect(r).toBe(3)
      same(la, ["A", "B", "C"])
      same(events, [])
    })
  })
  describe("with", () => {
    test("in bounds", () => {
      const r = la.with(1, "Q")
      expect(r).toBeInstanceOf(La)
      same(r, ["A", "Q", "C"])
    })
    test("negative in bounds", () => {
      const r = la.with(-2, "Q")
      expect(r).toBeInstanceOf(La)
      same(r, ["A", "Q", "C"])
    })
    test("too low", () => {
      expect(() => { la.with(-6, "Q") }).toThrow("0 <= -3 < 3")
    })
    test("too high", () => {
      expect(() => { la.with(100, "Q") }).toThrow("0 <= 100 < 3")
    })
  })
})
