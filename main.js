const apiKey=''
const anchor = document.getElementById('main')
const currentPage = () => document.getElementById('main').lastElementChild
const cats = ["Antiquit&auml;ten & Sammlerst&uuml;cke","Architektur","Belletristik","Bibel","Bildung","Biographie & Autobiographie","Business & Wirtschaft","Comics & Graphic Novels","Computer","Darstellende K&uuml;nste","Design","Drama","Familie & Beziehungen","Fremdsprachenstudium","Garten","Geschichte","Gesundheit & Fitness","Handwerk & Hobby","Haus & Heim","Haustiere","Humor","Jugendliteratur","Kinderb&uuml;cher","Kochen","Kunst","K&ouml;rper, Geist und Seele","Literaturkritik","Literatursammlungen","Lyrik","Mathematik","Medizin","Musik","Nachschlagewerke","Natur","Naturwissenschaften","Philosophie","Photographie","Politikwissenschaft","Psychologie","Recht","Reisen","Religion","Sachbucher f&uuml;r Kinder","Sachb&uuml;cher f&uuml;r junge Erwachsene","Selbsthilfe","Sozialwissenschaften","Spiel & Freizeit","Sport & Freizeit","Sprachwissenschaften","Studium","Technik & Ingenieurwesen","True Crime","Verkehr"]

const _ = el => currentPage().querySelector(el)
const __ = el => currentPage().querySelectorAll(el)
const div = html => {
  const d = document.createElement('div')
  d.insertAdjacentHTML('afterbegin',html)
  // d.style.setProperty('background-color','white')
  return d
}

class Observer {
  
  constructor(){
    this.watchers = []
    this.watchersOnce = []
    this.current = [undefined,undefined]
    this.register = this.register.bind(this)
    this.notify = this.notify.bind(this)
  }
  
  register(callback,once) {
    if (!once) {
      this.watchers.push(callback)
    }
    const [ov,nv] = this.current
    if (nv) {
      callback(nv,ov)
      return
    } else if (once) {
      this.watchersOnce.push(callback)
    }
  }
  
  notify(nv) {
    this.current.shift()
    this.current.push(nv)
    let ov
    [ov,nv] = this.current
    this.watchers.forEach(callback => callback(nv,ov))
    this.watchersOnce.forEach(callback => callback(nv,ov))
    this.watchersOnce = []
  }
}

class BookManager {
  
  get selectedBook(){
    return this._selectedBook
  }
  
  set onFetchRandomSample(callback) {
    this._observerRandomSample.register(callback)
  }
  
  set onFetchRandomSampleOnce(callback) {
    this._observerRandomSample.register(callback,'once')
  }
  /*
  constructor(apiKey){
    this.app = new Realm.App({ id: 'boox-urcjb' })
    this._observerRandomSample = new Observer()
    this.loginApiKey(apiKey)
    .then(usr => {
      this.user = usr;
      console.log("Successfully logged in!", usr);
    }).then(this.fetchRandomSample) 
  }
  */
  constructor() {
    this._observerRandomSample = new Observer()
  	this.user = {functions:{
  	  randomSample: async _ => {return {items: sample_raw.map(cat => {return {
  		    _id:[cat.category],
  		    boox:cat.boox.map(bk => {
      			const x = bk._id.toHexString
      			bk._id.toHexString = _ => x
      			return bk
    		  })
      	}})
  	  }},
    	getBook: async _ => book,
    	search: async t => {return {numberOfItems: search_data.numberOfItems,result:search_data.result.map(bk=>{
    	  return {
    	    title:bk.title,
    	    subtitle:bk.subtitle,
    	    teaser:bk.teaser,
    	    authors:bk.authors,
    	    imageLinks:bk.imageLinks,
    	    _id: {toHexString: ()=> Math.floor(1000000 * Math.random())}
    	  }
    	  
    	})}}
    }}
    this.fetchRandomSample()
  }

