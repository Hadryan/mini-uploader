
var MiniUploader = function(opts){
		
		//default values
		this.opts = {
			chunkSize: 		1024*1024,
			showPreview: 	true,
			autoStart: 		false,
			async:			true,
			dropContainer: 'body',
			urlUpload: 		'',
			dropClass: 		'',
			dropLayer:		'<div class="drop-files-area1"><h4 class="drop-files-area2">Drop Files Here</h4></div>',
			hasFileClass:	'',
			buttonRemove:	'<a href="">X</a>',
			buttonUpload:	'<a href="">I</a>',
			buttonSelect:	'<a href="">S</a>',
			addButtons:		true,
			fileAddMode:	'linear',
			fileReplaceMode:'replace',
			parallelUploads: 3,
			data: 			null //default data function, get data from container data
		};
		
		$.extend(this.opts, opts);//FIXME add deep?
		
		//variabile di ambiente
		this.fileList		= {};
		this.dropAreas 		= [];
		this.fileIndex		= 0;
		this.useFormData 	= false;
		this.hasAjaxUpload 	= false;
		this.freeSlots 		= this.opts.parallelUploads;
		this.checkInterval 	= null;
		//costants
		this.IDLE 		= 0;
		this.UPLOADING 	= 1;
		this.DONE 		= 2;
		this.ERROR 		= 3;
		
		this.init();
};

