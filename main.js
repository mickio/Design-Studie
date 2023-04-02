async function goto(pg,color,transition) {
  const anchor = document.getElementById('main')
  const tpl = `<div class="${color} ${transition}-start"><p>${pg}</p></div>`
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