  fetchRandomSample = async () => {
    this.user.functions.randomSample().then(r => {
      this.randomSample = r.items.map(cat => { return {
        category: cat._id,
        books: cat.boox.map(bk => { return {
          bookId:bk._id.toHexString(),
          title: bk.title,
          authors: bk.authors,
          imageLinks: bk.imageLinks
        }})
      }})
    }).then(() => this._observerRandomSample.notify(this.randomSample))
  }
  
  fetchBook = async bookId => this.user.functions.getBook(bookId)
  .then( bk => {
    if (typeof book['Sachgruppe(n)'] === "string" ) book['Sachgruppe(n)'] = book['Sachgruppe(n)'].split(/\s*;\s*/)
    if (typeof book['Schlagwörter'] === "string" ) book['Schlagwörter'] = book['Schlagwörter'].split(/\s*;\s*/)
    if (typeof book['Sprache(n)'] === "string" ) book['Sprache(n)'] = book['Sprache(n)'].split(', ')
    this._selectedBook = bk
    return bk
  })
  
  search = async term => this.user.functions.search(term).then(r=>{return {numberOfItems:r.numberOfItems,result: r.result.map(bk=>{return{
    bookId:bk._id.toHexString(),
    title: bk.title,
    subtitle:bk.subtitle,
    teaser:bk.teaser,
    authors: bk.authors,
    imageLinks: bk.imageLinks
  }})}})

  updateBook = async (bookId,book) => this.user.functions.updateBook(bookId,book)
  
  async loginApiKey(apiKey) {
    // Create an API Key credential
    const credentials = Realm.Credentials.apiKey(apiKey);
      try {
        // Authenticate the user
        const user = await this.app.logIn(credentials);
        // `App.currentUser` updates to match the logged in user
        console.assert(user.id === this.app.currentUser.id);
        return user;
    } catch (err) {
      console.error("Failed to log in", err);
    }
  }
  
}

const bookManager = new BookManager(apiKey)

const goto = async (pg,transition,...params) => { 
  await new Promise(x => setTimeout(x,500))
  let leaveMethod,enterMethod,beforeTransition,afterTransition;
  if (typeof transition === 'object') {
    ({transition,leaveMethod,enterMethod,beforeTransition,afterTransition} = transition)
  }
  if (typeof beforeTransition === 'function') await beforeTransition()
  let page
  const prevPage = anchor.lastElementChild
  if (typeof enterMethod === 'function') {
    page = await enterMethod()
  } else {
    const tpl = await pg(...params) 
    page = div(tpl)
    anchor.appendChild(page)
  }
  page.classList.add(transition+"-enter-start")
  prevPage.classList.add(transition+"-leave-start")
  await nextFrame()
  page.classList.replace(transition+"-enter-start",transition+"-enter-end")
  prevPage.classList.replace(transition+"-leave-start",transition+"-leave-end")
  await new Promise ( resolve => anchor.addEventListener('transitionend',()=>{
      page.classList.remove(transition+'-enter-end')
      prevPage.classList.remove(transition+'-leave-end')
      console.log("removed all transition classes")
      if (typeof leaveMethod === 'function') leaveMethod(prevPage)
      else prevPage.remove()
      resolve()
    },{once:true} ))
  if (typeof afterTransition === 'function') await afterTransition()
}

const gotoDetails = async (transition,...params) => {
  transitionObj = {
    transition: transition,
    leaveMethod: prevPage => prevPage.style.setProperty('display','none')
  }
  await switchToDetails(transitionObj,...params)
}

const switchToDetails = async (transition,...params) => {
  goto(details,transition,...params)
  .then(() => {
    currentPage().style.setProperty('background-color','var(--brown)')
    _('#back').addEventListener('click',function() {
      const icon = this.firstElementChild
      icon.remove()
      this.classList.add('uploading')
      goback('flyaway').then(() => {
        this.classList.remove('uploading')
        this.append(icon)
      })
    })
})}

