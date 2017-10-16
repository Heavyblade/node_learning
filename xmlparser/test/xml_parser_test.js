var assert    = require('assert'),
    xmlReader = require("./../lib/xml_parser").xmlReader,
    Tree      = require("./../lib/xml_parser").Tree,
    Node      = require("./../lib/xml_parser").Node,
    goTo      = require("./../lib/xml_parser").goTo,
    xml2JSON  = require("./../lib/xml_parser").xml2JSON,
    expect    = require("expect.js"),
    xmlToTree = require("./../lib/xml_parser").xmlToTree;


describe('xml to JSON', function() {
    describe('#xmlReader', function() {
        var xmlparser = null;

        beforeEach(function(){
            xmlparser = new xmlReader(null);
        });

        it("should take and xml and decompose it", function() {
            xmlparser.addDataString("<element1 hola='mundo'>content1</element1>");
            expect(xmlparser.size).to.be(3);

            expect(xmlparser.xmlArray[0]).to.be("<element1 hola='mundo'>");
            expect(xmlparser.xmlArray[1]).to.be("content1");
            expect(xmlparser.xmlArray[2]).to.be("</element1>");
        });

        it("should be able to remove the comments from body", function() {
            xmlparser.addDataString("<element1 hola='mundo'><!-- hola mu -> ndo - ddd > -->content1</element1>");
            expect(xmlparser.size).to.be(3);

            expect(xmlparser.xmlArray[0]).to.be("<element1 hola='mundo'>");
            expect(xmlparser.xmlArray[1]).to.be("content1");
            expect(xmlparser.xmlArray[2]).to.be("</element1>");
        });

        it("should not be affected by blank spaces", function() {
            xmlparser.addDataString("\n<element1 hola='mundo'>\n\ncontent1\n</element1>\n");
            expect(xmlparser.size).to.be(3);

            expect(xmlparser.xmlArray[0]).to.be("<element1 hola='mundo'>");
            expect(xmlparser.xmlArray[1]).to.be("content1");
            expect(xmlparser.xmlArray[2]).to.be("</element1>");
        });

        it("should be able to access the first element", function() {
            xmlparser.addDataString("<element1 hola='mundo'>content1</element1>");
            expect(xmlparser.getCurrent()).to.be("<element1 hola='mundo'>");
        });

        it("should be able to get the currentNode name", function() {
            xmlparser.addDataString("<element1 hola='mundo'>content1</element1>");
            expect(xmlparser.name()).to.be("element1");
        });

        it("should be able to get the currentNode name with white space", function() {
            xmlparser.addDataString("< element1 hola='mundo'>content1</element1>");
            expect(xmlparser.name()).to.be("element1");
        });

        it("should be able to extract attrs from xmlNode", function() {
            xmlparser.addDataString("<element1 hola='mundo'>content1</element1>");
            expect( xmlparser.getAttrs().hola ).to.be("mundo");
        });

        it("should be able to extract attrs from xmlNode with multiple attrs", function() {
            xmlparser.addDataString("<element1 hola='mundo' name='node'>content1</element1>");
            expect( xmlparser.getAttrs().hola ).to.be("mundo");
            expect( xmlparser.getAttrs().name ).to.be("node");
        });

        it("should be able to accept nested double or single quotes in attrs", function() {
            xmlparser.addDataString("<element1 hola='mu\"ndo'>content1</element1>");
            expect( xmlparser.getAttrs().hola ).to.be("mu\"ndo");
        });

        it("should be able to extract attrs from with double quotes", function() {
            xmlparser.addDataString("<element1 hola=\"mundo\" name=\"node\">content1</element1>");
            expect( xmlparser.getAttrs().hola ).to.be("mundo");
            expect( xmlparser.getAttrs().name ).to.be("node");
        });

        it('should identify open element type simple', function() {
            var xml = "<hello>";
            xmlparser.addDataString(xml);
            expect(xmlparser.name()).to.be("hello");
        });

        it("should be able to identify the node type as v7 does", function() {
            xmlparser.addDataString("<element1 hola='mundo'>content1</element1>");

            expect(xmlparser.tokenType()).to.be(4);
            xmlparser.moveNext();
            expect(xmlparser.tokenType()).to.be(6);
            xmlparser.moveNext();
            expect(xmlparser.tokenType()).to.be(5);
        });

        it("should be able to detect the end of document", function() {
            xmlparser.addDataString("<element1 hola='mundo'>content1</element1>");

            expect(xmlparser.atEnd()).to.be(false);
            xmlparser.moveNext();
            expect(xmlparser.atEnd()).to.be(false);
            xmlparser.moveNext();
            expect(xmlparser.atEnd()).to.be(true);
        });

        it("should be able to find the close tag for the current tag", function() {
            xmlparser.addDataString("<node1><node2><node3></node3>/node2></node1>");
            expect(xmlparser.findClose()).to.be(5);
        });

        it("should be able to find the close tag for the current tag", function() {
            xmlparser.addDataString("<node1><node2></node2></node1>");
            expect(xmlparser.findClose()).to.be(3);
        });

        it("should be able to find the close tag for the current tag with inner matching", function() {
            xmlparser.addDataString("<node1><node2><node1></node1></node2></node1>");
            expect(xmlparser.findClose()).to.be(5);
        });

        it("should find a closed tag for a tag in the middel of the body", function(){
            xmlparser.addDataString("<node1><node2><node3></node3></node2></node1>");
            xmlparser.moveNext();
            expect(xmlparser.findClose()).to.be(4);
        });

        it("should identify if the current element belongs to an array", function() {
            xmlparser.addDataString("<node1><node2><node3></node3><node3></node3><node3></node3></node2></node1>");
            xmlparser.moveTo(2);
            expect(xmlparser.isArray()).to.be(true);
        });

        it("should find a close for a self closed tag", function() {
            xmlparser.addDataString("<node1><node2><node3/><node3/><node3/></node2></node1>");
            xmlparser.moveTo(2);
            expect(xmlparser.findClose()).to.be(2);
        });

        it("should identify array of self closed elements", function() {
            xmlparser.addDataString("<node1><node2><node3/><node3/><node3/></node2></node1>");
            xmlparser.moveTo(2);
            expect(xmlparser.isArray()).to.be(true);
        });

        it("should be able to extract simple strings from cdata", function() {
            var xml = `<node><![CDATA[ Within this Character Data block I can ]]></node>`;
            var removed = xmlparser.extractCDATA(xml);

            expect(removed).to.match(/cdata_1/);
            expect(xmlparser.cdata.cdata_1).to.eql(" Within this Character Data block I can ");
            expect(removed).to.eql("<node><![CDATA [cdata_1]]></node>");
        });

        it("should not try to extract cdata from commnets", function() {
            xmlparser.addDataString("<element1 hola='mundo'><!-- hola <![CDATA[ Within this Character Data block I can ]]> -->content1</element1>");
            expect(xmlparser.size).to.be(3);

            expect(xmlparser.xmlArray[0]).to.be("<element1 hola='mundo'>");
            expect(xmlparser.xmlArray[1]).to.be("content1");
            expect(xmlparser.xmlArray[2]).to.be("</element1>");
            expect(Object.keys(xmlparser.cdata).length).to.be(0);
        });
    });

    describe("#goTo", function() {
        it("should be able to navigate to first element", function() {
            var baseTree = new Tree({id: 0});

            baseTree._root.children.push( new Node({id: 1}) );
            expect(goTo([0], baseTree).data.id).to.be(0);
        });

        it("should be able to navigate to a deep node", function() {
            var baseTree = new Tree({id: 0});

            baseTree._root.children.push( new Node({id: 1}) );
            baseTree._root.children[0].children.push( new Node({id: 2}) );
            baseTree._root.children[0].children.push( new Node({id: 3}) );

            expect(goTo([0, 0, 1], baseTree).data.id).to.be(3);
        });
    });

    describe("#xmlToTree", function() {
        it("should be able to build a tree data structure from xml", function() {
            var xml = "<?xml version=\"1.0\" encoding=\"UTF-8\"?><node1 id='1'><node2 id='2'><node3 id='3'></node3></node2></node1>";

            xmlTree = xmlToTree(xml);
            expect(goTo([0, 0, 0], xmlTree).data.attrs.id).to.be('3');
        });

        it("should be able to parse arrays inside tags", function() {
            var xml = "<?xml version=\"1.0\" encoding=\"UTF-8\"?><node1 id='1'><node2 id='2'><node3 id='3'></node3><node3 id='4'></node3></node2></node1>";

            xmlTree = xmlToTree(xml);
            expect(goTo([0, 0, 0], xmlTree).data.attrs.id).to.be('3');
            expect(goTo([0, 0, 1], xmlTree).data.attrs.id).to.be('4');
        });

        it("should be able to attach the correct body text to the node", function() {
            var xml = "<?xml version=\"1.0\" encoding=\"UTF-8\"?><node1 id='1'><node2 id='2'><node3 id='3'>hola</node3><node3 id='4'>mundo</node3></node2></node1>";

            xmlTree = xmlToTree(xml);
            expect(goTo([0, 0, 0], xmlTree).data._text).to.be('hola');
            expect(goTo([0, 0, 1], xmlTree).data._text).to.be('mundo');
        });

        it("should be able to parse a one node xml", function() {
            var xml = "<element1>content1</element1>";
            xmlTree = xmlToTree(xml);
            expect(goTo([0], xmlTree).data._text).to.be('content1');
        });
    });

    describe("#xml2JSON", function() {
        it("should convert an xml to an equivalent json", function() {
            var json = xml2JSON("<element1>content1</element1>");
            expect(json).to.eql({element1: {_text: "content1"}});
        });

        it("should convert a xml with nested nodes", function() {
            var xml  = "<?xml version=\"1.0\" encoding=\"UTF-8\"?><node1 id='1'><node2 id='2'><node3 id='3'></node3></node2></node1>",
                json = xml2JSON(xml);

            expect(json).to.eql({node1: {_attrs: {id: '1'}, node2: {_attrs: {id: '2'}, node3: {_attrs: {id: '3'}}}}});
        });

        it("should convert a xml with array nodes", function() {
            var xml  = "<?xml version=\"1.0\" encoding=\"UTF-8\"?><node1 id='1'><node2 id='2'><node3 id='3'></node3><node3 id='4'></node3></node2></node1>",
                json = xml2JSON(xml);

            expect(json).to.eql({node1: {_attrs: {id: '1'}, node2: {_attrs: {id: '2'}, node3: [{_attrs: {id: '3'}}, {_attrs: {id: '4'}}]  }}});
        });
        it("should parse self referencing objects", function() {
            var json = xml2JSON("<element1/>");
            expect(json).to.eql({element1: {}});
        });

        it("should parse a self referncing object with siblings", function() {
           var json = xml2JSON("<element1>content1<element2/></element1>");
            expect(json).to.eql({element1: {_text: 'content1', element2: {}}});
        });

        it("should get attributes for an start element", function() {
            var json = xml2JSON("<element1 hola='mundo'>content1</element1>");
            expect(json).to.eql({element1: { _attrs: {hola: "mundo"}, _text: "content1"}});
        });

        it("should handle attrs with inner elements", function(){
            var json = xml2JSON('<hola valor1="nombre" valor2="nombre2"><other>mundo</other></hola>');
            expect(json).to.eql({hola: { _attrs: {valor1:"nombre", valor2:"nombre2"}, other: {_text: "mundo"}}});
        });

        it("should parse special characters on node name", function() {
            var json = xml2JSON("<m:element1>content1<element2/></element1>");
            expect(json).to.eql({element1: { _text: "content1", element2: {}}});
        });
    });
});
