import './App.css'
import {BrowserRouter as Router, Switch, Route} from 'react-router-dom'
import {ThemeProvider} from 'theme-ui'
import theme from './config/theme'
import Home from './home'
import Game from './game'

function App() {
  return (
    <ThemeProvider theme={theme}>
      <Router>
        <Switch>
          <Route exact path="/">
            <Home />
          </Route>
          <Route path="/:gameID">
            <Game />
          </Route>
        </Switch>
      </Router>
    </ThemeProvider>
  )
}

export default App
