export class MetaPointerGate {
  private readonly ownedPointerIds = new Set<number>();

  reset(): void {
    this.ownedPointerIds.clear();
  }

  notePointerDown(pointerId: number): void {
    this.ownedPointerIds.add(pointerId);
  }

  canActivate(pointerId: number): boolean {
    return this.ownedPointerIds.has(pointerId);
  }
}
