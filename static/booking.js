// 這邊要重寫



document.getElementById('cardNumber').addEventListener('input', function (e) {
    let input = e.target.value;
    input = input.replace(/\D/g, ''); // 只保留數字
    input = input.substring(0, 16); // 最多16位數字

    // 加入空格
    let formattedInput = input.match(/.{1,4}/g)?.join(' ') || '';

    e.target.value = formattedInput;
});

document.getElementById('expiryDate').addEventListener('input', function (e) {
    let input = e.target.value;
    input = input.replace(/\D/g, ''); // 只保留數字
    if (input.length > 2) {
        input = input.substring(0, 2) + '/' + input.substring(2, 4); // MM/YY 格式
    }
    e.target.value = input.substring(0, 5); // 最多5個字符
});

document.getElementById('cvv').addEventListener('input', function (e) {
    let input = e.target.value;
    input = input.replace(/\D/g, ''); // 只保留數字
    e.target.value = input.substring(0, 3); // 最多3位數字
});
