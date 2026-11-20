/**
 * Seeded PRNG using Mulberry32 for deterministic random numbers.
 */
export class SeededRNG {
  constructor(seed = 123456789) {
    this.seed = (seed >>> 0) || 1;
    this.s = this.seed;
  }

  next() {
    this.s = (this.s + 0x6D2B79F5) >>> 0;
    let t = Math.imul(this.s ^ (this.s >>> 15), 1 | this.s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  range(min, max) {
    return min + this.next() * (max - min);
  }

  intRange(min, max) {
    return Math.floor(this.range(min, max + 1));
  }
}
