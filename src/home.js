import {useEffect, useState} from 'react'
import {BrowserRouter as Router, Switch, Route, Link, useHistory} from 'react-router-dom'
import {Box, Button, Heading, Input, Label, Select, Text} from 'theme-ui'
import {hri} from 'human-readable-ids'
import getDatabase from './config/firebase'
import {ThemeProvider} from 'theme-ui'
import theme from './config/theme'
import Game from './game'
import {getPersistentPlayer} from './config/player'

const Family = ({createGame}) => {
  return (
    <Box m={4} variant="vertical" sx={{minWidth: '100px', maxWidth: '300px', alignItems: 'center'}}>
      <Heading as="h3">Family</Heading>
      <Box variant="vertical">
        <Text pt={2}>Each player chooses secret name.</Text>
        <Text pt={2}>
          At the beginning of the game, the secret names are displayed in random order.
        </Text>
        <Text pt={2}>
          Players then take turns guessing who corresponds to each name. If they are correct, the
          named player joins the "family" of the guessing player, and they can work together to name
          the remaining players.
        </Text>
        <Text pt={2}>The game ends when there is a single family standing.</Text>
      </Box>
      <Button mt={4} onClick={() => createGame('family')}>
        Create Game
      </Button>
    </Box>
  )
}

const Celebrity = ({createGame}) => {
  const [namesPerPlayer, setNamesPerPlayer] = useState(5)
  const [timePerPlayer, setTimePerPlayer] = useState(60)
  return (
    <Box m={4} variant="vertical" sx={{minWidth: '100px', maxWidth: '300px', alignItems: 'center'}}>
      <Heading as="h3">Celebrity</Heading>
      <Box variant="vertical">
        <Text pt={2}>Players divide into two teams. Each player chooses five famous names.</Text>
        <Text pt={2}>
          Players then take turns trying to get their team to guess names one at a time. The team
          which guesses the most names correctly wins!
        </Text>
      </Box>
      <Box mt={4} as="form" onSubmit={(e) => e.preventDefault()}>
        <Label htmlFor="namesPerPlayer">Names per player:</Label>
        <Select
          mb={2}
          name="namesPerPlayer"
          id="namesPerPlayer"
          value={namesPerPlayer}
          onChange={(e) => setNamesPerPlayer(e.target.value)}
        >
          <option>5</option>
          <option>10</option>
          <option>20</option>
        </Select>
        <Label>Time per player:</Label>
        <Select mb={2} value={timePerPlayer} onChange={(e) => setTimePerPlayer(e.target.value)}>
          <option>30</option>
          <option>45</option>
          <option>60</option>
          <option>90</option>
          <option>120</option>
        </Select>
        <Button onClick={() => createGame('celebrity', {namesPerPlayer, timePerPlayer})}>
          Create Game
        </Button>
      </Box>
    </Box>
  )
}

export default function Home() {
  const history = useHistory()

  const onJoin = (e) => {
    e.preventDefault()
    const gameID = document.getElementById('gameID').value
    if (gameID) {
      history.push(`/${gameID}`)
    }
  }

  const createGame = async (type, additionalProps = {}) => {
    const id = hri.random()
    const host = getPersistentPlayer()
    const game = {
      id,
      type,
      host,
      state: 'created',
      createdAt: new Date().toISOString(),
      players: {},
      ...additionalProps
    }
    await getDatabase().ref(`games/${id}`).set(game)
    history.push(`/${id}`)
  }

  return (
    <Box m={2} sx={{display: 'flex', alignItems: 'center', flexDirection: 'column'}}>
      <Heading mb={2} as="h1">
        Name Games
      </Heading>

      <Heading mb={2} as="h2" color="primary">
        Start a game:
      </Heading>

      <Box sx={{display: 'flex', flexWrap: 'wrap', justifyContent: 'space-around'}}>
        <Family createGame={createGame} />
        <Celebrity createGame={createGame} />
      </Box>

      <Heading m={2} as="h2" color="primary">
        Join a game:
      </Heading>
      <Box variant="vertical" sx={{alignItems: 'center'}} as="form" onSubmit={onJoin}>
        <label>
          Game code:
          <Input id="gameID" name="code" />
          <Button type="submit">Go</Button>
        </label>
      </Box>
    </Box>
  )
}
