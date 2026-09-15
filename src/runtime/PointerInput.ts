export interface PointerInputLike {
  readonly wasTouch?: boolean;
  readonly event?: {
    readonly pointerType?: string;
  } | null;
}

export function isTouchLikePointer(pointer: PointerInputLike): boolean {
  return pointer.wasTouch === true || pointer.event?.pointerType === 'touch';
}
