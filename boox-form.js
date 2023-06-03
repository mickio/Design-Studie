const insertIdentifiers = list => {
  let html = list.map(({type,identifier}) => insertDataset('industryIdentifiers',type,identifier)).join('')
  html += `<div><span class="icon">add</span></div>`
  return html
}

const objFields = ['categories','authors','Person(en)','Sachgruppe(n)','Schlagwörter','Sprache(n)'];

const formGoogleView = book => `<div class="buttons not-visible"><boox-button icon="save" id="saveBook" minimizable minimized disabled></boox-button><boox-button icon="google" id="searchBook" minimizable minimized></boox-button><boox-button icon="edit" id="updateBook"></boox-button></div>
<form>
<fieldset class="content column" disabled>
<label>Titel</label><input name="title" class="title" value="${book.title}" >
<label>Untertitel</label><input name="subtitle" class="subtitle" value="${book.subtitle}" >
<label>Autor(en)</label><div class="tag"><div><input name="authors" class="authors" value="${book.authors}" ><span class="invisible"></span></div><div class="tags"></div></div>
<label>Teaser</label><textarea name="teaser" class="teaser" rows="3">${book.teaser}</textarea>
<label>Beschreibung</label><textarea name="description" class="description" rows="10">${book.description}</textarea>
</fieldset>
<fieldset class="info column"  disabled>
    <legend>Zusatzinfos</legend>
<label>Kategorien</label><div class="tag"><div><input name="categories" class="categories"><span class="icon invisible"></span></div><div class="tags"></div></div>
<label>Verlag</label><input name="publisher" class="entry" value="${book.publisher}" >
<label>Ver&ouml;ffentlichungsdatum</label><input name="publishedDate" class="entry" value="${book.publishedDate}" >
<label>Anzahl Seiten</label><input name="pageCount" class="entry" value="${book.pageCount}" >
<label>ISBN</label><input name="isbn" class="entry" value="${book.isbn}" >
<fieldset class="info group" name="industryIdentifiers"><legend>Identifiers aus Google search books</legend>${insertIdentifiersObject(book['industryIdentifiers'])}
</fieldset><fieldset class="info column" disabled>
<legend>Image URLs</legend>
<div>
    <img class="thumbnail" src="${book.thumbnail}">
    <div class="column">
<label>Thumbnail Image</label><input name="thumbnail" class="entry" value="${book.thumbnail}" >
    </div>
</div>
<div>
    <img class="image" src="${book.image}">
    <div class="column">
<label>Cover Image</label><input name="image" class="entry" value="${book.image}" >
    </div>
</div>
</fieldset>
</form>`

class BooxForm extends HTMLElement {
  static get observedAttributes() {
    return ['book']
  }
  constructor(book,buttonHandler) {
    super()
    book && this.init(book)
  }
  init(book) {
    this.book=book
    this.attachShadow({mode:'open'})
    const style = document.createElement('style')
    style.textContent = formStyles
    const content = div(formGoogleView(book))
    content.classList.add('panel')
    this.shadowRoot.append(content,style)
    this.form = this.shadowRoot.querySelector('form')
    this.form.oninput = this.enableSaveButton
    this.button = this.shadowRoot.querySelector("#updateBook")
    this.button.onclick = this.showEditButtons
    this.saveButton = this.shadowRoot.querySelector("#saveBook")
    this.saveButton.onclick = this.saveBook
    this.searchButton = this.shadowRoot.querySelector("#searchBook")
  } 
  connectedCallback() {
    this.prepareTags(this.book)
    this.prepareListObjectInput()
  }
  attributeChangedCallback(attName,oldValue,newValue) {
    if(attName=='book') {
      const book = JSON.parse(this.getAttribute('book'))
      book && this.init(book)
    }
  }
  showEditButtons = () => {
    this.button.setAttribute('icon','close')
    this.searchButton.setAttribute('minimized','')
    this.saveButton.setAttribute('minimized','')
    this.shadowRoot.querySelectorAll('fieldset').forEach( fset => fset.removeAttribute('disabled',''))
    this.button.onclick = this.hideEditButtons
  }
  enableSaveButton = () => this.saveButton.removeAttribute('disabled')
  disableSaveButton = () => {
    this.saveButton.removeAttribute('loading')
    this.saveButton.setAttribute('disabled','')
  }
  hideEditButtons = () => {
    this.button.setAttribute('icon','edit')
    this.searchButton.removeAttribute('minimized')
    this.saveButton.removeAttribute('minimized')
    this.shadowRoot.querySelectorAll('fieldset').forEach( fset => fset.setAttribute('disabled',''))
    this.button.onclick = this.showEditButtons
  }
  toggleButtonGroup = ([form]) => {
    const buttonGroupClasses = this.button.parentNode.classList
    if(form.intersectionRatio > .5) buttonGroupClasses.replace('not-visible','pop-up')
    else if (!form.intersectionRatio <= .5) buttonGroupClasses.replace('pop-up','not-visible')
  }
  saveBook = async () => {
    this.saveButton.setAttribute('loading','')
    if (this.book.bookId) this.updateBook()
    else this.addBook()
  }
  addBook = async () => {
    this.syncFormData(this.book)
    bookManager.addBook(this.book)
    .then(bookId => this.book.bookId = bookId)
    .then(this.disableSaveButton)
  }
    
