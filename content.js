function transformTable() {

    // 判斷網頁標題是否為"7-ELEVEN 交貨便服務單"
    if (document.title == '7-ELEVEN 交貨便服務單') {
        // 處理表格
        Process7ElevenTable();
    }

    // 判斷網頁標題是否為"全家店到店寄件單"
    if (document.title == '全家店到店寄件單') {
        // 處理表格
        ProcessFamilyMartTable();
    }

}

function Process7ElevenTable() {
    var style = document.createElement('style');
    style.textContent = `
    @media print {
        body {
          width: 100%;
          margin: 0;
          padding: 0;
        }
      
        #Print > table {
          width: 100%;
          table-layout: fixed;
          margin-left: auto;
          margin-right: auto;
        }
      
        #Print > table > tr {
          page-break-inside: avoid; /* 避免 tr 跨頁 */
          page-break-after: always; /* 每個 tr 後換頁 */
        }
      
        #Print > table > tr > td {
          width: 10cm;
          height: 15cm;
          text-align: center;
          vertical-align: middle;
          page-break-inside: avoid; /* 避免 td 內容跨頁 */
        }

        #Print > table > tr > td > div {
            /* 水平置中 */
            margin-left: auto;
            margin-right: auto;
            width: fit-content;
            height: fit-content;
        }
      }
    `;
    document.head.appendChild(style);



    var directTdChildren = document.querySelectorAll('#Panel1 > table > tbody > tr > td');

    // 建立一個新的 div 元素, ID 為 Print
    var newDiv = document.createElement('div');
    newDiv.id = 'Print';
    document.body.appendChild(newDiv);

    // 建立新的 table 元素
    var newTable = document.createElement('table');
    newTable.id = 'newTable';
    newDiv.appendChild(newTable);

    var scale = 1;
    var w = 330 * scale;
    var h = 540 * scale;

    for (var i = 0; i < directTdChildren.length; i++) {
        var td = directTdChildren[i];

        // 如果 td 沒有內容, 則跳過
        if (td.innerHTML.trim() === '') {
            continue;
        }

        // 建立新的 tr 元素
        var newTr = document.createElement('tr');
        newTable.appendChild(newTr);

        // 建立新的 td 元素
        var newTd = document.createElement('td');
        newTd.style.width = w + 'px';
        newTd.style.height = h + 'px';
        newTr.appendChild(newTd);


        // 建立新的 div 元素
        var newDiv = document.createElement('div');
        newDiv.style.overflow = 'hidden';
        newDiv.style.width = w + 'px';
        newDiv.style.height = 'fit-content';
        newDiv.style.margin = '10px auto 0 auto';
        newTd.appendChild(newDiv);

        // 將 td 內的內容移動到新的 div 元素中
        newDiv.innerHTML = td.innerHTML.trim();

        // 移除 td 的內建 style
        td.removeAttribute('style');
    }

    // 移除 Panel1 元素
    var panel1 = document.getElementById('Panel1');
    panel1.remove();
}

function ProcessFamilyMartTable() {
    
    var style = document.createElement('style');
    style.textContent = `
    body {
        width: 100%;
        margin: 0;
        padding: 0;
    }

    @media print {
      
        #Print > table {
          width: 100%;
          table-layout: fixed;
          margin-left: auto;
          margin-right: auto;
        }
      
        #Print > table > tr {
          page-break-inside: avoid; /* 避免 tr 跨頁 */
          page-break-after: always; /* 每個 tr 後換頁 */
        }
      
        #Print > table > tr > td {
          width: 10cm;
          height: 15cm;
          text-align: center;
          vertical-align: middle;
          page-break-inside: avoid; /* 避免 td 內容跨頁 */
        }
      }

      #Print > table > tr > td > div {
        outline: 5px solid white;
        outline-offset: -5px;
      }
    `;
    document.head.appendChild(style);

    // 建立一個新的 div 元素, ID 為 Print
    var newDiv = document.createElement('div');
    newDiv.id = 'Print';
    document.body.appendChild(newDiv);

    // 建立新的 table 元素
    var newTable = document.createElement('table');
    newTable.id = 'newTable';
    newDiv.appendChild(newTable);

    // 取得所有的 img 元素
    var imgs = document.querySelectorAll('img');

    var scale = 1;
    var w = 330 * scale;
    var h = 540 * scale;

    for (var i = 0; i < imgs.length; i++) {
        var img = imgs[i];
        
        for (var y = 0; y < 2; y++) {
            for (var x = 0; x < 2; x++) {
                // 建立新的 tr 元素
                var newTr = document.createElement('tr');
                newTable.appendChild(newTr);

                // 建立新的 td 元素
                var newTd = document.createElement('td');
                newTd.style.width = h/15*10 + 'px';
                newTd.style.height = h + 'px';
                newTr.appendChild(newTd);

                // 建立新的 div 元素
                var newDiv = document.createElement('div');
                newDiv.style.overflow = 'hidden';
                newDiv.style.width = w + 'px';
                newDiv.style.height = h + 'px';
                newDiv.style.margin = '10px auto 0 auto';

                // 建立新的 img 元素
                var newImg = document.createElement('img');
                newImg.src = img.src;
                newImg.style.objectPosition = (-w * x) + 'px ' + (-h * y) + 'px';
                newImg.style.width = '200%';
                newImg.style.height = '200%';

                // 將 img 元素加入到 div 元素中
                newDiv.appendChild(newImg);

                // 將 div 元素加入到 td 元素中
                newTd.appendChild(newDiv);
            }
        }

        // 移除 img 元素
        img.remove();
    }

    // 移除 Print 元素以外的所有元素
    var bodyChildren = document.body.children;
    for (var i = 0; i < bodyChildren.length; i++) {
        var child = bodyChildren[i];
        if (child.id != 'Print') {
            child.remove();
        }
    }

}

window.onload = transformTable;
