import { useRouterHistory } from 'react-router'
import createBrowserHistory from 'history/lib/createBrowserHistory'

const historyConfig = {
  basename: __BASENAME__
}

export const appHistory = useRouterHistory(createBrowserHistory)(historyConfig)

export default appHistory
