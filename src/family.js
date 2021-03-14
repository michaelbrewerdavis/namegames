import {useState} from 'react'
import {Box, Button, Heading, Input, Label, Message, Text} from 'theme-ui'
import Chat from './components/chat'
import sortPlayers from './util/sortPlayers'

const activePlayers = (players) => {
  return Object.values(players).filter((p) => !p.family)
}

const familyForPlayer = (playerID, players) => {
  return Object.values(players).filter((p) => p.family === playerID)
}

const Player = ({canBoot, player, players, removePlayer}) => {
  const playerRegistered = !!player.secretName
  const family = familyForPlayer(player.id, players)
  return (
    <Box>
      <Text sx={{color: playerRegistered ? 'green' : 'grey'}}>
        {player.name ? player.name : 'Player joining...'}
        {player.host && ' (host)'}
        {canBoot && !player.host && <button onClick={() => removePlayer(player.id)}>X</button>}
        {family.length > 0 && (
          <ul>
            {sortPlayers(family).map((p) => (
              <li>
                {p.name} ({p.secretName})
              </li>
            ))}
          </ul>
        )}
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
          sortPlayers(activePlayers(players), true).map((p) => (
            <li key={p.id}>
              <Player canBoot={canBoot} player={p} players={players} removePlayer={removePlayer} />
            </li>
          ))}
      </ul>
    </>
  )
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

const Slideshow = ({game, player, updateGame}) => {
  const setDisplay = (text) => {
    updateGame({slideshowText: text})
  }

  const startSlideshow = async () => {
    for (let i = 5; i > 0; i--) {
      setDisplay(`Starting names in ${i}...`)
      await delay(1000)
    }
    const randomized = activePlayers(game.players).sort(() => Math.random() - 0.5)
    for (const p of randomized) {
      setDisplay(p.secretName)
      await delay(2000)
    }
    setDisplay(null)
  }

  const next = () => updateGame({state: 'selectFirstPlayer'})

  if (!game.slideshowText) {
    if (player?.host) {
      return (
        <Box variant="vertical">
          <Button onClick={startSlideshow} mb={3}>
            Display secret names
          </Button>
          <Button onClick={next}>Next</Button>
        </Box>
      )
    } else {
      return <Heading as="h3">Waiting for host...</Heading>
    }
  } else {
    const level = game.slideshowText.match('Starting names in') ? 'h3' : 'h1'
    return (
      <Box p={3} sx={{textAlign: 'center'}}>
        <Heading as={level}>{game.slideshowText}</Heading>
      </Box>
    )
  }
}

const ChooseCurrentPlayer = ({game, player, updateGame}) => {
  const setCurrentPlayer = (p) => {
    updateGame({currentPlayer: p.id})
  }
  if (player?.host) {
    return (
      <Box variant="vertical">
        <Heading as="h3">Choose first player:</Heading>
        <Box sx={{display: 'row', flexWrap: 'wrap'}}>
          {sortPlayers(activePlayers(game.players)).map((p) => (
            <Button m={2} pt={2} sx={{minWidth: '5rem'}} onClick={() => setCurrentPlayer(p)}>
              {p.name}
            </Button>
          ))}
        </Box>
      </Box>
    )
  } else {
    return <Heading as="h3">Waiting for host...</Heading>
  }
}

const GameOptions = ({game, player, updateGame, updatePlayer, removePlayer}) => {
  const [name, setName] = useState(player?.name)
  const [secretName, setSecretName] = useState(player?.secretName)
  const playerSaved = !!player?.secretName || player?.justWatching
  if (!playerSaved) {
    const join = (e) => {
      e.preventDefault()
      updatePlayer(player.id, {...player, name: name.trim(), secretName: secretName.trim()})
    }

    const justWatching = (e) => {
      e.preventDefault()
      removePlayer(player.id)
    }

    return (
      <Box>
        <Heading as="h3">Join Game</Heading>
        <Box mt={2} mb={2} as="form" onSubmit={(e) => e.preventDefault()}>
          <Label htmlFor="name">Real Name</Label>
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
          <Label htmlFor="secretName">Secret Name</Label>
          <Input
            type="text"
            name="secretName"
            id="secretName"
            required
            mb={3}
            value={secretName}
            onChange={(e) => setSecretName(e.target.value)}
            autoComplete="off"
          />
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
      updatePlayer(player.id, {...player, secretName: null})
    }

    const startGame = () => {
      updateGame({state: 'slideshow'})
    }

    return (
      <Box p={2} variant="vertical">
        <Heading as="h3" mb={3}>
          Waiting for all players to join...
        </Heading>
        {!player.justWatching && (
          <Button mb={3} onClick={resetName}>
            Update Name
          </Button>
        )}
        {player.host && <Button onClick={startGame}>Start Game</Button>}
      </Box>
    )
  }
}

