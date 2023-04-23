<div id="wizard" #transition:onaddbook="slide-right-enter" #transition:onbookuploaded="slide-right-leave,$detachHost">
	
	<button id="cancel" @click="leaveAddbook">&times;</button>
	
	<div id="select-ebook">

		<label id="select-file">
			
			<input type="file" #formvalue="fileObj">
			<span>E-Book ausw&auml;hlen...</span>

		</label>	

		<input #if="term" #formvalue="term" type="text" id="select-metadata">

		<div class="panel">

			<div :obj="book" class="item" #foreach="book in searchResult" @click="selectItem(book.id)">

				<img :src="book.thumbnail">
				<p class="categories">{{book.categories}}</p>
				<p><span class="title">{{book.title}}</span> <span class="subtitle">{{book.subtitle}}</span></p>
				<p class="authors">{{book.authors}}</p>
				<p #if="book.textSnippet" class="teaser truncate" #html="book.textSnippet"></p>
				<p class="description truncate">{{book.description}}</p>
				<p class="details">
					<span #if="book.publisher">{{book.publisher}} </span> 
					<span #if="book.publishedDate">Erschienen {{book.publishedDate}} </span>
					<span #if="book.pageCount">{{book.pageCount}} Seiten </span>
					<span #if="book.isbn">ISBN {{book.isbn}}</span>
				</p>	

			</div>	

		</div>	

	</div>

	<div #if="selected" id="edit-and-upload">

		<button #if="!editable" id="edit" @click="editMetadata" class="material-icons">edit</button>
		<button #if="editable" id="save" @click="editMetadata" class="material-icons">save_as</button>

		<div class="selected">

			<p #if="!editable" class="categories">{{selected.categories}}</p>
			<input #if="editable" class="categories" #formvalue="categories" placeholder="comma separated list of categories">
			<img :src="selected.image">
			<input #if="editable" #formvalue="selected.image" placeholder="image: src - attribute of img">
			<input #if="editable" #formvalue="selected.thumbnail" placeholder="thumbnail: src - attribute of img">
			<input #if="editable" #formvalue="selected.fname" placeholder="Dateiname">
			<p>
				<span #if="!editable" class="title">{{selected.title}}</span> 
				<span class="title"><input #formvalue="selected.title" #if="editable"> </span> 
				<span #if="!editable" class="subtitle">{{selected.subtitle}}</span>
				<span class="subtitle"><input #formvalue="selected.subtitle" #if="editable"></span>
			</p>
			<p #if="!editable" class="authors">{{selected.authors}}</p>
			<input #if="editable" class="authors" #formvalue="authors" placeholder="comma separated list of authors (name surname)">
			<p #if="!selected.description" class="teaser" #html="selected.textSnippet"></p>
			<p #if="editable"><textarea #if="editable" class="teaser" #formvalue="selected.teaser" placeholder="description" ></textarea></p>
			<p #if="!editable" class="description">{{selected.description}}</p>
			<p #if="editable"><textarea class="description" #formvalue="selected.description" placeholder="description" ></textarea></p>
			<p class="details">
				<span #if="!editable">{{selected.publisher}} </span> 
				<span #if="editable"><input #formvalue="selected.publisher" placeholder="publisher"> </span> 
				<span #if="!editable">Erschienen {{selected.publishedDate}} </span>
				<span #if="editable"><input #formvalue="selected.publishedDate" placeholder="publishing date"> </span> 
				<span #if="!editable">{{selected.pageCount}} Seiten </span>
				<span #if="editable"><input #formvalue="selected.pageCount" placeholder="page count"> </span> 
				<span #if="!editable">ISBN {{selected.isbn}}</span>
				<span #if="editable"><input #formvalue="selected.isbn" placeholder="ISBN"> </span> 
			</p>

		</div>

		<div class="buttons">

			<button id="back" @click="scrollBack">zur&uuml;ck</button>
			<button id="upload" @click="upload" :loading>Hochladen</button>
		
		</div>

	</div>

