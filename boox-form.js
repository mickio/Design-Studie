const formStyles = '@import "form-styles.css"'

const formGoogleView = book => `<div class="buttons not-visible"><boox-button icon="save" id="saveBook" minimizable minimized disabled></boox-button><boox-button icon="google" id="searchBook" minimizable minimized></boox-button><boox-button icon="edit" id="updateBook"></boox-button></div>
<form>
<fieldset class="content column" disabled>
<label>Titel</label><input name="title" class="title" value="${book.title}" >
<label>Untertitel</label><input name="subtitle" class="subtitle" value="${book.subtitle}" >
<label>Autor(en)</label><div class="tag"><div><input name="authors" class="authors" value="${book.authors}" ><span class="check-button disabled"></span></div><div class="tags"></div></div>
<label>Teaser</label><textarea name="teaser" class="teaser" rows="3">${book.teaser}</textarea>
<label>Beschreibung</label><textarea name="description" class="description" rows="10">${book.description}</textarea>
</fieldset>
<fieldset class="info column"  disabled>
    <legend>Zusatzinfos</legend>
<label>Kategorien</label><div class="tag"><div><input name="categories" class="categories"><span class="check-button disabled"></span></div><div class="tags"></div></div>
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
    this.shadowRoot.append(content,style)
    this.form = this.shadowRoot.querySelector('form')
    this.form.oninput = this.enableSaveButton
    this.button = this.shadowRoot.querySelector("#updateBook")
    this.button.onclick = this.showEditButtons
    this.saveButton = this.shadowRoot.querySelector("#saveBook")
    this.saveButton.onclick = this.saveBook
    this.searchButton = this.shadowRoot.querySelector("#searchBook")
    this.searchButton.onclick = this.activateGSearch
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
  activateGSearch () {
    const searchButton = document.querySelector('.navbar boox-button')
    searchButton.setAttribute('icon','google')
    searchButton.blink()
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
    if(form.intersectionRatio > .1) buttonGroupClasses.replace('not-visible','pop-up')
    else if (!form.intersectionRatio <= .1) buttonGroupClasses.replace('pop-up','not-visible')
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
    if (this.classList.contains('disabled') && !self.shadowRoot.querySelector('fieldset:disabled')) return 
    const input = this.previousElementSibling
    const container = this.parentNode.nextElementSibling
    container.querySelector('span')?.remove()
    const text = typeof val === 'string' ? val : input.value
    input.value = ''
    this.classList.replace('enabled','disabled')
    container.insertAdjacentHTML('beforeend',`<div class="cancel-button not-visible">${text}</div>`)
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
          this.nextElementSibling.classList.replace('disabled', 'enabled');
        });
        button.addEventListener('click',this.popUp)
      } 
    });
    ['industryIdentifiers','creators','identifiers','titles'].forEach(name => {
      const fset = this.shadowRoot.querySelector(`fieldset[name=${name}]`)
      if (fset) {
        const cancelButtons = fset.querySelectorAll('.cancel-button')
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
      suggest.call(this,this.parentNode,cats,term)
    })
  }
}

customElements.define('boox-form',BooxForm)

/* helper für details form view */
const objFields = ['categories','authors','Person(en)','Sachgruppe(n)','Schlagwörter','Sprache(n)'];

const isEqual = (o,p) => typeof o === 'object' ? JSON.stringify(p) === JSON.stringify(o) : o == p

const insertDataset = (name,...params) => name == 'industryIdentifiers' ? `<div class="dataset"><input value="${params[0]??''}"><input value="${params[1]??''}"><span class="cancel-button"></span></div>` : `<div class="dataset"><input value="${params[0]??''}"><input  value="${params[1]??''}"><input value="${params[2]??''}"><span class="cancel-button"></span></div>`

const getDataset = (dataElement,name) => {
  const dataset = []
  for(const inp of dataElement.querySelectorAll('input')) {
    dataset.push(inp.value)
  }
  if (name === 'industryIdentifiers') {
    return {type:dataset[0],identifier:dataset[1]}
  }
  return dataset
}

const insertObject = list => {
  let html = list.map( ds => insertDataset('',...ds)).join('')
  html += `<div class="add-identifier"></div>`
  return html
}

const insertIdentifiersObject = list => {
  let html = list.map(({type,identifier}) => insertDataset('industryIdentifiers',type,identifier)).join('')
  html += `<div class="add-identifier"></div>`
  return html
}

/* helper für suggest */
suggest = function(mtPoint, suggestions, term) {
    mtPoint.nextElementSibling.querySelector('span.options')?.remove()
    if (term.length < 3) return
    let html = '<span class="options"><div>'
    html += suggestions.filter(t => t.toLowerCase().includes(term.toLowerCase())).map(t => `<p>${t}</p>`).join('')
    html +="</div></span>"
    mtPoint.nextElementSibling.insertAdjacentHTML('beforeend',html)
    const inp = this
    mtPoint.nextElementSibling.querySelectorAll('p').forEach(p =>p.addEventListener('click',function(){
      inp.value = this.textContent.trim()
      mtPoint.nextElementSibling.querySelector('span.options').remove()
      mtPoint.getRootNode().host.popUp.call(inp.nextElementSibling)
    }))
  }