/*
game states
  created
  waitingForSlideshow1
  showingSlideshow1
  waitingForSlideshow2
  showingSlideshow2
  selectingFirstPlayer
  waitingForGuess

*/

const ChooseTargetPlayer = ({player, game, updateGame}) => {
  if (game.currentPlayer === player?.id) {
    const setTarget = (p) => updateGame({currentGuessTarget: p.id})
    return (
      <Box variant="vertical">
        <Heading as="h3">Choose a target player:</Heading>
        <Box sx={{display: 'flex', flexWrap: 'wrap'}}>
          {sortPlayers(activePlayers(game.players)).map((p) => {
            if (p.id === player.id) {
              return null
            }
            return (
              <Button m={2} pt={2} sx={{minWidth: '5rem'}} onClick={() => setTarget(p)}>
                {p.name}
              </Button>
            )
          })}
        </Box>
      </Box>
    )
  } else {
    return <div>Waiting for {game.players[game.currentPlayer].name}...</div>
  }
}

const ChooseTargetSecret = ({player, game, updateGame}) => {
  if (game.currentPlayer === player?.id) {
    const setTargetSecret = (e) => {
      e.preventDefault()
      updateGame({currentGuess: document.getElementById('guessSecret').value.trim()})
    }
    return (
      <Box>
        <Heading as="h3">Who is {game.players[game.currentGuessTarget].name}?</Heading>
        <Box mt={2} as="form" onSubmit={setTargetSecret}>
          <Input type="text" id="guessSecret" autoComplete="off" />
          <Button mt={2}>Submit</Button>
        </Box>
      </Box>
    )
  } else {
    let targetName = game.players[game.currentGuessTarget].name
    if (game.currentGuessTarget === player?.id) {
      targetName = targetName + ' (you)'
    }
    return (
      <Message as="h3" sx={{textAlign: 'center'}}>
        <strong>{game.players[game.currentPlayer].name}</strong> is asking
        <br />
        <strong>{targetName}</strong>...
      </Message>
    )
  }
}

const ChooseGuessResult = ({player, game, updateGame, updatePlayer}) => {
  if (game.currentGuessTarget === player?.id) {
    const setResult = (result) => {
      if (result) {
        updatePlayer(game.currentPlayer, {
          ...game.players[game.currentPlayer],
          allFamilies: [game.currentPlayer]
        })
        Object.values(game.players).forEach((p) => {
          if (p.id === player.id || p.family === player.id) {
            const allFamilies = p.allFamilies
              ? p.allFamilies.concat(game.currentPlayer)
              : [game.currentPlayer]
            updatePlayer(p.id, {...p, family: game.currentPlayer, allFamilies})
          }
        })
      }
      updateGame({
        lastPlayer: game.currentPlayer,
        lastGuess: game.currentGuess,
        lastTarget: game.currentGuessTarget,
        lastResult: result,
        currentPlayer: result ? game.currentPlayer : game.currentGuessTarget,
        currentGuess: null,
        currentGuessTarget: null
      })
    }
    return (
      <Box variant="vertical">
        <Message>
          <em>{game.players[game.currentPlayer].name}</em> is asking:
          <br />
          <strong>{player.name}</strong>, are you <strong>{game.currentGuess}</strong>?
        </Message>
        {game.currentGuess === player.secretName && (
          <Button mt={3} onClick={() => setResult(true)}>
            Busted!
          </Button>
        )}
        {game.currentGuess !== player.secretName && (
          <Button mt={3} onClick={() => setResult(false)}>
            No, I'm not
          </Button>
        )}
        {game.currentGuess !== player.secretName && (
          <Button mt={3} onClick={() => setResult(true)}>
            Close enough...
          </Button>
        )}
      </Box>
    )
  } else {
    return (
      <Message>
        <em>{game.players[game.currentPlayer].name}</em> is asking:
        <br />
        <strong>{game.players[game.currentGuessTarget].name}</strong>, are you{' '}
        <strong>{game.currentGuess}</strong>?
      </Message>
    )
  }
}

const GuessResult = ({game}) => {
  if (!game.lastPlayer || !game.players[game.lastPlayer]) {
    return null
  }
  return (
    <Message mb={3}>
      <em>{game.players[game.lastPlayer].name}</em> asked:
      <br />
      <strong>{game.players[game.lastTarget].name}</strong>, are you{' '}
      <strong>{game.lastGuess}</strong>?<br />
      The answer was <strong>{game.lastResult ? 'yes' : 'no'}</strong>.
    </Message>
  )
}