  updateBook = async () => {
      this.syncFormData(this.book)
      bookManager.updateBook(this.book.bookId,this.book).then(this.disableSaveButton)
  }
    
  syncFormData () {
    const book = this.book
    const formData = new FormData(this.form)
    for(let entry of formData.entries()) {
      if (['categories','authors','Person(en)','Sachgruppe(n)','Schlagwörter','Sprache(n)'].includes(entry[0])) {
        const elems = this.shadowRoot.querySelector(`input[name^=${entry[0].slice(0,6)}]`).parentNode.nextElementSibling.children
        const a = []
        for(const el of elems) {
          a.push(el.textContent.trim())    
        }
        if (elems.length) {
          book[entry[0]] = a
        }
      }
      else if (entry[1]) book[entry[0]] = entry[1]
    };
    ['industryIdentifiers','creators','identifiers','titles'].forEach(name => {
      const a = []
      const elems = this.shadowRoot.querySelectorAll(`fieldset[name=${name}] div.dataset`)
      for (const el of elems) {
        a.push(getDataset(el,name))
      }
      if(elems.length)  book[name] = a
    })
    console.log('update book',book)
  }
    
  /* Helpers für list input */
  popUp = async function (val) {
    const self = this.getRootNode().host
    const input = this.previousElementSibling
    const container = this.parentNode.nextElementSibling
    const text = typeof val === 'string' ? val : input.value
    input.value = ''
    this.classList.replace('visible','invisible')
    container.insertAdjacentHTML('beforeend',`<div class="not-visible">${text}</div>`)
    const tag = container.lastElementChild
    tag.addEventListener('click',function(){
      if (this.parentNode.parentNode.parentNode.hasAttribute('disabled')) return
      this.classList.replace('pop-up','not-visible')
      setTimeout(() => this.remove(),300)
      self.enableSaveButton()
    })
    await nextFrame()
    tag.classList.replace('not-visible','pop-up')
  }
  prepareTags = book => {
    objFields.forEach(name => {
      const span = this.shadowRoot.querySelector(`input[name^=${name.slice(0,6)}] ~ span`)
      span && book[name]?.forEach(entry => this.popUp.call(span,entry))
    })
  }
  prepareListObjectInput = () => {
    const self = this;
    objFields.forEach(name => {
      const input = self.shadowRoot.querySelector(`input[name^=${name.slice(0,6)}]`)
      if (input) {
        const button = input.nextElementSibling
        input.addEventListener('input', function() {
          this.nextElementSibling.classList.replace('invisible', 'visible');
        });
        button.addEventListener('click',this.popUp)
      } 
    });
    ['industryIdentifiers','creators','identifiers','titles'].forEach(name => {
      const fset = this.shadowRoot.querySelector(`fieldset[name=${name}]`)
      if (fset) {
        const cancelButtons = fset.querySelectorAll('div input + span')
        const addButton = fset.querySelector('.add-identifier')
        for( let button of cancelButtons) {
          button.addEventListener('click',function(){
            this.parentNode.remove()
            self.enableSaveButton()
          })
        }
        addButton.addEventListener('click',function() {
          this.insertAdjacentHTML('beforebegin',insertDataset(name))
          this.previousElementSibling.lastElementChild.addEventListener('click',function(){
            this.parentNode.remove()
            self.enableSaveButton()
          })
        })
      }
    })
    self.shadowRoot.querySelector('input[name=categories]').addEventListener('input',function(){
      const term = this.value
      self.suggest.call(this,this.parentNode,cats,term)
    })
  }
  /* helper für suggest */
  suggest = function(mtPoint, suggestions, term) {
      if (term.length < 3) return
      this.parentNode.querySelector('div.options')?.remove()
      let html = '<div class="options">'
      html += suggestions.filter(t => t.toLowerCase().includes(term.toLowerCase())).map(t => `<p>${t}</p>`).join('')
      html +="</div>"
      mtPoint.insertAdjacentHTML('afterbegin',html)
      const inp = this
      mtPoint.querySelectorAll('p').forEach(p =>p.addEventListener('click',function(){
        inp.value = this.textContent.trim()
        inp.parentNode.querySelector('div.options').remove()
        mtPoint.getRootNode().host.popUp.call(inp.nextElementSibling)
      }))
  }
}

