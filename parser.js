var comicid = 0;
var refNum = 0;
var refs = [];

function wikiparse(wikitext, num){
  comicid = num;

  var lines = wikitext.split(/\r?\n/);
  var html = "";

  var bulletLevel = 0; //level of bullet points
  var quotes = 0; //previous line was quote

  var tablerow = false; //true if currently in table row

  for(var i = 0; i < lines.length; i++){
    var line = lines[i];
    if(line !== ""){
      line = convertLine(line); //perform simple inline parsing

      if(line[0] === "*"){ //bullet points
        var bulletNum = line.match(/^\*+/)[0].length; //number of * in front of string
        line = "<li>" + line.replace(/^\*+ */, "") + "</li>";

        if(bulletLevel < bulletNum){ //start of new level of bulleting
          line = "<ul>" + line;
          bulletLevel++;
        }
        else if(bulletLevel > bulletNum){ //end of level
          line = "</ul>" + line;
          bulletLevel--;
        }
      }
      else if(bulletLevel > 0){ //end of bulleting
        line = "</ul><p>" + line + "</p>";
        bulletLevel--;
      }

      else if(line[0] === ":"){ //quotes
        line = "<dd>" + line.substring(1) + "</dd>";

      	if(!quotes){ //start of quote
        	line = "<dl>" + line;
          quotes = 1;
        }
      }
      else if(quotes){ //end of quote
      	line = "</dl><p>" + line + "</p>";
        quotes = 0;
      }

      else if(line[0] === '{' && line[1] === '|'){ //tables
        line = "<table " + line.substring(2) + ">";
      }
      else if(line[0] === '|' && line[1] == '-'){ //start of table row
        line = "";
        tablerow = true;
      }
      else if(line[0] === '|' && line[1] === '}'){ //end of table
        line = "</table>"; //no rows?
        tablerow = false;
      }
      else if(line[0] === '!'){ //table heading
        line = "<th>" + line.substring(1).replace(/!!/g, "</th><th>") + "</th>";
        if(tablerow){
          line = "<tr>" + line + "</tr>";
          tablerow = false;
        }
      }
      else if(line[0] === '|'){ //table cell
        line = "<td>" + line.substring(1).replace(/\|\|/g, "</td><td>") + "</td>";
        if(tablerow){
          line = "<tr>" + line + "</tr>";
          tablerow = false;
        }
      }

      else line = "<p>" + line + "</p>"; //regular text


      html += line;
    }
  }

  if(refNum > 0) {
    var refFormatted = "<div class='references'><ol>";
    for(var i = 0; i < refs.length; i++) {
      refFormatted += "<li id='note-" + i + "'><a href='#ref-" + i + "'>↑</a><span>" + refs[i] + "</span></li>";
    }
    refFormatted += "</ol></div>";
    html += refFormatted;
  }
  return html;
}


