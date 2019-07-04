// ThePirat 2018

var N = 6;

var pixabayKey = "10654725-1829b1299c4103708fd706523";
var googleKey = new Date().getSeconds() % 2 == 1 ? "AIzaSyBfC5ICxN3iNo41dFD49AKgmjK2Z3qAfqM" : "AIzaSyCzb6SI_JRrp6xLLYV617Ary6n59h36ros";
var bingKey = "2acaa76bcb0d4335baa5191bc91ae295";
var imgUrCli = "52c9b8cfd5d8bca";
var imgUrToken = "80dc0ebc1b409dbe5349fe40943c1427a13bdc68"; // Get new from the redirected URL on https://api.imgur.com/oauth2/authorize?client_id=52c9b8cfd5d8bca&response_type=token
var imgUrAlbum = "RJe6O2x";

// TODO: Use cache
var cache = {};
var bank = new Array(N);
var validBanksCount = 0;
var pendingImagesLoading = 0;
var errorImagesLoading = 0;
var finalSize = { w:-1, h:-1};
var penColor = "#000000";

Date.prototype.YYYYMMDDHHMMSS = function () {
  var yyyy = this.getFullYear().toString(); var MM = pad(this.getMonth() + 1,2); var dd = pad(this.getDate(), 2);
  var hh = pad(this.getHours(), 2); var mm = pad(this.getMinutes(), 2); var ss = pad(this.getSeconds(), 2);
  return yyyy + MM + dd+  hh + mm + ss;
};
function pad(number, length) {
  var str = '' + number;
  while (str.length < length) { str = '0' + str; }
  return str;
}

$(document).ready(function () {
	$("#album").attr('href', 'https://imgur.com/a/' + imgUrAlbum);
  for(var i = 1; i <= N; i++) {
		$("#inputs").append($("<input id='search" + i + "'' type='text'/>"));
  }
  $("#inputs input").on('keydown', function(event) {
    if (event.keyCode === 13) {
        $("#dale").click();
        return false;
    }
	});
  $("#addTerm").click(function(){
  	N++;
  	$("#inputs").append($("<input id='search" + N + "'' type='text'/>"));
  });
  $("#size,#type,#as").on('change', function(){
  	SelectionChanged();
  });
  
  $("#dale").click(function() {
    if ($("#search1").val().length == 0) {
      alert('Buscá algo !');
      return false;
    }
    Search();
  });
  
  $("#canvas-container").on('dblclick', function() {
  	ToggleResultFocus();
  });
  $("#edit").click(function(){
  	ToggleResultFocus();
  });
  
  $("#save").click(function (){
  	UploadToImgUr();
    return false;
  });
  $("#download").click(function() {
  	Download();
  });
  $("#engine").change(function() {
  	var eng = $("#engine").val();
    if (eng == 'google' || eng == 'bing') {
    	$("#quantity").val(10);
    	$(".language,.quantity").hide();
    } else {
    	$(".language,.quantity").show();
    }
  });
  $(".language,.quantity").hide();
  $("#color-picker").spectrum({
    color: penColor,
    change: function(color) {
        penColor = color.toHexString();
    }
	});
  $("#search1").focus();
  
});

function Search() {
	validBanksCount = 1;
  $("#main").empty();
  for(var i = 1; i <= N; i++) {
  	$("#main").append($("<div id='bank" + i + "'></div>"));
    $("#main").append($("<div id='selection" + i + "'><select id='selectImage" + i + "' class='image-picker' ></option></select></div>"));
  }
  
  $(".image-picker").hide();
  $("#result").html('');
  $("#errMsg").html('');
  $("#divCanvas").hide();
  for(var i = 1; i <= N; i++) {
  	var el = $("#search" + i);
		if (el.val().length > 0) {
    	$("#bank" + i).html(el.val().toString() + ":");
    	LoadImages(el.val(), i - 1);
      validBanksCount = i;
    }
    else {
    	break;
    }
  }
  
  setTimeout(function() { return CheckCompletion(); }, 250);
}

