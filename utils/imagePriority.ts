let priorityClaimed = false;

export function claimPriority(): boolean {
  if (!priorityClaimed) {
    priorityClaimed = true;
    return true;
  }
  return false;
}

export function resetPriority() {
  priorityClaimed = false;
}

