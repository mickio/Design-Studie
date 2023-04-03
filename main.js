const apiKey=''
const anchor = document.getElementById('main')

const _ = el => document.querySelector(el)
const div = html => {
  const d = document.createElement('div')
  d.insertAdjacentHTML('afterbegin',html)
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
  
  set onFetchRandomSample(callback) {
    this._observerRandomSample.register(callback)
  }
  
  set onFetchRandomSampleOnce(callback) {
    this._observerRandomSample.register(callback,'once')
  }
  
  constructor(apiKey){
    this.app = new Realm.App({ id: 'boox-urcjb' })
    this._observerRandomSample = new Observer()
    this.loginApiKey(apiKey)
    .then(usr => {
      this.user = usr;
      console.log("Successfully logged in!", usr);
    }).then(this.fetchRandomSample) 
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
    }).then(_ => this._observerRandomSample.notify(this.randomSample))
  }
  
  fetchBook = async bookId => this.user.functions.getBook(bookId)
  
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

async function goto(pg,transition,...params) {
  const tpl = await pg(...params) 
  const page = div(tpl)
  page.classList.add(transition+"-start")
  anchor.appendChild(page)
  await nextFrame()
  page.classList.replace(transition+"-start",transition+"-end")
  anchor.addEventListener('transitionend',()=>{
    anchor.lastElementChild.classList.remove(transition+'-end')
    console.log("removed all transition classes")
    anchor.firstElementChild.remove()
    },{once:true} )
}

const home = async _ =>  {
  const sample = await new Promise( resolve => {
    bookManager.onFetchRandomSampleOnce = randomSample => resolve(randomSample) 
  }) 
  return sample.map( cat => {
    let category = `<div><h1>${cat.category}</h1><div class="slider">`
    category+=cat.books.map( bk => bk.imageLinks?.thumbnail ? `<a href="javascript:goto(details,'zoom','${bk.bookId}','${cat.books.map(o=> o.bookId)}')"><img src="${bk.imageLinks.thumbnail}"></a>` : `<a href="javascript:goto(details,'zoom','${bk.bookId}','${cat.books.map(o=> o.bookId)}')"><div class="card-content"><p class="header">${bk.title}</p><p class="authors">${bk.authors}</p></div></a>`).join('')
    category+="</div></div>"
    return category
    }).join('')
}

function scrollToTab(ind) {
  const scroller = _('div.card-content')
  const scrollStop = - ind * scroller.clientWidth // Minus wg scroll Balken oben...
  scroller.scrollTo({left:scrollStop,behavior:'smooth'})
}
function scroller() {
  let lastScrollPosY = 0
  let invisible = false
  return () => {
    const self = _('.card')
    const isScrollingUp = self.scrollTop - lastScrollPosY > 0
    if (isScrollingUp && invisible) {
        invisible = false
        _('.spacer').classList.replace('invisible','visible')
        _('.card-image').classList.replace('visible','invisible')
        self.scrollTo({top:self.scrollTopMax,behavior: 'smooth'})
      } else if (!isScrollingUp && !invisible) {
        invisible = true
        _('.spacer').classList.replace('visible','invisible')
        _('.card-image').classList.replace('invisible','visible')
        self.scrollTo({top:0,behavior: 'smooth'})
    }
    lastScrollPosY = self.scrollTop
  }
}
onScrollCard = scroller()