const refreshSample = () => {
  bookManager.fetchRandomSample().then(()=>gotoHome('zoom'))
  _('div.button.right.bottom span').remove()
  _('div.button.right.bottom').classList.add('uploading')
}

const goback = async (transition,...params) => {
  const transitionObj = {
    transition: transition,
    enterMethod: () => new Promise ( resolve => {
      const page = anchor.lastElementChild.previousElementSibling
      page.style.removeProperty('display')
      //anchor.append(page)
      resolve(page)
    })
  }
  await goto('',transitionObj,...params)
}

const gotoHome = async transition =>  {
  await goto(home,transition)
  __('div.slider > div:last-of-type').forEach(el => el.addEventListener('click', function({ target }) {
      const icon = this.firstElementChild
      icon.remove()
      this.classList.add('uploading')
      gotoCategories('zoom',this.dataset.category).then(() => {
        this.classList.remove('uploading')
        this.append(icon)
      })
  }))
}

const gotoCategories = async (transition,cat) => {
  transitionObj = {
    transition: transition,
    leaveMethod: prevPage => prevPage.style.setProperty('display','none')
  }
  await goto(categories,transitionObj,cat)
  currentPage().style.setProperty('background-color','white')

}

const gotoSearch = async (transition,term) => {
  transitionObj = {
    transition: transition,
    leaveMethod: prevPage => prevPage.style.setProperty('display','none')
  }
  await goto(search,transitionObj,term)  
  currentPage().style.setProperty('background-color','white')
}

const home = async () =>  new Promise(resolve => {
  currentList = home
  bookManager.onFetchRandomSampleOnce = randomSample => {
      let html = `<div onclick="refreshSample()" class="button right bottom"><span class="icon">refresh</span></div>`
      html += randomSample.map( cat => {
      let category = `<div><h1>${cat.category}</h1><div class="slider">`
      category+=cat.books.map( bk => bk.imageLinks?.thumbnail ? `<a href="javascript:gotoDetails('enlarge','${bk.bookId}','${cat.books.map(o=> o.bookId)}')"><img width="128px" src="${bk.imageLinks.thumbnail}"></a>` : `<a href="javascript:gotoDetails('enlarge','${bk.bookId}','${cat.books.map(o=> o.bookId)}')"><div class="card-content"><p class="header">${bk.title}</p><p class="authors">${bk.authors}</p></div></a>`).join('')
    category+=`<div class="card-content" data-category="${cat.category}"><p style="font-size:48pt" class="icon">more_horiz</p></div>`
    category+="</div></div>"
    return category
    }).join('')
    resolve(html)
  }})

/* die details Ansicht... */
function scrollToTab(ind) {
  const scroller = _('div.card-content')
  const scrollerTitleBar = _('div.spacer div')
  const scrollStop = ind * scroller.clientWidth // Minus wg scroll Balken oben...
  scroller.scrollTo({left:scrollStop,behavior:'smooth'})
  for ( tab of scrollerTitleBar.children) tab.classList.remove('active-tab')
  scrollerTitleBar.children[ind].classList.add('active-tab')
  if (ind == 1) scroller.children[1].firstElementChild.classList.remove('hidden')
  else scroller.children[1].firstElementChild.classList.add('hidden')
}

function scroller() {
  let lastScrollPosY = 0
  let invisible = true
  let wait = false
  return () => {
    if (wait) return 
    const self = _('.card')
    const isScrollingUp = self.scrollTop - lastScrollPosY > 0
    const showArrows = () => {
      const arrows = __('.v-centered.ease-enter-end')
      for (arrow of arrows) { 
        arrow.classList.replace('ease-enter-end','ease-enter-start') 
      };
      setTimeout(() => { 
        for (arrow of arrows) { 
          arrow.classList.replace('ease-enter-start','ease-enter-end') 
        }},1000) 
    }
    if (isScrollingUp && invisible) {
        invisible = false
        showArrows()
        _('.spacer h1').classList.replace('invisible','visible')
        _('.spacer div').classList.replace('white','black')
        _('.card-image').classList.replace('visible','invisible')
        self.scrollTo({top:self.scrollTopMax,behavior: 'smooth'})
      } else if (!isScrollingUp && !invisible) {
        invisible = true
        showArrows()
        _('.spacer h1').classList.replace('visible','invisible')
        _('.spacer div').classList.replace('black','white')
        _('.card-image').classList.replace('invisible','visible')
        self.scrollTo({top:0,behavior: 'smooth'})
    }
    wait = true
    setTimeout(() => wait = false,100)
    lastScrollPosY = self.scrollTop
  }
}
const onScrollCard = scroller()

