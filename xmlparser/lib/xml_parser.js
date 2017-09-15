function xmlReader() {

  this.xmlString = "";
  this.xmlArray  = [];
  this.pointer   = 0;
  this.size      = 0;

  // **************************************
  // Velneo v7 interface
  // **************************************
  this.atEnd       = function() { return ((this.pointer) === this.size-1); };
  this.name        = function() { return(this.getNodeName()); };
  this.text        = function() { return(this.getCurrent());  };
  this.readNext    = function() {
                        var nextElement = this.xmlArray[this.pointer+1];
                        return( nextElement ? this.tokenType(nextElement) : 0);
                     };
  this.tokenType = function(element) {
      var current = element || this.getCurrent();

      if (current.match(/<\/([^>]*)\s*>/g))           { return(5); }
      else if (current.match(/<\s*[^>\/]*\s*\/>/g)  ) { return(0); }
      else if (current.match(/<([^>]*)>/g))           { return(4); }
      else { return (6); }
  };

  this.addDataString = function(xmlString) {
      var isXmlHeader;

      this.xmlString = xmlString;
      this.xmlArray  = _.select(xmlString.replace(/<([^>]*)>/g, "__##__<$1>__##__").split("__##__"), function(el) {
                          isXmlHeader = el.match(/<\?xml/);
                          return( el.trim() !== "" && isXmlHeader === null );
                       });
      this.xmlArray  = _.map(this.xmlArray, function(el) { return(el.trim()); });                      
      this.size      = this.xmlArray.length;
  };

  // **************************************
  // Private methods
  // **************************************
  this.moveNext    = function() { this.pointer++; };
  this.getCurrent  = function() { return(this.xmlArray[this.pointer]); };
  this.getNodeName = function() {
                      return( ((this.getCurrent().match(/<\s*[^\s>\/]+:([^\s>\/]+)\s*/) || this.getCurrent().match(/<\s*([^\s>\/]+)\s*/) || [])[1] || "").trim() );
                     };
  this.getAttrs = function() {
      var element = this.getCurrent(),
        attrRegx  = /\s+([^=\s]+)="*'*([^="']+)"*'*/g,
        attrs     = {},
        param;

      while (param = attrRegx.exec(element)) {
          key = param[1].split(":")[1] || param[1];
          attrs[key] = param[2];
      }
      return (attrs);
  };
}

function parseXML(xmlString) {
  xml = new xmlReader();
  xml.addDataString(xmlString);

  var superJson    = "",
      pendingClose = false,
      element, attrs, jsonAttr, next;

  _.each(xml.xmlArray, function() {
      var type = xml.tokenType();

      switch (type) {
        case 0:
              element  = xml.name();
              attrs    = xml.getAttrs();
              jsonAttr = Object.keys(attrs).length > 0 ? {_attrs: attrs} : {};

              superJson += "\"" + element + "\": " + JSON.stringify(jsonAttr);
              if (next == 4) { superJson += ", "; }
          break;
        case 4:
              element = xml.name();
              attrs   = xml.getAttrs();
              next    = xml.readNext();

          if ( Object.keys(attrs).length > 0 ) {
              if (next == 4) { superJson += "\"" + element + "\": { \"_attrs\": " + JSON.stringify(attrs) + ", "; }
              if (next == 6 && element.trim() != "") {
                  superJson += "\"" + element + "\": { \"_attrs\": " + JSON.stringify(attrs) + ", \"_text\": ";
                  pendingClose = true;
                }
              if (next == 5) { superJson += "\"" + element + "\": { \"_attrs\": " + JSON.stringify(attrs) + "} "; }
          } else {
              if (next == 4) { superJson += "\"" + element + "\": {"; }
              if (next == 6 && element.trim() != "") { superJson += "\"" + element + "\":"; }
              if (next == 5) { superJson += "\"" + element + "\": 0"; }
          }

          break;
        case 5:
              element = xml.name();
              next    = xml.readNext();

          if (pendingClose) {
              pendingClose = false;
              superJson += "}";
          }
          if (next == 5) { superJson += " }"; }
          if (next == 4) { superJson += ", "; }
          break;
        case 6:
          if (xml.text().trim() != "") {
            superJson += "\"" + encodeURIComponent(xml.text()) + "\"";
          }
          if ( xml.readNext() == 0 ) { superJson += ", "; }
          break;
      }

      xml.moveNext();
  });

  return(decodeURIComponent("{" + superJson + "}"));
}


_ = {
	intersect: function(a,b) {
		var t;
		if (b.length > a.length) t = b, b = a, a = t;
		return a.filter(function (e) {
			if (b.indexOf(e) !== -1) return true;
		});
	},
	find: function(array, filter) {
			var z 	   = array.length,
				item;

			for( var i=0; i < z; i++ ) {
				item = array[i];
				if ( filter(array[i]) ) { return(item); }
			}
			return(null);
	},
	each: function(array, callback) {
			var x = [],
				z = array.length,
				record;

			for( var i=0; i < z; i++ ) { callback(array[i]); }
	},
	map: function(array, callback) {
			var x = [],
				z = array.length,
				record;

			for( var i=0; i < z; i++ ) {x.push(callback(array[i])); }
			return x;
	},
  select: function(array, callback) {
		var x = [],
			z = array.length,
			record;

		for( var i=0; i < z; i++ ) {
			record = array[i];
			if ( callback(record) ) { x.push(record); }
		}
		return(x);
  }
};

exports.xmlReader = xmlReader;
exports.parseXML  = parseXML;
