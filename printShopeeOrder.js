function ActiveShopeePrintOrderFunc() {

    // 紀錄是否已經加入按鈕
    var hasButton = document.getElementById("PrintShopeeOrderButton");
    if (hasButton != null) {
        return;
    }
    
    console.log("ActiveShopeePrintOrderFunc")

    // https://seller.shopee.tw/api/v3/order/get_package?SPC_CDS=cf6ef95b-9c4e-466f-9984-627ed47a1ef6&SPC_CDS_VER=2&order_id=155127848209946' \
    
    // 取得 SPC_CDS Cookie
    var cookies = document.cookie.split(';');
    var spcCds = null;
    for (var i = 0; i < cookies.length; i++) {
        var cookie = cookies[i].trim();
        if (cookie.startsWith('SPC_CDS=')) {
            spcCds = cookie.substring(8);
            break;
        }
    }

    let fullCookie = "";
    chrome.runtime.sendMessage({ action: "getCookies", url: window.location.href }, response => {
        if (response && response.cookies) {
            console.log("Cookies for current page:", response.cookies);
            // 在這裡處理 cookie
            for (var i = 0; i < response.cookies.length; i++) {
                var cookie = response.cookies[i];
                fullCookie += cookie.name + "=" + cookie.value + ";";
            }
        }
    });

    // 取得 order_id
    var url = window.location.href;
    var reg = /https:\/\/seller.shopee.tw\/portal\/sale\/order\/(\d+)/g;
    var result = reg.exec(url);
    if (result == null) {
        return;
    }

    var orderID = result[1];
    var shopID = "";

    // https://seller.shopee.tw/api/sellermisc/shop_info/get_shop_inactive_status/?SPC_CDS=a165db25-318b-4ee4-b8c7-7ba8031e173b&SPC_CDS_VER=2
    fetch('https://seller.shopee.tw/api/sellermisc/shop_info/get_shop_inactive_status/?SPC_CDS=' + spcCds + '&SPC_CDS_VER=2')
    .then(response => response.json())
    .then(data => {
        console.log(data);
        shopID = data.data.shop_id;
        console.log("shopID: " + shopID);
    });

    // get_package
    function updatePackageData() {
        var getPackageUrl = 'https://seller.shopee.tw/api/v3/order/get_package?SPC_CDS=' + spcCds + '&SPC_CDS_VER=2&order_id=' + orderID;
        console.log("getPackageUrl: " + getPackageUrl);
        fetch(getPackageUrl)
        .then(response => response.json())
        .then(data => {
            console.log(data);
            // data.data.package_list[0].package_number
            // data.data.package_list[0].channel_id
            // data.data.package_list[0].consignment_no

            let orderInfo = data.data.order_info;

            // 取得 consignment_no 
            var consignmentNo = data.data.order_info.package_list[0].consignment_no;
            console.log("consignmentNo: " + consignmentNo);

            if (consignmentNo == null || consignmentNo == "") {
                // console.log("安排出貨！");
                // 找到 #PrintShopeeShipButton 按鈕
                var button = document.getElementById("PrintShopeeShipButton");
                // 如果按鈕已經是安排出貨, 則不處理
                if (button.querySelector("span").innerText.trim() == "安排出貨") {
                    setTimeout(updatePackageData, 2000);
                    return;
                }
                // 內容的 span 變成 "安排出貨"
                button.querySelector("span").innerText = "安排出貨";
                // 監聽按鈕的點擊事件
                button.addEventListener('click', function () {
                    // 安排出貨
                    var nextButton = document.querySelector('.next > .btns > .shopee-popover > .shopee-popover__ref > button.shopee-button.shopee-button--primary');
                    nextButton.click();
                    setTimeout(updatePackageData, 2000);
                });
            } else {
                // console.log("列印寄件單！");
                // POST https://seller.shopee.tw/api/v3/logistics/create_sd_jobs?SPC_CDS=a165db25-318b-4ee4-b8c7-7ba8031e173b&SPC_CDS_VER=2&async_sd_version=0.2

                // 找到 #PrintShopeeShipButton 按鈕
                var button = document.getElementById("PrintShopeeShipButton");
                // 內容的 span 變成 "列印寄件單"
                button.querySelector("span").innerText = "列印寄件單";
                // 移除所有的監聽事件
                var newButton = button.cloneNode(true);
                button.parentNode.replaceChild(newButton, button);
                button = newButton;
                // 監聽按鈕的點擊事件
                button.addEventListener('click', function () {
                    fetch('https://seller.shopee.tw/api/v3/logistics/create_sd_jobs?SPC_CDS=' + spcCds + '&SPC_CDS_VER=2&async_sd_version=0.2', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(CreateSDJobsPayload(shopID, orderInfo)),
                    }).then(response => response.json())
                    .then(data => {
                        console.log(data);

                        // 取得 job_id
                        var jobID = data.data.list[0].job_id;
                        console.log("jobID: " + jobID);

                        // fulfillment_shipping_method
                        var fulfillment_shipping_method = orderInfo.package_list[0].fulfillment_shipping_method;

                        var url = '';
                        if (fulfillment_shipping_method == 7 || fulfillment_shipping_method == 8) {
                            url = 'https://seller.shopee.tw/api/v3/logistics/download_sd_job?job_id=' + jobID;
                        }

                        if (fulfillment_shipping_method == 30015) {
                            // seller.shopee.tw/awbprint?job_id=SDK0001_ bdb67d9a4bad7824d272acaf0560a662&shop_id =910507994&first_time=0
                            // url = 'https://seller.shopee.tw/awbprint?job_id=' + jobID + '&shop_id=' + shopID + '&first_time=0';
                            url = 'https://seller.shopee.tw/api/v3/logistics/download_sd_job?job_id=' + jobID;

                            payload = {
                                "pdf_url": url,
                                "cookie": fullCookie,
                                "crop": {
                                    "x": -0.025,
                                    "y": -0.005,
                                    "width": 0.94,
                                    "height": 1,
                                
                                },
                            }
                            // 將 payload 轉換為可附加在 url 後的字串
                            payload = encodeURIComponent(JSON.stringify(payload));

                            url = chrome.runtime.getURL('pdf.html?payload=' + payload);
                        }

                        if (fulfillment_shipping_method == 25) {
                            // seller.shopee.tw/awbprint?job_id=SDK0001_ bdb67d9a4bad7824d272acaf0560a662&shop_id =910507994&first_time=0
                            // url = 'https://seller.shopee.tw/awbprint?job_id=' + jobID + '&shop_id=' + shopID + '&first_time=0';
                            url = 'https://seller.shopee.tw/api/v3/logistics/download_sd_job?job_id=' + jobID;

                            payload = {
                                "pdf_url": url,
                                "cookie": fullCookie,
                                "crop": {
                                    "x": 0,
                                    "y": 0,
                                    "width": 0.5,
                                    "height": 0.5,
                                
                                },
                            }
                            // 將 payload 轉換為可附加在 url 後的字串
                            payload = encodeURIComponent(JSON.stringify(payload));

                            url = chrome.runtime.getURL('pdf.html?payload=' + payload);
                        }

                        if (url == '') {
                            return;
                        }

                        // 以 url 開啟新分頁
                        var newWindow = window.open(url, '', 'height='+screen.height + ' width='+screen.width);

                    });
                });
            }

            
        });
    }
    updatePackageData();


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

    // 出貨/列印寄件單按鈕
    var button = document.createElement('a');
    button.id = "PrintShopeeShipButton";
    button.className = "fix-button shopee-button shopee-button--primary shopee-button--normal";
    button.innerHTML = "<span> 讀取中 </span>";
    button.style.marginLeft = "10px";

    card.appendChild(button);
    

    // <button type="button" class="fix-button shopee-button shopee-button--primary shopee-button--normal"><span> 列印出貨單 </span></button>
    var button = document.createElement('a');
    button.id = "PrintShopeeOrderButton";
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

