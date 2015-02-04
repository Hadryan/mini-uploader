<!DOCTYPE html>
<html>
<head>
    <title>MiniUploader - Modern Ajax Uploader</title>
    <meta name="description" content="A modern Ajax File Uploader with Drag and Drop">
    <meta name="viewport" content="width=1024, maximum-scale=1">
    <meta property="og:image" content="assets/preview3860.jpg?v=1" />
    <link rel="shortcut icon" href="favicon.ico">
    <link href="assets/main1bce.css?v=6" type="text/css" rel="stylesheet">
    <link href="http://fonts.googleapis.com/css?family=Amaranth:400,700" rel="stylesheet" type="text/css">
    <link href="assets/prettify.css" type="text/css" rel="stylesheet">
    <link rel="stylesheet" type="text/css" href="assets/fd-slider/fd-slider5e1f.css?v=2">
    <link rel="stylesheet" type="text/css" href="assets/fd-slider/fd-slider-tooltip.css">
    
    <link rel="stylesheet" type="text/css" href="../fontawesome/font-awesome.min.css">
    <link rel="stylesheet" type="text/css" href="../css/themes.css">
    
    <script type="text/javascript" src="assets/jquery.min.js"></script>
    <script type="text/javascript" src="assets/prettify.js"></script>
    <script type="text/javascript" src="../js/mini-uploader.js"></script>
    
</head>
<body>

	<div id="logo">
	    <h1> <img style="width:140px;" src="assets/logo.png"> Mini Uploader</h1>
	</div>

    <a id="ribbon" href="../../github.com/albanx/"></a>

    <div id="content">
    		<p>
	        MiniUploader is a simple javascript Class for creating drag &amp; drop uploader on the fly, highly customizable 
	        with options and graphics.
	    </p>
	    
		<div id="download">
		  	<a href="mini-uploader.zip" class="button">Download for free</a>
		</div>

		<div id="example">
	        <h2>Example</h2>
	        
	        <h3>Single Drop</h3>
	        <p>Drop any file in this area:</p>
	        <div id="drophere">
	        	<div class="mu-preview-holder"></div>
	        </div>
	
	         <h3>Multi Drop</h3>
	        <div class="drophere"></div>
	        
	        <h3>Events</h3>
	        <div class="dropevents"></div>
	    </div>

	    <h2>Features</h2>
	    <ul>
			<li>Pure Drag&amp;Drop Ajax Uploader</li>
			<li>can be used as jQuery plugin or as standalone</li>
			<li>Highly configurable</li>
			<li>Chunk upload</li>
			<li>Events, API and Callbacks</li>
			<li>Images preview</li>
			<li>Queue manager</li>
			<li>Works in all major MODERN browsers (no support junk old browsers)</li>
			<li>Free for personal use</li>
	    </ul>

    
    <h2 id="usage1">Usage as jQuery plugin</h2>
    <pre class="prettyprint">
$('.drop-containers').miniuploader(opts);
    </pre>
    
    <h2 id="usage1">Usage as standalone</h2>
    <pre class="prettyprint">
var uploader = new MiniUploader('.drop-containers', opts)
    </pre>
    
    <h2 id="options">Options</h2>

<pre class="prettyprint">
//default options values
var defaults = {
    chunkSize:      1024*1024,// Chunk split size for the file when uploading
    showPreview:    true,// Show image/jpg preview
    autoStart:      false,// Automatic start uploader on drop or select
    async:          true,// Ajax Request type
    urlUpload:      '',// Server side uploader URL
    dropClass:      '',// Class to add on drop/drag over the container
    
    // Layer to view on drop over file FIXME rename
    dropLayer:      '<?php echo htmlspecialchars('<div class="mu-drop-area"><h4 class="mu-drop-title">Drop Files Here</h4></div>') ?>',
    
    // Message to translate or set, strings
    messages:       {
        'upload_ready'  : 'Ready',
        'upload_done'   : 'Done',
        'upload_error'  : 'Error',
        'upload_progress' :'Uploading'
    },
    
    // Class to add when a container has droped a file inside
    hasFileClass:   '',
    
    // Buttons: if dom element it will be added, if selector it will bind remove 
    // event on that elements
    buttonRemove:   '<?php echo htmlspecialchars('<a style="cursor:pointer" title="Remove file"><i class="fa fa-times-circle "></i></a>')?>',
    buttonUpload:   '<?php echo htmlspecialchars('<a style="cursor:pointer" title="Start upload this file"><i class="fa fa-arrow-circle-up"></i></a>')?>',
    buttonSelect:   '<?php echo htmlspecialchars('<a href="">S</a>')?>',
    
    //Progress set up
    progressBar:    {
        //this is the html to show as progress information
        container: '<?php echo htmlspecialchars('<div class="mu-progress">0%</div>')?>',
		//this is the function that is triggered on every update, to update the progress bar
		updater: function(container, progress, fileElem) {
			container.html(progress+' %');
		}
    },
    
    elementTriggerSelect: false,//a selector for a button on the dom where to bind the file select
    addButtons:     true,// Use the above buttons on the drop container
    fileAddMode:    'linear', // Use multiple or single file on the same drop container
    fileReplaceMode:'replace', //on re-added if there is a file on the container will be overriten
    maxFilesForPlacehoder: 1, // Maximum/Minimun files on the single drop placeholder
    parallelUploads: 3,// Maximum parallel uploads allowed, for performance reason
    
    // Further data to send to server for each file, can be a function or an object
    // If funtion data will be calculated and should return an object
    data:           null, //default data function, get data from container data
    
    //Global callback that runs when all files has been uploaded
    onFinish: function() {
        
    },
    
    //Callback that runs when a single file has been uploaded, returns fileElem
    onFinishFile: function(fileElem) {
        
    },
    
    showPreview:    true,	//enable previews for jpg/png files
    previewHolder: 'img', 	//dom element inside droper that will display the preview
    previewLoading: ''		// set a loader before creating preview
};
</pre>


<h3>Theming</h3>
<p>
	Mini Uploader is totally customizable in theming. Buttons and drop area are completly in control of the user.
</p>

<h2>Supported browsers</h2>
<img src="assets/browsers.png">
<p>
  Mini Uploader has been successfully tested in the following browsers:
  <ul>
    <li>Chrome</li>
    <li>Safari 7+</li>
    <li>Firefox 18+</li>
    <li>IE 10+</li>
    <li>Mobile Safari (iOS 4.1+)</li>
    <li>Android 2.3+</li>
  </ul>
</p>

<h2>Changes</h2>

<h3 id="v1.0.0">Version 1.0.0 (01/02/2014)</h3>
<ul>
	<li>First version realeased to public.</li>
</ul>

<h2>Contact</h2>
<p id="contact">
  If you encounter any problems, for updates, please use the <a href="https://github.com/albanx/miniuploader/issues">GitHub issue tracker</a>.<br>
</p>
</div>
<div id="footer">
  <a class="github" href="http://github.com/">Hosted on GitHub</a>
</div>


<script type="text/javascript" src="assets/fd-slider/fd-slider.js"></script>
<script>
  	prettyPrint();

  	$('#drophere').miniuploader({
  	  	urlUpload: '../upload.php'
  	});
</script>

</body>
</html>