import { HashRouter } from './hash.js';
import { HistoryRouter } from './history.js';
import { ROUTELIST } from './routeList.js';
// 路由模式
const MODE = 'hash';
class WebRouter {
    constructor({ mode = 'hash', routeList }) {
        this.router = mode === 'hash' ? new HashRouter(routeList) : new HistoryRouter(routeList);
    }
    push(path) {
        this.router.push(path);
    }
    replace(path) {
        this.router.replace(path);
    }
    go(num) {
        this.router.go(num);
    }
}

const webRouter = new WebRouter({
    mode: MODE,
    routeList: ROUTELIST
});

document.querySelector('.btn-list').addEventListener('click', e => {
    const event = e || window.event;
    if (event.target.tagName === 'LI') {
        const url = event.target.dataset.url;
        console.log(url);
        !url.indexOf('/') ? webRouter.push(url) : webRouter.go(url);
    }
});

document.querySelector('.replace-btn').addEventListener('click', e => {
    webRouter.replace('/');
});