function CheckCompletion() {
  if (bank.slice(0, validBanksCount).every(function (v) { return v.loaded; })) {
  	ShowImages();
  	return;
  }
  setTimeout(function() { return CheckCompletion(); }, 250);
}

function LoadImages(search, index) {
	var hit = GetFromCache(search);
  if (hit != null) {
  	bank[index].images = hit;
    bank[index].loaded = true;
    return;
  }

	var engine = $("#engine").val();
  switch(engine) {
  	case "google":
    	LoadImages_Google(search, index);
    	break;
  	case "pixabay":
    	LoadImages_Pixabay(search, index);
    	break;
  	case "bing":
    	LoadImages_Bing(search, index);
    	break;
    default:
    	break;
  }
}

function GetCacheKey(search) {
	var value = search.toLowerCase().trim();
	var engine = $("#engine").val();
  var lang = $("#language").val();
  var maxImgPerBank = $("#quantity").val();
	var key = engine + ":" + lang + ":" + maxImgPerBank + ":" + value;
  return key;
}
function GetFromCache(search) {
	var key = GetCacheKey(search);
  if (cache[key] !== undefined) {
  	console.log("Cache Hit for key " + key);
  	return cache[key];
  }
  return null;
}

function UpdateCache(search, index) {
	var key = GetCacheKey(search);
  cache[key] = bank[index].images;
}

function LoadImages_Pixabay(search, index) {
  console.log("Will load for: " + search + ". Index: " + index);
  var lang = $("#language").val();
	bank[index] = { images: [], loaded: false };
  var searchUrl = encodeURIComponent(search);
  var url = "https://pixabay.com/api?key=" + pixabayKey + "&q=" + searchUrl + "&lang=" + lang;
  console.log("will get url " + url);
  $.get(url, function (data, status) {
  	if (status == "success" && data.hits) {
        console.log("Received data for " + search);
        var imgs = [];
        for(var i = 0; i < data.hits.length; i++) {
        	var title = data.hits[i].previewURL.substring(data.hits[i].previewURL.lastIndexOf('/')+1);
        	bank[index].images.push({ thumbUrl: data.hits[i].previewURL, webUrl: data.hits[i].webformatURL, title: title });
        }
        bank[index].loaded = true;
        UpdateCache(search, index);
    }
    else {
    	console.log("NO data from pixabay");
    }
  });
}

function LoadImages_Google(search, index) {
  console.log("Will load for: " + search + ". Index: " + index);
  var lang = $("#language").val();
  var maxImgPerBank = $("#quantity").val();
	bank[index] = { images: [], loaded: false };
  
  $.ajax({
    type: "GET",
    dataType: "jsonp",
    url: "https://www.googleapis.com/customsearch/v1",
    data: {
      key: googleKey,
      cx: "004286675445984025592:ypgpkv9fjd4",
      filter: "1",
      searchType: "image",
      num: 10, // Max is 10 for google (to get more, use param start={index})
      q: search
    }
  }).done(function(data) {
  	if (!data || !data.items) {
    	alert("Google API error, try Bing or Pixabay");
      return;
    }
  	if (data.items.length) {
      $.each(data.items, function(i, o) {
          var thumbURL = o.image.thumbnailLink;
          var webURL = o.link;
          var title = o.title;
          bank[index].images.push({ thumbUrl: thumbURL, webUrl: webURL, title: title });
        });
      bank[index].loaded = true;
      UpdateCache(search, index);
    }
    else {
    	console.log("NO data from google");
    }
  });
}

function LoadImages_Bing(search, index) {
  console.log("(BING) Will load for: " + search + ". Index: " + index);
  var lang = $("#language").val();
  var maxImgPerBank = $("#quantity").val();
	bank[index] = { images: [], loaded: false };
  
  $.ajax({
    type: "GET",
    dataType: "json",
    url: "https://api.cognitive.microsoft.com/bing/v7.0/images/search", //"https://api.datamarket.azure.com/Bing/Search/v1/Image",
    beforeSend: function(xhr) {
      xhr.setRequestHeader("Ocp-Apim-Subscription-Key", bingKey);
    },
    data: {
      q: "'" + search + "'",
    }
  }).done(function(data) {
    if (data && data.value) {
      $.each(data.value, function(i, o) {
          var thumbURL = o.thumbnailUrl;
          var webURL = o.contentUrl;
          var title = o.name;
          bank[index].images.push({ thumbUrl: thumbURL, webUrl: webURL, title: title });
        });
      bank[index].loaded = true;
      UpdateCache(search, index);
    }
    else {
    	console.log("NO data from bing");
    }
    
  });
}

