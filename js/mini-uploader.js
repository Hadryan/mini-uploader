/**
 * MiniUploader v1.0
 * http://www.albanx.com/
 *
 * Copyright 2014-2015, Alban Xhaferllari
 *
 * Date: 28-08-2013
 */

var MiniUploader = function(dropContainer, opts){
	
	//default options values
	var defaults = {
		// Chunk split size for the file when uploading
		chunkSize: 		1024*1024,
		
		// Show image/jpg preview
		showPreview: 	true,
		
		// Automatic start uploader on drop or select
		autoStart: 		false,
		
		// Ajax Request type
		async:			true,
		
		// Server side uploader URL
		urlUpload: 		'',
		
		// Remote Upload path, better set in the server side
		uploadPath: '',
		
		// Class to add on drop/drag over the container
		dropClass: 		'',
		
		// Layer to view on drop over file FIXME rename
		dropLayer:		'<div class="mu-drop-area"><span class="mu-drop-title">Drop Files Here</span></div>',
		
		// Message to translate or set, strings
		messages: 		{
			'upload_ready' 	: 'Ready',
			'upload_done'	: 'Done',
			'upload_error' 	: 'Error',
			'upload_progress' :'Uploading'
		},
		
		// Class to add when a container has droped a file inside
		hasFileClass:	'',
		
		// Buttons: if dom element it will be added, if selector it will bind remove 
		// event on that elements
		buttonRemove:	'<a class="mu-bremove" title="Remove file"><i class="fa fa-times-circle"></i></a>',
		buttonUpload:	'<a class="mu-bstart" title="Start upload this file"><i class="fa fa-arrow-circle-up"></i></a>',
		buttonSelect:	'<a class="mu-bselect">Select file</a>',
		filenameContainer:	'<span class="mu-fname"></span>',
		fileCountContainer: '<span class="mu-fcount"></span>',
		//Progress set up
		progressBar: 	{
			//this is the html to show as progress information
			container: '<div class="mu-progress">0%</div>',
			            
			//this is the function that is triggered on every update, to update the progress bar
			updater: function(container, progress, fileElem) {
				container.html(progress+' %');
			}
		},
		showPreview: 	true,
		previewHolder: '.mu-preview-holder', //dom element inside droper that will display the preview
		previewLoading: '',
		
		
		//a selector for a button on the dom where to bind the file select
		elementTriggerSelect: false,
		
		// Use the above buttons on the drop container
		addButtons:		true,
		
		// Use multiple or single file on the same drop container
		fileAddMode:	'replace', //Will be added one file for container replace/clone
		
		// Maximum/Minimun files on the single drop placeholder
		maxPlaceholderFiles: 1,	//TODO
		minPlaceholderFiles: 1,	//TODO
		
		// Maximum parallel uploads allowed, for performance reason
		parallelUploads: 3,
		
		// Further data to send to server for each file, can be a function or an object
		// If funtion data will be calculated and should return an object
		data: 			null, //default data function, get data from container data
		
		//validate selected files: runs for each selected files, if return true file will be added to the list
		validateFile: function(file){
			return true;
		},
		
		//Global callback that runs when all files has been uploaded
		onFinish: function() {
			
		},
		
		//Callback that runs when all files of a single container has been uploaded
		onFinishGroup: function(domElem){
			
		},
		//Callback that runs when a single file has been uploaded, returns fileElem
		onFinishFile: function(fileElem) {
			
		},
		
		//Callabcks that runs when files are dropped
		onDrop: function(files) {
			
		},
		
		//Callbacks that runs when files are select or droped
		onFileSelect: function(){
			
		},
		onPaste: function(files){
			
		}
	};
		
	//Extend the default options with the user one
	this.opts = $.extend({}, defaults, opts);//FIXME add deep?
	
	//Drop container
	this.dropContainer 	= dropContainer;
	
	//runtime variables
	this.fileList		= {}; 		//a list with all selected files
	this.fileIndex		= 0;		//a simple incremental index to track internal file ids of the above list
	this.useFormData 	= false;	// test variable for formdata support
	this.hasAjaxUpload 	= false;	// test variable for ajax upload support
	this.freeSlots 		= this.opts.parallelUploads; //track the free upload slots
	this.checkInterval 	= null;		//setInterval time for the queue processor
	this.uploadQueue 	= []; 		//files in queue to ready to be uploaded by the queue processor
	this.inputSelect 	= null;
	
	//internal costants to track file status
	this.IDLE 		= 0;
	this.UPLOADING 	= 1;
	this.DONE 		= 2;
	this.ERROR 		= 3;
	this.PREVIEWING	= 4;
	this.CHECKING	= 5;
	this.PROCESSING	= 6;
	
	//start Uploader Setup
	this.init();
};


