import { History, Location } from 'history'
import * as React from 'react'
import * as ReactDOM from 'react-dom'
import { match, matchPath, RouteComponentProps, RouteProps } from 'react-router'

function isEmptyChildren(children) {
    return React.Children.count(children) === 0
}

type CacheDom = HTMLElement | null
type LivePath = string | string[] | undefined
interface IMatchOptions {
    path?: string | string[]
    exact?: boolean
    strict?: boolean
    sensitive?: boolean
}

enum SideEffect {
    SAVE_DOM_SCROLL = 'SAVE_DOM_SCROLL',
    RESTORE_DOM_SCROLL = 'RESTORE_DOM_SCROLL',
    CLEAR_DOM_SCROLL = 'CLEAR_DOM_SCROLL',
    RESET_SCROLL = 'RESET_SCROLL',

    HIDE_DOM = 'HIDE_DOM',
    SHOW_DOM = 'SHOW_DOM',
    CLEAR_DOM_DATA = 'CLEAR_DOM_DATA',

    // 恢复与隐藏的钩子
    ON_REAPPEAR_HOOK = 'ON_REAPPEAR_HOOK',
    ON_HIDE_HOOK = 'ON_HIDE_HOOK',

    NO_SIDE_EFFECT = 'NO_SIDE_EFFECT'
}

enum LiveState {
    NORMAL_RENDER_ON_INIT = 'normal render (matched or unmatched)',
    NORMAL_RENDER_MATCHED = 'normal matched render',
    HIDE_RENDER = 'hide route when livePath matched',
    NORMAL_RENDER_UNMATCHED = 'normal unmatched render (unmount)'
}

type OnRoutingHook = (
    location: Location,
    match: match | null,
    history: History,
    livePath: LivePath,
    alwaysLive: boolean | undefined
) => any

interface IProps extends RouteProps {
    name?: string
    livePath?: string | string[]
    alwaysLive?: boolean
    onHide?: OnRoutingHook
    onReappear?: OnRoutingHook
    forceUnmount?: OnRoutingHook
    computedMatch?: IMatchOptions
    // history: History
    // match: match
    // staticContext: any
}

/**
 * The public API for matching a single path and rendering.
 */
type PropsType = RouteComponentProps<any> & IProps
class LiveRoute extends React.Component<PropsType, any> {
    public routeDom: CacheDom = null
    public scrollPosBackup: { left: number; top: number } | null = null
    public previousDisplayStyle: string | null = null
    public liveState: LiveState = LiveState.NORMAL_RENDER_ON_INIT
    public currentSideEffect: SideEffect[] = [SideEffect.NO_SIDE_EFFECT]

    public componentDidMount() {
        this.getRouteDom()
    }

    public getSnapshotBeforeUpdate(prevProps, prevState) {
        // 隐藏相关
        this.performSideEffects(this.currentSideEffect, [
            SideEffect.ON_HIDE_HOOK,
            SideEffect.SAVE_DOM_SCROLL,
            SideEffect.HIDE_DOM,
        ])
        return null
    }

    public componentDidUpdate(prevProps, prevState) {
        this.performSideEffects(this.currentSideEffect, [SideEffect.CLEAR_DOM_DATA])

        // 展示相关
        this.performSideEffects(this.currentSideEffect, [
            SideEffect.SHOW_DOM,
            SideEffect.RESTORE_DOM_SCROLL,
            SideEffect.CLEAR_DOM_SCROLL,
            SideEffect.ON_REAPPEAR_HOOK
        ])
        // this.performSideEffects(this.currentSideEffect, [SideEffect.RESET_SCROLL])
        this.getRouteDom()
    }

    // 销毁清除工作
    public componentWillUnmount() {
        this.clearDomData()
        this.clearScroll()
    }

    // 获取当前路由
    public getRouteDom = () => {
        let routeDom: Element | null | Text = null
        try {
            routeDom = ReactDOM.findDOMNode(this)
        } catch {
            // TODO:
        }
        this.routeDom = (routeDom as CacheDom) || this.routeDom
    }