function CreateSDJobsPayload(shop_id, orderInfo)
{
    // 取得 SPC_CDS Cookie
    var cookies = document.cookie.split(';');
    var spcCds = null;
    for (var i = 0; i < cookies.length; i++) {
        var cookie = cookies[i].trim();
        if (cookie.startsWith('SPC_CDS=')) {
            spcCds = cookie.substring(8);
            break;
        }
    }

    // orderID
    var orderID = orderInfo.order_id;
    // packageNumber
    var packageNumber = orderInfo.package_list[0].package_number;
    // channelID
    var channelID = orderInfo.package_list[0].channel_id;
    // fulfillment_shipping_method
    var fulfillment_shipping_method = orderInfo.package_list[0].fulfillment_shipping_method;

    console.log("fulfillment_shipping_method: " + fulfillment_shipping_method);

    // 7-11 {"fulfillment_shipping_method:7", "fulfillment_carrier_name": "7-ELEVEN"}
    // {"group_list":[{"primary_package_number":"OFG155184440275512","group_shipment_id":0,"package_list":[{"order_id":155184439241735,"package_number":"OFG155184440275512"}]}],"region_id":"TW","shop_id":910507994,"channel_id":30005,"record_generate_schema":false,"generate_file_details":[{"file_type":"C2C_SHIPPING_LABEL_HTML","file_name":"寄件單","file_contents":

    // 7-11, 全家, 萊爾富
    if (fulfillment_shipping_method == 7 || fulfillment_shipping_method == 8 || fulfillment_shipping_method == 25) {
        return {
            "group_list": [
                {
                    "primary_package_number": packageNumber,
                    "group_shipment_id": 0,
                    "package_list": [
                        {
                            "order_id": orderID,
                            "package_number": packageNumber
                        }
                    ]
                }
            ],
            "region_id": "TW",
            "shop_id": shop_id,
            "channel_id": channelID,
            "record_generate_schema": false,
            "generate_file_details": [
                {
                    "file_type": "C2C_SHIPPING_LABEL_HTML",
                    "file_name": "寄件單",
                    "file_contents": [
                        6
                    ]
                }
            ]
        };
    } 

    // OK Mart {"fulfillment_carrier_name": "OK Mart", "fulfillment_shipping_method": 30015}
    // {"group_list":[{"primary_package_number":"OFG155177278206064","group_shipment_id":0,"package_list":[{"order_id":155177277249681,"package_number":"OFG155177278206064"}]}],"region_id":"TW","shop_id":910507994,"channel_id":30014,"record_generate_schema":false,"generate_file_details":[{"file_type":"THERMAL_PDF","file_name":"寄件單","file_contents":[14]}]}
    if (fulfillment_shipping_method == 30015) {
        return {
            "group_list": [
                {
                    "primary_package_number": packageNumber,
                    "group_shipment_id": 0,
                    "package_list": [
                        {
                            "order_id": orderID,
                            "package_number": packageNumber
                        }
                    ]
                }
            ],
            "region_id": "TW",
            "shop_id": shop_id,
            "channel_id": channelID,
            "record_generate_schema": false,
            "generate_file_details": [
                {
                    "file_type": "THERMAL_PDF",
                    "file_name": "寄件單",
                    "file_contents": [
                        14
                    ]
                }
            ]
        };
    }

    return {};

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

    img {
        image-rendering: pixelated;
    }


    table, th, td {
        border: 0px solid black;
        border-collapse: collapse;
        border-bottom: 1px solid black;
        font-weight: bold;
    }

    td, th {
        padding: 0.1cm;
    }

    td {
        font-size: 14px;
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
    newWindow.document.write('<div style="border: solid 1px; border-radius: 10px; padding: 10px;">');
    // newWindow.document.write('<div id="order-sn" style="font-family: \'Code 39-hoch-Logitogo\', sans-serif; font-size: 25px; padding: 5px 0;">*' + orderSN + '*</div>');
    newWindow.document.write('<div id="order-sn" style="height: 30px;text-align: center;padding-bottom: 5px;"><img src="http://127.0.0.1:8080/datamatrix?q=' + orderSN + '" style="height: 100%;"></img></div>');
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

/*
7-11 {"fulfillment_shipping_method:7", "fulfillment_carrier_name": "7-ELEVEN"}
{"group_list":[{"primary_package_number":"OFG155184440275512","group_shipment_id":0,"package_list":[{"order_id":155184439241735,"package_number":"OFG155184440275512"}]}],"region_id":"TW","shop_id":910507994,"channel_id":30005,"record_generate_schema":false,"generate_file_details":[{"file_type":"C2C_SHIPPING_LABEL_HTML","file_name":"寄件單","file_contents":[6]}]}
{
    "code": 0,
    "data": {
        "list": [
            {
                "job_id": "SDK0001_356638490709a1d9e71e042131879e0d",
                "job_name": "寄件單.7-ELEVEN*1.html",
                "job_status": 5,
                "job_type": 3,
                "is_first_time": 0
            }
        ]
    },
    "message": "success",
    "user_message": "success"
}

OK Mart {"fulfillment_carrier_name": "OK Mart", "fulfillment_shipping_method": 30015}
{"group_list":[{"primary_package_number":"OFG155177278206064","group_shipment_id":0,"package_list":[{"order_id":155177277249681,"package_number":"OFG155177278206064"}]}],"region_id":"TW","shop_id":910507994,"channel_id":30014,"record_generate_schema":false,"generate_file_details":[{"file_type":"THERMAL_PDF","file_name":"寄件單","file_contents":[14]}]}
{
    "code": 0,
    "data": {
        "list": [
            {
                "job_id": "SDK0001_bdb67d9a4bad7824d272acaf0560a662",
                "job_name": "寄件單.OK Mart*1.pdf",
                "job_status": 5,
                "job_type": 1,
                "is_first_time": 0
            }
        ]
    },
    "message": "success",
    "user_message": "success"
}

全家 {"fulfillment_carrier_name": "全家", "fulfillment_shipping_method": 8}
{"group_list":[{"primary_package_number":"OFG155174554262974","group_shipment_id":0,"package_list":[{"order_id":155174553232543,"package_number":"OFG155174554262974"}]}],"region_id":"TW","shop_id":910507994,"channel_id":30006,"record_generate_schema":false,"generate_file_details":[{"file_type":"C2C_SHIPPING_LABEL_HTML","file_name":"寄件單","file_contents":[6]}]}
{
    "code": 0,
    "data": {
        "list": [
            {
                "job_id": "SDK0001_ba09897adde41cb3efed15700b53612b",
                "job_name": "寄件單.全家*1.html",
                "job_status": 3,
                "job_type": 3,
                "is_first_time": 1
            }
        ]
    },
    "message": "success",
    "user_message": "success"
}

萊爾富




*/