const editBook = (bookId) => {
  const button = _("#updateBook")
  button.firstElementChild.remove()
  button.insertAdjacentHTML('afterbegin','<span class="icon">save</span>')
  __('fieldset').forEach( fset => fset.removeAttribute('disabled',''))
  button.onclick = () => setEdit(bookId)
}

const setEdit = (bookId) => {
  const button = _('#updateBook')
  button.firstElementChild?.remove()
  button.classList.remove('uploading')
  button.classList.remove('active')
  button.insertAdjacentHTML('afterbegin','<span class="icon">edit</span>')
  __('fieldset').forEach( fset => fset.setAttribute('disabled',''))
  button.onclick = () => editBook(bookId)
}

const setUpdateBook = () => {
  const button = _('#updateBook')
  button.classList.add('active')
  button.onclick = () => updateBook(bookManager.selectedBook.bookId)
}

async function updateBook(bookId) {
  const book = {}
  const oBook = bookManager.selectedBook
  const form = _('form')
  const button = _('#updateBook')
  button.firstElementChild?.remove()
  button.classList.add('uploading')
  const formData = new FormData(form)
  for(entry of formData.entries()) {
    if (['categories','authors','Person(en)','Sachgruppe(n)','Schlagwörter','Sprache(n)'].includes(entry[0])) {
        const elems = _(`input[name^=${entry[0].slice(0,6)}]`).parentNode.nextElementSibling.children
        const a = []
        for(const el of elems) {
          a.push(el.textContent.trim())    
        }
        if (elems.length && !isEqual(oBook[entry[0]],a)) {
          book[entry[0]] = a
        }
    }
    else if (entry[1] && oBook[entry[0]] != entry[1]) book[entry[0]] = entry[1]
  };
  ['industryIdentifiers','creators','identifiers','titles'].forEach(name => {
    const a = []
    const elems = __(`fieldset[name=${name}] div.dataset`)
    for (const el of elems) {
      a.push(getDataset(el,name))
    }
    if(elems.length && !isEqual(oBook[name],a))  book[name] = a
  })
  console.log('update book',book)
  // bookManager.updateBook(bookId,book)
  setTimeout(() => setEdit(bookId),1000)
}

const isEqual = (o,p) => typeof o === 'object' ? JSON.stringify(p) === JSON.stringify(o) : o == p

const chooseColor = () => {
  let prevColor,color
  return () => {
    color = ['color-blue','color-green','color-orange','color-brown'][Math.floor(4*Math.random())]
    while (color === prevColor) {
      color = ['color-blue','color-green','color-orange','color-brown'][Math.floor(4*Math.random())]
    }
    prevColor = color
    return color
  }
}
const getColor = chooseColor()

const insertDataset = (name,...params) => name == 'industryIdentifiers' ? `<div class="dataset"><input value="${params[0]??''}"><input value="${params[1]??''}"><span class="icon">cancel</span></div>` : `<div class="dataset"><input value="${params[0]??''}"><input  value="${params[1]??''}"><input value="${params[2]??''}"><span class="icon">cancel</span></div>`

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
  html += `<div><span class="icon">add</span></div>`
  return html
}

const insertIdentifiersObject = list => {
  let html = list.map(({type,identifier}) => insertDataset('industryIdentifiers',type,identifier)).join('')
  html += `<div><span class="icon">add</span></div>`
  return html
}

