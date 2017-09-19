var assert    = require('assert'),
    xmlReader = require("./../lib/xml_parser").xmlReader,
    parseXML  = require("./../lib/xml_parser").parseXML,
    expect    = require("expect.js");

describe('xml to JSON', function() {
  describe('#xmlReader', function() {
          let xmlparser = null;

          beforeEach(function(){
              xmlparser = new xmlReader(null);
          });

          it("should take and xml and decompose it", function() {
              xmlparser.addDataString("<element1 hola='mundo'>content1</element1>")
              expect(xmlparser.size).to.be(3);

              expect(xmlparser.xmlArray[0]).to.be("<element1 hola='mundo'>");
              expect(xmlparser.xmlArray[1]).to.be("content1");
              expect(xmlparser.xmlArray[2]).to.be("</element1>");
          });

          it("should not be affected by blank spaces", function() {
              xmlparser.addDataString("\n<element1 hola='mundo'>\n\ncontent1\n</element1>\n")
              expect(xmlparser.size).to.be(3);

              expect(xmlparser.xmlArray[0]).to.be("<element1 hola='mundo'>");
              expect(xmlparser.xmlArray[1]).to.be("content1");
              expect(xmlparser.xmlArray[2]).to.be("</element1>");
          });

          it("should be able to access the first element", function() {
              xmlparser.addDataString("<element1 hola='mundo'>content1</element1>")
              expect(xmlparser.getCurrent()).to.be("<element1 hola='mundo'>");
          });

          it("should be able to get the currentNode name", function() {
              xmlparser.addDataString("<element1 hola='mundo'>content1</element1>")
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

          it("should be able to extract attrs from with double quotes", function() {
              xmlparser.addDataString("<element1 hola=\"mundo\" name=\"node\">content1</element1>");

              expect( xmlparser.getAttrs().hola ).to.be("mundo");
              expect( xmlparser.getAttrs().name ).to.be("node");
          });

          it('should identify open element type simple', function() {
              const xml = "<hello>";
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
    });

    describe("#parseXML", function() {

        it("should convert an xml to an equivalent json", function() {
            var json = parseXML("<element1>content1</element1>");

            expect(json).to.be(JSON.stringify({element1: "content1"}));
        });

        it("should parse self referencing objects", function() {
          var json = parseXML("<element1/>");

          expect(json).to.be('{"element1": {}}');
        });

        it("should parse a self referncing object with siblings", function() {
            var json = parseXML("<element1>content1<element2/></element1>");

            expect(json).to.be('{"element1":"content1", "element2": {}}');
        });

        it("should get attributes for an start element", function() {
            var json = parseXML("<element1 hola='mundo'>content1</element1>");

            expect(json).to.be('{"element1": { "_attrs": {"hola":"mundo"}, "_text": "content1"}}');
        });

        it("should handle attrs with inner elements", function(){
            var json = parseXML('<hola valor1="nombre" valor2="nombre2"><other>mundo</other></hola>');

            expect(json).to.be('{"hola": { "_attrs": {"valor1":"nombre","valor2":"nombre2"}, "other":"mundo" }}');
        });

        it("should parse special characters on node name", function() {
            var json = parseXML("<m:element1>content1<element2/></element1>");

            expect(json).to.be('{"element1":"content1", "element2": {}}');
        });
    });
});
