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

        // 獲取 img 原始長寬
        var iw = img.width;
        var ih = img.height;

        // 建立一個 1/4 img 大小的 canvas 元素
        var canvas = document.createElement('canvas');
        canvas.width = iw;
        canvas.height = ih;
        var ctx = canvas.getContext('2d');
    
        
        for (var y = 0; y < 2; y++) {
            for (var x = 0; x < 2; x++) {
                // 淨空 canvas
                ctx.clearRect(0, 0, canvas.width, canvas.height);

                // 將 img 繪製到 canvas 中
                ctx.drawImage(img, -iw / 2 * x * 2, -ih / 2 * y * 2, img.width * 2, img.height * 2);

                // 判斷 Canvas 中黑色像素的數量
                var imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                var data = imageData.data;
                var count = 0;
                
                for (var j = 0; j < data.length; j += 4) {
                    var r = data[j];
                    var g = data[j + 1];
                    var b = data[j + 2];
                    var alpha = data[j + 3];
                    if (r == 0 && g == 0 && b == 0 && alpha == 255) {
                        count++;
                    }
                }

                // 如果黑色像素數量小於 1000, 則跳過
                if (count < 1000) {
                    continue;
                }

                // 建立新的 tr 元素
                let newTr = document.createElement('tr');
                newTable.appendChild(newTr);

                // 建立新的 td 元素
                let newTd = document.createElement('td');
                newTd.style.width = h/15*10 + 'px';
                newTd.style.height = h + 'px';
                newTr.appendChild(newTd);

                // 建立新的 div 元素
                let newDiv = document.createElement('div');
                newDiv.style.overflow = 'hidden';
                newDiv.style.width = w + 'px';
                newDiv.style.height = h + 'px';
                newDiv.style.margin = '10px auto 0 auto';

                // 建立新的 img 元素
                let newImg = document.createElement('img');
                newImg.src = canvas.toDataURL();
                // newImg.style.objectPosition = (-w * x) + 'px ' + (-h * y) + 'px';
                newImg.style.width = '100%';
                newImg.style.height = '100%';

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

    setTimeout(function () {
        window.print();
        // window.close();
    }, 1000);

}