const Winner = ({winner, game, player, updateGame}) => {
  const playAgain = () => {
    const newGame = {
      ...game,
      state: 'created',
      lastPlayer: null,
      lastGuess: null,
      lastTarget: null,
      lastResult: null,
      currentPlayer: null,
      currentGuess: null,
      currentGuessTarget: null,
      players: Object.entries(game.players).reduce((acc, [key, value]) => {
        acc[key] = {
          ...value,
          secretName: null,
          family: null,
          allFamilies: null
        }
        return acc
      }, {})
    }
    updateGame(newGame)
  }

  return (
    <Box variant="vertical">
      <Message mb={3} as="h3">
        {winner.name} ({winner.secretName}) wins!
      </Message>
      {player?.host && <Button onClick={playAgain}>Play Again</Button>}
    </Box>
  )
}
const GameActions = ({player, game, updateGame, updatePlayer}) => {
  const active = activePlayers(game.players)
  if (active.length === 1) {
    const winner = active[0]
    return <Winner game={game} player={player} winner={winner} updateGame={updateGame} />
  } else if (game.state === 'slideshow') {
    return <Slideshow game={game} player={player} updateGame={updateGame} />
  } else if (!game.currentPlayer || !game.players[game.currentPlayer]) {
    return <ChooseCurrentPlayer game={game} player={player} updateGame={updateGame} />
  } else if (game.currentGuessTarget && !game.currentGuess) {
    return <ChooseTargetSecret game={game} player={player} updateGame={updateGame} />
  } else if (game.currentGuess) {
    return (
      <ChooseGuessResult
        game={game}
        player={player}
        updateGame={updateGame}
        updatePlayer={updatePlayer}
      />
    )
  } else {
    return (
      <Box>
        {game.lastResult !== undefined && <GuessResult game={game} />}
        <ChooseTargetPlayer game={game} player={player} updateGame={updateGame} />
      </Box>
    )
  }
}

const GameWindow = ({gameID, game, player, updatePlayer, updateGame, removePlayer}) => {
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

const Header = ({gameID, player}) => {
  const [showingSecretName, setShowingSecretName] = useState(false)
  return (
    <Box sx={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'}}>
      <Heading as="h1">
        Family
        {gameID && <Text sx={{display: 'inline', color: 'grey'}}> ({gameID})</Text>}
      </Heading>
      {player?.name && (
        <Box as="vertical">
          <b>{player?.name}</b>
          {player.secretName && (
            <div style={{display: 'flex', justifyContent: 'space-between'}}>
              <span style={{flex: 'grow'}}>Secretly {showingSecretName ? player?.secretName : '********'}</span>
              <span ml={2}>
                <Button
                  ml={1}
                  variant="header"
                  onClick={() => setShowingSecretName(!showingSecretName)}
                >
                  <i className={`far fa-eye${showingSecretName ? '-slash' : ''}`} />
                </Button>
              </span>
            </div>
          )}
        </Box>
      )}
    </Box>
  )
}

const Footer = ({game, updateGame, player, updatePlayer, removePlayer}) => {
  const assumeHost = (e) => {
    e.preventDefault()
    const oldHost = activePlayers(game.players).find((p) => p.host)
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
      const newHost = activePlayers(game.players).find((p) => p.id !== player.id)
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

export default function Family({game, gameID, updateGame, player, removePlayer, updatePlayer}) {
  const [showing, setShowing] = useState('players')

  console.log('rendered with', player?.id, gameID)

  return (
    <Box p={4}>
      <Header gameID={gameID} player={player} />
      <Box p={2}>
        <GameWindow
          gameID={gameID}
          game={game}
          player={player}
          updatePlayer={updatePlayer}
          updateGame={updateGame}
          removePlayer={removePlayer}
        />
      </Box>
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
          variant={showing === 'chat' ? 'selectedTab' : 'unselectedTab'}
          onClick={() => setShowing('chat')}
        >
          Chat
        </Button>
        <Button
          m={2}
          variant={showing === 'settings' ? 'selectedTab' : 'unselectedTab'}
          onClick={() => setShowing('settings')}
        >
          Settings
        </Button>
      </Box>
      {showing === 'players' && game && (
        <Players players={game.players} canBoot={!!player?.host} removePlayer={removePlayer} />
      )}
      {showing === 'chat' && game && player?.allFamilies && (
        <Chat
          primaryChat={player.family || player.id}
          subscribedChats={player.allFamilies}
          primaryChatName={`${game.players[player.family || player.id].name}'s family`}
          sender={player.name}
        />
      )}
      {showing === 'settings' && (
        <Footer
          game={game}
          updateGame={updateGame}
          player={player}
          updatePlayer={updatePlayer}
          removePlayer={removePlayer}
        />
      )}
    </Box>
  )
}
