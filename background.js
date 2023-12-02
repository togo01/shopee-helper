// 監聽來自內容腳本的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "getCookies" && request.url) {
        // 獲取指定 URL 的所有 cookie
        chrome.cookies.getAll({ url: request.url }, cookies => {
            sendResponse({ cookies: cookies });
        });
        return true; // 指示異步回應
    }
});