</div>

<style>
	@import 'https://fonts.googleapis.com/css?family=Material+Icons';
	/* Transitions */
	.slide-right-enter,	.slide-right-leave {
		transition: 0.5s all ease-in-out;
	}
	.slide-right-enter-start {
		transform: translate(-100vw);
	}
	.slide-right-enter-end {
		transform: translate(0);
	}
	.slide-right-leave-start {
		transform: translate(0);
	}
	.slide-right-leave-end {
		transform: translate(-100vw);
	}
	/* Styles */
	#wizard {
		display: flex;
		font-family: -apple-system, BlinkMacSystemFont, "Segoe UI",
               Roboto, Oxygen-Sans, Ubuntu, Cantarell,
               "Helvetica Neue", sans-serif;
		position: absolute;
		z-index: 10;
		overflow-x: scroll;
		scroll-snap-type: x mandatory;
		width: 100vw;
		min-height: 100vh;
		background-color: white;
		box-shadow: 2px 2px 50px gray;	
	}
	#cancel {
		position: absolute;
		right:20px;
		top: 20px;
	}
	#edit,#save {
		position: absolute;
		right: calc(20px - 100vw);
		top: 20px;
	}
	#select-ebook, #edit-and-upload {
		flex: 0 0 calc(100vw - 2px);
		display: block;
		scroll-snap-align: start;
	}
	img {
		float: left;
		padding-right: 20px;
		max-height: 194px;
	}
	div>input {
		border: 1px solid #cccccc;
		border-radius: 5px;
		padding: 15px;
		margin: 5px;
		width: calc(100vw - 80px);
	}
	label > input {
		display: none;
	}
	label {
		cursor: pointer;
		border: 1px solid #cccccc;
		border-radius: 5px;
		padding: 15px;
		margin: 5px;
		width: calc(100vw - 40px);
		background: #dddddd;
		display: inline-block;
		text-align: center;
	}
	label:hover {
		background: #5cbd95;
	}
	label:active {
		color: #9fa1a0;
	}
	label:valid+span {
		color: #ffffff
	}
	.item {
		cursor: pointer;
		border-bottom: 1px solid black;
		padding: 5px 15px;
		margin: 0 5px;
		min-height: 194px;
	}
	.item:hover {
		background-color: aliceblue;
	}
	.categories {
		text-transform: uppercase;
		color: darkslateblue;
		font-size: small;
	}
	.title {
		font-weight: bold;
		letter-spacing: 0.16em;
		text-transform: uppercase;
	}
	.subtitle {
		text-transform: uppercase;
		color: gray;
	}
	.authors {
		font-variant: small-caps;
	}
	.teaser {
		font-style: italic;
	}
	textarea.teaser, textarea.description {
		width: 100%;
		height: fit-content;
	}
	.details {
		display: flex;
		justify-content: start;
		font-size: small;
		color: gray;
		flex-wrap: wrap;
	}
	.details span {
		margin-right: 20px;
		max-width: 200px;
	}
	.description {
		font-size: smaller;
		letter-spacing: 1px;
	}
	.truncate {
		white-space: nowrap;
		max-height: 18px;
		max-width: calc(100vw - 200px);
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.selected {
		padding: 20px;
		width: calc(100vw - 80px);
	}
	.buttons {
		padding: 20px;
		display: flex;
		justify-content: space-between;
	}
	.buttons button {
		padding: 10px 20px;
		font-size: 18px;
		line-height: 18px;
	}
	#upload {
		color: white;
		background-color: green;
	}
	.loading {
		background-image: url(/loading.gif);
		background-size: contain;
		background-repeat: no-repeat;
		background-position: center;
	}
	#upload::before {
		vertical-align: bottom;
		font-family: "Material Icons";
		padding-right: 5px;
		content: "upload";
		font-size: 18px;
	}
	#back:before {
		vertical-align: bottom;
		font-family: "Material Icons";
		padding-right: 5px;
		content: "west";
		font-size: 18px;
	}
</style>