    // 隐藏路由
    public hideRoute() {
        if (this.routeDom && this.routeDom.style.display !== 'none') {
            this.previousDisplayStyle = this.routeDom.style.display
            this.routeDom.style.display = 'none'
        }
    }

    // 恢复 DOM 原有的 display 样式
    public showRoute() {
        if (this.routeDom && this.previousDisplayStyle !== null) {
            this.routeDom.style.display = this.previousDisplayStyle
        }
    }

    public doesRouteEnableLive() {
        return this.props.livePath || this.props.alwaysLive
    }

    // 保存滚动位置
    public saveScrollPosition() {
        if (this.routeDom) {
            const scrollTop = document.documentElement.scrollTop || document.body.scrollTop
            const scrollLeft = document.documentElement.scrollLeft || document.body.scrollLeft
            this.scrollPosBackup = { top: scrollTop, left: scrollLeft }
        }
    }

    // 恢复滚动位置
    public restoreScrollPosition() {
        const scroll = this.scrollPosBackup
        if (scroll && this.routeDom) {
            window.scrollTo(scroll.left, scroll.top)
        }
    }

    // 重置滚动位置
    public resetScrollPosition() {
        if (scroll && this.routeDom) {
            window.scrollTo(0, 0)
        }
    }

    // 清除Dom
    public clearDomData() {
        if (this.doesRouteEnableLive()) {
            this.routeDom = null
            this.previousDisplayStyle = null
        }
    }

    // 清除滚动位置
    public clearScroll() {
        if (this.doesRouteEnableLive()) {
            this.scrollPosBackup = null
        }
    }

    public isLivePathMatch(
        livePath: LivePath,
        alwaysLive: boolean | undefined,
        pathname: string,
        options: IMatchOptions,
    ) {
        const pathArr = Array.isArray(livePath) ? livePath : [livePath]
        if (alwaysLive) {
            pathArr.push('*')
        }

        for (const currPath of pathArr) {
            if (typeof currPath !== 'string') {
                continue
            }

            const currLiveOptions = { ...options, path: currPath }
            const currMatch = matchPath(pathname, currLiveOptions)
            // return if one of the livePaths is matched
            if (currMatch) {
                return currMatch
            }
        }
        // not matched default fallback
        return null
    }

    public performSideEffects = (sideEffects: SideEffect[], range: SideEffect[]) => {
        const sideEffectsToRun = sideEffects.filter(item => range.indexOf(item) >= 0)

        sideEffectsToRun.forEach((sideEffect, index) => {
            switch (sideEffect) {
                case SideEffect.SAVE_DOM_SCROLL:
                    this.saveScrollPosition()
                    break
                case SideEffect.HIDE_DOM:
                    this.hideRoute()
                    break
                case SideEffect.SHOW_DOM:
                    this.showRoute()
                    break
                case SideEffect.RESTORE_DOM_SCROLL:
                    this.restoreScrollPosition()
                    break
                case SideEffect.ON_REAPPEAR_HOOK:
                    this.onHook('onReappear')
                    break
                case SideEffect.ON_HIDE_HOOK:
                    this.onHook('onHide')
                    break
                case SideEffect.CLEAR_DOM_SCROLL:
                    this.clearScroll()
                    break
                case SideEffect.RESET_SCROLL:
                    this.resetScrollPosition()
                    break
                case SideEffect.CLEAR_DOM_DATA:
                    this.clearScroll()
                    this.clearDomData()
                    break
            }
        })

        this.currentSideEffect = sideEffects.filter(item => range.indexOf(item) < 0) as SideEffect[]
    }

    public onHook = (hookName: 'onHide' | 'onReappear') => {
        const {
            exact = false,
            sensitive = false,
            strict = false,
            path,
            livePath,
            alwaysLive,
            // from withRouter, same as RouterContext.Consumer ⬇️
            history,
            location,
            match,
            staticContext,
            // from withRouter, same as RouterContext.Consumer ⬆️
        } = this.props
        const hook = this.props[hookName]
        const context = { history, location, match, staticContext }
        const matchOfPath = this.props.path ? matchPath(location.pathname, this.props) : context.match
        const matchOfLivePath = this.isLivePathMatch(livePath, alwaysLive, location!.pathname, {
            path,
            exact,
            strict,
            sensitive,
        })
        const matchAnyway = matchOfPath || matchOfLivePath
        if (typeof hook === 'function') {
            hook(location!, matchAnyway, history, livePath, alwaysLive)
        }
    }

