/**
 * This file will automatically be loaded by webpack and run in the "renderer" context.
 * To learn more about the differences between the "main" and the "renderer" context in
 * Electron, visit:
 *
 * https://electronjs.org/docs/tutorial/application-architecture#main-and-renderer-processes
 *
 * By default, Node.js integration in this file is disabled. When enabling Node.js integration
 * in a renderer process, please be aware of potential security implications. You can read
 * more about security risks here:
 *
 * https://electronjs.org/docs/tutorial/security
 *
 * To enable Node.js integration in this file, open up `main.js` and enable the `nodeIntegration`
 * flag:
 *
 * ```
 *  // Create the browser window.
 *  mainWindow = new BrowserWindow({
 *    width: 800,
 *    height: 600,
 *    webPreferences: {
 *      nodeIntegration: true
 *    }
 *  });
 * ```
 */

import './index.css';

console.log('👋 This message is being logged by "renderer.js", included via webpack');
import ePub, { Rendition } from 'epubjs';
import { app, ipcRenderer } from 'electron';

function getSearchParameters() {
  var prmstr = window.location.search.substr(1);
  return prmstr != null && prmstr != "" ? transformToAssocArray(prmstr) : new Map();
}
console.log('rawUrl:' + JSON.stringify(window.location));

function transformToAssocArray(prmstr: string) {
  var params = new Map();
  var prmarr = prmstr.split("&");
  for (var i = 0; i < prmarr.length; i++) {
    var tmparr = prmarr[i].split("=");
    params.set(tmparr[0], tmparr[1]);
  }
  return params;
}

var params = getSearchParameters();


var sm = params.get("args");
console.log("args:" + JSON.stringify(sm));





// Load the opf
if (sm == "") {
  window.alert("请打开一个epub文件");
  ipcRenderer.send('close-me');
} else {
  var book = ePub(sm);
  var rendition = book.renderTo("viewer", {
    width: "100%",
    height: 800,
    spread: "always"
  });

  rendition.display(undefined);






  book.ready.then(() => {


    window.addEventListener("resize", () => rendition.resize(window.innerWidth, window.innerHeight));

    var next = document.getElementById("next");

    next.addEventListener("click", function (e) {
      rendition.next();
      e.preventDefault();
    }, false);

    var prev = document.getElementById("prev");
    prev.addEventListener("click", function (e) {
      rendition.prev();
      e.preventDefault();
    }, false);

    var keyListener = function (e: { keyCode: any; which: any; }) {

      // Left Key
      if ((e.keyCode || e.which) == 37) {
        rendition.prev();
      }

      // Right Key
      if ((e.keyCode || e.which) == 39) {
        rendition.next();
      }

    };

    rendition.on("keyup", keyListener);
    document.addEventListener("keyup", keyListener, false);

  })

  var title = document.getElementById("title");

 /*  rendition.on("rendered", function (section: { href: string; }) {
    var current = book.navigation && book.navigation.get(section.href);

    if (current) {
      var $select = document.getElementById("toc");
      var $selected = $select.querySelector("option[selected]");
      if ($selected) {
        $selected.removeAttribute("selected");
      }

      var $options = $select.querySelectorAll("option");
      for (var i = 0; i < $options.length; ++i) {
        let selected = $options[i].getAttribute("ref") === current.href;
        if (selected) {
          $options[i].setAttribute("selected", "");
        }
      }
    }

  }); */

  rendition.on("relocated", function (location: { atEnd: any; atStart: any; }) {
    console.log(location);

    var next = document.getElementById("next");
    var prev = document.getElementById("prev");

    if (location.atEnd) {
      next.style.visibility = "hidden";
    } else {
      next.style.visibility = "visible";
    }

    if (location.atStart) {
      prev.style.visibility = "hidden";
    } else {
      prev.style.visibility = "visible";
    }

  });

  rendition.on("layout", function (layout: { spread: any; }) {
    let viewer = document.getElementById("viewer");

    if (layout.spread) {
      viewer.classList.remove('single');
    } else {
      viewer.classList.add('single');
    }
  });


}