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
    this.tokenType  = function(element) {
        var current = element || this.getCurrent();

        if (current.match(/<\/([^>]*)\s*>/g))           { return(5); }
        else if (current.match(/<\s*[^>\/]*\s*\/>/g)  ) { return(0); }
        else if (current.match(/<([^>]*)>/g))           { return(4); }
        else { return (6); }
    };

    this.addDataString = function(xmlString) {
        var isXmlHeader;

        this.xmlString = xmlString;
        this.xmlArray  = _.select(xmlString.replace(/<([^>]*)>/g, "__#&#__<$1>__#&#__").split("__#&#__"), function(el) {
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
        return {name: this.name(), attrs: this.getAttrs()};
    };
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

Tree.prototype.traverseDF = function(callback) {

    // this is a recurse and immediately-invoking function 
    (function recurse(currentNode) {
        // step 2
        for (var i = 0, length = currentNode.children.length; i < length; i++) {
            // step 3
            recurse(currentNode.children[i]);
        }

        // step 4
        callback(currentNode);

        // step 1
    })(this._root);
};

function whatIsIt(object) {
    var stringConstructor = "test".constructor,
        arrayConstructor  = [].constructor,
        objectConstructor = {}.constructor;

    if (object === null) { return "null"; }
    else if (object === undefined)                     { return "undefined"; }
    else if (object.constructor === stringConstructor) { return "String";    }
    else if (object.constructor === arrayConstructor)  { return "Array";     }
    else if (object.constructor === objectConstructor) { return "Object";    }
    else { return "don't know"; }
}

Tree.prototype.toJSON = function() {

    function buildJSON(currentNode){
          var base = {};

          if ( currentNode.data.attrs && Object.keys(currentNode.data.attrs).length > 0 ) { base._attrs = currentNode.data.attrs; }
          if ( currentNode.data._text ) { base._text  = currentNode.data._text; }

          for (var i = 0, length = currentNode.children.length; i < length; i++) {
              var child = currentNode.children[i];

              if ( whatIsIt(base[child.data.name]) === "undefined" ) {
                  base[child.data.name] = buildJSON(child);
              } else if ( whatIsIt(base[child.data.name]) === "Array"  ) {
                  base[child.data.name].push(buildJSON(child));
              } else {
                  base[child.data.name] = [base[child.data.name]];
                  base[child.data.name].push(buildJSON(child));
              }
          }
          return base;
    }

    var json = {};
    json[this._root.data.name] =  buildJSON(this._root);

    return json;
};

Tree.prototype.traverseBF = function(callback) {
    var queue = new Queue();

    queue.enqueue(this._root);

    currentTree = queue.dequeue();

    while(currentTree){
        for (var i = 0, length = currentTree.children.length; i < length; i++) {
            queue.enqueue(currentTree.children[i]);
        }

        callback(currentTree);
        currentTree = queue.dequeue();
    }
};

Tree.prototype.contains = function(callback, traversal) {
    traversal.call(this, callback);
};

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
*/

function goTo(path, tree, node) {
    if ( path.length === 1 && node === undefined ) { return(tree._root); }
    if ( node === undefined ) { path.shift(); }

    var item  = path.shift(),
       myNode = (node || tree._root).children[item];

    return path.length == 0 ? myNode : goTo(path, null, myNode);
}

function xmlToTree(xmlString) {
    var xml = new xmlReader();
    xml.addDataString(xmlString);

    /*********************
    * Initializing the tree
    **********************/
    var tree = new Tree( xml.tagToJSON() ),
        path = [0],
        parentNode, nodeChild;

    if ( xml.size > 1) {  xml.moveNext(); }

    /*********************
     * parsing xml array
     *********************/
    while(!xml.atEnd()) {
        switch (xml.tokenType()) {
            case 4:
                    parentNode = goTo(path.slice(0), tree);
                    nodeChild  = new Node(xml.tagToJSON());
                    nodeChild.parent = parentNode;

                    parentNode.children.push(nodeChild);
                    path.push( parentNode.children.length -1 );
                    break;
            case 0:
                    parentNode = goTo(path.slice(0), tree);
                    nodeChild  = new Node(xml.tagToJSON());
                    nodeChild.parent = parentNode;

                    parentNode.children.push(nodeChild);
                    break;
            case 6:
                    goTo(path.slice(0), tree).data._text = encodeURIComponent(xml.text());
                    break;
            case 5:
                    path.pop();
                    break;
        }
        xml.moveNext();
    }
    return tree;
}

function xml2JSON(xmlString) {
    return(xmlToTree(xmlString).toJSON());
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
        var z      = array.length,
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
exports.goTo      = goTo;
exports.xmlToTree = xmlToTree;
exports.Node      = Node;
exports.Tree      = Tree;
exports.xml2JSON  = xml2JSON;
