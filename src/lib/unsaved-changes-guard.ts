let activeGuard: (() => boolean) | null = null;

export function registerUnsavedChangesGuard(guard: (() => boolean) | null) {
  activeGuard = guard;
}

export function confirmDiscardUnsavedChanges(): boolean {
  return activeGuard ? activeGuard() : true;
}
