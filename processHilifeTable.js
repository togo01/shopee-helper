function ProcessHilifeTable() {
    
    // 取得 url
    var url = window.location.href;
    
    // 判斷是不是 https://external2.shopee.tw/ext/hilife/live/ec_orders_tagC2C.aspx
    var reg = /https:\/\/external2.shopee.tw\/ext\/hilife\/live\/ec_orders_tagC2C.aspx/g;
    var result = reg.exec(url);
    if (result == null) {
        return;
    }
    
}

ProcessHilifeTable();