import { html } from 'htm/preact'
import { type FunctionComponent } from 'preact'
import { useCallback } from 'preact/hooks'
import { State } from '../state.js'
import { Button } from '../components/button.js'
import './home.css'

export const HomeRoute:FunctionComponent<{
    state:ReturnType<typeof State>
}> = function HomeRoute ({ state }) {
    const plus = useCallback((ev:MouseEvent) => {
        ev.preventDefault()
        State.Increase(state)
    }, [])

    const minus = useCallback((ev:Event) => {
        ev.preventDefault()
        State.Decrease(state)
    }, [])

    return html`<section class="route home">
        <div>
            <h2>counter</h2>
            <output aria-live="polite">count: ${state.count.value}</output>

            <ul class="count-controls">
                <li>
                    <${Button} class="btn" onClick=${plus}>
                        plus
                    <//>
                </li>
                <li>
                    <${Button} class="btn" onClick=${minus}>
                        minus
                    <//>
                </li>
            </ul>
        </div>
    </section>`
}
