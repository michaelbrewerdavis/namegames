import _ from 'lodash'
import {hri} from 'human-readable-ids'
import {useCallback, useEffect, useMemo, useState} from 'react'
import {Box, Input, Label, Heading, Text, Button} from 'theme-ui'
import sortPlayers from './util/sortPlayers'
import delay from './util/delay'

const allWordsInGame = (game) => {
  return Object.values(game.players)
    .map((p) => p.celebrityNames)
    .flat()
}

const makeTeams = (game, count) => {
  const playerIDs = Object.values(game.players)
    .map((p) => p.id)
    .sort(() => Math.random() - 0.5)
  const teamSize = playerIDs.length / count
  const teams = {}
  for (let i = 0; i < count; i++) {
    teams[hri.random()] = _.sortBy(
      playerIDs.slice(teamSize * i, teamSize * (i + 1)),
      (id) => game.players[id].sortKey || Math.random()
    )
  }
  return teams
}

const teamForPlayer = (game, playerID) => {
  return Object.entries(game.teams).find(([id, playerIDs]) => playerIDs?.includes(playerID))?.[0]
}

const computeCurrentPlayer = (game) => {
  const teamIDs = Object.keys(game.teams)
  const currentTeamIndex = game.currentTeamIndex || 0
  const currentTeamID = teamIDs[currentTeamIndex % teamIDs.length]

  const activeTeamPlayers = game.teams[currentTeamID].filter((p) => game.players[p])
  return activeTeamPlayers[0]
}

const advanceCurrentPlayer = (game, updateGame, playerID) => {
  const teamIDs = Object.keys(game.teams)
  const currentTeamIndex = game.currentTeamIndex || 0
  const currentTeamID = teamIDs[currentTeamIndex % teamIDs.length]

  let team = game.teams[currentTeamID]
  const playerIndex = team.indexOf(playerID)
  if (playerIndex >= 0) {
    team.splice(playerIndex, 1)
    team = team.concat(playerID)
  }

  const newTeams = {...game.teams, [currentTeamID]: team}

  updateGame({teams: newTeams, currentTeamIndex: currentTeamIndex + 1, currentStats: null})
}

