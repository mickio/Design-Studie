const apiKey=''
const anchor = document.getElementById('main')
const cats = ["Antiquit&auml;ten & Sammlerst&uuml;cke","Architektur","Belletristik","Bibel","Bildung","Biographie & Autobiographie","Business & Wirtschaft","Comics & Graphic Novels","Computer","Darstellende K&uuml;nste","Design","Drama","Familie & Beziehungen","Fremdsprachenstudium","Garten","Geschichte","Gesundheit & Fitness","Handwerk & Hobby","Haus & Heim","Haustiere","Humor","Jugendliteratur","Kinderb&uuml;cher","Kochen","Kunst","K&ouml;rper, Geist und Seele","Literaturkritik","Literatursammlungen","Lyrik","Mathematik","Medizin","Musik","Nachschlagewerke","Natur","Naturwissenschaften","Philosophie","Photographie","Politikwissenschaft","Psychologie","Recht","Reisen","Religion","Sachbucher f&uuml;r Kinder","Sachb&uuml;cher f&uuml;r junge Erwachsene","Selbsthilfe","Sozialwissenschaften","Spiel & Freizeit","Sport & Freizeit","Sprachwissenschaften","Studium","Technik & Ingenieurwesen","True Crime","Verkehr"]

const _ = el => document.querySelector(el)
const __ = el => document.querySelectorAll(el)
const div = html => {
  const d = document.createElement('div')
  d.insertAdjacentHTML('afterbegin',html)
  d.style.setProperty('background-color','white')
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
  const tpl = await pg(...params) 
  const page = div(tpl)
  const prevPage = anchor.firstElementChild
  page.classList.add(transition+"-enter-start")
  prevPage.classList.add(transition+"-leave-start")
  anchor.appendChild(page)
  await nextFrame()
  page.classList.replace(transition+"-enter-start",transition+"-enter-end")
  prevPage.classList.replace(transition+"-leave-start",transition+"-leave-end")
  anchor.addEventListener('transitionend',()=>{
      anchor.lastElementChild.classList.remove(transition+'-enter-end')
      console.log("removed all transition classes")
      anchor.firstElementChild.remove()
    },{once:true} )
}

const home = async () =>  {
    bookManager.onFetchRandomSampleOnce = randomSample => {
      let html = `<div onclick="bookManager.fetchRandomSample().then(()=>goto(home,'zoom'))" class="button right bottom"><span class="icon">refresh</span></div>`
      html += randomSample.map( cat => {
      let category = `<div><h1>${cat.category}</h1><div class="slider">`
      category+=cat.books.map( bk => bk.imageLinks?.thumbnail ? `<a href="javascript:goto(details,'enlarge','${bk.bookId}','${cat.books.map(o=> o.bookId)}')"><img src="${bk.imageLinks.thumbnail}"></a>` : `<a href="javascript:goto(details,'zoom','${bk.bookId}','${cat.books.map(o=> o.bookId)}')"><div class="card-content"><p class="header">${bk.title}</p><p class="authors">${bk.authors}</p></div></a>`).join('')
    category+=`<div class="card-content"><a href="javascript:goto(categories,'slide','${cat.category}')"><p style="font-size:48pt" class="icon">more_horiz</p></a></div>`
    category+="</div></div>"
    return category
    }).join('')
    console.log('appending random sample')
    setTimeout(() => {
      _('#main > div').replaceWith(div(html))
      __('div.slider > div:last-of-type').forEach(el => el.addEventListener('click',function({target}) {
        this.querySelector('p').remove()
        this.classList.add('uploading')
      }))
    }, 500 )
  }
  return '<div style="height:100%;display:flex;align-items:center;justify-content:center;"><img src="preparing.gif"></div>'
}