function make_base_auth(user, password) {
    var tok = user + ':' + password;
    var hash = btoa(tok);
    return "Basic " + hash;
  }
  
function sleep(delay) {
    var start = new Date().getTime();
    while (new Date().getTime() < start + delay);
}

// Show images to pick
function ShowImages() {
  console.log("Will show images for " + validBanksCount + " banks");
  var maxImgPerBank = $("#quantity").val();
  for(var i = 0; i < validBanksCount; i++) {
  	var selector = "#selectImage" + (i + 1);
    $(selector).html('');
    $(selector).append($("<option value=''/>"));
  	for(var j = 0; j < Math.min(maxImgPerBank, bank[i].images.length); j++) {
      var src = bank[i].images[j].thumbUrl;      
      var full = bank[i].images[j].webUrl;
      var name =  bank[i].images[j].title;
      var appendElem = "<option data-img-src='" + src + "' value='" + j + "' data-web-url='" + full + "'>" + name + "</option>";
      $(selector).append($(appendElem));
  	}
    $(selector).show();
  }
  
  $(".image-picker").imagepicker({
    hide_select: true,
    selected: function(select, op, ev) { 
    	SelectionChanged();
    }
  });
  
  var $container = $('.image_picker_selector');
  // initialize
  $container.imagesLoaded(function () {
    $container.masonry({
      columnWidth: 30,
      itemSelector: '.thumbnail'
    });
  });
  
  $("#main").show();
  
}

// Show the result
function SelectionChanged() {
	if (validBanksCount == 0) {
  	return;
  }
	var renderAs = $("#as").val();
  isSelectionChanging = true;
  try {
    switch(renderAs) {
      case "multi":
        // Force multi imgs
        SelectionChanged_MultiImg();
        $("#result").show();
        $("#divCanvas").hide();
        break;
      case "single":
        // Force canvas
        SelectionChanged_Canvas(true);
        break;
      case "auto":
        // Try canvas or fallback to multi
        SelectionChanged_MultiImg();
        SelectionChanged_Canvas(false);
      default:
        break;
    }
  } catch(err) { 
  	
  }
}

// Show the result as multiples IMG tags
function SelectionChanged_MultiImg() {
	$("#result").html("<p class='text'>Multi:</p>");
  var size = $("#size").val();
  var type = $("#type").val();
	for(var i = 0; i < validBanksCount; i++) {
  	var selected = $("#selectImage" + (i+1)).find(":selected");
    if (selected.length) {
    	var url = selected.data("web-url");
      if (type == 'h') {
      	$("#result").append($("<img src='" + url +"' height='" + size + "' />"));
      }
      else {
        // vertical
        $("#result").append($("<div><img src='" + url +"' width='" + size + "' /><div/>"));
      }
    }
  }
  $("#result img").on('dblclick', function() {
  	ToggleResultFocus();
  });
}