function convertLine(line){ //replace simple inline wiki markup
  //headings and subheadings
  //format ==<text>== -> <h2>, ===<text>=== -> h3, etc.
  if(line[0] === '=' && line[line.length - 1] === '='){
    var headingLeft = line.match(/^=+/)[0].length; //number of '='s on the left
    var headingRight = line.match(/=+$/)[0].length; //number of '='s on the right
    var headingNum = Math.min(headingLeft, headingRight);
    if(headingNum >= 1 && headingNum <= 6){
      line = "<h" + headingNum + ">" + line.substring(headingNum, line.length - headingNum) + "</h" + headingNum + ">";
    }
  }

  //link to another xkcd comic
  //format: [[<id>: <title]] or [[<id>: <title>|<id>]]
  line = line.replace(/\[\[([0-9]+): [^\]]+(|\1)?\]\]/g, convertComicLink);

  //link to within explain page
  //format: [[#<heading>|<display>]]
  line = line.replace(/\[\[#[^\]]+\]\]/g, convertHeadingLink);

  //internal links
  //format: [[<target>]] or [[<target>|<display>]]
  line = line.replace(/\[\[[^\]]+\]\]/g, convertInternalLink);

  // citation needed
  //format: {{Citation needed}}
  line = line.replace(/{{Citation needed}}/g, convertCitationLink);

  //what if links
  //format: {{what if|<id>|<title>}}
  line = line.replace(/{{what if(\|[^\|]+){1,2}}}/g, convertWhatIfLink);

  //wikipedia links
  //format: {{w|<target>}} or {{w|<target>|<display>}} (or W)
  line = line.replace(/{{[wW](\|[^}]+){1,2}}}/g, convertWikiLink);

  //tvtropes links
  //format: {{tvtropes|<target>|<display>}}
  line = line.replace(/{{tvtropes(\|[^}]+){2}}}/g, convertTropesLink);

  //other external links
  //format: [http://<url>] or [http://<url> <display>] (includes https)
  line = line.replace(/\[((http|https):)?\/\/([^\]])+]/g, convertOtherLink);

  //references
  line = line.replace(/<ref>.+<\/ref>/g, convertRefLink);

  //bold
  //format: '''<text>'''
  line = line.replace(/'''(?:(?!''').)+'''/g, convertBold);

  //italics
  //format: ''<text>'' or ''<text>
  line = line.replace(/''[^('')\n]+''/g, convertItalics)
             .replace(/''.+/g, convertItalics);
  return line;
}

function convertComicLink(link){
  var firstSep = link.indexOf(":");
  var secondSep = link.indexOf("|");
  var id = link.substring(2, firstSep);
  var display = "";
  if(secondSep === -1) {
    var title = link.substring(firstSep + 2, link.length - 2);
    display = id + ": " + title;
  }
  else {
    display = link.substring(secondSep + 1, link.length - 2);
  }
  return '<a href="https://xkcd.com/' + id + '">' + display + '</a>';
}

function convertHeadingLink(link){
  var target = link.substring(3, link.length-2);
  var display = "";
  var separator = target.indexOf("|");
  if(separator === -1){
    display = target;
  }
  else{
    display = target.substring(separator + 1);
    target = target.substring(0, separator);
  }
  return '<a href="http://www.explainxkcd.com/' + comicid + '#' + encodeURIComponent(target) + '" title="' + target + '">' + display + '</a>';
}

function convertInternalLink(link){
  var target = link.substring(2, link.length-2);
  var display = "";
  var separator = target.indexOf("|");
  if(separator === -1){
    display = target;
  }
  else{
    display = target.substring(separator + 1);
    target = target.substring(0, separator);
  }
  return '<a href="http://www.explainxkcd.com/wiki/index.php/' + encodeURIComponent(target) + '" title="' + target + '">' + display + '</a>';
}

function convertCitationLink(){
  return '<sup>[<a href="/285" title="285" class="mw-redirect"><i>citation needed</i></a>]</sup>';
}

function convertWhatIfLink(link){
  var firstSep = link.indexOf("|") + 1;
  var secondSep = link.indexOf("|", firstSep);

  var id = link.substring(firstSep, secondSep);
  var title = link.substring(secondSep + 1, link.length - 2);

  return '<a rel="nofollow" href="http://what-if.xkcd.com/' + id + '">' + title + '</a>';
}

function convertWikiLink(link){
  var target = link.substring(4, link.length-2);
  var display = "";
  var separator = target.indexOf("|");
  if(separator === -1){
    display = target;
  }
  else{
    display = target.substring(separator + 1);
    target = target.substring(0, separator);
  }
  return '<a href="http://en.wikipedia.org/wiki/' + encodeURIComponent(target) + '" title="wikipedia:' +  target + '">' + display + '</a>';
}

function convertTropesLink(link){
  var firstSep = link.indexOf("|") + 1;
  var secondSep = link.indexOf("|", firstSep);

  var target = link.substring(firstSep, secondSep);
  var display = link.substring(secondSep + 1, link.length - 2);

  return '<a rel="nofollow" class="external text" href="http://tvtropes.org/pmwiki/pmwiki.php/Main/' + target + '">' +
           '<span style="background: #eef;" title="Warning: TV Tropes. See comic 609.">' + display + '</span>' +
         '</a>';
}

function convertOtherLink(link){
  var separator = link.indexOf(" ");
  var target = "";
  var display = "";
  if(separator === -1){
    target = link.substring(1, link.length - 1);
    display = "[X]";
  }
  else{
    target = link.substring(1, separator);
    display = link.substring(separator + 1, link.length - 1);
  }
  return '<a rel="nofollow" href="' + encodeURI(target) + '">' + display + '</a>';
}

function convertRefLink(link) {
  var display = link.substring(5, link.length - 6);
  console.log(display);
  refNum++;
  refs.push(display);
  return "<sup id='ref-" + (refNum - 1) + "'><a href='#note-" + (refNum - 1) + "'>[" + refNum + "]</a></sup>";
}

function convertBold(text){
  return "<b>" + text.substring(3, text.length - 3) + "</b>";
}

function convertItalics(text){
  if(text.substr(-2) === "''") {
    return "<i>" + text.substring(2, text.length - 2) + "</i>";
  }
  return "<i>" + text.substring(2) + "</i>";
}