const createListPage = books => books.map( book => `<div class="card-entry">
  <div><a href="javascript:gotoDetails('enlarge','${book.bookId}','${books.map(bk=>bk.bookId)}')">
    <img src="${book.imageLinks.thumbnail}">
    </a>
  </div>
  <div>
    <p class="title ${getColor()}">${book.title} </p>
    <p class="subtitle">${book.subtitle} </p>
    <p class="authors">${book.authors} </p>
    <p class="teaser">${book.teaser}</p>
  </div>
</div>
`).join('')

const listWrapper = (noi,title,str) => `<div class="button" onclick="goback('zoom')"><span class="icon">west</span></div>
<div style="text-align:center"><h2 class="${getColor()}">${title}</h2><p style="font-size:small">${noi} Ergebnisse gefunden</p></div>${str}`

const panelOne = book => `<div class="panel"><p class="title">${book.title}</p><p class="subtitle">${book.subtitle}</p><p class="authors">${book.authors}</p><p class="description">${book.description}</p></div>`

const panelTwo = (bookId,book) => `<div class="panel">
<button id="updateBook" class="button right bottom action hidden" style="position: fixed;" onclick="editBook('${bookId}')"><span class="icon">edit</span> </button>
<form oninput="setUpdateBook()">
<fieldset class="content column" disabled>
<label>Titel</label><input name="title" class="title" value="${book.title}" >
<label>Untertitel</label><input name="subtitle" class="subtitle" value="${book.subtitle}" >
<label>Autor(en)</label><div class="tag"><div><input name="authors" class="authors" value="${book.authors}" ><span class="icon invisible">check</span></div><div class="tags"></div></div>
<label>Teaser</label><textarea name="teaser" class="teaser" rows="3">${book.teaser}</textarea>
<label>Beschreibung</label><textarea name="description" class="description" rows="10">${book.description}</textarea>
</fieldset>
<fieldset class="info column"  disabled>
    <legend>Zusatzinfos</legend>
<label>Kategorien</label><div class="tag"><div><input name="categories" class="categories"><span class="icon invisible">check</span></div><div class="tags"></div></div>
<label>Verlag</label><input name="publisher" class="entry" value="${book.publisher}" >
<label>Ver&ouml;ffentlichungsdatum</label><input name="publishedDate" class="entry" value="${book.publishedDate}" >
<label>Anzahl Seiten</label><input name="pageCount" class="entry" value="${book.pageCount}" >
<label>ISBN</label><input name="isbn" class="entry" value="${book.isbn}" >
<fieldset class="info group" name="industryIdentifiers"><legend>Identifiers aus Google search books</legend>${insertIdentifiersObject(book['industryIdentifiers'])}
</fieldset>
<label>Art des Inhalts</label><input name="Art des Inhalts" class="entry" value="${book['Art des Inhalts']}" >
<label>EAN</label><input name="EAN" class="entry" value="${book['EAN']}" >
<label>Literarische Gattung</label><input name="Literarische Gattung" class="entry" value="${book['Literarische Gattung']}" >
<label>Organisation(en)</label><input name="Organisation(en)" class="entry" value="${book['Organisation(en)']}" >
<label>Person(en)</label><div class="tag"><div><input name="Person(en)" class="entry" value="${book['Person(en)']}" ><span class="icon invisible">check</span></div><div class="tags"></div></div>
<label>Sachgruppe(n)</label><div class="tag"><div><input name="Sachgruppe(n)" class="entry" value="${book['Sachgruppe(n)']}" ><span class="icon invisible">check</span></div><div class="tags"></div></div>
<label>Schlagwörter</label><div class="tag"><div><input name="Schlagwörter" class="entry" value="${book['Schlagwörter']}" ><span class="icon invisible">check</span></div><div class="tags"></div></div>
<label>Sprache(n)</label><div class="tag"><div><input name="Sprache(n)" class="entry" value="${book['Sprache(n)']}" ><span class="icon invisible">check</span></div><div class="tags"></div></div>
<label>Titel</label><input name="Titel" class="entry" value="${book['Titel']}" >
<label>Verlag</label><input name="Verlag" class="entry" value="${book['Verlag']}" >
<label>Zeitliche Einordnung</label><input name="Zeitliche Einordnung" class="entry" value="${book['Zeitliche Einordnung']}" >
<label>Zielgruppe</label><input name="Zielgruppe" class="entry" value="${book['Zielgruppe']}" >
<fieldset class="info group" name="creators"><legend>Autoren aus ePub</legend>${insertObject(book['creators'])}
</fieldset>
<fieldset class="info group" name="identifiers"><legend>Identifiers aus ePub</legend>${insertObject(book['identifiers'])}
</fieldset>
<fieldset class="info group" name="titles"><legend>Titel aus ePub</legend>${insertObject(book['titles'])}
</fieldset>
</fieldset>
<fieldset class="info column" disabled>
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
</form>
</div>
<div id="related" class="column"></div>`