// Use a canvas (fallback to thumbnails for images with CORS problems)
function SelectionChanged_Canvas(force) {
	let images = new Array(validBanksCount);
  var size = $("#size").val();
  var type = $("#type").val();
  finalSize = { w: type == 'h' ? 0 : size, h: type == 'h' ? size : 0 };
  pendingImagesLoading = validBanksCount;
  errorImagesLoading = 0;
  var selectedCount = 0;
	for(var i = 0; i < validBanksCount; i++) {
  	var selected = $("#selectImage" + (i+1)).find(":selected");
    if (selected && selected.data("web-url")) {
    	selectedCount++;
    	var url = selected.data("web-url");
      var thumbUrl = selected.data("img-src");
      let img = document.createElement('img');
      img.setAttribute("data-index", i)
      img.crossOrigin = 'anonymous';
      img.setAttribute('data-thumb-url', thumbUrl);
      img.addEventListener('load', (x) => {
      	CanvasLoadImage(x, type, size, images, finalSize);
      });
      img.addEventListener('error', (x) => {
      	var imgIndex = parseInt(x.srcElement.getAttribute("data-index"));
        console.log("ERROR on img loading index " + imgIndex + (force ? " Will try with thumbnail" : ""));
      	if (force) {
        	let thumbImg = document.createElement('img');
      		thumbImg.setAttribute("data-index", imgIndex)
      		thumbImg.crossOrigin = 'anonymous';
          thumbImg.addEventListener('load', (tx) => {
          	CanvasLoadImage(tx, type, size, images, finalSize);
          });
          thumbImg.addEventListener('error', (tx) => {
          	CanvasErrorImage(tx, images);
          });
          thumbImg.src = x.srcElement.getAttribute('data-thumb-url');
        }
        else {
        	CanvasErrorImage(x, images);
        }
      });
      img.src = url;
    }
  }
  if (selectedCount == validBanksCount) {
  	setTimeout(function() { return CheckCanvasCompletion(images); }, 250);
  }
  
}

function CanvasLoadImage(x, type, size, images, finalSize) {
  var aspectRatio = type == 'h' ? x.srcElement.width / x.srcElement.height : x.srcElement.height / x.srcElement.width;
  var newHeight = type == 'h' ? size : size * aspectRatio;
  var newWidth = type == 'h' ? size * aspectRatio : size;
  if (type == 'h') {
    finalSize.w += newWidth;
  }
  else {
    finalSize.h += newHeight;
  }
  pendingImagesLoading--;
  console.log("Original image size: " + x.srcElement.width + 'x' + x.srcElement.height + ". Scaled: " + newWidth + "x" + newHeight + ". Pending images: " + pendingImagesLoading);
  var imgIndex = parseInt(x.srcElement.getAttribute("data-index"));
  $("#bank" + (imgIndex + 1)).css('color', 'black');
  images[imgIndex] = { image: x.srcElement, w: newWidth, h: newHeight };
}

function CanvasErrorImage(x, images) {
	var imgIndex = parseInt(x.srcElement.getAttribute("data-index"));
  $("#bank" + (imgIndex + 1)).css('color', 'red');
  console.log("ERROR on img loading thumbnail index " + imgIndex);
  images[imgIndex] = { image: null, w: 0, h: 0 };
  pendingImagesLoading--;
  errorImagesLoading++;
}

function CheckCanvasCompletion(images) {
	if (errorImagesLoading > 0) {
    console.log("Cannot use canvas for some of the images (CORS policy)")
    $("#divCanvas").hide();
    $("#result").show();
  	return;
  }
  if (pendingImagesLoading <= 0) {
  	//Draw final canvas
    $("#errMsg").html('');
    $("#result").hide();
    $("#save").show();
    $("#savedUrl").hide();
    var type = $("#type").val();
    var canvas = document.createElement('canvas');
    canvas.id = "canvas";
    canvas.width = finalSize.w;
    canvas.height = finalSize.h;
    var ctx = canvas.getContext('2d');
    var x = 0; var y = 0;
    for(var i = 0; i < images.length; i++) {
    	ctx.drawImage(images[i].image, x, y, images[i].w, images[i].h);
    	if (type == 'h') {
      	x += images[i].w;
      }
      else{
      	y += images[i].h;
      }
    }
    
    $("#canvas-container").html(canvas);
    $("#divCanvas").show();
    new DrawInCanvas("#canvas", "#container");
  	return;
  }
  else {  
  	setTimeout(function() { return CheckCanvasCompletion(images); }, 250);
  }
}

function ToggleResultFocus() {
  $("#container").toggle();
  $(".text").toggle();
  $("#draw").toggle();
}

function Download() {
	var finalImageData = $("#canvas")[0].toDataURL("image/png");
  var name = 'Basu' + new Date().YYYYMMDDHHMMSS() + '.png';
  var a = $("<a href='" + finalImageData + "' download='" + name + "'>download</a>");
  a[0].click();
}