function scrollToTab(ind) {
  const scroller = _('div.card-content')
  const scrollStop = - ind * scroller.clientWidth // Minus wg scroll Balken oben...
  scroller.scrollTo({left:scrollStop,behavior:'smooth'})
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
        _('.spacer').classList.replace('invisible','visible')
        _('.card-image').classList.replace('visible','invisible')
        self.scrollTo({top:self.scrollTopMax,behavior: 'smooth'})
      } else if (!isScrollingUp && !invisible) {
        invisible = true
        showArrows()
        _('.spacer').classList.replace('visible','invisible')
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

const setUpdateBook = (bookId) => {
  const button = _('#updateBook')
  button.classList.add('active')
  button.onclick = () => updateBook(bookId)
}

async function updateBook(bookId) {
  const book = {}
  const form = _('form')
  const button = _('#updateBook')
  button.firstElementChild.remove()
  button.classList.add('uploading')
  const formData = new FormData(form)
  for(entry of formData.entries()) {
    if (entry[1]) book[entry[0]] = entry[1]
  }
  // bookManager.updateBook(bookId,book)
  setTimeout(() => setEdit(bookId),1000).then( () => button.classList.remove('active'))
}

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

const createListPage = books => books.map( book => `<div class="card-entry">
  <div><a href="javascript:goto(details,'zoom','${book.bookId}','${books.map(bk=>bk.bookId)}')">
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

const listWrapper = (noi,title,str) => `<div style="text-align:center"><h2 class="${getColor()}">${title}</h2><p style="font-size:small">${noi} Ergebnisse gefunden</p></div>${str}`

const panelOne = book => `<div class="panel"><p class="title">${book.title}</p><p class="subtitle">${book.subtitle}</p><p class="authors">${book.authors}</p><p class="description">${book.description}</p></div>`

const panelTwo = (bookId,book) => `<div class="panel">
<button id="updateBook" class="button right action" style="position: fixed;" onclick="editBook('${bookId}')"><span class="icon">edit</span> </button>
<form oninput="setUpdateBook('${bookId}')">
<fieldset class="content column" disabled>
<label>Titel</label><input name="title" class="title" value="${book.title}" >
<label>Untertitel</label><input name="subtitle" class="subtitle" value="${book.subtitle}" >
<label>Autor(en)</label><input name="authors" class="authors" value="${book.authors}" >
<label>Teaser</label><textarea name="teaser" class="teaser" value="${book.teaser}" rows="3"></textarea>
<label>Beschreibung</label><textarea name="description" class="description" value="${book.description}" rows="10"></textarea>
</fieldset>
<fieldset class="info column"  disabled>
    <legend>Zusatzinfos</legend>
<label>Kategorien</label><input name="categories" class="categories" value="${book.categories}" list="categories">
<label>Verlag</label><input name="publisher" class="entry" value="${book.publisher}" >
<label>Ver&ouml;ffentlichungsdatum</label><input name="publishedDate" class="entry" value="${book.publishedDate}" >
<label>Anzahl Seiten</label><input name="pageCount" class="entry" value="${book.pageCount}" >
<label>ISBN</label><input name="isbn" class="entry" value="${book.isbn}" >
<label>industryIdentifiers</label><input name="industryIdentifiers" class="entry" value="${book['industryIdentifiers']}" >
<label>Art des Inhalts</label><input name="Art des Inhalts" class="entry" value="${book['Art des Inhalts']}" >
<label>EAN</label><input name="EAN" class="entry" value="${book['EAN']}" >
<label>Literarische Gattung</label><input name="Literarische Gattung" class="entry" value="${book['Literarische Gattung']}" >
<label>Organisation(en)</label><input name="Organisation(en)" class="entry" value="${book['Organisation(en)']}" >
<label>Person(en)</label><input name="Person(en)" class="entry" value="${book['Person(en)']}" >
<label>Sachgruppe(n)</label><input name="Sachgruppe(n)" class="entry" value="${book['Sachgruppe(n)']}" >
<label>Schlagwörter</label><input name="Schlagwörter" class="entry" value="${book['Schlagwörter']}" >
<label>Sprache(n)</label><input name="Sprache(n)" class="entry" value="${book['Sprache(n)']}" >
<label>Titel</label><input name="Titel" class="entry" value="${book['Titel']}" >
<label>Verlag</label><input name="Verlag" class="entry" value="${book['Verlag']}" >
<label>Zeitliche Einordnung</label><input name="Zeitliche Einordnung" class="entry" value="${book['Zeitliche Einordnung']}" >
<label>Zielgruppe</label><input name="Zielgruppe" class="entry" value="${book['Zielgruppe']}" >
<label>creators</label><input name="creators" class="entry" value="${book['creators']}" >
<label>identifiers</label><input name="identifiers" class="entry" value="${book['identifiers']}" >
<label>titles</label><input name="titles" class="entry" value="${book['titles']}" >
</fieldset>
<fieldset class="info column" disabled>
    <legend>Image URLs</legend>
    <div>
        <img class="thumbnail" src="${book.thumbnail}">
        <div class="column">
<label>Thumbnail Image</label><input name="Thumbnail Image" class="entry" value="${book.thumbnail}" >
        </div>
    </div>
    <div>
        <img class="image" src="${book.image}">
        <div class="column">
<label>Cover Image</label><input name="Cover Image" class="entry" value="${book.image}" >
        </div>
    </div>
</fieldset>
</form>
</div>
<div id="related" class="column"></div>`

const details = async (bookId,books) => {
  books = books.split(/\s*,\s*/)
  setTimeout( () => {
  bookManager.fetchBook(bookId)
  .then(book => {
    _('div.card-content.tabs').insertAdjacentHTML('afterbegin',panelOne(book))
    _('div.card-content.tabs').insertAdjacentHTML('beforeend',panelTwo(bookId,book))
    bookManager.search(book.authors)
      .then(bx => _('#related').insertAdjacentHTML('afterbegin',createListPage(bx.result)))
  })
  },500)
  const pos = books.findIndex(bid => bid == bookId)
  const nextBookId = books[pos+1]
  const previousBookId = books[pos-1]
  const img = new Image()
  img.src = book.image
  img.addEventListener('load',() => _('div.card-image > img').replaceWith(img))
  return `<div class="card" onscroll="onScrollCard()">
  <div class="card-image visible">
      <img src="${book.imageLinks.thumbnail}">
  </div>
  <div class="spacer invisible">
      <h1>Metadaten</h1>
      <div>
          <span onclick="scrollToTab(0)">Übersicht</span>
          <span onclick="scrollToTab(1)">Bearbeiten</span>
          <span onclick="scrollToTab(2)">Ähnliches</span>
      </div>
  </div>
  <div class="card-content tabs">

  </div>
  
  <div onclick="goto(home,'zoom')" class="button "><span class="icon">north</span></div>
  ${previousBookId ? '<div onclick="goto(details,\'slide-right\',\''+previousBookId+'\',\''+books+'\')" class="button v-centered ease-enter-end" ><span class="icon">arrow_back_ios</span></div>' : ''}
  ${nextBookId ? '<div onclick="goto(details,\'slide-left\',\''+nextBookId+'\',\''+books+'\')" class="button right v-centered ease-enter-end" ><span class="icon">arrow_forward_ios</span></div>' : ''}
</div>
`
} 

const categories = async cat => {
  const r = await bookManager.search(cat)
  return listWrapper(r.numberOfItems,cat,createListPage(r.result))
}

const search = async () => {
  const term = _('.navbar input').value
  const button = _('.navbar a')
  button.classList.add('uploading')
  button.text = ''
  const r = await bookManager.search(term)
  await new Promise(resolve => setTimeout(resolve,1000))
  button.classList.remove('uploading')
  button.text = "search"
  _('.navbar input').value = ""
  return listWrapper(r.numberOfItems,term,createListPage(r.result))
}

const image = () => '<div style="background-color:var(--milka);height: 100%;display:flex;align-items:center;justify-content:center;font-size: 72px; color: var(--orange)"><p>Details</p></div>'

function nextFrame() {
	let count = 5
	return new Promise(resolve => {
		const step = () => {
			count-=1
			if(count) requestAnimationFrame(step)
			else requestAnimationFrame(resolve)
		}
		console.log('stepping...')
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
    console.debug(`[Transition][setBoundingBox] Set coordinates ${box.x}, ${box.y}, ${box.width}, ${box.height} for zoom transitions and ${posX} resp. ${posY}`)
}

anchor.addEventListener("click",setBoundingBox)

const popUp = async () => {
  const text = _('.tag > div > input').value
  _('.tag > div > input').value = ''
  _('.tag > div > input ~ a').classList.replace('visible','invisible')
  _('#tags').insertAdjacentHTML('beforeend',`<div class="not-visible">${text}</div>`)
  const tag =_('#tags > div:last-of-type')
  tag.addEventListener('click',delcat)
  await nextFrame()
  tag.classList.replace('not-visible','pop-up')
}
  
function delcat (){
  this.classList.replace('pop-up','not-visible')
  setTimeout(() =>this.remove(),300)
}

const inp = _('.tag > div > input')

inp?.addEventListener('input', function () {
  this.nextElementSibling.classList.replace('invisible','visible')
})

goto(home,'slide')