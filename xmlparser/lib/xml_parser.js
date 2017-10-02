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
  this.findClose   = function() {
                        var next            = this.pointer + 1,
                            currentNodeName = this.name(),
                            closedRegx      = new RegExp("<\s?\/\s?" + currentNodeName + "\s?>"),
                            toIgnore        = 0,
                            nextElement;

                        if ( this.tokenType() === 0 ) { return(this.pointer); }

                        while ( !(closedRegx.exec(this.xmlArray[next]) && toIgnore == 0) && next < this.size ) {
                            nextElement = this.xmlArray[next];
                            if ( this.tokenType(nextElement) == 4 && currentNodeName == this.getNodeName(nextElement) ) { toIgnore++; }
                            if ( closedRegx.exec(this.xmlArray[next]) ) { toIgnore--; }
                            next++;
                        }

                        return(next);
                     };
  this.isArray     = function() {
                        var closeTag = this.findClose();
                        return(this.name() === this.getNodeName( this.xmlArray[closeTag +1]));
                     };
  this.moveNext    = function() { this.pointer++; };
  this.moveTo      = function(to) { this.pointer = to; };
  this.getCurrent  = function() { return(this.xmlArray[this.pointer]); };
  this.getNodeName = function(element) {
                      var el = element || this.getCurrent();

                      return( ((el.match(/<\s*[^\s>\/]+:([^\s>\/]+)\s*/) || el.match(/<\s*([^\s>\/]+)\s*/) || [])[1] || "").trim() );
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

  this.tagToJSON = function() {
      return {name. this.name(), attrs: this.getAttrs()};
  }
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


function Node(data) {
    this.data = data;
    this.parent = null;
    this.children = [];
}

function Tree(data) {
    var node = new Node(data);
    this._root = node;
}

/*
 <node1>                     [0]
      <node2>                [0, 0]
          <node3>            [0, 0, 0]
              <node4>        [0, 0, 0, 0]
                  hola mundo
              </node4>       [0, 0, 0]
              <node4>        [0, 0, 0, 1]
                hola mundo
              </node4>       [0, 0, 0]
          </node3>           [0, 0]
          <node3>            [0, 0, 1]
            hola2 mundo2
          </node3>           [0, 0]
      </node2>               [0]
      <node5>                [0, 1]
        <node6>              [0, 1, 0]
          Hola mundo
        </node6>             [0, 1]
      </node5>               [0]
</node1>

{node1: {node2: {node3: [{_text: "hola mundo"}, {_text: "hola mudo2"}] }}}
*/

function xml_to_json(xmlString) {
    var xml = new xmlReader();

    xml.addDataString(xmlString);

    function goTo(path, node) {
        var item = path.shift();

        node   = node || tree.root;
        myNode = item ? node.children[item] : node;

        return path.length == 0 ? myNode : goTo(path, myNode);
    }

    function goTo(path, node) {
        if ( path.length === 1 ) { return(tree.root); }

    }

    /*********************
    * Initializing the tree
    ********************/
    var currentNode = new Node( xml.tagToJSON() ),
        tree        = new Tree(currentNode),
        path        = [0],
        parentNode;

    xml.moveNext();

    /*********************
     * parsing xml array
     ********************/
    while(!xml.atEnd()) {

        switch (xml.tokenType()) {
            case 4:
                    parentNode = goTo(path);
                    parentNode.children.push(new Node( xml.tagToJSON() ));
                    path.push( parentNode.length -1 );
                    break;
            case 0:
                    goTo(path).children.push(new Node( xml.tagToJSON() ));
                    break;
            case 6:
                    goTo(path).data._text = xml.name();
                    break;
            case 5:
                    path.pop();
                    break;
        }
        xml.ext();
    }
    return tree;
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
exports.xml_to_json = xml_to_json