const Header = ({gameID, player}) => {
  return (
    <Box mb={3} sx={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'}}>
      <Heading as="h1">
        Celebrity
        {gameID && <Text sx={{display: 'inline', color: 'grey'}}> ({gameID})</Text>}
      </Heading>
      {player?.name && (
        <Box as="vertical">
          <b>{player?.name}</b>
        </Box>
      )}
    </Box>
  )
}

const Player = ({canBoot, player, players, removePlayer}) => {
  const playerRegistered = !!player.joined
  return (
    <Box>
      <Text sx={{color: playerRegistered ? 'green' : 'grey'}}>
        {player.name ? player.name : 'Player joining...'}
        {player.host && ' (host)'}
        {canBoot && !player.host && <button onClick={() => removePlayer(player.id)}>X</button>}
      </Text>
    </Box>
  )
}

const Players = ({canBoot, players, removePlayer}) => {
  return (
    <>
      <Heading as="h3">Players</Heading>
      <ul>
        {players &&
          sortPlayers(Object.values(players), true).map((p) => (
            <li key={p.id}>
              <Player canBoot={canBoot} player={p} players={players} removePlayer={removePlayer} />
            </li>
          ))}
      </ul>
    </>
  )
}

const GameOptions = ({game, player, updateGame, updatePlayer, removePlayer}) => {
  const [name, setName] = useState(player?.name)
  const playerSaved = !!player?.joined || player?.justWatching
  if (!playerSaved) {
    const join = (e) => {
      e.preventDefault()
      const celebrityNames = [...document.querySelectorAll('.celebrity')]
        .map((input) => input.value)
        .filter((name) => name)
        .map(name => name.trim())
      console.log(celebrityNames)
      updatePlayer(player.id, {
        ...player,
        name: name.trim(),
        celebrityNames,
        sortKey: Math.random(),
        joined: new Date().toISOString()
      })
    }

    const justWatching = (e) => {
      e.preventDefault()
      removePlayer(player.id)
    }

    return (
      <Box>
        <Heading as="h3">Join Game</Heading>
        <Box mt={2} mb={2} as="form" onSubmit={(e) => e.preventDefault()}>
          <Label htmlFor="realName">Your Name</Label>
          <Input
            type="text"
            name="name"
            id="name"
            required
            mb={3}
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="off"
          />
          <Label>Your Celebrity Names</Label>
          <Box sx={{display: 'flex', flexWrap: 'wrap'}}>
            {[...Array(game.namesPerPlayer)].map((_, i) => {
              const celebrityName = player?.celebrityNames?.[i]
              return (
                <Input
                  className="celebrity"
                  type="text"
                  m={2}
                  sx={{maxWidth: '200px'}}
                  defaultValue={celebrityName}
                  autoComplete="off"
                />
              )
            })}
          </Box>
          <Button mr="2" onClick={join}>
            Join
          </Button>
          <Button variant="secondary" onClick={justWatching}>
            Just Watching
          </Button>
        </Box>
      </Box>
    )
  } else {
    const resetName = () => {
      updatePlayer(player.id, {...player, joined: null})
    }

    const startGame = () => {
      const teams = makeTeams(game, 2)
      const words = allWordsInGame(game)
      updateGame({state: 'teams', teams, words})
    }

    return (
      <Box p={2} variant="vertical">
        <Heading as="h3" mb={3}>
          Waiting for all players to join...
        </Heading>
        {!player.justWatching && (
          <>
            <Label>My names:</Label>
            <ul>
              {player.celebrityNames?.map((name) => (
                <li key={name}>{name}</li>
              ))}
            </ul>
            <Button mt={3} mb={3} onClick={resetName}>
              Update Names
            </Button>
          </>
        )}
        {player.host && <Button onClick={startGame}>Start Game</Button>}
      </Box>
    )
  }
}

const formatTeam = (teamID) => {
  const [first, second] = teamID.split('-').map(_.capitalize)
  return `Team ${first} ${second}`
}

const Team = ({game, teamID, team, canBoot, removePlayer}) => {
  const score = game.scores?.[teamID] || 0
  return (
    <Box>
      <Label>
        {formatTeam(teamID)} ({score} points)
      </Label>
      <ul>
        {team.map((playerID) =>
          game.players[playerID] ? (
            <li>
              <Player
                canBoot={canBoot}
                player={game.players[playerID]}
                players={game.players}
                removePlayer={removePlayer}
              />
            </li>
          ) : null
        )}
      </ul>
    </Box>
  )
}

const Teams = ({game, canBoot, removePlayer}) => {
  return (
    <Box mb={3} variant="vertical">
      <Heading as="h3">Teams</Heading>
      {Object.entries(game.teams || {}).map(([teamID, team]) => (
        <Team
          game={game}
          teamID={teamID}
          team={team}
          canBoot={canBoot}
          removePlayer={removePlayer}
        />
      ))}
    </Box>
  )
}

const ChooseTeams = ({game, player, updateGame}) => {
  const numTeams = Object.keys(game.teams).length
  const shuffleTeams = (count = numTeams) => {
    const teams = makeTeams(game, count)
    updateGame({teams})
  }
  const startGame = () => {
    updateGame({state: 'ready'})
  }
  return (
    <Box variant="vertical">
      <Heading mb={3} as="h3">
        Make Teams
      </Heading>
      {player.host ? (
        <Box variant="vertical">
          <Button mb={1} onClick={() => shuffleTeams()}>
            Shuffle
          </Button>
          <Button mb={1} onClick={() => shuffleTeams(numTeams + 1)}>
            Add Team
          </Button>
          {numTeams > 2 && <Button onClick={() => shuffleTeams(numTeams - 1)}>Remove Team</Button>}
          <Button mb={1} onClick={startGame}>
            Start Game
          </Button>
        </Box>
      ) : (
        <Text>Waiting for host to approve teams...</Text>
      )}
    </Box>
  )
}

const Stats = ({correctWords = [], passed = 0, seconds, remainingWords}) => {
  return (
    <Box mb={3} variant="vertical">
      {seconds > 0 && <Text>{seconds} seconds left</Text>}
      <Text>
        Correct:{' '}
        {correctWords.length > 0 && (
          <ul>
            {correctWords.map((w) => (
              <li>{w}</li>
            ))}
          </ul>
        )}
      </Text>
      <Text>Passed: {passed}</Text>
      <Text>Remaining words: {remainingWords}</Text>
    </Box>
  )
}

const PlayerWindow = ({game, updateGame, player}) => {
  const [started, setStarted] = useState(false)
  const [seconds, setSeconds] = useState(game.timePerPlayer)
  const [finished, setFinished] = useState(false)
  const [remainingWords, setRemainingWords] = useState(
    game.words.sort(() => Math.random() - 0.5) || []
  )
  const [correctWords, setCorrectWords] = useState([])
  const [passed, setPassed] = useState(0)

  useEffect(() => {
    if (!started) {
      return
    }
    const timer = async (s) => {
      while (s > 0) {
        await delay(1000)
        s = s - 1
        setSeconds(s)
      }
      setFinished(true)
    }
    timer(seconds)
  }, [started, setSeconds, setFinished])

  const finishTurn = useCallback(() => {
    const scores = game.scores || {}
    const teamID = teamForPlayer(game, player.id)
    scores[teamID] = (scores[teamID] || 0) + correctWords.length
    updateGame({words: remainingWords, scores})
    advanceCurrentPlayer(game, updateGame, player.id)
  }, [game, updateGame, player, correctWords, remainingWords])

  useEffect(() => {
    if (remainingWords.length === 0) {
      finishTurn()
    }
  }, [remainingWords, finishTurn])

  const stats = useMemo(() => {
    return {
      seconds,
      correctWords,
      passed,
      remainingWords: remainingWords.length
    }
  }, [seconds, correctWords, passed, remainingWords])

  useEffect(() => {
    if (started && !finished) {
      updateGame({currentStats: stats})
    }
  }, [started, finished, stats, updateGame])

  const currentWord = remainingWords[0]
  const addCorrect = () => {
    setCorrectWords(correctWords.concat(currentWord))
    setRemainingWords(remainingWords.slice(1))
  }

  const pass = () => {
    setRemainingWords([...remainingWords.slice(1), currentWord])
    setPassed(passed + 1)
  }

  if (finished || remainingWords.length === 0) {
    return (
      <Box>
        <Heading mb={3} as="h3">
          Finished!
        </Heading>
        <Stats {...stats} />
        <Button onClick={() => finishTurn()}>Next Player</Button>
      </Box>
    )
  } else if (started) {
    return (
      <Box>
        <Box mb={3} variant="vertical" sx={{alignItems: 'center'}}>
          <Heading m={4} as="h2">
            {currentWord}
          </Heading>
          <Box sx={{display: 'flex'}}>
            <Button onClick={addCorrect}>Got it!</Button>
            <Box sx={{minWidth: '100px'}} />
            <Button onClick={pass}>Pass</Button>
          </Box>
        </Box>
        <Stats {...stats} />
      </Box>
    )
  } else {
    return (
      <Box variant="vertical">
        <Heading mb={3} as="h3">
          You're up!
        </Heading>
        <Button mb={1} onClick={() => setStarted(true)}>
          Start
        </Button>
        <Button onClick={() => advanceCurrentPlayer(game, updateGame, player.id)}>Skip Turn</Button>
      </Box>
    )
  }
}

const PlayerReady = ({game, updateGame, player}) => {
  const currentPlayerID = computeCurrentPlayer(game)
  const currentTeamID = teamForPlayer(game, currentPlayerID)

  if (player?.id === currentPlayerID) {
    return (
      <Box>
        <PlayerWindow game={game} updateGame={updateGame} player={player} />
      </Box>
    )
  } else {
    const isMyTeam = currentTeamID === teamForPlayer(game, player?.id)
    const teamLabel = isMyTeam
      ? `Your team (${formatTeam(currentTeamID)}) is playing!`
      : `${formatTeam(currentTeamID)} is playing`
    return (
      <Box>
        <Heading mb={3} as="h3">
          {teamLabel}
          <br />
          {game.players[currentPlayerID].name} is up
        </Heading>
        {game.currentStats && <Stats {...game.currentStats} />}
        {player?.host && (
          <Button onClick={() => advanceCurrentPlayer(game, updateGame, currentPlayerID)}>
            Skip to Next Player
          </Button>
        )}
      </Box>
    )
  }
}

const GameActions = ({game, updateGame, player}) => {
  if (game.state === 'teams') {
    return <ChooseTeams game={game} updateGame={updateGame} player={player} />
  } else if (game.state === 'ready') {
    return <PlayerReady game={game} updateGame={updateGame} player={player} />
  }
}

const GameOver = ({game}) => {
  const teamsInOrder = _.sortBy(Object.entries(game.scores), (e) => e[1]).reverse()
  const allNames = allWordsInGame(game).sort()
  return (
    <Box mb={3}>
      <Heading as="h3">Game over!</Heading>
      <Heading mb={3} as="h3">
        {formatTeam(teamsInOrder[0][0])} wins!
      </Heading>
      <Label>Scores:</Label>
      <Box ml={2} mb={3}>
        {teamsInOrder.map(([id, score]) => (
          <Text key={id}>
            {formatTeam(id)}: {score}
          </Text>
        ))}
      </Box>
      <Label>All names:</Label>
      <Box ml={2} sx={{display: 'flex', flexWrap: 'wrap'}}>
        {allNames.map((name) => (
          <Text sx={{minWidth: '100px'}} key={name}>{name}</Text>
        ))}
      </Box>
    </Box>
  )
}

const GameWindow = ({gameID, game, player, updatePlayer, updateGame, removePlayer}) => {
  const restart = () => {
    const newGame = _.pick(game, ['host', 'id', 'type'])
    newGame.state = 'created'
    newGame.teams = {}
    newGame.scores = {}
    newGame.currentStats = {}
    newGame.currentTeamIndex = null
    newGame.players = Object.entries(game.players).reduce((acc, [id, p]) => {
      acc[id] = _.pick(p, ['id', 'name', 'host'])
      return acc
    }, {})
    updateGame(newGame)
  }

  if (!game) {
    return null
  } else if (game.state === 'created') {
    return (
      <GameOptions
        game={game}
        player={player}
        updatePlayer={updatePlayer}
        updateGame={updateGame}
        removePlayer={removePlayer}
      />
    )
  } else if (!game.words) {
    return (
      <Box>
        <GameOver game={game} />
        {player.host && <Button onClick={restart}>Start Over</Button>}
      </Box>
    )
  } else {
    return (
      <GameActions
        game={game}
        player={player}
        updateGame={updateGame}
        updatePlayer={updatePlayer}
      />
    )
  }
}

const Footer = ({game, updateGame, player, updatePlayer, removePlayer}) => {
  const assumeHost = (e) => {
    e.preventDefault()
    const oldHost = Object.values(game.players).find((p) => p.host)
    if (oldHost) {
      updatePlayer(oldHost.id, {...oldHost, host: false})
    }
    updatePlayer(player.id, {...player, host: true})
    updateGame({host: player.id})
  }

  const leaveGame = (e) => {
    e.preventDefault()
    removePlayer(player.id)
    if (player.host) {
      const newHost = Object.values(game.players).find((p) => p.id !== player.id)
      if (newHost) {
        updatePlayer(newHost.id, {...newHost, host: true})
        updateGame({host: newHost.id})
      }
    }
  }
  return (
    <Box variant="vertical">
      <a href="/">Home</a>
      {player?.host === false && (
        <a href="/family" onClick={assumeHost}>
          Assume Host
        </a>
      )}
      {player && !player.justWatching && (
        <a href="/family" onClick={leaveGame}>
          Leave Game
        </a>
      )}
    </Box>
  )
}

export default function Celebrity({gameID, game, updateGame, player, updatePlayer, removePlayer}) {
  const [showing, setShowing] = useState('players')
  return (
    <Box p={4}>
      <Header gameID={gameID} player={player} />
      <GameWindow
        gameID={gameID}
        game={game}
        player={player}
        updatePlayer={updatePlayer}
        updateGame={updateGame}
        removePlayer={removePlayer}
      />
      <Box mt={2} sx={{display: 'flex'}}>
        <Button
          m={2}
          variant={showing === 'players' ? 'selectedTab' : 'unselectedTab'}
          onClick={() => setShowing('players')}
        >
          Players
        </Button>
        <Button
          m={2}
          variant={showing === 'settings' ? 'selectedTab' : 'unselectedTab'}
          onClick={() => setShowing('settings')}
        >
          Settings
        </Button>
      </Box>
      {showing === 'players' &&
        game &&
        (game.teams ? (
          <Teams game={game} canBoot={!!player?.host} removePlayer={removePlayer} />
        ) : (
          <Players players={game.players} canBoot={!!player?.host} removePlayer={removePlayer} />
        ))}
      {showing === 'settings' && (
        <Footer
          game={game}
          player={player}
          updatePlayer={updatePlayer}
          removePlayer={removePlayer}
        />
      )}
    </Box>
  )
}