    public render() {
        const {
            exact = false,
            sensitive = false,
            strict = false,
            forceUnmount,
            path,
            livePath,
            alwaysLive,
            component,
            render,
            // from withRouter, same as RouterContext.Consumer ⬇️
            history,
            location,
            match,
            staticContext,
            // from withRouter, same as RouterContext.Consumer ⬆️
        } = this.props
        let { children } = this.props
        const context = { history, location, match, staticContext }

        // 如果不匹配会返回 null
        const matchOfPath = this.props.path ? matchPath(location.pathname, this.props) : context.match
        const matchOfLivePath = this.isLivePathMatch(livePath, alwaysLive, location!.pathname, {
            path,
            exact,
            strict,
            sensitive,
        })
        const matchAnyway = matchOfPath || matchOfLivePath

        // 不渲染 => 路由都不匹配，或者依赖路由匹配，缓存路由没有渲染过。
        if (
            !matchAnyway ||
            (!matchOfPath &&
                matchOfLivePath &&
                (this.liveState === LiveState.NORMAL_RENDER_ON_INIT || this.liveState === LiveState.NORMAL_RENDER_UNMATCHED))
        ) {
            this.currentSideEffect = [SideEffect.CLEAR_DOM_SCROLL]
            this.liveState = LiveState.NORMAL_RENDER_UNMATCHED
            return null
        }

        // 匹配 render 和 不匹配隐藏的逻辑
        if (matchOfPath) {
            // 第一次访问
            this.currentSideEffect = [SideEffect.RESET_SCROLL]

            // 不是第一次匹配，从隐藏状态到渲染的状态
            if (this.liveState === LiveState.HIDE_RENDER) {
                this.currentSideEffect = [
                    SideEffect.SHOW_DOM,
                    SideEffect.RESTORE_DOM_SCROLL,
                    SideEffect.CLEAR_DOM_SCROLL, // 当前操作也可以省略
                    SideEffect.ON_REAPPEAR_HOOK,
                ]
            }

            this.liveState = LiveState.NORMAL_RENDER_MATCHED
        } else {
            // force unmount
            if (typeof forceUnmount === 'function' && forceUnmount(location, match, history, livePath, alwaysLive)) {
                this.liveState = LiveState.NORMAL_RENDER_UNMATCHED
                this.currentSideEffect = [SideEffect.CLEAR_DOM_DATA]
                return null
            }

            // 从展示到隐藏的逻辑。缓存页面没匹配，但是依赖的页面被匹配了。否则走不渲染的逻辑(上面第一个 if )了
            if (this.liveState === LiveState.NORMAL_RENDER_MATCHED) {
                this.currentSideEffect = [SideEffect.ON_HIDE_HOOK, SideEffect.SAVE_DOM_SCROLL, SideEffect.HIDE_DOM]
            }
            this.liveState = LiveState.HIDE_RENDER
        }

        // 正常render 传递到页面的props
        const props = {
            ...context,
            location,
            match: matchOfPath,
            ensureDidMount: this.getRouteDom,
            restoreScrollPosition: this.restoreScrollPosition.bind(this),
        }

        // Preact uses an empty array as children by
        // default, so use null if that's the case.
        if (Array.isArray(children) && children.length === 0) {
            children = null
        }

        if (typeof children === 'function') {
            children = (children as any)(props)

            if (children === undefined) {
                children = null
            }
        }

        const componentInstance = component && React.createElement(component, props)

        // 正常渲染路由
        return children && !isEmptyChildren(children)
            ? children
            : matchAnyway
                ? component
                    ? componentInstance
                    : render
                        ? render(props as any)
                        : null
                : null
    }
}

export default LiveRoute