function UploadToImgUr() {
  var finalImageData = $("#canvas")[0].toDataURL("image/png");
  if (finalImageData) {
  	var defaultTitle = 'Basurita ' + new Date().YYYYMMDDHHMMSS();
  	var title = prompt("Please enter image title", defaultTitle);
		var imgBase64 = finalImageData.replace("data:image/png;base64,", "");
    $.ajax({
      url: "https://api.imgur.com/3/image",
      async: false,
      type: "POST",
      datatype: "json",
      data: {image: imgBase64, album: imgUrAlbum, title: title},
      success: function(data) {
      	var url = data.data.link;
        $("#save").hide();
      	$("#savedUrl").html(url);
        $("#savedUrl").attr('href', url);
        $("#savedUrl").show();
        //var whatAppRef = 'whatsapp://send?text=' + encodeURIComponent(url);
        //$("#whatsApp").attr('href', whatAppRef);
      	return url;
      },
      error: function(data) {
      	console.log("Error uploading image " + data);
        $("#savedUrl").hide();
        return null;
      },
      beforeSend: function (xhr) {
          xhr.setRequestHeader("Authorization", "Bearer " + imgUrToken);
      }
    });
  }
}





// original from: http://jsfiddle.net/Haelle/v6tfp2e1
class DrawInCanvas {
  constructor(canvasSelector, containerSelector) {
  	this.canvasSelector = canvasSelector;
    this.containerSelector = containerSelector;
    this.canvas = $(canvasSelector)[0];
    this.initVars();
    this.initEvents();
  }

  initVars() {
    this.ctx = this.canvas.getContext("2d");
    this.isMouseClicked = false;
    this.isMouseInCanvas = false;
    this.prevX = 0;
    this.currX = 0;
    this.prevY = 0;
    this.currY = 0;
  }

  initEvents() {
  	$(this.canvasSelector).on("touchmove", (e) => this.onMouseMove(e));
    $(this.canvasSelector).on("mousemove", (e) => this.onMouseMove(e));
    $(this.canvasSelector).on("touchstart", (e) => { this.onMouseEnter(e); this.onMouseDown(e); });
    $(this.canvasSelector).on("mousedown", (e) => this.onMouseDown(e));
    $(this.canvasSelector).on("touchend", () => { this.onMouseUp(); this.onMouseOut(); });
    $(this.canvasSelector).on("mouseup", () => this.onMouseUp());
    $(this.canvasSelector).on("mouseout", () => this.onMouseOut());
    $(this.canvasSelector).on("mouseenter", (e) => this.onMouseEnter(e));
  }
  
  onMouseDown(e) {
  	this.isMouseClicked = true;
    this.updateCurrentPosition(e);
  }
  
  onMouseUp() {
  	this.isMouseClicked = false;
  }
  
  onMouseEnter(e) {
  	this.isMouseInCanvas = true;
    this.updateCurrentPosition(e);
  }
  
  onMouseOut() {
  	this.isMouseInCanvas = false;
  }

  onMouseMove(e) {
    if (this.isMouseClicked && this.isMouseInCanvas) {
    	console.log("drawing");
    	this.updateCurrentPosition(e);
      this.draw();
    }
  }
  
  updateCurrentPosition(e) {
  		if (e.touches) {
  			e = e.touches[0];
      }
      this.prevX = this.currX;
      this.prevY = this.currY;
      this.currX = e.clientX - this.canvas.offsetLeft;
      this.currY = e.clientY - this.canvas.offsetTop;
  }
  
  draw() {
  	if (this.shouldDraw()) {
      this.ctx.beginPath();
      this.ctx.moveTo(this.prevX, this.prevY);
      this.ctx.lineTo(this.currX, this.currY);
      this.ctx.strokeStyle = penColor; 
      this.ctx.lineWidth = $("#thick").val();
      this.ctx.stroke();
      this.ctx.closePath();
    }
  }
  
  shouldDraw() {
  	return $(this.containerSelector).is(":hidden");
  }
}
