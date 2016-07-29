function wikiparse(wikitext){
  var lines = wikitext.split(/\r?\n/);
  var html = "";

  var bulletLevel = 0; //level of bullet points

  for(var i = 0; i < lines.length; i++){
    var line = lines[i];
    if(line !== ""){
      line = convertLine(line);

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
      else line = "<p>" + line + "</p>";

      html += line;
    }
  }
  return html;
}


function convertLine(line){
  //subheading
  //format: ===<text>===
  if(line.substring(0, 3) === "===" && line.substring(line.length - 3) === "==="){
    line = "<h3>" + line.substring(3, line.length - 3) + "</h3>";
  }

  //heading
  //format: ==<text>==
  if(line.substring(0, 2) === "==" && line.substring(line.length - 2) === "=="){
    line = "<h2>" + line.substring(2, line.length - 2) + "</h2>";
  }

  //internal links
  //format: [[<target>]] or [[<target>|<display>]]
  line = line.replace(/\[\[[^\]]+\]\]/g, convertInternalLink);

  //what if links
  //format: {{what if|<id>|<title>}}
  line = line.replace(/{{what if(\|[^\|]+){1,2}}}/g, convertWhatIfLink);

  //wikipedia links
  //format: {{w|<target>}} or {{w|<target>|<display>}}
  line = line.replace(/{{w(\|[^}]+){1,2}}}/g, convertWikiLink);

  //other external links
  //format: [http://<url>] or [http://<url> <display>] (includes https)
  line = line.replace(/\[(http|https):\/\/([^\]])+]/g, convertOtherLink);

  //bold
  //format: '''<text>'''
  line = line.replace(/'''([^'])+'''/g, convertBold);

  //italics
  //format: ''<text>''
  line = line.replace(/''([^'])+''/g, convertItalics);
  return line;
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

  return '<a rel="nofollow" href="' + encodeURIComponent(target) + '">' + display + '</a>';
}

function convertBold(text){
  return "<b>" + text.substring(3, text.length - 3) + "</b>";
}

function convertItalics(text){
  return "<i>" + text.substring(2, text.length - 2) + "</i>";
}