customElements.define('boox-form',BooxForm)

const formStyles = `/* Form tab */
input, textarea {
  width: calc(100% - 10px);
	margin: 0 5px;
	border: 1px solid var(--green);
	padding: 5px;
	box-sizing: border-box;
}
input:focus {
	box-shadow: inset 0 0 2px 2px var(--green);
	outline: none;
	border-color: var(--orange);
}
input:disabled, textarea:disabled  {
	border-color: white;
}
input ~ span:before {
  font-family: "Material Icons";
  content: "check";
}
fieldset label {
	color: var(--green);
	font-variant-caps: all-petite-caps;
	margin: 5px 5px 0 5px;
}
.dataset span:before {
  content: "cancel";
  vertical-align: middle;
  cursor: pointer;
}
fieldset {
	margin: 5px;
	padding: 0 0 5px 0;
	border: none;
}
legend{
	font-size: x-small;
}
fieldset img {
	float: left;
	padding:5px
}
.column {
	display: flex;
	flex-direction: column;
	align-items: flex-start;
}
.group {
  width: calc(100% - 10px);
  box-sizing: border-box;
  border: 1px solid var(--green);
  padding: 0 5px 0 0;
}
.group legend {
  color: var(--green)
}
.group div {
  display: flex;
  padding-bottom: 5px;
  justify-content: flex-end;
}
fieldset:disabled .group span {
  display:none
}
fieldset:enabled .group span {
  cursor: pointer;
}
fieldset .group div:last-child {
  width: 100%;
  box-sizing: border-box;
}
fieldset .group div:last-child span {
  background-color: #87B42D;
  color: white;
  border-radius: 50%;
  padding: 0 2px;
}

.thumbnail,.image {
	height: 45px;
	width: 32px;
	object-fit: cover;
	object-position: top;
}
.tag {
  display: flex;
  flex-direction: column;
  align-items: start;
  justify-items: start;
  width: 100%
}
.tag > div {
  position: relative;
  width: 100%;
}
.tags {
  padding: 5px
}  
fieldset:enabled .tags > div {
  display: inline-block;
  height: 20px;
  line-height:20px;
  color: black;
  font-size: 9pt;
  background-color: var(--green);
  padding: 0 5px;
  border-radius: 10px;
  margin: 0 10px;
}
fieldset:disabled .tags > div {
  display: inline-block;
  height: 20px;
  line-height:20px;
  font-size: 9pt;
  padding: 0 5px;
  margin: 0 10px;
  box-shadow: none;
}
fieldset:disabled .tags {
  position: relative;
  top: -30px;
}
.not-visible{
  transform: scale(0.0);
  transition: transform .2s cubic-bezier(0.68, 0.55, 0.265, 1.55);
}
.pop-up {
  transition: transform .2s cubic-bezier(0.68, 0.55, 0.265, 1.55);
  transform: scale(1.1);
  /* box-shadow: 2px 2px 15px grey */
}
fieldset:enabled .tags > div:after {
  font-family: "Material Icons";
  content: "cancel";
  line-height: 20px;
  vertical-align: middle;
  padding-left: 3px;
}

.tag span {
  text-decoration: none;
  color: var(--green);
  position: absolute;
  right: 8px;
  top: 4px;
}
fieldset:enabled .add-identifier:before {
  font-family: "Material Icons";
  content: "cancel";
  transform: rotate(45deg);
  color: green;
}
.buttons {
	position: fixed;
  display: flex;
  bottom: 0;
  right: 0
}
.invisible {
	opacity: 0;
	transition: opacity .5s ease;
}
.visible {
	opacity: 1;
	transition: opacity .5s ease;
}
`