const details = async (bookId,books) => {
  books = books.split(/\s*,\s*/)
  setTimeout(() =>
  bookManager.fetchBook(bookId)
  .then(book => {
    _('div.card-content.tabs').insertAdjacentHTML('afterbegin',panelOne(book))
    _('div.card-content.tabs').insertAdjacentHTML('beforeend',panelTwo(bookId,book))
    bookManager.search(book.authors)
      .then(bx => _('#related').insertAdjacentHTML('afterbegin',createListPage(bx.result)))
    book.authors?.forEach(aut => {
      popUp.call(_('input[name=authors] ~ span'),aut)
    })
    book.categories?.forEach(cat => {
      popUp.call(_('input[name=categories] ~ span'),cat)
    });
    book['Person(en)']?.forEach(p => {
      popUp.call(_('input[name^=Person] ~ span'),p)
    });
    book['Sachgruppe(n)']?.forEach(p => {
      popUp.call(_('input[name^=Sachgruppe] ~ span'),p)
    });0
    book['Schlagwörter']?.forEach(p => {
      popUp.call(_('input[name=Schlagwörter] ~ span'),p)
    });
    book['Sprache(n)']?.forEach(p => {
      popUp.call(_('input[name^=Sprache] ~ span'), p)
    });
    const img = new Image()
    img.src = book.image
    img.addEventListener('load',() => _('div.card-image > img').replaceWith(img))
  }).then(() => {
    ['categories','authors','Person','Sachgruppe','Schlagw','Sprache'].forEach(name => {
        const input = _(`input[name^=${name}]`)
        const button = input.nextElementSibling
        input.addEventListener('input', function() {
          this.nextElementSibling.classList.replace('invisible', 'visible');
        });
        button.addEventListener('click',popUp)
    });
    ['industryIdentifiers','creators','identifiers','titles'].forEach(name => {
      const fset = _(`fieldset[name=${name}]`)
      const cancelButtons = fset.querySelectorAll('div input + span')
      const addButton = fset.lastElementChild.lastElementChild
      for( button of cancelButtons) {
        button.addEventListener('click',function(){
          this.parentNode.remove()
          setUpdateBook()
        })
      }
      addButton.addEventListener('click',function() {
        this.parentNode.insertAdjacentHTML('beforebegin',insertDataset(name))
        this.parentNode.previousElementSibling.lastElementChild.addEventListener('click',function(){
          this.parentNode.remove()
          setUpdateBook()
        })
      })
    })
    _('input[name=categories]').addEventListener('input',function(){

      const term = this.value
      suggest.call(this,this.parentNode,cats,term)
      })
    })
  ,3100)

  const pos = books.findIndex(bid => bid == bookId)
  const nextBookId = books[pos+1]
  const previousBookId = books[pos-1]
  return `<div class="card" onscroll="onScrollCard()">        
  <div class="card-image visible">
      <img src="${book.imageLinks.thumbnail}">
  </div>
  <div class="spacer">
      <h1 class="invisible">Metadaten</h1>
      <div class="white">
          <span onclick="scrollToTab(0)" class="active-tab">Übersicht</span>
          <span onclick="scrollToTab(1)">Bearbeiten</span>
          <span onclick="scrollToTab(2)">Ähnliches</span>
      </div>
  </div>
  <div class="card-content tabs">

  </div>
  
  <div id="back" class="button "><span class="icon">north</span></div>
  ${previousBookId ? '<div onclick="switchToDetails(\'slide-right\',\''+previousBookId+'\',\''+books+'\')" class="button v-centered ease-enter-end" ><span class="icon">arrow_back_ios</span></div>' : ''}
  ${nextBookId ? '<div onclick="switchToDetails(\'slide-left\',\''+nextBookId+'\',\''+books+'\')" class="button right v-centered ease-enter-end" ><span class="icon">arrow_forward_ios</span></div>' : ''}
</div>
`
} 

