var alreadyGetProductCode = false;

function GetProductCode() { 

    if (alreadyGetProductCode) {
        return;
    }
    

    // 使用 fetch 呼叫 API http://localhost:8080/product_by_barcode?q=國際碼末五碼

    var items = document.querySelectorAll("div.product-list-item");

    // 在 qty 欄位後面加上一個新的欄位 stock
    var qty = document.querySelector("div.product-list-head > .qty");

    if (qty == null) {
        return;
    }

    var stock = document.createElement("div");
    stock.className = "stock";
    stock.innerText = "庫存";
    stock.style.flex = "0 0 100px";
    stock.style.textAlign = "right";
    qty.after(stock);


    var totalQty = 0;
    var totalWeight = 0;
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

                    var productWeightNode = metaNode.querySelector("div.product-weight");
                    if (productWeightNode != null) {
                        productWeightNode.remove();
                    }
                    var productWeightNode = document.createElement("div");
                    productWeightNode.className = "product-weight";
                    productWeightNode.innerText = "重量: ?";
                    metaNode.appendChild(productWeightNode);


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

                    GetWeight();


                }).catch(function (err) {
                    console.log('Fetch Error :-S', err);
                    GetWeight();
                });;
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

                    var productWeightNode = metaNode.querySelector("div.product-weight");
                    if (productWeightNode != null) {
                        productWeightNode.remove();
                    }
                    var productWeightNode = document.createElement("div");
                    productWeightNode.className = "product-weight";
                    productWeightNode.innerText = "重量: ?";
                    metaNode.appendChild(productWeightNode);

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

                    GetWeight();
                }
            ).catch(function (err) {
                console.log('Fetch Error :-S', err);
                GetWeight();
            });
        }

        function GetWeight() {

            // 產品包裝重量係數
            var weightFactor = 1.15;

            // 數量
            var qty = item.querySelector("div.qty");
            var itemQuantity = Number.parseInt(qty.innerText);

            // 查詢文字為 itemMetaText + 標題
            var queryText = itemMetaText + " " + itemTitle.innerText;

            // 查找 數字+入 或 數字+入裝 或 數字+包 不分大小寫，並取出數字
            var reg = /(\d+)(入|入裝|包)/gi;
            var result = reg.exec(queryText);
            var subQty = 1;
            if (result != null) {
                subQty = Number.parseInt(result[1]);
            } else {
                // 特殊處理 數字+數字 組合，例如 2+1 或 2+2
                reg = /(\d+)\+(\d+)/gi;
                result = reg.exec(queryText);
                if (result != null) {
                    subQty = Number.parseInt(result[1]) + Number.parseInt(result[2]);
                }
            }
            

            // 查找 數字+g 或 數字+cc 或 數字+ml 不分大小寫，並取出數字
            var reg = /(\d+)(g|cc|ml)/gi;
            var result = reg.exec(queryText);
            var weightValue = 0;
            if (result != null) {
                weightValue = Number.parseInt(result[1]) / 1000 * subQty;
            }

            // 查找 數字+g+數字+g 如 2g+2g 不分大小寫，並取出數字相加
            reg = /(\d+)(g)\+(\d+)(g)/gi;
            result = reg.exec(queryText);
            if (result != null) {
                weightValue = (Number.parseInt(result[1]) / 1000 + Number.parseInt(result[3]) / 1000) * subQty;
            }

            // 查找 數字+kg 不分大小寫，並取出數字
            reg = /(\d+)(kg)/gi;
            result = reg.exec(queryText);
            if (result != null) {
                weightValue = Number.parseInt(result[1]) * subQty;
            }

            // 查找 數字+加侖 或 數字+gal 不分大小寫，並取出數字
            reg = /(\d+)(加侖|gal)/gi;
            result = reg.exec(queryText);
            if (result != null) {
                weightValue = Number.parseInt(result[1]) * 3.785 * subQty;
            }
            
            if (weightValue == 0) {
                weightValue = 0.2;
            }

            totalWeight += weightValue * weightFactor * itemQuantity;
            UpdatePackageWeight();

            // 顯示重量
            var productWeightNode = item.querySelector("div.product-weight");
            if (productWeightNode != null) {
                if (weightValue * weightFactor < 100) {
                    if (itemQuantity > 1) {
                        productWeightNode.innerText = "重量: " + (weightValue * weightFactor).toFixed(3) + "kg × " + itemQuantity + " = " + (weightValue * weightFactor * itemQuantity).toFixed(3) + "kg (預估)";
                    } else {
                        productWeightNode.innerText = "重量: " + (weightValue * weightFactor).toFixed(3) + "kg (預估)";
                    }
                } else {
                    if (itemQuantity > 1) {
                        productWeightNode.innerText = "重量: " + (weightValue * weightFactor).toFixed(1) + "kg × " + itemQuantity + " = " + (weightValue * weightFactor * itemQuantity).toFixed(1) + "kg (預估)";
                    } else {
                        productWeightNode.innerText = "重量: " + (weightValue * weightFactor).toFixed(1) + "kg (預估)";
                    }
                }
            }

            
        }

    }

    function UpdatePackageWeight() {
        var maxWeight = 5.0;

        var finalWeight = totalWeight + 0.3;

        var packageWeight = document.querySelector("div#package-weight-progress");
        if (packageWeight != null) {
            // 設定 style width
            packageWeight.style.width = (finalWeight / maxWeight * 100) + "%";
            // 根據重量顯示不同顏色，低於 80% 為綠色，介於 80% ~ 100% 為黃色，高於 100% 為紅色
            if (finalWeight / maxWeight < 0.8) {
                packageWeight.style.backgroundColor = "#6ee2c6";
            } else if (finalWeight / maxWeight < 1) {
                packageWeight.style.backgroundColor = "#eabc8e";
            } else {
                packageWeight.style.backgroundColor = "#f28b82";
            }
        }

        var packageWeightText = document.querySelector("div#package-weight-des");
        // " 0.0kg / 4.0kg "
        if (packageWeightText != null) {
            packageWeightText.innerText = finalWeight.toFixed(1) + "kg / " + maxWeight.toFixed(1) + "kg";
        }
    }


    
    alreadyGetProductCode = true;
    

}