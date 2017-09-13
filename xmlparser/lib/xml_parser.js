function xmlReader(the_root) {

  this.xmlString = "";
  this.xmlArray = [];
  this.pointer = 0;
  this.size = 0;

  this.atEnd       = function() { return ((this.pointer) === this.size-1); };
  this.moveNext    = function() { this.pointer++; }
  this.readNext    = function() {
                        var nextElement = this.xmlArray[this.pointer+1];
                        return( nextElement ? this.tokenType(nextElement) : 0);
                     };
  this.getCurrent  = function() { return(this.xmlArray[this.pointer]); };
  this.getNodeName = function() { return((this.getCurrent().match(/<\s*([\w\d]+)\s*/) || [])[1] || ""); };
  this.name        = function() { return(this.getNodeName()); };
  this.text        = function() { return(this.getCurrent());  };

  this.tokenType = function(element) {
      var current = element || this.getCurrent();

      if (current.match(/<\/([^>]*)\s*>/g)) { return (5); }
      else if (current.match(/<([^>]*)>/g)) { return (4); }
      else { return (6); }
  };

  this.addDataString = function(xmlString) {
      this.xmlString = xmlString;
      this.xmlArray  = _.select(xmlString.replace(/<([^>]*)>/g, "\n<$1>\n").split("\n"), function(el) { return(el.trim() !== ""); });
      this.size      = this.xmlArray.length;
  };

  this.getAttrs = function() {
      var element = this.getCurrent(),
        attrRegx  = /\s+([^=\s]+)="*'*([^="']+)"*'*/g,
        attrs     = {},
        param;

      while (param = attrRegx.exec(element)) { attrs[param[1]] = param[2]; }
      return (attrs);
  };
}

function parseXML(xmlString) {
  xml = new xmlReader();
  xml.addDataString(xmlString);

  var superJson = "";

  _.each(xml.xmlArray, function() {
      var type = xml.tokenType();

      switch (type) {
        case 4:
          var element = xml.name(),
              next    = xml.readNext();

          if (next == 4) { superJson += "\"" + encodeURIComponent(element) + "\": {"; }
          if (next == 6 && element.trim() != "") { superJson += "\"" + encodeURIComponent(element) + "\":"; }
          if (next == 5) { superJson += "\"" + encodeURIComponent(element) + "\": 0"; }

          break;
        case 5:
          var element = xml.name(),
              next    = xml.readNext();

          if (next == 5) { superJson += " }"; }
          if (next == 4) { superJson += ", "; }
          break;
        case 6:
          if (xml.text().trim() != "") {
            superJson += "\"" + encodeURIComponent(xml.text()) + "\"";
          }
          break;
      }

      xml.moveNext();
  });

  return ("{" + superJson + "}");
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
