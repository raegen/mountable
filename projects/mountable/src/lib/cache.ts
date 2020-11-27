
export class Cache extends Array {
  constructor(readonly maxLength: number) {
    super();
  }
  push(...items): number {
    const result = super.unshift(...items);
    // remove items after the specified max length
    this.splice(this.maxLength, this.length - this.maxLength);
    return result;
  }

  get(id: number) {
    const index = this.findIndex(
      record => record.id === id
    );
    const cache = this[index];
    if (index !== -1) {
      // remove taken record
      this.splice(index, this.length - index);
    }

    return cache;
  }
}
