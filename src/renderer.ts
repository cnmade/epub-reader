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

import jQuery from 'jquery';
console.log('👋 This message is being logged by "renderer.js", included via webpack');
import ePub, { NavItem, Rendition } from 'epubjs';
import { app, ipcRenderer } from 'electron';


//jQuery 无冲突
jQuery.noConflict();

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

if (sm == "" || sm == ".") {
  //dev
  sm = "file:///./rust.epub";
  //prod
  // sm = "";
}





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



  //菜单

  var tocArrow = document.getElementById("arrow_toc");
  tocArrow.addEventListener("mouseenter", () => {
    jQuery("#catalog").css("display", "block").css("overflow", "auto");

  });

  var tocDiv = document.getElementById("catalog");
  tocDiv.addEventListener("mouseleave", () => {
    jQuery("#catalog").css("display", "none").css("overflow", "hidden");
  });

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



  var recursionHandle = function (toc: NavItem[], doc: string[], i: number) {
    toc.forEach(function (chapter: NavItem) {
      doc.push('<p class="catalog-item catalog-item-' + i + '" data-catalog="' + chapter.href + '">' + chapter.label + '</p>')
      if (chapter.subitems && chapter.subitems.length) {
        i++
        recursionHandle(chapter.subitems, doc, i)
        i > 0 && i--
      }
    })

    return doc
  }

  rendition.on("rendered", function (section: { href: string; }) {
    var current = book.navigation && book.navigation.get(section.href);
    book.loaded.navigation.then(function (toc) {

      // 方式一 toc是一个多维数组，下面这种只能显示第一级的目录

      var catalogitem = '';
      /* toc.forEach(function (chapter: NavItem) {
        catalogitem += '<p class="catalog-item" data-catalog="' + chapter.href + '">' + chapter.label + '</p>';
        return "";
      });

      // 将拼接好的目录渲染到页面里       
      document.querySelector('#catalog').innerHTML = catalogitem */

      // 方式二 将所有的目录全部显示出来
      // 第一级的catalog-item-0
      // 第二级的catalog-item-1 以此类推...
      document.querySelector('#catalog').innerHTML = recursionHandle(toc.toc, [], 0).join('')

      // 点击跳转
      jQuery('.catalog-item').on('click', function () {
        // 当点击报错的时候，请看下面  杂项-目录跳转报错
        var url = jQuery(this).attr("data-catalog");
        console.log(url);
        rendition.display(url);
      });
    })





  });

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