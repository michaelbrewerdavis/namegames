import {hri} from 'human-readable-ids'

export const getPersistentPlayer = () => {
  let id = window.localStorage.getItem('playerID')
  if (!id) {
    id = hri.random()
    window.localStorage.setItem('playerID', id)
  }
  return id
}
