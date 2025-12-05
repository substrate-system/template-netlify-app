import { html } from 'htm/preact'
import { type FunctionComponent, render } from 'preact'
import Debug from '@substrate-system/debug'
import { State } from './state.js'
import Router from './routes/index.js'
import './style.css'

const router = Router()
const state = State()
const debug = Debug('example')

// set debug logging in local env
if (isDev()) {
    localStorage.setItem('DEBUG', 'example:*,example')
    // @ts-expect-error DEV env
    window.state = state
} else {
    localStorage.removeItem('DEBUG')
    localStorage.removeItem('debug')
}

export const Example:FunctionComponent = function Example () {
    debug('rendering example...')
    const match = router.match(state.route.value)

    if (!match || !match.action) {
        return html`<div class="404">
            <h1>404</h1>
        </div>`
    }

    const ChildNode = match.action(match, state.route.value)

    return html`<main>
        <header>
            <h1>ABC</h1>

            <nav aria-label="Main navigation">
                <ul>
                    <li><a href="/">home</a></li>
                    <li><a href="/contact">contact</a></li>
                </ul>
            </nav>
        </header>

        <${ChildNode} state=${state} />
    </main>`
}

render(html`<${Example} />`, document.getElementById('root')!)

function isDev ():boolean {
    return !!(import.meta.env.DEV || import.meta.env.MODE === 'staging')
}
