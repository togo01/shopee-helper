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

    var heads = ["#", "商品", "", "單價", "數量", "小計"];
    var headMinWidths = [5, -1, 7, 7, 7, 7];
    var headTr = '<tr>';

    for (var i = 0; i < heads.length; i++) {
        if (headMinWidths[i] == -1) {
            headTr += '<th style="text-align: left;">' + heads[i] + '</th>';
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

        // 編號
        itemTr += '<td class="center">' + i + '</td>';

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

        var itemCode = "";
        
        if (code != null) {
            
            // Image Src: http://127.0.0.1:8080/datamatrix?q=code

            itemCode = '<div style="height:30px; overflow: hidden;"><img src="http://127.0.0.1:8080/datamatrix?q=' + code + '" style="height: 100%;"></div>';


            // 編號 code-128, Code A(ASCII:103), %, 12345, Stop(ASCII:106)
            // var startCodeStr = 'Ë';
            // var stopCodeStr = 'Î';
            // var codeStr = code;
            // var checkSum = 103;
            // for (var j = 0; j < codeStr.length; j++) {
            //     var charCode = codeStr.charCodeAt(j) - 32;
            //     checkSum += charCode * (j + 1);
            // }
            // checkSum = checkSum % 103;
            // codeStr = startCodeStr + codeStr;
            // codeStr += String.fromCharCode(checkSum > 94 ? checkSum + 100 : checkSum + 32);
            // codeStr += stopCodeStr;

            // itemCode = '<div style="height:20px; overflow: hidden;"><span style="font-family: \'Code 128\', sans-serif; font-size: 35px; padding: 0;">' + codeStr + '</span></div>';

            // itemTr += '<td class="center" style="font-family: \'Code 128\', sans-serif; font-size: 35px; padding: 0;">' + codeStr + '</td>';
        } else {
            // code = itemMetaText;
            // itemTr += '<td class="center">N/A</td>';
        }

        var title = itemTitle.innerText;
        // 如果 title 開頭為 (\d+) , 則將 (\d+) 取出來
        var reg = /^(\(\d+\))\s/;
        var result = reg.exec(title);
        if (result != null) {
            var count = result[1];
            title = title.substring(count.length + 1);
        }
        
        itemTr += '<td>' + title + '<br>' + code + (result != null ? " " + result[1] : "") + '</td>';
        itemTr += '<td>' + itemCode + '</td>';

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