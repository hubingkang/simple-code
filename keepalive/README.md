### 使用方法

组件**必须**使用 withRouter 高阶组件，以便组件内部获取 Router 的上下文

```
import LiveRoute from 'KeepAliveRoute'
import { withRouter } from 'react-router-dom'

const KeepAliveRoute = withRouter(LiveRoute)
```

#### Use in Switch

因为 Switch 组件的原因，它每次只会挂载匹配的路由，卸载未匹配的路由，其 KeepAliveRoute 组件不能放置在 Switch 组件中，需要对当前路由进行适当的改造。以 Honor 项目为例：

```
{
    module: 'Home',
    path: '/home',
    children: [
      {
        path: '/dashboard',
        title: '首页',
        component: () => import('@/containers/dashboard'),
        keepAlive: true,
        alwaysLive: false,
        livePath: ["/bdShops2", "/crm/visit/plan/list"],
      },
      {
        path: '/dashboard/announcements/:id',
        component: () => import('@/containers/dashboard/announcements'),
        title: '通知详情',
      },
      ...
    ]
}
```
在想 keepAlive 的路由上设置参数:
* keepAlive: true,
* livePath: ["/bdShops2", "/crm/visit/plan/list"]，livePath 参数参考下面的Props：
* alwaysLive: false // 可省略, 默认为 false

```
import LiveRoute from '@/components/keepalive'
const KeepAliveRoute = withRouter(LiveRoute)

function BaseRouter ({ history }) {
  return (
    <Router history={history}>
      <Wrapper>
        <Switch>
          <Redirect exact from="/" to="/identity/choose" />
          {publicRoutes.map(route => (
            <Route
              exact
              key={route.path}
              path={route.path}
              render={props => renderPublicRoutes(props, route)}
            />
          ))}
          {privateRoutes.map(route => {
            if (route.keepAlive) {
              return <Route path={route.path} />
            }

            return (
              <Route
                exact
                key={route.path}
                path={route.path}
                render={props => renderPrivateRoutes(props, route)}
              />
            )
          })}
          <Route path="*" component={NoMatchRedirect} />
        </Switch>
        {
          privateRoutes.filter((route) => route.keepAlive).map(({livePath, path, component}) => {
            const Comp = React.lazy(component)

            const Component = (props) => {
              return (
                <Suspense fallback={<div>Loading...</div>}>
                  <Comp {...props} />
                </Suspense>
              )
            }

            return (
              <KeepAliveRoute
                path={path}
                component={Component}
                livePath={livePath}
                name={path}
                onHide={(location, match, history, livePath, alwaysLive) => {
                  console.log('hide hook tiggered')
                }}
                onReappear={(location, match, history, livePath, alwaysLive) => {
                  console.log('reappear hook tiggered')
                }}
                forceUnmount={(location, match, history, livePath, alwaysLive) => {
                  if (location?.pathname === '/bdShops2') {
                    return true
                  }
                  return false
                }}
              />
            )
          })
        }
      </Wrapper>
    </Router>
  )
}
```

**注意** 上面 Switch 原有路由添加一个占位符。

```
if (route.keepAlive) {
    return <Route path={route.path} />
}
```

### Props of KeepAliveRoute


| 属性         | 说明                        | 类型                                                         | 默认值 |
| ------------ | --------------------------- | ------------------------------------------------------------ | ------ |
| path         | 当前路由的 path             | string                                                       | -      |
| exact        | path 是否精准匹配           | boolean                                                      | false  |
| component    | 当前路由渲染的组件          | ReactNode                                                    | -      |
| livePath     | path 页面存活的依赖的路由   | string \| string[]                                           | -      |
| alwaysLive   | path 页面是否在所有页面存活 | boolean                                                      | false  |
| onHide       | 路由隐藏前的回调            | function({ location, match, history, livePath, alwaysLive }) | -      |
| onReappear   | 路由从隐藏-->展示后的回调   | function({ location, match, history, livePath, alwaysLive }) | -      |
| forceUnmount | 强制卸载路由                | function({ location, match, history, livePath, alwaysLive }) | -      |

### Props of your Component

| 属性                  | 说明                    | 类型          | 默认值 |
| --------------------- | ----------------------- | ------------- | ------ |
| ensureDidMount        | 确保当前获取到最终的dom | function() {} | -      |
| restoreScrollPosition | 恢复滚动位置            | function() {} | -      |

因为一些页面在渲染时候可能在某些接口请求前先加载 `Loading`  组件，导致 `KeepAlive` 的组件保存的是 `Loading` 组件，即调用 `ensureDidMount()` 表示当前确保获取的是 `KeepAlive` 的页面。


### 参考

[react-live-route](https://github.com/fi3ework/react-live-route)
