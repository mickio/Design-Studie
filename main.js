const apiKey=''
const anchor = document.getElementById('main')

const _ = el => document.querySelector(el)

class Observer {
  watchers = []
  watchersOnce = []
  current = [undefined,undefined]
  
  constructor(){
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
  
  app = new Realm.App({ id: 'boox-urcjb' })
  _observerRandomSample = new Observer()
  
  set onFetchRandomSample(callback) {
    this._observerRandomSample.register(callback)
  }
  
  set onFetchRandomSampleOnce(callback) {
    this._observerRandomSample.register(callback,'once')
  }
  
  constructor(apiKey){
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

async function goto(pg,color,transition) {
  const tpl = pg === 'Home' ? home() : `<div class="${color} ${transition}-start"><p>${pg}</p></div>`
  //anchor.firstElementChild.remove()
  anchor.insertAdjacentHTML("beforeend",tpl)
  await nextFrame()
  anchor.lastElementChild.classList.replace(transition+"-start",transition+"-end")
  anchor.addEventListener('transitionend',()=>{
    anchor.lastElementChild.classList.remove(transition+'-end')
    console.log("removed all transition classes")
    anchor.firstElementChild.remove()
    },{once:true} )
}

const home = _ =>  {
  const sample = bookManager.randomSample
  let tplGallery = "<div>"
  tplGallery += sample.map( cat => {
    let category = `<div><h1>${cat.category}</h1><div class="slider">`
    category+=cat.books.map( bk => bk.imageLinks?.thumbnail ? `<a class="card" href="javascript:goto(cat.boox,bk)"><img src="${bk.imageLinks.thumbnail}"></div></a>` : `<a class="card" href="javascript:goto(cat.boox,bk)"><div class="card-content"><p class="header">${bk.title}</p><p class="authors">${bk.authors}</p></div></a>`).join('')
    category+="</div></div>"
    return category
    }).join('')
  tplGallery += "</div>"
  console.log(tplGallery)
  return tplGallery
}

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

