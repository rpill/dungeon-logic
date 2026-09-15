export interface PointerInputLike {
  readonly wasTouch?: boolean;
  readonly event?: object | null;
}

export function isTouchLikePointer(pointer: PointerInputLike): boolean {
  const event = pointer.event;
  const pointerType = event !== null && event !== undefined && 'pointerType' in event
    ? (event as { readonly pointerType?: unknown }).pointerType
    : undefined;
  return pointer.wasTouch === true || pointerType === 'touch';
}
