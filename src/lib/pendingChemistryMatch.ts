export interface PendingMatch {
  playerIdx: 0 | 1
  opponent: { firstName: string; lastName: string; avatar?: string }
}

let pending: PendingMatch | null = null

export const pendingChemistryMatch = {
  set(data: PendingMatch) { pending = data },
  consume(): PendingMatch | null {
    const d = pending
    pending = null
    return d
  },
}