MiniUploader.prototype = {
	init: function() {
		
		//detect AJAX upload
		this.detectFormData();
		this.detectHtml5Upload();
		
		if(!this.hasAjaxUpload){
			console.log('Ajax Upload non supported');
			return false;
		}
		
		if(!this.useFormData ){
			console.log('Form data not supported');
			return false;
		}
		
		//get the drop containers for the files
		this.$dropContainer	= $(this.dropContainer).css('position', 'relative');
		if(!this.$dropContainer) {
			console.log('No containers found');
			return false;
		}
		
		//bind Javascript events
		this.bindEvents();
		
		//add drop div for effects
		this.addOverLayers();
		
		//add hidden input for select button
		this.inputSelect = $('<input type="file" />').css({visibility:'hidden', width:0, height:0, position:absolute, top:0, left:0});
		this.inputSelect.appendTo('body');
		return true;
	},
	
	// add a drop layer that will be view when we drag a file over the area
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
	
	// bind the events
	bindEvents: function(){
    	var self = this;

    	//bind drop event
    	this.$dropContainer.on('dragover', function(e){
    		e.stopPropagation();
    		e.preventDefault();
    		e.dropEffect = 'copy';
    		var $this = $(this);
    		if(self.opts.dropClass) {
    			$this.addClass(self.opts.dropClass);
    		}
    		
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

	    	if(self.opts.dropClass) {
	    		$this.removeClass(self.opts.dropClass);
	    	}
    		if(self.opts.dropLayer) {
    			$(this).data('dropLayer').hide();
    		}
    	});
    	
    	//bind click events on buttons
	},

	
	// Put files in queue, that will be processed for upload
	enqueueFile: function(fileId){
		this.uploadQueue.push(fileId);
		this.processQueue();//trigger a process queue if it is not running already
	},
	
	//Enqueue all files ready for upload
	enqueueAll: function(){
		for(var fileId in this.fileList) {
			if ( this.fileList.hasOwnProperty(fileId) ) {
				var fileElem = this.fileList[fileId];
				if(fileElem.status == this.IDLE) {
					this.uploadQueue.push(fileId);
				}
			}
		}
		
		this.processQueue();//trigger a process queue if it is not running already
	},
	
	// Get files from queue and start upload them by respecting quotas
	processQueue: function() {
		var self 	= this;
		if(!this.checkInterval){
			this.checkInterval = setInterval(function(){
				if(self.uploadQueue.length == 0) {
					clearInterval(self.checkInterval);
					self.checkInterval = null;
				} else {
					for(var i = 0; i<self.uploadQueue.length; i++){
						if( self.freeSlots > 0 ) {
							self.startUpload( self.uploadQueue[i] );//start file upload
							self.uploadQueue.splice(i, 1); //remove from queue
							self.freeSlots--;
						}
					}
				}
				
			}, 200);
		}
	},
	startUpload: function(fileId){
		//start uploading the file
		var fileElem 	= this.fileList[fileId];
		fileElem.status = this.UPLOADING;//set correct status
		this.ajaxUpload(fileElem);//start the ajax upload
	},
	onFinishFile: function(fileElem) {
		this.freeSlots++;//free the slot
		fileElem.status = this.DONE;// set the correct status
		
		//if an even is configured by the user run it
		if(typeof this.opts.onFinishFile == 'function') {
			this.opts.onFinishFile.call(this, fileElem);
		}

		//check of all files has been uploaded, if yes run  global finish event
		if( this.checkFinishStatus() ){
			this.onFinishAll();
		}
	},
	
	//track error uploads
	onErrorFile: function(fileElem, err){
		this.freeSlots++;
		fileElem.status = this.ERROR;
		console.log(err);
	},
	
	
	onProgress: function(fileId, progress) {
		var fileElem = this.fileList[fileId];
		fileElem.progress = progress;
		
		//update the progress bar if it configured
		if(this.opts.progressBar) {
			if(typeof this.opts.progressBar.updater == 'function') {
				var progressBar = fileElem.domElem.data('progressBar');
				this.opts.progressBar.updater.call(this, progressBar, progress, fileElem);
			}
		}
	},
	
	//run final finish
	onFinishAll: function() {
		console.log('All files has been uploaded');
		if(typeof this.opts.onFinish == 'function') {
			this.opts.onFinish.call(this);
		}
	},
	
	//function that checks the list of file if has been uploaded
	checkFinishStatus: function(){
		var done 	= 0;
		var total 	= 0;
		
		//loop the object list
		for(var fileId in this.fileList) {
			total++;
			if ( this.fileList.hasOwnProperty(fileId) ) {//maybe not needed
				var fileElem = this.fileList[fileId];
				if(fileElem.status == this.DONE) {//FIXME consider files gone in error
					done++;
				}
			}
		}
		
		return done == total;
	},

	//generate a simple index id for tracking file list
	generateFileId: function(){
		this.fileIndex++;
		return 'file_'+this.fileIndex;
	},
	
	//calculate params to send with the single file upload, maybe needed on server side
	getFileParams: function(fileElem){
		var params = [];
		if(typeof this.opts.data === 'function') {
			params = this.opts.data.call(this, fileElem, fileElem.domElem); 
		} else if(this.opts.data !== null) {
			params = this.opts.data;
		}
		
		return params;
	},
	
	//add a list of files on the list
	addFiles: function(fileList, domElem){
		for(var i = 0; i<fileList.length; i++){
			this.addFile(fileList[i], domElem);
			
			if(this.opts.fileAddMode == 'clone') {
				var index 		= this.$dropContainer.index(domElem); //TODO cachare il selector
				var nextElem 	= this.$dropContainer.get(index+1);
				if (nextElem) {
					domElem = $(nextElem);
				} else {
					var newdomElem = domElem.clone();
					newdomElem.insertAfter(domElem);
					domElem = newdomElem;
				}
			} else if(this.opts.fileAddMode == 'replace'){
				//nothing TODO add more files on the same first container
			}
		}
	},
	addFile: function(file, domElem){
		
		//create a unique id for the file in queue
		var fileId = this.generateFileId();
		
		//file element
		var fileElem = {
			file: 			file,
			name: 			file.name,
			size: 			file.size,
			currentByte: 	0,
			progress: 		0,
			done:			0,
			status:			this.IDLE,
			domElem:		domElem,
			fileId:			fileId
		};
		
		//the single dom elmenet attach 
		domElem.data('fileIds', fileId);
		
		//add in list the file
		this.fileList[fileId] = fileElem;
		
		//add buttons for the single element, including progress bar
		if(this.opts.addButtons) {
			this.addButtons(domElem, fileElem.name);
		}
		
		//update file counter number
		if( domElem.data('fileCounter') ) {
			domElem.data('fileCounter').html(fileIds.length);
		}
		
		//create a simple preview of the file
		if(this.opts.showPreview) {
			this.addFilePreview(fileId);
		}
		
		return fileId;
	},
	
	// This function create a preview for the file in case of images
	addFilePreview: function(fileId) {
		var fileElem= this.fileList[fileId];
		var file 	= fileElem.file;
		var domElem = fileElem.domElem;
		
		//TODO preview for multiple file in same container
		//add a small preview of the image if supported
		var URL 	= window.URL || window.webkitURL;
		if (URL.createObjectURL && (file.type == "image/jpeg" || file.type == "image/png" || file.type == "image/gif")) {
			var holder 	= domElem.find(this.opts.previewHolder);
			var img 	= $('<img class="mu-preview" />').css({'max-width':holder.width(), 'max-height': holder.height()}).attr('src', URL.createObjectURL(fileElem.file) );
			if(holder.length) {
				holder.children().hide();
				holder.append(img).data('muPreview', img);
				img.css({'max-width': holder.width() - parseInt( img.css("border-right-width"), 10) - parseInt( img.css("border-left-width"), 10) });
			}
		}
	},
	
	//remove the file from the list and try to free memory
	removeFile: function(fileId){
		var fileElem 	= this.fileList[fileId];
		fileElem.file 	= null;
		fileElem 		= null;
		delete this.fileList[fileId];
	},
	
	//Clean the DOM container of the file
	removeFilesFromDom: function(domElem) {
		//get all files in this single container and remove one by one
		var fileIds = domElem.data('fileIds');
		var len 	= fileIds.length;
		for(var i = 0; i<len; i++) {
			var fileId = fileIds[i];
			this.removeFile(fileId);
		}
		
		//clean doom element
		domElem.find('.mu-buttons').remove();
		domElem.data('hasButtons', false);
		domElem.data('fileIds', []);
		//remove the preview image and restore old content
		var holder 	= domElem.find(this.opts.previewHolder);
		if( holder.length ) {
			holder.html('');
		}
		
		//remove file counter
		if( domElem.data('fileCounter') ){
			domElem.data('fileCounter').remove();
		}
		
		//remove progress bar
		if( domElem.data('progressBar') ) {
			domElem.data('progressBar').remove();
		}
		
		//remove file name container
		if(domElem.data('filenameContainer') ) {
			domElem.data('filenameContainer').remove();
		}
	},
	
	addButtons: function(domElem, fileName){
		if( !domElem.data('hasButtons') ) {
			
			//add Upload button to the container
			if(this.opts.buttonUpload) {
				$(this.opts.buttonUpload).addClass('mu-buttons').appendTo(domElem).on('click', {domElem:domElem, self:this} , function(e){
		    		e.stopPropagation();
		    		e.preventDefault();
		    		
		    		//get file list for this dom element
					var domElem = e.data.domElem;
					var fileIds = domElem.data('fileIds');
					var len 	= fileIds.length;
					
					//upload files
					for(var i = 0; i<len; i++) {
						var fileId = fileIds[i];
						e.data.self.startUpload(fileId);//FIXME qui rischia di non rispettare le quote
					}
				});
			}
			
			//add remove button
			if(this.opts.buttonRemove) {
				$(this.opts.buttonRemove).addClass('mu-buttons').appendTo(domElem).on('click', {domElem:domElem, self:this} , function(e){
		    		e.stopPropagation();
		    		e.preventDefault();
					e.data.self.removeFilesFromDom(e.data.domElem);
				});
			}
			
			//progress info
			if(this.opts.progressBar) {
				var progressBar = $(this.opts.progressBar.container).appendTo(domElem);
				domElem.data('progressBar', progressBar); 
			}

			//file counter
			if(this.opts.fileCountContainer) {
				var fileCounter = $(this.opts.fileCountContainer).appendTo(domElem);
				domElem.data('fileCounter', fileCounter.html(1) );
//				fileCounter.on('click', domElem, function(e){
//					
//				});
			}
			
			//show file name
			if(this.opts.filenameContainer) {
				var filenameContainer = $(this.opts.filenameContainer).appendTo(domElem);
				domElem.data('filenameContainer', filenameContainer.html(fileName) );
			}
			domElem.data('hasButtons', true);
			
			//TODO add browse
		}
		
		//update the title attribute for other file names
		if( domElem.data('filenameContainer') ) {
			var fileId = domElem.data('fileId');
			domElem.data('filenameContainer').attr('title', this.fileList[fileId].name );
		}
	},

	//This is the core of the uploading, a semi- recrusive function for uploading the file via ajax
	ajaxUpload: function(fileElem){
    	var currentByte	= fileElem.currentByte;
    	var name		= fileElem.name;
    	var size		= fileElem.size;
    	var file 		= fileElem.file;
    	
    	var chunkSize	= this.opts.chunkSize;	//chunk size
		var endByte		= chunkSize + currentByte;
		var isLast		= (size - endByte <= 0);
    	var chunk		= null;
    	var xhr 		= new XMLHttpRequest();//prepare xhr for upload
    	var self 		= this;
    	
    	if(chunkSize == 0) {
    		chunk	= file;
    		isLast	= true;
    	} else {
    		chunk = this.fileSlice(file, currentByte, endByte);
    	}
    	
    	//no slice, it is not supported if null
    	if(chunk === null) {
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

		//internal uploader params, not change
		var params = [];
		params.push('ax-start-byte='+ currentByte);
		params.push('ax-last-chunk='+ isLast);
		params.push('ax-file-name=' + name);
		
		//additional user params
		var fileParams = this.getFileParams(fileElem);
		for(var key in fileParams){
			if ( fileParams.hasOwnProperty(key) ) {
				params.push(key+'=' + fileParams[key]);
			}
		}
		
		if(this.useFormData) { //firefox 5 formdata does not work correctly
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
			
		} else {
			//else we use a old trick upload with php::/input ajax, FF3.6+, Chrome, Safari
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
	}
};
//TODO add destroy method

(function($, MiniUploader) {
	$.fn.miniuploader = function(opts) {
		this.data('miniuploader', new MiniUploader(this, opts) );
		return this;
	};
})(jQuery, MiniUploader);