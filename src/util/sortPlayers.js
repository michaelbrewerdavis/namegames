export default function sortPlayers(players, hostFirst = false) {
  return players.concat().sort((a, b) => {
    if (a.id === b.id) {
      return 0
    }
    if (hostFirst) {
      if (a.host) {
        return -1
      }
      if (b.host) {
        return 1
      }
    }
    if (!a.name) {
      return 1
    }
    if (!b.name) {
      return -1
    }
    if (a.name < b.name) {
      return -1
    }
    return 1
  })
}