/* weitere Ansichten */
const categories = async cat => {
  const r = await bookManager.search(cat)
  return listWrapper(r.numberOfItems,cat,createListPage(r.result))
}

const search = async () => {
  const term = document.querySelector('.navbar input').value
  const button = document.querySelector('.navbar a')
  button.classList.add('uploading')
  button.text = ''
  const r = await bookManager.search(term)
  await new Promise(resolve => setTimeout(resolve,1000))
  button.classList.remove('uploading')
  button.text = "search"
  document.querySelector('.navbar input').value = ""
  return listWrapper(r.numberOfItems,term,createListPage(r.result))
}

const image = () => '<div style="background-color:var(--milka);height: 100%;display:flex;align-items:center;justify-content:center;font-size: 72px; color: var(--orange)"><p>Details</p></div>'

/* noch mehr helpers */
function nextFrame() {
	let count = 5
	return new Promise(resolve => {
		const step = () => {
			count-=1
			if(count) requestAnimationFrame(step)
			else requestAnimationFrame(resolve)
		}
		requestAnimationFrame(step);
	});
}

const setBoundingBox = clickEvent => {
    const box = clickEvent.target.getBoundingClientRect()
    const posX = 0 //clickEvent.target.parentNode.parentNode.scrollLeft
    const posY = 0 //_('#main > div').scrollTop
    const rootStyles = document.documentElement.style
    rootStyles.setProperty("--box-width",`${box.width}px`)
    rootStyles.setProperty("--box-height",`${box.height}px`)
    rootStyles.setProperty("--box-positionX",`${box.x}px`)
    rootStyles.setProperty("--box-positionY",`${box.y}px`)
    rootStyles.setProperty("--scrollX", `${posX}px`)
    rootStyles.setProperty("--scrollY", `${posY}px`)
    //console.debug(`[Transition][setBoundingBox] Set coordinates ${box.x}, ${box.y}, ${box.width}, ${box.height} for zoom transitions and ${posX} resp. ${posY}`)
}

anchor.addEventListener("click",setBoundingBox)

/* Helper für input */
const popUp = async function (val) {
  const input = this.previousElementSibling
  const container = this.parentNode.nextElementSibling
  const text = val ?? input.value
  input.value = ''
  this.classList.replace('visible','invisible')
  container.insertAdjacentHTML('beforeend',`<div class="not-visible">${text}</div>`)
  const tag = container.lastElementChild
  tag.addEventListener('click',function(){
    if (_('fieldset:disabled')) return 
    this.classList.replace('pop-up','not-visible')
    setTimeout(() =>this.remove(),300)
    setUpdateBook()
  })
  await nextFrame()
  tag.classList.replace('not-visible','pop-up')
}

/* helper für suggest */
const suggest = function(mtPoint, suggestions, term) {
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
    popUp.call(inp.nextElementSibling)
  }))
}

let currentList
gotoHome('enlarge')