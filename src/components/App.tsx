import React, { Suspense } from 'react'
import { Route, Redirect, Switch } from 'react-router-dom'

import { isValidSolid } from 'data'
import {
  escapeName,
  randomSolidName,
  isConwaySymbol,
  fromConwayNotation,
  isAlternateName,
  getCanonicalName,
} from 'math/polyhedra/names'

import ErrorPage from './ErrorPage'
import Loading from './Loading'

const HomePage = React.lazy(() => import('./HomePage'))
const Viewer = React.lazy(() => import('./Viewer'))

export default () => (
  <Suspense fallback={<Loading />}>
    <Switch>
      <Route
        exact
        path="/"
        render={({ location }) => (
          <HomePage hash={location.hash.substring(1)} />
        )}
      />
      <Route
        exact
        path="/random"
        render={() => <Redirect to={randomSolidName()} />}
      />
      <Route
        path="/:solid"
        render={({ match, history }) => {
          const solid = match.params.solid ?? ''
          if (isConwaySymbol(solid)) {
            const fullName = escapeName(fromConwayNotation(solid))
            const newPath = history.location.pathname.replace(solid, fullName)
            return <Redirect to={newPath} />
          }
          if (isAlternateName(solid)) {
            const fullName = escapeName(getCanonicalName(solid))
            const newPath = history.location.pathname.replace(solid, fullName)
            return <Redirect to={newPath} />
          }
          if (isValidSolid(solid)) {
            return <Viewer solid={solid} url={match.url} />
          }
          return <ErrorPage />
        }}
      />
    </Switch>
  </Suspense>
)
