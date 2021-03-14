import {useCallback, useEffect, useMemo, useState} from 'react'
import {useParams} from 'react-router-dom'
import getDatabase from './config/firebase'
import {getPersistentPlayer} from './config/player'
import Family from './family'
import Celebrity from './celebrity'
import {Box, Heading, Spinner, Text} from 'theme-ui'

export default function Game() {
  const {gameID: enteredID} = useParams()
  const gameID = enteredID.toLowerCase()
  const [game, setGame] = useState(null)
  const [justWatching, setJustWatching] = useState(false)
  const playerID = getPersistentPlayer()
  const [loaded, setLoaded] = useState(false)

  const gameDB = useMemo(() => gameID && getDatabase().ref(`games/${gameID}`), [gameID])

  const updateGame = useCallback(
    (updates) => {
      gameDB.update({
        ...updates,
        updatedAt: new Date().toISOString()
      })
    },
    [gameDB]
  )

  const updatePlayer = useCallback(
    (playerID, player) => {
      const updates = {}
      updates[`players/${playerID}`] = player
        ? {
            ...player,
            updatedAt: new Date().toISOString()
          }
        : null
      updateGame(updates)
    },
    [updateGame]
  )

  const removePlayer = useCallback(
    (removedPlayer) => {
      if (removedPlayer === playerID) {
        setJustWatching(true)
      }
      updatePlayer(removedPlayer, null)
    },
    [playerID, updatePlayer, setJustWatching]
  )

  useEffect(() => {
    if (!gameDB) {
      return
    }
    gameDB.on('value', (snapshot) => {
      console.log(snapshot.val())
      setGame(snapshot.val())
      setLoaded(true)
    })
  }, [gameDB, setGame])

  useEffect(() => {
    if (!playerID || !game || justWatching || game.state !== 'created') {
      return
    }
    const player = game.players?.[playerID]
    if (!player) {
      updatePlayer(playerID, {
        id: playerID,
        host: playerID === game.host
      })
    }
  }, [playerID, game, updatePlayer, justWatching])

  const player = justWatching ? {justWatching: true} : game?.players?.[playerID]

  if (!game) {
    if (!loaded) {
      return <Spinner m={4} />
    } else {
      return (
        <Box m={3}>
          <Heading as="h3">Are you lost?</Heading>
          <Text>There doesn't seem to be a game here</Text>
        </Box>
      )
    }
  }

  const GameComponent = game.type === 'celebrity' ? Celebrity : Family
  return (
    <GameComponent
      game={game}
      gameID={gameID}
      updateGame={updateGame}
      player={player}
      removePlayer={removePlayer}
      updatePlayer={updatePlayer}
    />
  )
}