MiniUploader.prototype = {
	init: function() {
		this.detectFormData();
		this.detectHtml5Upload();
		
		if(!this.hasAjaxUpload){
			console.log('Ajax UPload non supported');
		}
		
		if(!this.useFormData ){
			console.log('Form data not supported');
		}
		
		this.$dropContainer	= $(this.opts.dropContainer);
		if(!this.$dropContainer) {
			console.log('No containers found');
		}
		
		this.bindEvents();
		this.addOverLayers();
	},
	addOverLayers: function() {
		var self = this;
		if(self.opts.dropLayer) {
			this.$dropContainer.each(function(){
				var $this 		= $(this);
				var dropLayer 	= $(self.opts.dropLayer).hide();
				$(this).append(dropLayer).data('dropLayer', dropLayer);
				dropLayer.css( {'width': $this.width(), 'height': $this.height() });
			});
		}
	},
	startUpload: function(fileId){
		var fileElem 	= this.fileList[fileId];
		fileElem.status = this.UPLOADING;
		this.ajaxUpload(fileElem);
	},
	startUploadAll: function(){
		if(!this.checkInterval){
			var self 	= this;
			
			this.checkInterval = setInterval(function(){
				
				var idles 	= self.getIdleFiles();
				var len 	= idles.length;
				if(len == 0) {
					clearInterval(self.checkInterval);
					self.checkInterval = null;
				} else {
					for(var i = 0; i<len; i++){
						if( this.freeSlots > 0 ) {
							self.startUpload(idles[i]);
							this.freeSlots--;
						}
					}
				}
				
			}, 500);
		}
	},
	onFinishFile: function(fileElem) {
		this.freeSlots++;
		fileElem.status = this.DONE;
		if( this.checkFinishStatus() ){
			this.onFinishAll();
		}
		
	},
	onErrorFile: function(fileElem, err){
		this.freeSlots++;
		fileElem.status = this.ERROR;
		console.log(err);
	},
	onFinishAll: function() {

	},
	onProgress: function(fileId, progress) {
		var fileElem = this.fileList[fileId];
		fileElem.progress = progress;
		fileElem.domElem.data('progressBar').css('width', progress+'%');
		fileElem.domElem.data('progressInfo').html(progress+' %');
		
	},
	checkFinishStatus: function(){
		var done 	= 0;
		var total 	= 0;
		
		for(var fileId in this.fileList) {
			total++;
			if ( this.fileList.hasOwnProperty(fileId) ) {
				var fileElem = this.fileList[fileId];
				if(fileElem.status == this.DONE) {//FIXME considerare anche l'errore in DONE?
					done++;
				}
			}
		}
		
		return done == total;
	},
	getIdleFiles: function(){
		var idles = []
		for(var fileId in this.fileList) {
			if ( this.fileList.hasOwnProperty(fileId) ) {
				var fileElem = this.fileList[fileId];
				if(fileElem.status == this.IDLE) {
					idles.push(fileId);
				}
			}
		}
		
		return idles;
	},
	getFileId: function(){
		this.fileIndex++;
		return 'file_'+this.fileIndex;
	},
	getFileParams: function(fileElem){
		var params = [];
		if(typeof this.opts.data === 'function') {
			params = this.opts.data.call(this, fileElem, fileElem.domElem); 
		} else if(this.opts.data !== null) {
			params = this.opts.data;
		}
		
		return params;
	},
	addFiles: function(fileList, domElem){
		for(var i = 0; i<fileList.length; i++){
			this.addFile(fileList[i], domElem);
			
			if(this.opts.fileAddMode == 'linear') {
				var index 		= this.$dropContainer.index(domElem); //TODO cachare il selector
				var nextElem 	= this.$dropContainer.get(index+1);
				if (nextElem) {
					domElem = $(nextElem);
				}
			} else if(this.opts.fileAddMode == 'allInOne'){
				//nothing
			}
		}
	},
	addFile: function(file, domElem){
		
		//create a unique id for the file in queue
		var fileId = this.getFileId();
		
		//file element
		var fileElem = {
			file: 			file,
			name: 			file.name,
			size: 			file.size,
			tempName:		file.name,
			currentByte: 	0,
			progress: 		0,
			done:			0,
			status:			this.IDLE,
			domElem:		domElem,
			fileId:			fileId
		};
		
		//calculate file data
		
		
		//the single dom elmenet can have more file attached
		var fileIds = domElem.data('fileIds');
		if(!fileIds) {
			fileIds = [];
		}
		
		//login of file add for a single dom element
		if(this.opts.fileReplaceMode == 'replace') {
			for(var i = 0; i<fileIds.length; i++){
				delete this.fileList[fileIds[i]];
			}
			fileIds = [];
		}
		fileIds.push(fileId);
		domElem.data('fileIds', fileIds);
		
		//enqueue the file
		this.fileList[fileId] = fileElem;
		
		if(this.opts.addButtons) {
			this.addButtons(domElem);
		}
		return fileId;
	},
	removeFile: function(fileId){
		var fileElem = this.fileList[fileId];
		fileElem.file = null;
		fileElem.domElem.find('.ax-buttons').remove();
		if( fileElem.domElem.data('dropLayer') ) {
			fileElem.domElem.data('dropLayer').remove();
			fileElem.domElem.data('dropLayer', null);
		}
		delete this.fileList[fileId];
		fileElem = null;
	},
	addButtons: function(domElem){
		if( !domElem.data('hasButtons') ) {
			if(this.opts.buttonUpload) {
				$(this.opts.buttonUpload).addClass('ax-buttons').appendTo(domElem).on('click', {domElem:domElem, self:this} , function(e){
		    		e.stopPropagation();
		    		e.preventDefault();
					var domElem = e.data.domElem;
					var fileIds = domElem.data('fileIds');
					var len 	= fileIds.length;
					for(var i = 0; i<len; i++) {
						var fileId = fileIds[i];
						e.data.self.startUpload(fileId);//FIXME qui rischia di non rispettare le quote
					}
				});
			}
			
			if(this.opts.buttonRemove) {
				$(this.opts.buttonRemove).addClass('ax-buttons').appendTo(domElem).on('click', {domElem:domElem, self:this} , function(e){
		    		e.stopPropagation();
		    		e.preventDefault();
					var domElem = e.data.domElem;
					var fileIds = domElem.data('fileIds');
					var len 	= fileIds.length;
					for(var i = 0; i<len; i++) {
						var fileId = fileIds[i];
						e.data.self.removeFile(fileId);
					}
				});
			}
			
			//TODO parametrizzare progress bar
			var divBar 		= $('<div />').addClass('ax-buttons progress progress-striped active').appendTo(domElem);
			var divStrip 	= $('<div />').addClass('bar progress-bar progress-bar-info').appendTo(divBar);
			var divInfo 	= $('<div />').css({position:'absolute', left:'40%'}).appendTo(divBar);
			domElem.data({ 'hasButtons': true, 'progressBar':divStrip, 'progressInfo':divInfo });
			
			//TODO add browse
		}
	},
	
	bindEvents: function(){
    	var self = this;

    	//bind drop event
    	this.$dropContainer.on('dragover', function(e){
    		e.stopPropagation();
    		e.preventDefault();
    		var $this = $(this);
    		if(self.opts.dropClass) $this.addClass(self.opts.dropClass);
    		if(self.opts.dropLayer) {
    			$this.data('dropLayer').show();
    		}
    		
    	}).on('dragenter', function(e){
    		e.stopPropagation();
    		e.preventDefault();
    	}).on('dragleave', function(e){
    		e.stopPropagation();
    		e.preventDefault();
    		var $this = $(this);
    		if(self.opts.dropClass) $this.removeClass(self.opts.dropClass);
    		if(self.opts.dropLayer) {
    			$this.data('dropLayer').hide();
    		}
    	}).on('drop', function(e){
	    	e.stopPropagation();
	    	e.preventDefault();

	    	//add files
	    	self.addFiles(e.originalEvent.dataTransfer.files, $(this) );

	    	if(self.opts.dropClass) $this.removeClass(self.opts.dropClass);
    		if(self.opts.dropLayer) {
    			$(this).data('dropLayer').hide();
    		}
    	});
    	
    	//bind click events on buttons
	},

	ajaxUpload: function(fileElem){
    	var currentByte	= fileElem.currentByte;
    	var name		= fileElem.name;
    	var size		= fileElem.size;
    	var file 		= fileElem.file;
    	var tempName	= fileElem.tempName;
    	
    	var chunkSize	= this.opts.chunkSize;	//chunk size
		var endByte		= chunkSize + currentByte;
		var isLast		= (size - endByte <= 0);
    	var chunk		= null;
    	var xhr 		= new XMLHttpRequest();//prepare xhr for upload
    	var self 		= this;
    	
    	if(chunkSize == 0)//no divide
    	{
    		chunk	= file;
    		isLast	= true;
    	}
    	else
    	{
    		chunk = this.fileSlice(file, currentByte, endByte);
    	}

    	if(chunk === null)//no slice, it is not supported if null
    	{
    		chunk	= file;
    		isLast	= true;
    	}

    	
    	//abort event, (nothing to do for the moment)
    	xhr.upload.addEventListener('abort', function(e){
    	}, false);

    	//progress function, with ajax upload progress can be monitored
    	xhr.upload.addEventListener('progress', function(e)
		{
			if (e.lengthComputable)
			{
				var perc = Math.round((e.loaded + currentByte) * 100 / size);
				self.onProgress(fileElem.fileId, perc);
			}
		}, false);

    	xhr.upload.addEventListener('error', function(e){
    	}, false);

    	xhr.onreadystatechange=function()
		{
			if(this.readyState == 4 && this.status == 200)
			{
				try
				{
					var ret	= JSON.parse( this.responseText );
					if(currentByte == 0) {
						fileElem.name 		= ret.name;
						fileElem.tempName 	= ret.temp_name;
					}
					
					if(isLast) {
						//exec finish event of the file
						self.onFinishFile(fileElem);
					} else {
						fileElem.currentByte = endByte;
						self.ajaxUpload(fileElem);
					}
				}
				catch(err)
				{
					self.onErrorFile(fileElem, err);
				}
			}
		};

		var params = [];
		params.push('ax-start-byte='+ currentByte);
		params.push('ax-last-chunk='+ isLast);
		params.push('ax-file-name=' + name);
		params.push('ax-temp-name=' + tempName);
		var fileParams = this.getFileParams(fileElem);
		for(var key in fileParams){
			if ( fileParams.hasOwnProperty(key) ) {
				params.push(key+'=' + fileParams[key]);
			}
		}
		
		if(this.useFormData) //firefox 5 formdata does not work correctly
		{
			var data 	= new FormData();
			var len 	= params.length;
			data.append('ax_file_input', chunk);
			for(var i=0; i<len; i++)
			{
				var d = params[i].split('=');
				data.append(d[0], d[1] );
			}
			xhr.open('POST', this.opts.urlUpload, this.opts.async);
			xhr.send(data);
		}
		else//else we use a old trick upload with php::/input ajax, FF3.6+, Chrome, Safari
		{
			var c =  this.opts.urlUpload.indexOf('?') == -1 ? '?' : '&';
			xhr.open('POST', this.opts.urlUpload + c + params.join('&'), this.opts.async);
			xhr.setRequestHeader('Cache-Control', 'no-cache');
			xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');//header
			xhr.setRequestHeader('Content-Type', 'application/octet-stream');//generic stream header
			xhr.send(chunk);//send peice of file
		}
	},
	
	
	
	//HELPER FUNCTIONS
	detectHtml5Upload: function(){
		var axtest 			= document.createElement('input');
		axtest.type 		= 'file';
		this.hasAjaxUpload 	= ('multiple' in axtest &&  typeof File != "undefined" &&  typeof (new XMLHttpRequest()).upload != "undefined" );
	},
	detectFormData: function(){
		this.useFormData = window.FormData !== undefined;

		//if formData is supported we use that, better in general FF4+, Chrome, Safari
		var isfirefox5 =  (navigator.userAgent).match(/Firefox\/(\d+)?/);
		if(isfirefox5!==null)
		{
			var fire_ver = isfirefox5!==null && isfirefox5[1]!==undefined && !isNaN(isfirefox5[1]) ? parseFloat(isfirefox5[1]) : 7;
			if(fire_ver<=6) this.useFormData = false;
		}

		//same for some version of opera
		var is_opera =  (navigator.userAgent).match(/Opera\/(\d+)?/);
		if(is_opera!==null)
		{
			var ver 		= (navigator.userAgent).match(/Version\/(\d+)?/);
			var opera_ver 	= ver[1]!==undefined && !isNaN(ver[1]) ? parseFloat(ver[1]) : 0;
			if(opera_ver<12.10) this.useFormData = false;
		}
	},
	fileSlice: function(blob, start, end)
	{
		var blobSlice;
		if (window.File.prototype.slice) 
		{
			try 
			{
				blob.slice();	// depricated version will throw WRONG_ARGUMENTS_ERR exception
				return blob.slice(start, end); //standard slice method
			}
			catch (e) 
			{
				// depricated old slice method
				return blob.slice(start, end - start);
			}
		} //medium old prefixed slice
		else if ((blobSlice = window.File.prototype.webkitSlice || window.File.prototype.mozSlice)) 
		{
			return blobSlice.call(blob, start, end);
		}
		
		return null;
	},
});