const details = async (bookId,books) => {
  books = books.split(/\s*,\s*/)
  const book = await bookManager.fetchBook(bookId)
  const pos = books.findIndex(bid => bid === bookId)
  const nextBookId = books[pos+1]
  const previousBookId = books[pos-1]
  const img = new Image()
  img.src = book.image
  img.addEventListener('load',_=> _('div.card-image > img').replaceWith(img))
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
      <div class="panel">
          <p class="title">${book.title}</p>
          <p class="subtitle">${book.subtitle}</p>
          <p class="authors">${book.authors}</p>
          <p class="description">${book.description}</p>
      </div>
      <div class="panel">
          <button #if="disabled" class="button right" style="position: fixed;" @click="edit"><span class="icon">edit</span> </button>
          <button #if="!disabled" :disabled="!editing" class="button right" style="position: fixed;" @click="save"><span class="icon">save</span> </button>
          <article class="content column">
              <label>Titel</label>
              <input :disabled  class="title" #formvalue="book.title">
              <label>Untertitel</label>
              <input :disabled  class="subtitle" #formvalue="book.subtitle">
              <label>Autor(en)</label>
              <input :disabled  class="authors" #formvalue="book.authors">
              <label>Teaser</label>
              <textarea :disabled class="teaser" #formvalue="book.textSnippet" rows="3"></textarea>
              <label>Beschreibung</label>
              <textarea :disabled class="description" #formvalue="book.description" rows="10"></textarea>
          </article>
          <fieldset class="info column">
              <legend>Zusatzinfos</legend>
              <label>Kategorien</label>
              <input :disabled  class="categories" #formvalue="book.categories" list="categories">
              <label>Verlag</label>
              <input :disabled  #formvalue="book.publisher">
              <label>Ver&ouml;ffentlichungsdatum</label>
              <input :disabled  #formvalue="book.publishedDate">
              <label>Anzahl Seiten</label>
              <input :disabled  #formvalue="book.pageCount">
              <label>ISBN</label>
              <input :disabled  #formvalue="book.isbn">
          </fieldset>
          <fieldset class="info column">
  <label>industryIdentifiers</label>
              <input :disabled  class="entry" #formvalue="book['industryIdentifiers']">
  <label>Art des Inhalts</label>
              <input :disabled  class="entry" #formvalue="book['Art des Inhalts']">
  <label>EAN</label>
              <input :disabled  class="entry" #formvalue="book['EAN']">
  <label>Literarische Gattung</label>
              <input :disabled  class="entry" #formvalue="book['Literarische Gattung']">
  <label>Organisation(en)</label>
              <input :disabled  class="entry" #formvalue="book['Organisation(en)']">
  <label>Person(en)</label>
              <input :disabled  class="entry" #formvalue="book['Person(en)']">
  <label>Sachgruppe(n)</label>
              <input :disabled  class="entry" #formvalue="book['Sachgruppe(n)']">
  <label>Schlagwörter</label>
              <input :disabled  class="entry" #formvalue="book['Schlagwörter']">
  <label>Sprache(n)</label>
              <input :disabled  class="entry" #formvalue="book['Sprache(n)']">
  <label>Titel</label>
              <input :disabled  class="entry" #formvalue="book['Titel']">
  <label>Verlag</label>
              <input :disabled  class="entry" #formvalue="book['Verlag']">
  <label>Zeitliche Einordnung</label>
              <input :disabled  class="entry" #formvalue="book['Zeitliche Einordnung']">
  <label>Zielgruppe</label>
              <input :disabled  class="entry" #formvalue="book['Zielgruppe']">
  <label>creators</label>
              <input :disabled  class="entry" #formvalue="book['creators']">
  <label>identifiers</label>
              <input :disabled  class="entry" #formvalue="book['identifiers']">
  <label>titles</label>
              <input :disabled  class="entry" #formvalue="book['titles']">
          </fieldset>
          <fieldset class="info column">
              <legend>Image URLs</legend>
              <div>
                  <img class="thumbnail" :src="book.thumbnail">
                  <div class="column">
                      <label>Thumbnail Image</label>
                      <input :disabled  #formvalue="book.thumbnail">
                  </div>
              </div>
              <div>
                  <img class="image" :src="book.image">
                  <div class="column">
                      <label>Cover Image</label>
                      <input :disabled  #formvalue="book.image">
                  </div>
              </div>
          </fieldset>
          <datalist id="categories">
              <option value="Antiquit&auml;ten & Sammlerst&uuml;cke">
              <option value="Architektur">
              <option value="Belletristik">
              <option value="Bibel">
              <option value="Bildung">
              <option value="Biographie & Autobiographie">
              <option value="Business & Wirtschaft">
              <option value="Comics & Graphic Novels">
              <option value="Computer">
              <option value="Darstellende K&uuml;nste">
              <option value="Design">
              <option value="Drama">
              <option value="Familie & Beziehungen">
              <option value="Fremdsprachenstudium">
              <option value="Garten">
              <option value="Geschichte">
              <option value="Gesundheit & Fitness">
              <option value="Handwerk & Hobby">
              <option value="Haus & Heim">
              <option value="Haustiere">
              <option value="Humor">
              <option value="Jugendliteratur">
              <option value="Kinderb&uuml;cher">
              <option value="Kochen">
              <option value="Kunst">
              <option value="K&ouml;rper, Geist und Seele">
              <option value="Literaturkritik">
              <option value="Literatursammlungen">
              <option value="Lyrik">
              <option value="Mathematik">
              <option value="Medizin">
              <option value="Musik">
              <option value="Nachschlagewerke">
              <option value="Natur">
              <option value="Naturwissenschaften">
              <option value="Philosophie">
              <option value="Photographie">
              <option value="Politikwissenschaft">
              <option value="Psychologie">
              <option value="Recht">
              <option value="Reisen">
              <option value="Religion">
              <option value="Sachbucher f&uuml;r Kinder">
              <option value="Sachb&uuml;cher f&uuml;r junge Erwachsene">
              <option value="Selbsthilfe">
              <option value="Sozialwissenschaften">
              <option value="Spiel & Freizeit">
              <option value="Sport & Freizeit">
              <option value="Sprachwissenschaften">
              <option value="Studium">
              <option value="Technik & Ingenieurwesen">
              <option value="True Crime">
              <option value="Verkehr">
          </datalist>
      </div>
      <div class="column">
          <div #foreach="book in boox">
              <div>
                  <img :src="book.imageLinks.thumbnail">
              </div>
              <div>
                  <p class="title">{{book.title}} </p>
                  <p class="subtitle">{{book.subtitle}} </p>
                  <p class="authors">{{book.authors}} </p>
                  <p #html="book.teaser" class="teaser"></p>
              </div>
          </div>
  
      </div>
  </div>
  
  <div onclick="goto(home,'zoom')" class="button "><span class="icon">north</span></div>
  ${previousBookId ? '<div onclick="goto(details,\'slide-left\',\''+previousBookId+'\',\''+books+'\')" class="button v-centered" ><span class="icon">arrow_back_ios</span></div>' : ''}
  ${nextBookId ? '<div onclick="goto(details,\'slide-right\',\''+nextBookId+'\',\''+books+'\')" class="button right v-centered" ><span class="icon">arrow_forward_ios</span></div>' : ''}
</div>
`
} 

const categories = params => '<div style="height:100%;display:flex;align-items:center;justify-content:center;font-size: 72px"><p>Kategorien</p></div>' 
const search = params => '<div style="height:100%;display:flex;align-items:center;justify-content:center;font-size: 72px"><p>Suche</p></div>' 

function nextFrame() {
	let count = 5
	return new Promise(resolve => {
		const step = _ => {
			count-=1
			if(count) requestAnimationFrame(step)
			else requestAnimationFrame(resolve)
		}
		console.log('stepping...')
		requestAnimationFrame(step);
	});
}

