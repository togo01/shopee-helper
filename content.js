var isProcessed = false;
var isScriptInjected = false;

function transformTable() {

    if (isProcessed) {
        return;
    }

    // 判斷網頁標題是否為"7-ELEVEN 交貨便服務單"
    if (document.title.trim() == '7-ELEVEN 交貨便服務單') {
        // 處理表格
        Process7ElevenTable();
        isProcessed = true;
    }

    // 判斷網頁標題是否為"全家店到店寄件單"
    if (document.title.trim() == '全家店到店寄件單') {
        // 處理表格
        ProcessFamilyMartTable();
        isProcessed = true;
    }

    if (document.title == '蝦皮賣家中心') {

        console.log("蝦皮賣家中心");

        if (!isScriptInjected) {
            isScriptInjected = true;

        }


        var activePageItem = document.querySelectorAll("a.router-link-active.breadcrumb-name.active");

        if (activePageItem.length > 0) {

            var activePageName = activePageItem[0].innerText;

            console.log("activePageName: " + activePageName);

            if (activePageName == '訂單明細') {
                ActiveShopeePrintOrderFunc();
                // 取得自編碼
                GetProductCode();
            }

        }
    }

}

var alreadyGetProductCode = false;

function GetProductCode() { 

    if (alreadyGetProductCode) {
        return;
    }
    

    // 使用 fetch 呼叫 API http://localhost:8080/product_by_barcode?q=國際碼末五碼

    var items = document.querySelectorAll("div.product-list-item");

    // 在 qty 欄位後面加上一個新的欄位 stock
    var qty = document.querySelector("div.product-list-head > .qty");
    var stock = document.createElement("div");
    stock.className = "stock";
    stock.innerText = "庫存";
    stock.style.flex = "0 0 100px";
    stock.style.textAlign = "left";
    qty.after(stock);


    var totalQty = 0;
    for (var i = 1; i < items.length; i++) {
        let item = items[i];

        let itemTitle = item.querySelector("div.product-name");
        let itemMeta = item.querySelectorAll("div.product-meta > div");
        let itemMetaText = "";
        if (itemMeta != null && itemMeta.length > 0) {
            itemMeta.forEach(function (meta) {
                // 找到冒號
                let index = meta.innerText.indexOf(":");
                if (index != -1) {
                    itemMetaText = meta.innerText.substring(index + 1).trim() + ", " + itemMetaText;
                } else {
                    itemMetaText = meta.innerText.trim() + ", " + itemMetaText;
                }
            });
        }

        // 在 qty 欄位後面加上一個新的欄位 stock
        let qty = item.querySelector("div.qty");
        let stock = document.createElement("div");
        stock.className = "stock";
        stock.style.flex = "0 0 100px";
        stock.style.textAlign = "left";
        qty.after(stock);

        // 取得商品數量
        let itemQuantity = Number.parseInt(qty.innerText);

        // 使用 Regex 抓取出連續大於等於 5 碼數字
        let code = "";
        var reg = /\d{5,}/g;
        let testItemStr = itemMetaText + (itemTitle != null ? itemTitle.innerText : "");
        var result = reg.exec(testItemStr);
        
        if (result != null) {
            // 取出最後一個結果
            code = result[0];

            console.log("code: " + code);

            fetch('http://localhost:8080/product_by_barcode?q=' + code)
                .then(function (response) {
                    return response.json();
                })
                .then(function (data) {
                    var metaNode = item.querySelector("div.product-meta");
                    var productIdNode = metaNode.querySelector("div.product-id");
                    if (productIdNode != null) {
                        productIdNode.remove();
                    }
                    var productIdNode = document.createElement("span");
                    productIdNode.className = "product-id";
                    productIdNode.innerText = "自編碼: ";
                    metaNode.appendChild(productIdNode);

                    // 如果 data 不是陣列
                    if (!Array.isArray(data)) {
                        productIdNode.innerText += "查無資料";
                        return;
                    }

                    // 如果 data 是空陣列
                    if (data.length == 0) {
                        productIdNode.innerText += "查無資料";
                        return;
                    }

                    var productIndex = 0;

                    // 如果 data 陣列大於一個元素
                    if (data.length > 1) {
                    
                        // 如果 data 陣列有多個元素
                        // 用 data[].name 比對 testItemStr 看哪一個比較像
                        var maxScore = 0;
                        for (var i = 0; i < data.length; i++) {
                            var score = 0;
                            var name = data[i].name;
                            for (var j = 0; j < testItemStr.length; j++) {
                                if (name.indexOf(testItemStr[j]) != -1) {
                                    score++;
                                }
                            }
                            if (score > maxScore) {
                                maxScore = score;
                                productIndex = i;
                            }
                        }

                    }

                    // 將原始標題放置於 metaNode 最前方
                    var originTitle = document.createElement("span");
                    originTitle.innerText = "原始蝦皮標題: " + itemTitle.innerText;
                    metaNode.insertBefore(originTitle, metaNode.firstChild);

                    // 修改蝦皮商品名稱
                    itemTitle.innerText = data[productIndex].name;

                    // 產品名稱後加入國際碼後五碼
                    var endBarCode = data[productIndex].bar_code.substring(data[productIndex].bar_code.length - 5);
                    itemTitle.innerText = "(" + endBarCode + ") " + itemTitle.innerText;

                    // 顯示自編碼
                    productIdNode.innerText += data[productIndex].id;

                    // 取得庫存
                    var stockCounts = [0, 0, 0];
                    data[productIndex].stocks.forEach(function (stock) {
                        if (stock.store_id == '00') {
                            stockCounts[0] = stock.count;
                        } else if (stock.store_id == '01') {
                            stockCounts[1] = stock.count;
                        } else if (stock.store_id == '02') {
                            stockCounts[2] = stock.count;
                        }
                    });

                    // 製作三個庫存欄位
                    var stockNames = ["路竹倉", "路竹店", "岡山店"]
                    var stockItems = [];
                    for (var i = 0; i < 3; i++) {
                        var div = document.createElement("div");
                        div.className = "stock-item";
                        div.style.display = "flex";
                        div.style.justifyContent = "space-between";
                        div.style.width = "100%";
                        div.style.margin = "2px 0";
                        stockItems.push(div);

                        var span1 = document.createElement("span");
                        span1.className = "stock-name";
                        span1.style.color = "white";
                        span1.style.width = "50%";
                        span1.style.textAlign = "center";
                        span1.style.backgroundColor = "black";
                        span1.style.padding = "4px 0px";
                        span1.style.borderRadius = "10px 0 0 10px";
                        span1.innerText = stockNames[i];
                        div.appendChild(span1);

                        var span2 = document.createElement("span");
                        span2.className = "stock-count";
                        span2.style.width = "50%";
                        if (stockCounts[i] == 0) {
                            span2.style.backgroundColor = "lightgrey";
                        } else if (stockCounts[i] >= itemQuantity) {
                            span2.style.backgroundColor = "#6ee2c6";
                        } else {
                            span2.style.backgroundColor = "#eabc8e";
                        }
                        span2.style.textAlign = "right";
                        span2.style.padding = "4px 4px";
                        span2.style.borderRadius = "0 10px 10px 0";
                        span2.innerText = stockCounts[i];
                        div.appendChild(span2);

                        stock.appendChild(div);
                    }


                });
        } else {
            // 使用商品名稱查詢
            fetch('http://localhost:8080/product_by_name?q=' + itemTitle.innerText.trim())
                .then(function (response) {
                    return response.json();
                })
                .then(function (data) {
                    var metaNode = item.querySelector("div.product-meta");
                    var productIdNode = metaNode.querySelector("div.product-id");
                    if (productIdNode != null) {
                        productIdNode.remove();
                    }
                    var productIdNode = document.createElement("span");
                    productIdNode.className = "product-id";
                    productIdNode.innerText = "自編碼: ";
                    metaNode.appendChild(productIdNode);

                    // 如果 data 不是陣列
                    if (!Array.isArray(data)) {
                        productIdNode.innerText += "查無資料";
                        return;
                    }

                    // 如果 data 是空陣列
                    if (data.length == 0) {
                        productIdNode.innerText += "查無資料";
                        return;
                    }

                    var productIndex = 0;

                    // 如果 data 陣列大於一個元素
                    if (data.length > 1) {
                    
                        // 如果 data 陣列有多個元素
                        // 用 data[].name 比對 testItemStr 看哪一個比較像
                        var maxScore = 0;
                        for (var i = 0; i < data.length; i++) {
                            var score = 0;
                            var name = data[i].name;
                            for (var j = 0; j < testItemStr.length; j++) {
                                if (name.indexOf(testItemStr[j]) != -1) {
                                    score++;
                                }
                            }
                            if (score > maxScore) {
                                maxScore = score;
                                productIndex = i;
                            }
                        }

                    }

                    // 將原始標題放置於 metaNode 最前方
                    var originTitle = document.createElement("span");
                    originTitle.innerText = "原始蝦皮標題: " + itemTitle.innerText;
                    metaNode.insertBefore(originTitle, metaNode.firstChild);

                    // 修改蝦皮商品名稱
                    itemTitle.innerText = data[productIndex].name;

                    // 產品名稱後加入國際碼後五碼
                    var endBarCode = data[productIndex].bar_code.substring(data[productIndex].bar_code.length - 5);
                    itemTitle.innerText = "(" + endBarCode + ") " + itemTitle.innerText;

                    // 顯示自編碼
                    productIdNode.innerText += data[productIndex].id;

                    // 取得庫存
                    var stockCounts = [0, 0, 0];
                    data[productIndex].stocks.forEach(function (stock) {
                        if (stock.store_id == '00') {
                            stockCounts[0] = stock.count;
                        } else if (stock.store_id == '01') {
                            stockCounts[1] = stock.count;
                        } else if (stock.store_id == '02') {
                            stockCounts[2] = stock.count;
                        }
                    });

                    // 製作三個庫存欄位
                    var stockNames = ["路竹倉", "路竹店", "岡山店"]
                    var stockItems = [];
                    for (var i = 0; i < 3; i++) {
                        var div = document.createElement("div");
                        div.className = "stock-item";
                        div.style.display = "flex";
                        div.style.justifyContent = "space-between";
                        div.style.width = "100%";
                        div.style.margin = "2px 0";
                        stockItems.push(div);

                        var span1 = document.createElement("span");
                        span1.className = "stock-name";
                        span1.style.color = "white";
                        span1.style.width = "50%";
                        span1.style.textAlign = "center";
                        span1.style.backgroundColor = "black";
                        span1.style.padding = "4px 0px";
                        span1.style.borderRadius = "10px 0 0 10px";
                        span1.innerText = stockNames[i];
                        div.appendChild(span1);

                        var span2 = document.createElement("span");
                        span2.className = "stock-count";
                        span2.style.width = "50%";
                        if (stockCounts[i] == 0) {
                            span2.style.backgroundColor = "lightgrey";
                        } else if (stockCounts[i] >= itemQuantity) {
                            span2.style.backgroundColor = "#6ee2c6";
                        } else {
                            span2.style.backgroundColor = "#eabc8e";
                        }
                        span2.style.textAlign = "right";
                        span2.style.padding = "4px 4px";
                        span2.style.borderRadius = "0 10px 10px 0";
                        span2.innerText = stockCounts[i];
                        div.appendChild(span2);

                        stock.appendChild(div);
                    }

                    // 在 product-name 前加入標籤，表示需要在人工檢查
                    // <div class="product-tag shopee-tag shopee-tag__information shopee-tag--normal default"> 無編碼模糊搜尋反查，需人工再確認 </div>
                    var tag = document.createElement("div");
                    tag.className = "product-tag shopee-tag shopee-tag__information shopee-tag--normal default";
                    tag.innerText = "無編碼商品，以名稱模糊搜尋反查品項，需人工再確認";
                    itemTitle.before(tag);

                
                }
            );
        }

    }


    
    alreadyGetProductCode = true;
    

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

function ActiveShopeePrintOrderFunc() {

    // 紀錄是否已經加入按鈕
    var hasButton = document.getElementById("PrintShopeeOrderButton");
    if (hasButton != null) {
        return;
    }
    
    console.log("ActiveShopeePrintOrderFunc")


    var cards = document.querySelectorAll("div.card-header");
    if (cards.length == 0) {
        return;
    }

    // 找到 .card-title 為 進帳資訊 的 card
    var card = null;
    for (var i = 0; i < cards.length; i++) {
        var cardTitle = cards[i].querySelector("div.card-title");
        if (cardTitle.innerText == "進帳資訊") {
            card = cards[i];
            break;
        }
    }

    if (card == null) {
        return;
    }

    // <button type="button" class="fix-button shopee-button shopee-button--primary shopee-button--normal"><span> 列印出貨單 </span></button>
    var button = document.createElement('a');
    button.id = "PrintShopeeOrderButton";
    // button.type = "button";
    button.className = "fix-button shopee-button shopee-button--primary shopee-button--normal";
    button.innerHTML = "<span> 列印出貨單 </span>";
    button.style.marginLeft = "10px";
    
    card.appendChild(button);

    // 監聽按鈕的點擊事件
    button.addEventListener('click', function () {
        PrintShopeeOrder();
    });

    // button.click();

}

function PrintShopeeOrder() {

    // 放到最大
    var newWindow = window.open('', '', 'height='+screen.height + ' width='+screen.width);
    newWindow.document.write('<html><head><title>宗明藥局出貨單</title></head><body>');

    // <link href="https://fonts.cdnfonts.com/css/code-39-logitogo" rel="stylesheet">
    var link = newWindow.document.createElement('link');
    link.href = "https://fonts.cdnfonts.com/css/code-39-logitogo";
    link.rel = "stylesheet";
    newWindow.document.head.appendChild(link);

    // <link href="https://fonts.cdnfonts.com/css/code-128" rel="stylesheet">
    var link = newWindow.document.createElement('link');
    link.href = "https://fonts.cdnfonts.com/css/code-128";
    link.rel = "stylesheet";
    newWindow.document.head.appendChild(link);


    var style = newWindow.document.createElement('style');
    style.textContent = `

    * {
        font-size: 11px;
    }

    body {
        width: 10cm;
        margin: 0;
        padding: 0.75cm;
    }

    th {
    }


    table, th, td {
        border: 0px solid black;
        border-collapse: collapse;
        border-bottom: 1px solid black;
    }

    td, th {
        padding: 0.1cm;
    }

    table {
        border-collapse: collapse;
        width: 100%;

    }

    .right {
        text-align: right;
    }

    .center {
        text-align: center;
    }


    
    `;
    newWindow.document.head.appendChild(style);



    var orderSN = "未知訂單編號";
    document.querySelectorAll(".shopee-card__content > .section").forEach(function (section) {

        var sectionName = section.querySelector(".name");
        if (sectionName == null) {
            return;
        }

        if (sectionName.innerText == "訂單編號") {
            var sectionValue = section.querySelector(".body");
            if (sectionValue == null) {
                return;
            }
            orderSN = sectionValue.innerText;
        }
    });

    newWindow.document.write('<div id="title" style="text-align: center;font-size: 30px;font-weight: bold;">宗明藥局 - 出貨單</div>');

    newWindow.document.write('<div id="header" style="display: flex;flex-direction: row;align-items: center;justify-content: space-between;margin: 0.2cm 0;">');

    // font-family: monospace;font-size: 30px;
    newWindow.document.write('<div style="">');
    newWindow.document.write('<div id="order-sn" style="font-family: \'Code 39-hoch-Logitogo\', sans-serif; font-size: 25px; padding: 5px 0;">*' + orderSN + '*</div>');
    newWindow.document.write('<div id="order-sn" style="font-family: monospace;font-size: 20px; margin: 0 auto;">' + orderSN.substring(0, orderSN.length - 4) + '<span style="font-size: 20px;font-weight: bolder;border: solid 1px black; margin-left: 2px;">' + orderSN.substring(orderSN.length - 4) + '</span></div>');
    newWindow.document.write('</div>')

    // 黑底白字，圓角右上角顯示總商品數量
    newWindow.document.write('<div id="total-qty" style="background-color: #000000 !important;-webkit-print-color-adjust: exact;color: #FFFFFF;border-radius: 0.5cm;padding: 0.1cm 0.5cm;width: fit-content;font-size: 60px;float: right;font-family: monospace;font-weight: bold;">-</div>');

    newWindow.document.write('</div>')

    newWindow.document.write('<table>');

    var heads = ["商品", "", "單價", "數量", "小計"];
    var headMinWidths = [-1, 40, 6, 6, 6];
    var headTr = '<tr>';

    for (var i = 0; i < heads.length; i++) {
        if (headMinWidths[i] == -1) {
            headTr += '<th>' + heads[i] + '</th>';
        } else {
            headTr += '<th style="width: ' + headMinWidths[i] + 'mm;">' + heads[i] + '</th>';
        }
    }
    
    headTr += '</tr>';
    newWindow.document.write(headTr);

    var items = document.querySelectorAll("div.product-list-item");

    var totalQty = 0;
    for (var i = 1; i < items.length; i++) {
        var item = items[i];

        var itemTitle = item.querySelector("div.product-name");
        var itemMeta = item.querySelector("div.product-meta > div");
        var itemProductId = item.querySelector("div.product-meta > span.product-id");

        var itemTr = '<tr>';

        // 商品
        var itemMetaText = itemMeta != null ? itemMeta.innerText.trim() : "";
        

        // 使用 Regex 抓取出連續大於等於 5 碼數字
        var code = null;
        if (itemProductId != null) {
            code = itemProductId.innerText.substring(4);
        }
        // var reg = /\d{5,}/g;
        // var testItemStr = itemMeta != null ? itemMeta.innerText : "";
        // testItemStr += itemTitle != null ? itemTitle.innerText : "";
        // var result = reg.exec(testItemStr);
        
        if (code != null) {
            
            // 編號 code-128, Code A(ASCII:103), %, 12345, Stop(ASCII:106)
            var startCodeStr = 'Ë';
            var stopCodeStr = 'Î';
            var codeStr = code;
            var checkSum = 103;
            for (var j = 0; j < codeStr.length; j++) {
                var charCode = codeStr.charCodeAt(j) - 32;
                checkSum += charCode * (j + 1);
            }
            checkSum = checkSum % 103;
            codeStr = startCodeStr + codeStr;
            codeStr += String.fromCharCode(checkSum > 94 ? checkSum + 100 : checkSum + 32);
            codeStr += stopCodeStr;

            code = '<div style="height:20px; overflow: hidden;"><span style="font-family: \'Code 128\', sans-serif; font-size: 35px; padding: 0;">' + codeStr + '</span></div>';

            // itemTr += '<td class="center" style="font-family: \'Code 128\', sans-serif; font-size: 35px; padding: 0;">' + codeStr + '</td>';
        } else {
            code = itemMetaText;
            // itemTr += '<td class="center">N/A</td>';
        }
        
        itemTr += '<td>' + itemTitle.innerText + '</td>';
        itemTr += '<td>' + code + '</td>';

        // 單價
        var itemPrice = item.querySelector("div.price");
        itemTr += '<td class="right">' + itemPrice.innerText + '</td>';
        // 數量
        var itemQuantity = item.querySelector("div.qty");
        itemTr += '<td class="center">' + itemQuantity.innerText + '</td>';
        totalQty += parseInt(itemQuantity.innerText);
        // 小計
        var itemTotal = item.querySelector("div.subtotal");
        itemTr += '<td class="right">' + itemTotal.innerText + '</td>';

        itemTr += '</tr>';
        newWindow.document.write(itemTr);
    
    }

    // 總商品數量
    var totalQtyDiv = newWindow.document.getElementById("total-qty");
    totalQtyDiv.innerText = totalQty;

    var totalTr = '<tr>';
    // 總計
    var incomeValue = document.querySelector("div.income-value");
    totalTr += '<td class="right" colspan="' + heads.length + '">總計: ' + incomeValue.innerText + '</td>';

    totalTr += '</tr>';

    newWindow.document.write(totalTr);

    newWindow.document.write('</table></body></html>');
    newWindow.document.close();
    
    setTimeout(function () {
        newWindow.print();
        newWindow.close();
    }, 1000);

}


var timer;

var observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
        if (mutation.addedNodes.length) {
            // 檢查是否是你需要的元素或內容
            
        }
    });
    clearTimeout(timer);
    timer = setTimeout(function() {
        transformTable();
    }, 1000);
});

observer.observe(document.body, { childList: true, subtree: true });

console.log("content.js");

// 註冊載入事件，執行 transformTable
window.addEventListener('load', function () {
    transformTable();
});

//https://seller.shopee.tw/api/v3/order/get_one_order?SPC_CDS=912a3577-0877-4019-8f46-bbe0af23b4fa&SPC_CDS_VER=2&order_id=109596557367844
