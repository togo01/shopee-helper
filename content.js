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

    // 判斷網址是否為 https://seller.shopee.tw/portal/sale/order/<order_id>
    var url = window.location.href;
    var reg = /https:\/\/seller.shopee.tw\/portal\/sale\/order\/\d+/g;
    var result = reg.exec(url);
    if (result != null) {
        
        console.log("訂單明細頁面");
        // 新增列印出貨單按鈕
        ActiveShopeePrintOrderFunc();
        // 取得自編碼
        GetProductCode();
        // 測試處理寄貨單
        TestGetPackageList();
    
    }

}

var isAlreadyTestGetPackageList = false;
function TestGetPackageList() 
{
    if (isAlreadyTestGetPackageList) {
        return;
    }


    var url = window.location.href;
    var reg = /https:\/\/seller.shopee.tw\/portal\/sale\/order\/(\d+)/g;
    var result = reg.exec(url);
    if (result == null) {
        return;
    }

    var orderID = result[1];
    console.log("orderID: " + orderID);

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
    console.log("SPC_CDS: " + spcCds);

    // https://seller.shopee.tw/api/v3/order/get_one_order?SPC_CDS=912a3577-0877-4019-8f46-bbe0af23b4fa&SPC_CDS_VER=2&order_id=109596557367844
    // https://seller.shopee.tw/api/v3/order/get_package?SPC_CDS=a165db25-318b-4ee4-b8c7-7ba8031e173b&SPC_CDS_VER=2&order_id=155114727285980
    fetch('https://seller.shopee.tw/api/v3/order/get_package?SPC_CDS=' + spcCds + '&SPC_CDS_VER=2&order_id=' + orderID, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
    })
    .then(response => response.json())
    .then(data => {
        console.log(data);
        
    })

    // https://seller.shopee.tw/api/v3/logistics/download_sd_job?job_id=SDK0001_10bbc6fef0e3da5f1e5a2e9e66d91a3d
    fetch('https://seller.shopee.tw/api/v3/logistics/download_sd_job?job_id=SDK0001_10bbc6fef0e3da5f1e5a2e9e66d91a3d', {
        method: 'GET',
        headers: {
            cookie: cookies,
        },
    })
    .then(response => response.text())
    .then(data => {
        console.log(data);
        
    })



    isAlreadyTestGetPackageList = true;
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

