function ProcessShopeeAwb() {
    var timer = setInterval(function () {
        var a = document.querySelector("button.shopee-react-button.shopee-react-button--primary.shopee-react-button--normal");
        var b = document.querySelector("button.shopee-react-button.shopee-react-button--primary.shopee-react-button--normal.disabled");

        if (a != null && b == null) {
            
            clearInterval(timer);
            
            // setTimeout(function () {
                a.click();
                // 取得現在的時間戳記
                var timestamp = new Date().getTime();
                // 等待 1 秒後, 關閉視窗
                while (new Date().getTime() < timestamp + 3000) {
                    // Do nothing
                };
                window.close();
            // }, 1000);
        }
    }, 1000);
}

ProcessShopeeAwb();