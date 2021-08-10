const {ipcRenderer} = require('electron');

jQuery.noConflict();

//定义book 常量
let book = ePub();

let rendition;


console.log('👋 This message is being logged by "renderer.js", included via webpack');


function getSearchParameters() {
    const prmstr = window.location.search.substr(1);
    return prmstr != null && prmstr != "" ? transformToAssocArray(prmstr) : new Map();
}

console.log('rawUrl:' + JSON.stringify(window.location));

function transformToAssocArray(prmstr) {
    const params = new Map();
    const prmarr = prmstr.split("&");
    for (let i = 0; i < prmarr.length; i++) {
        const tmparr = prmarr[i].split("=");
        params.set(tmparr[0], tmparr[1]);
    }
    return params;
}

function sharedDoOpenBook() {

    document.getElementById("viewer").innerHTML = "";

    rendition = book.renderTo("viewer", {
        width: "100%",
        height: 800,
        spread: "always"
    });

    rendition.display(undefined);


    //菜单

    jQuery("#arrow_toc").mouseenter(() =>{
        jQuery("#catalog")
            .css("display", "block")
            .css("overflow", "auto")
            .mouseleave(() => {
                jQuery("#catalog").css("display", "none");
            });
    })


    //书签

    jQuery("#bookmark").mouseenter(() => {
        jQuery("#bookmark-cc")
            .css("display", "block")
            .css("overflow", "auto")
            .mouseleave(() =>{
                jQuery("#bookmark-cc").css("display", "none");
            });
    });



    book.loaded.metadata.then(function(meta){
        //ipcRenderer.send('page-title-updated', meta.title);
        console.log("书名：" + meta.title+" – 作者: " + meta.creator);
        document.title = meta.title;
    });

    book.ready.then(() => {




        window.addEventListener("resize", () => rendition.resize(window.innerWidth, window.innerHeight));

        const next = document.getElementById("next");

        next.addEventListener("click", function (e) {
            rendition.next();
            e.preventDefault();
        }, false);

        const prev = document.getElementById("prev");
        prev.addEventListener("click", function (e) {
            rendition.prev();
            e.preventDefault();
        }, false);

        const keyListener = function (e) {

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

    const title = document.getElementById("title");


    const recursionHandle = function (toc, doc, i) {
        toc.forEach(function (chapter) {
            doc.push('<p class="catalog-item catalog-item-' + i + '" data-catalog="' + chapter.href + '">' + chapter.label + '</p>')
            if (chapter.subitems && chapter.subitems.length) {
                i++
                recursionHandle(chapter.subitems, doc, i)
                i > 0 && i--
            }
        })

        return doc
    };
    rendition.on("rendered", function (rendition, iframe) {


        //绑定滚动事件
        iframe.document.addEventListener('wheel', (event) => {
            console.log("mouse wheel:", event.deltaY);
            const delta = event.deltaY;
            if (delta > 0) { //鼠标滚轮向下
                console.log("mouse go next");
                document.getElementById("next").click();
            } else { //鼠标滚轮向上滚动
                console.log("mouse go prev");
                document.getElementById("prev").click();
            }
        });
    });
    rendition.on("rendered", function (section) {


        rendition.themes.default({"p": {"font-family": "crjk !important"}});


        const current = book.navigation && book.navigation.get(section.href);
        book.loaded.navigation.then(function (toc) {

            // 方式一 toc是一个多维数组，下面这种只能显示第一级的目录

            const catalogitem = '';
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
                const url = jQuery(this).attr("data-catalog");
                console.log(url);
                rendition.display(url);
            });


        })


    });

    rendition.on("relocated", function (location) {
        console.log(location);

        const next = document.getElementById("next");
        const prev = document.getElementById("prev");

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

    rendition.on("layout", function (layout) {
        const viewer = document.getElementById("viewer");

        if (layout.spread) {
            viewer.classList.remove('single');
        } else {
            viewer.classList.add('single');
        }
    });
}

//打开一本电子书
function doOpenBook(e) {

    var bookData = e.target.result;

    book.open(bookData)
    sharedDoOpenBook();
}


const params = getSearchParameters();


let sm = params.get("args");
console.log("args:" + JSON.stringify(sm));

if (sm == "" || sm == ".") {
    //dev
    // sm = "file:///./rust.epub";
    // sm = "file:///../bft.epub";
    //prod
    // sm = "";

}

console.log(sm);

// Load the opf
if (sm == "" || sm == ".") {
    // window.alert("请打开一个epub文件");
    // ipcRenderer.send('close-me');
    var inputElement = document.getElementById("ebook-selector");

    inputElement.addEventListener('change', function (e) {
        var file = e.target.files[0];
        if (window.FileReader) {
            var reader = new FileReader();
            reader.onload = doOpenBook;
            reader.readAsArrayBuffer(file);
        }
    });
} else {

    if (sm.indexOf("file:///") < 0) {
        sm = "file:///" + decodeURI(sm);
    }

    book.open(sm)
    sharedDoOpenBook();


}