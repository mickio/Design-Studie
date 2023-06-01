const buttonComponent = types => {
    const div = document.createElement('button')
    div.classList.add('button', ...types||['disk','floating'])
    div.insertAdjacentHTML('afterbegin',`<span class="icon"></span><div class="watermark"></div>`)
    return div
}

class BooxButton extends HTMLElement {

    static get observedAttributes() { 
        return ['icon', 'type','rotated','minimized','loading','disabled']; 
    }

    constructor() {
        super()
        this.attachShadow({mode:'open'})
        let classNames = this.getAttribute('form-factors')?.split(/\s*,\s*/)
        const buttonStyle = document.createElement('style')
        buttonStyle.insertAdjacentText('afterbegin',styles)
        this.shadowRoot.append(buttonComponent(classNames),buttonStyle)
        this.button = this.shadowRoot.querySelector('button')
    }
    
    attributeChangedCallback (attName, oldValue,newValue) {
        switch(attName) {
            case 'icon':
                this.setIcon()
                break;
            case 'type':
                this.button.firstElementChild.classList.replace(oldValue,newValue)
                break;
            case 'rotated':
                this.button.classList.toggle('rotated')
                break;
            case 'minimized':
                this.button.classList.toggle('minimized')
                break;
            case 'loading':
                this.toggleLoading()
            case 'disabled':
                if (this.hasAttribute('disabled')) this.button.setAttribute('disabled','')
                else this.button.removeAttribute('disabled')
        }
    }
    
    connectedCallback () {
        if( this.hasAttribute('minimizable') ) {
            this.button.classList.toggle('minimizable' )
        }
        if( this.hasAttribute('rotatable') ) {
            this.button.classList.toggle('rotatable')
        }
    }

    toggleAttribute = (attName) => {
        if(this.hasAttribute(attName)) this.removeAttribute(attName)
        else this.setAttribute(attName,'')
    } 

    toggleMinimized = () => {
        if(this.hasAttribute('minimizable')) this.toggleAttribute('minimized')
    }

    toggleRotated = () => {
        if(this.hasAttribute('rotatable')) this.toggleAttribute('rotated')
    }

    toggleLoading = () => {
        if (this.hasAttribute('loading')) this.button.lastElementChild.classList.replace('watermark','loading')
        else this.button.lastElementChild.classList.replace('loading','watermark')
    }

    setIcon = () => {
        const icon = this.getAttribute('icon')
        switch(icon) {
            case 'dnb':
                this.button.firstElementChild.textContent = 'search'
                this.button.classList.remove('inverted')
                this.button.lastElementChild.textContent = icon
                break;
            case 'google':
                this.button.firstElementChild.textContent = 'search'
                this.button.classList.remove('inverted')
                this.button.lastElementChild.textContent = icon
                break;
            case 'close':
                this.button.firstElementChild.textContent = 'close'
                this.button.classList.add('inverted')
                this.button.lastElementChild.textContent = ''
                break;
            default:
                this.button.firstElementChild.textContent = icon
                this.button.lastElementChild.textContent = ''
                this.button.classList.remove('inverted')
            }
        }
}

customElements.define('boox-button',BooxButton)

const styles = `
    .button {
        background-color: var(--orange);
        cursor: pointer;
        margin: 1em;
        padding: 20px;
        overflow: visible;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: background-color var(--duration) ease-out;
    }
    .button:disabled {
        background-color: lightsalmon;
        color: grey !important;
        cursor: auto;
    }
    .disk {
        width: 2em;
        height: 2em;
        border-radius: 50%;
        transition: border-radius var(--duration) ease-out;
    }
    .fullwidth {
        width: 100%;
        box-sizing: border-box;
    }
    .floating {
        border:none;
        box-shadow: 2px 2px 15px rgba(128, 128, 128, 0.637);
    }
    .minimizable {
        transform: scaleY(1);
        transition: all var(--duration) ease-out;
    }
    .minimized {
        transform: scaleY(0);
        transition: all var(--duration) ease-in;
    }
    .rotatable {
        transform: rotate(0);
        transition: all var(--duration) ease-out;
    }
    .rotated {
        transform: rotate(-90deg);
        transition: all var(--duration) ease-in;
    }
    .icon {
        vertical-align: bottom;
        font-family: 'Material Icons';
        font-weight: normal;
        font-style: normal;
        font-size: 24px;
        /* line-height: 1; */
        letter-spacing: normal;
        text-transform: none;
        display: inline-block;
        white-space: nowrap;
        word-wrap: normal;
        direction: ltr;
        -moz-font-feature-settings: 'liga';
        -moz-osx-font-smoothing: grayscale;
    }
    .inverted {
        color: var(--orange) !important;
        background-color: black;
    }
    .loading {
        background-color: var(--orange);
        background-image: url(preparing.gif);
        background-position: center;
        background-size: contain;
        background-repeat: no-repeat;
        width: 2em;
        height: 2em;
        border-radius: 50%;
        position: absolute;
    }
    .watermark {
        position: absolute;
        color: lightsalmon;
        font-size: 9pt;
        z-index: -1
    }
    .button:active {
        background-color: lightsalmon;
        border-radius: 25%;
        transition: color var(--duration) ease-in;
    }
`